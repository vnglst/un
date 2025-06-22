import { useState, useRef, useEffect } from 'react'
import { Form, useActionData, useNavigation, Link } from 'react-router'
import PageLayout from '~/components/page-layout'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Select } from '~/components/ui/select'
import { ServiceCard } from '~/components/ui/cards'
import { logger, timeAsyncOperation } from '~/lib/logger'
import { useAppContext } from '~/lib/app-context'
import {
  MessageSquare,
  Brain,
  Search,
  Filter,
  Send,
  RotateCcw,
} from 'lucide-react'

interface RAGResponse {
  question: string
  answer: string
  sources: Array<{
    index: number
    chunk_id: number
    speech_id: number
    country: string
    speaker: string
    year: number
    session: number
    distance: number
    preview: string
  }>
  metadata: {
    model: string | undefined
    usage?: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    }
    search_count: number
    filters_applied: string[]
  }
}

interface ConversationMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  ragResponse?: RAGResponse
}

type ActionData = { success: true; result: RAGResponse } | { error: string }

export function meta() {
  return [
    { title: 'AI Chat - UN Speeches' },
    {
      name: 'description',
      content:
        'Ask questions about UN General Assembly speeches using AI-powered semantic search.',
    },
  ]
}

export async function action({
  request,
}: {
  request: Request
}): Promise<ActionData> {
  const url = new URL(request.url)

  logger.requestStart('POST', url.pathname, {})

  return timeAsyncOperation('rag-action', async () => {
    try {
      const { ragQuery } = await import('../../rag-ts/runtime/rag-pipeline.ts')
      const { initDatabase } = await import(
        '../../rag-ts/runtime/vector-search.ts'
      )

      const formData = await request.formData()
      const question = formData.get('question') as string
      const country = formData.get('country') as string
      const yearFrom = formData.get('yearFrom') as string
      const yearTo = formData.get('yearTo') as string
      const searchLimit = formData.get('searchLimit') as string

      if (!question?.trim()) {
        return { error: 'Question is required' }
      }

      logger.info('Processing RAG query', {
        question:
          question.substring(0, 100) + (question.length > 100 ? '...' : ''),
        country: country !== 'all' ? country : undefined,
        yearFrom,
        yearTo,
        searchLimit,
      })

      const db = initDatabase()

      const filters: Record<string, unknown> = {}
      if (country && country !== 'all') {
        filters.country = country
      }
      if (yearFrom) {
        filters.yearFrom = parseInt(yearFrom)
      }
      if (yearTo) {
        filters.yearTo = parseInt(yearTo)
      }

      const options = {
        searchLimit: searchLimit ? parseInt(searchLimit) : 5,
        filters,
        includeContext: true,
      }

      logger.info('Executing RAG query', {
        question:
          question.substring(0, 100) + (question.length > 100 ? '...' : ''),
        options,
      })

      const result = await ragQuery(db, question, options)

      db.close()

      logger.info('RAG query completed successfully', {
        answerLength: result.answer.length,
        sourceCount: result.sources.length,
        model: result.metadata.model,
        totalTokens: result.metadata.usage?.total_tokens || 0,
        searchCount: result.metadata.search_count,
      })

      return { success: true, result }
    } catch (error) {
      logger.error('RAG query error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      throw new Response(
        error instanceof Error
          ? error.message
          : 'An error occurred while processing your question',
        { status: 500 }
      )
    }
  })
}

export default function RAGPage() {
  const { ragAvailable } = useAppContext()
  const actionData = useActionData<ActionData>()
  const navigation = useNavigation()
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [question, setQuestion] = useState('')
  const [country, setCountry] = useState('all')
  const [yearFrom, setYearFrom] = useState('')
  const [yearTo, setYearTo] = useState('')
  const [searchLimit, setSearchLimit] = useState('5')
  const [showFilters, setShowFilters] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isLoading = navigation.state === 'submitting'

  // Scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation, isLoading])

  // Handle new action data
  useEffect(() => {
    if (actionData && 'success' in actionData && question.trim()) {
      const userMessage: ConversationMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: question,
        timestamp: new Date(),
      }

      const assistantMessage: ConversationMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: actionData.result.answer,
        timestamp: new Date(),
        ragResponse: actionData.result,
      }

      setConversation((prev) => [...prev, userMessage, assistantMessage])
      setQuestion('')
    }
  }, [actionData, question, conversation.length])

  const handleSubmit = (e: React.FormEvent) => {
    if (!question.trim() || isLoading) {
      e.preventDefault()
    }
  }

  const clearConversation = () => {
    logger.info('RAG conversation cleared', {
      previousMessageCount: conversation.length,
    })
    setConversation([])
  }

  if (!ragAvailable) {
    return (
      <PageLayout>
        <div className="py-4">
          <div className="flex items-center text-sm text-gray-600">
            <Link to="/" className="hover:text-un-blue transition-colors">
              HOME
            </Link>
            <span className="mx-2">&gt;</span>
            <span className="text-gray-900 font-medium">AI CHAT</span>
          </div>
        </div>

        <div className="py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Chat - Configuration Required
          </h1>
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4">
              RAG System Not Available
            </h2>
            <p className="text-gray-600 mb-6">
              The RAG (Retrieval-Augmented Generation) system requires an OpenAI
              API key to function.
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Setup Instructions:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>
                    Get an OpenAI API key from{' '}
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-un-blue hover:underline"
                    >
                      OpenAI Platform
                    </a>
                  </li>
                  <li>
                    Add it to your environment variables as OPENAI_API_KEY
                  </li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            </div>
          </Card>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout className="space-y-0 py-0">
      {/* Breadcrumb Navigation */}
      <div className="py-4">
        <div className="flex items-center text-sm text-gray-600">
          <Link to="/" className="hover:text-un-blue transition-colors">
            HOME
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="text-gray-900 font-medium">AI CHAT</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          AI-Powered UN Speeches Chat
        </h1>
        <p className="text-lg text-gray-700 mb-6 max-w-4xl">
          Ask questions about UN General Assembly speeches and get AI-powered
          answers based on semantic search across our comprehensive database.
          Explore diplomatic discourse through intelligent conversation.
        </p>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <ServiceCard
          title="Semantic Search"
          description="Advanced AI-powered search that understands context and meaning, not just keywords."
          icon={<Brain className="h-6 w-6 text-gray-600" />}
        />

        <ServiceCard
          title="Intelligent Answers"
          description="Get comprehensive answers backed by relevant UN speech excerpts and sources."
          icon={<MessageSquare className="h-6 w-6 text-gray-600" />}
        />

        <ServiceCard
          title="Filtered Search"
          description="Narrow down results by country, year, or session to get more targeted insights."
          icon={<Search className="h-6 w-6 text-gray-600" />}
        />
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-12">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Chat Interface</h2>
            {conversation.length > 0 && (
              <Button
                onClick={clearConversation}
                variant="outline"
                size="sm"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Clear Chat
              </Button>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <div className="p-6 min-h-[500px] max-h-[600px] overflow-y-auto bg-gray-50">
          {conversation.length === 0 ? (
            <div className="text-center py-16">
              <div className="max-w-lg mx-auto">
                <div className="w-16 h-16 bg-un-blue rounded-lg flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Welcome to AI Chat
                </h3>
                <p className="text-gray-600 mb-8">
                  Ask questions about UN General Assembly speeches and get
                  intelligent answers powered by semantic search and AI
                  analysis.
                </p>
                <div className="bg-white rounded-lg p-6 text-left shadow-sm border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-4">
                    Try asking questions like:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-un-blue rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">
                        "What did countries say about climate change in recent
                        years?"
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-un-blue rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">
                        "How has the discussion on nuclear weapons evolved over
                        time?"
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-un-blue rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm text-gray-700">
                        "What are the main concerns about global security
                        mentioned by African countries?"
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {conversation.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-6 py-4 ${
                      message.type === 'user'
                        ? 'bg-un-blue text-white'
                        : 'bg-white text-gray-900 shadow-sm border border-gray-200'
                    }`}
                  >
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {message.content}
                    </div>

                    {/* Show sources for assistant messages */}
                    {message.type === 'assistant' && message.ragResponse && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm font-semibold text-gray-900 mb-3">
                          Sources ({message.ragResponse.sources.length}):
                        </p>
                        <div className="space-y-2">
                          {message.ragResponse.sources
                            .slice(0, 3)
                            .map((source) => (
                              <Link
                                key={source.speech_id}
                                to={`/speech/${source.speech_id}`}
                                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="text-xs text-gray-600 mb-1">
                                  {source.country} • {source.year} •{' '}
                                  {source.speaker}
                                </div>
                                <div className="text-sm text-gray-800 line-clamp-2">
                                  {source.preview}
                                </div>
                              </Link>
                            ))}
                        </div>

                        {message.ragResponse.metadata && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs text-gray-500">
                              Model: {message.ragResponse.metadata.model} •
                              {message.ragResponse.metadata.usage &&
                                ` Tokens: ${message.ragResponse.metadata.usage.total_tokens} • `}
                              Search results:{' '}
                              {message.ragResponse.metadata.search_count}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-xs opacity-75 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex justify-start mt-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-[85%] shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-un-blue border-t-transparent"></div>
                  <span className="text-gray-700">AI is thinking...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <div className="p-6 border-t border-gray-200 bg-white">
          <Form method="post" onSubmit={handleSubmit} className="space-y-4">
            {/* Question Input */}
            <div className="flex space-x-3">
              <Input
                name="question"
                placeholder="Ask a question about UN speeches..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="flex-1 h-12 text-base"
                disabled={isLoading}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                disabled={isLoading}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !question.trim()}
                className="bg-un-blue hover:bg-un-blue/90 text-white px-6"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Asking...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Ask
                  </>
                )}
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Country
                  </label>
                  <Select
                    name="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full"
                  >
                    <option value="all">All countries</option>
                    {/* Add more countries as needed */}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Year From
                  </label>
                  <Input
                    name="yearFrom"
                    type="number"
                    placeholder="e.g., 2020"
                    value={yearFrom}
                    onChange={(e) => setYearFrom(e.target.value)}
                    min="1946"
                    max="2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Year To
                  </label>
                  <Input
                    name="yearTo"
                    type="number"
                    placeholder="e.g., 2024"
                    value={yearTo}
                    onChange={(e) => setYearTo(e.target.value)}
                    min="1946"
                    max="2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Search Results
                  </label>
                  <Select
                    name="searchLimit"
                    value={searchLimit}
                    onChange={(e) => setSearchLimit(e.target.value)}
                  >
                    <option value="3">3 results</option>
                    <option value="5">5 results</option>
                    <option value="10">10 results</option>
                    <option value="20">20 results</option>
                  </Select>
                </div>
              </div>
            )}

            {/* Error Display */}
            {actionData && 'error' in actionData && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">
                  {(actionData as { error: string }).error}
                </p>
              </div>
            )}
          </Form>
        </div>
      </div>
    </PageLayout>
  )
}
