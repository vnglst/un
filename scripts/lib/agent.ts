import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import yaml from 'yaml'
import OpenAI from 'openai'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface AgentConfig {
  name: string
  description: string
  model: string
  temperature: number
  max_steps: number
  system_prompts: Array<{
    role: string
    content: string
  }>
  tools: Array<{
    type: string
    function: {
      name: string
      description: string
      parameters: any
    }
  }>
}

export interface ConversationMessage {
  role: string
  content: string
  tool_calls?: any[]
  tool_call_id?: string
  name?: string
}

export class Agent {
  private client: OpenAI
  private config: AgentConfig
  private memory: ConversationMessage[] = []
  private stepCount = 0
  private shouldStop = false
  private toolImplementations: Record<string, Function>

  constructor(
    client: OpenAI,
    configName: string,
    toolImplementations: Record<string, Function>
  ) {
    this.client = client
    this.toolImplementations = toolImplementations
    this.config = this.loadConfig(configName)
    this.initializeMemory()
  }

  private loadConfig(name: string): AgentConfig {
    const configPath = join(__dirname, '..', 'agents', `${name}.yaml`)
    try {
      const configFile = readFileSync(configPath, 'utf-8')
      return yaml.parse(configFile)
    } catch (error) {
      throw new Error(
        `Failed to load agent config: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  private initializeMemory(): void {
    const baseSystemPrompt = this.config.system_prompts?.[0]?.content || ''
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const systemPrompt = `${baseSystemPrompt}\n\nCurrent date: ${currentDate}`
    this.memory = [{ role: 'system', content: systemPrompt }]
  }

  printMessage(role: string, msg: string | object): void {
    const colors = {
      user: '\x1b[94m', // Blue
      assistant: '\x1b[96m', // Cyan
      tool: '\x1b[93m', // Yellow
      tool_result: '\x1b[95m', // Magenta
      system: '\x1b[90m', // Gray
      reset: '\x1b[0m', // Reset
    }

    const labels = {
      user: 'You',
      assistant: 'UN Researcher',
      tool: '[Tool call]',
      tool_result: '[Tool result]',
      system: '[System]',
    }

    const color = (colors as any)[role] || ''
    const label = (labels as any)[role] || role

    let message = typeof msg === 'string' ? msg : JSON.stringify(msg, null, 0)

    // Remove newlines to keep tool messages on one line
    if (role === 'tool' || role === 'tool_result') {
      message = message.replace(/\n/g, ' ').replace(/\s+/g, ' ')
    }

    // Truncate long tool messages
    if ((role === 'tool' || role === 'tool_result') && message.length > 1000) {
      message = message.substring(0, 1000) + '...'
    }

    console.log(`${color}${label}${colors.reset}: ${message}`)
  }

  reset(): void {
    this.memory = []
    this.stepCount = 0
    this.shouldStop = false
    this.initializeMemory()
  }

  async analyze(userPrompt: string): Promise<ConversationMessage[]> {
    this.memory.push({ role: 'user', content: userPrompt })
    this.shouldStop = false
    this.stepCount = 0

    while (!this.shouldStop) {
      if (this.stepCount >= this.config.max_steps) {
        this.printMessage('system', 'Maximum steps reached. Stopping.')
        break
      }

      await this.step()
      this.stepCount++
    }

    return this.memory
  }

  private async step(): Promise<void> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: this.memory as any,
        tools: this.config.tools as any,
        tool_choice: 'auto',
        temperature: this.config.temperature,
      })

      const responseMessage = response.choices[0].message

      // Add assistant message to memory
      this.memory.push({
        role: responseMessage.role,
        content: responseMessage.content || '',
        tool_calls: responseMessage.tool_calls || undefined,
      })

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        await this.handleToolCalls(responseMessage.tool_calls)
      } else {
        const content = responseMessage.content || ''
        this.printMessage('assistant', content)
        this.shouldStop = true
      }
    } catch (error) {
      this.printMessage(
        'system',
        `Error: ${error instanceof Error ? error.message : String(error)}`
      )
      this.memory.push({
        role: 'assistant',
        content: `Error: ${error instanceof Error ? error.message : String(error)}`,
      })
      this.shouldStop = true
    }
  }

  private async handleToolCalls(toolCalls: any[]): Promise<void> {
    for (const toolCall of toolCalls) {
      await this.executeToolCall(toolCall)
    }
  }

  private async executeToolCall(toolCall: any): Promise<void> {
    const toolName = toolCall.function.name

    if (!this.toolImplementations[toolName]) {
      this.printMessage('system', `Unknown tool: ${toolName}`)
      return
    }

    try {
      const args = JSON.parse(toolCall.function.arguments)

      this.printMessage(
        'tool',
        `Calling ${toolName} with arguments: ${JSON.stringify(args)}`
      )

      const toolFunction = this.toolImplementations[toolName]
      const result = await toolFunction(args)

      this.printMessage('tool_result', result)

      // Add tool result to memory
      this.memory.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolName,
        content:
          typeof result === 'string' ? result : JSON.stringify(result, null, 2),
      })
    } catch (error) {
      const errorMessage = `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`
      this.printMessage('tool_result', errorMessage)

      this.memory.push({
        tool_call_id: toolCall.id,
        role: 'tool',
        name: toolName,
        content: errorMessage,
      })
    }
  }
}
