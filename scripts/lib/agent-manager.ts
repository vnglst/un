import OpenAI from 'openai'
import { Agent } from './agent.ts'
import { ToolImplementations } from './tools.ts'

export class AgentManager {
  private client: OpenAI
  private tools: ToolImplementations
  private diplomatAgent: Agent

  constructor(client: OpenAI) {
    this.client = client
    this.tools = new ToolImplementations()

    // Create the consolidated diplomat agent with all tools
    this.diplomatAgent = new Agent(
      this.client,
      'diplomat',
      this.getAllToolImplementations()
    )
  }

  /**
   * Get the consolidated diplomat agent
   */
  getDiplomatAgent(): Agent {
    return this.diplomatAgent
  }

  /**
   * Create a single agent (for backward compatibility)
   * All requests now use the consolidated diplomat agent
   */
  createAgent(): {
    agent: Agent
    tools: ToolImplementations
  } {
    // Return the diplomat agent regardless of the requested agent name
    // This maintains backward compatibility with existing orchestrator code
    return { agent: this.diplomatAgent, tools: this.tools }
  }

  /**
   * Get all tool implementations for the consolidated diplomat agent
   */
  private getAllToolImplementations(): Record<
    string,
    (...args: unknown[]) => Promise<string>
  > {
    return {
      sql_query: async (args) =>
        await this.tools.sqlQuery(args as { query: string; limit?: number }),

      full_text_search: async (args) =>
        await this.tools.fullTextSearch(
          args as {
            search_term: string
            country_filter?: string
            year_from?: number
            year_to?: number
            limit?: number
          }
        ),

      wikipedia_search: async (args) =>
        await this.tools.wikipediaSearch(args as { query: string }),

      get_cnn_lite_news: async (args) =>
        await this.tools.getCnnLiteNews(args as { url?: string } | undefined),

      check_duplicate_recipient: async (args) =>
        await this.tools.checkDuplicateRecipient(
          args as { leader_name: string }
        ),

      store_letter: async (args) =>
        await this.tools.storeLetter(
          args as {
            content: string
            addressed_to: string
            subject: string
            metadata?: string
          }
        ),
    }
  }

  /**
   * Close database connections
   */
  close(): void {
    this.tools.close()
  }
}
