#!/usr/bin/env node

import dotenv from 'dotenv'
import OpenAI from 'openai'
import { createInterface, Interface } from 'readline'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import yaml from 'yaml'
import { AgentManager } from './lib/agent-manager.ts'
import { Agent } from './lib/agent.ts'
import chalk from 'chalk'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config()

class DiplomatCLI {
  private agentManager: AgentManager
  private agent: Agent
  private rl: Interface
  private isLetterMode: boolean
  private letterTemplate: any

  constructor(isLetterMode: boolean = false) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error(
        chalk.red('❌ OPENAI_API_KEY not found in environment variables')
      )
      console.error(
        chalk.yellow('Please set your OpenAI API key in the environment')
      )
      process.exit(1)
    }

    const client = new OpenAI({ apiKey })
    this.agentManager = new AgentManager(client)
    this.agent = this.agentManager.getDiplomatAgent()
    this.isLetterMode = isLetterMode
    this.letterTemplate = isLetterMode ? this.loadLetterTemplate() : null

    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })
  }

  private loadLetterTemplate(): any {
    try {
      const templatePath = join(
        __dirname,
        'templates',
        'letter-writer-template.yaml'
      )
      const templateFile = readFileSync(templatePath, 'utf-8')
      return yaml.parse(templateFile)
    } catch (error) {
      console.error(chalk.red('❌ Failed to load letter template:', error))
      return null
    }
  }

  private printWelcome(): void {
    if (this.isLetterMode) {
      console.log(chalk.blue.bold('\n✍️  UN Diplomatic Letter Writer'))
      console.log(chalk.gray('═'.repeat(50)))
      console.log(
        chalk.white(
          'I will help you write diplomatic letters to world leaders using UN speech research.'
        )
      )
      console.log(
        chalk.white(
          "Simply tell me the topic and recipient, and I'll research and draft a letter."
        )
      )
      console.log(chalk.gray('Type "help" for commands, "exit" to quit.'))
      console.log(chalk.gray('═'.repeat(50)))
      console.log(chalk.cyan('\n💡 Example requests:'))
      console.log(
        chalk.gray(
          '  • "Write a diplomatic letter to The White House on climate change cooperation"'
        )
      )
      console.log(
        chalk.gray(
          '  • "Draft a letter to the UN Secretary-General about peacekeeping operations"'
        )
      )
      console.log(
        chalk.gray(
          '  • "Create a letter to the President of France regarding trade relations"'
        )
      )

      // Note: We don't send the template automatically - wait for user input
    } else {
      console.log(chalk.blue.bold('\n🌍 UN Diplomatic Research Agent'))
      console.log(chalk.gray('═'.repeat(50)))
      console.log(
        chalk.white(
          'Ask me anything about international affairs, UN speeches, or current events.'
        )
      )
      console.log(
        chalk.white(
          'I can research UN databases, current news, and historical context.'
        )
      )
      console.log(chalk.gray('Type "help" for commands, "exit" to quit.'))
      console.log(chalk.gray('═'.repeat(50)))
    }
  }

  private printHelp(): void {
    console.log(chalk.cyan('\n📚 Available Commands:'))
    console.log(chalk.white('  help     - Show this help message'))
    console.log(chalk.white('  clear    - Clear conversation history'))
    console.log(chalk.white('  exit     - Exit the chat'))
    console.log(chalk.white('  quit     - Exit the chat'))
    console.log(chalk.cyan('\n💡 Example Questions:'))
    console.log(
      chalk.gray(
        '  • What did China say about climate change in recent UN speeches?'
      )
    )
    console.log(
      chalk.gray('  • Tell me about the current situation in Ukraine')
    )
    console.log(
      chalk.gray(
        '  • Who are the key leaders involved in Middle East diplomacy?'
      )
    )
    console.log(
      chalk.gray(
        '  • Write a letter to the German Chancellor about renewable energy'
      )
    )
  }

  private async getUserInput(): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(chalk.green('You: '), (input: string) => {
        resolve(input.trim())
      })
    })
  }

  private async processUserInput(input: string): Promise<boolean> {
    const lowerInput = input.toLowerCase()

    // Handle commands
    if (lowerInput === 'exit' || lowerInput === 'quit') {
      return false
    }

    if (lowerInput === 'help') {
      this.printHelp()
      return true
    }

    if (lowerInput === 'clear') {
      this.agent.reset()
      console.log(chalk.yellow('✨ Conversation history cleared'))
      return true
    }

    if (input === '') {
      return true
    }

    // Process the question with the agent
    try {
      console.log(chalk.gray('\n🔍 Researching...'))

      // In letter mode, prepend the template to the user's request
      let finalInput = input
      if (this.isLetterMode && this.letterTemplate?.prompt) {
        finalInput = `${this.letterTemplate.prompt}\n\nUser request: ${input}`
      }

      await this.agent.analyze(finalInput)
      console.log() // Add spacing after response
    } catch (error) {
      console.error(
        chalk.red(
          `❌ Error: ${error instanceof Error ? error.message : String(error)}`
        )
      )
    }

    return true
  }

  async start(): Promise<void> {
    this.printWelcome()

    try {
      while (true) {
        const input = await this.getUserInput()
        const shouldContinue = await this.processUserInput(input)

        if (!shouldContinue) {
          break
        }
      }
    } catch (error) {
      console.error(
        chalk.red(
          `❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`
        )
      )
    } finally {
      this.cleanup()
    }
  }

  private cleanup(): void {
    console.log(
      chalk.blue('\n👋 Thanks for using the UN Diplomatic Research Agent!')
    )
    this.rl.close()
    this.agentManager.close()
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log(chalk.yellow('\n\n🛑 Received interrupt signal. Exiting...'))
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log(chalk.yellow('\n🛑 Received termination signal. Exiting...'))
  process.exit(0)
})

// Start the CLI
const isLetterMode = process.argv.includes('--letter')
const cli = new DiplomatCLI(isLetterMode)
cli.start().catch((error) => {
  console.error(chalk.red('❌ CLI failed to start:', error))
  process.exit(1)
})
