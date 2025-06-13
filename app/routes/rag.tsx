import { useState, useRef, useEffect } from 'react'
import {
  Form,
  useActionData,
  useLoaderData,
  useNavigation,
  Link,
} from 'react-router'
import PageLayout from '../components/page-layout'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'

interface RAGResponse {
  question: string
  answer: string
  sources: Array<{
    index: number
    chunk_id: string
    speech_id: string
    country: string
    speaker: string
    year: number
    session: number
    distance: number
    preview: string
  }>
  metadata: {
    model: string
    usage: {
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

type LoaderData = {
  ragAvailable: boolean
}

type ActionData = { success: true; result: RAGResponse } | { error: string }

export function meta() {
  return [
    { title: 'RAG Chat - UN Speeches' },
    {
      name: 'description',
      content:
        'Ask questions about UN General Assembly speeches using AI-powered semantic search.',
    },
  ]
}

export async function loader(): Promise<LoaderData> {
  // Check if RAG is available
  const ragAvailable = !!process.env.OPENAI_API_KEY

  return {
    ragAvailable,
  }
}

export async function action({
  request,
}: {
  request: Request
}): Promise<ActionData> {
  const formData = await request.formData()
  const question = formData.get('question') as string
  const country = formData.get('country') as string
  const yearFrom = formData.get('yearFrom') as string
  const yearTo = formData.get('yearTo') as string
  const searchLimit = formData.get('searchLimit') as string

  if (!question?.trim()) {
    throw new Response('Question is required', { status: 400 })
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Response('OpenAI API key is not configured', { status: 500 })
  }

  try {
    // Dynamic import to avoid loading RAG modules if not needed
    // @ts-expect-error - RAG modules are JavaScript without TypeScript declarations
    const { initDatabase } = await import('../../rag-js/vector-search.js')
    // @ts-expect-error - RAG modules are JavaScript without TypeScript declarations
    const { ragQuery } = await import('../../rag-js/rag-pipeline.js')

    const db = await initDatabase()

    // Build filters
    const filters: Record<string, unknown> = {}
    if (country && country !== 'all') {
      filters.country = country
    }
    if (yearFrom) {
      filters.year_from = parseInt(yearFrom)
    }
    if (yearTo) {
      filters.year_to = parseInt(yearTo)
    }

    const options = {
      searchLimit: searchLimit ? parseInt(searchLimit) : 5,
      filters,
      includeContext: true,
    }

    const result = await ragQuery(db, question, options)

    db.close()

    return { success: true, result }
  } catch (error) {
    console.error('RAG query error:', error)
    throw new Response(
      error instanceof Error
        ? error.message
        : 'An error occurred while processing your question',
      { status: 500 }
    )
  }
}

export default function RAGPage() {
  const { ragAvailable } = useLoaderData<LoaderData>()
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
  }, [conversation])

  // Handle successful response
  useEffect(() => {
    if (actionData && 'success' in actionData && actionData.success) {
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
  }, [actionData, question])

  const handleSubmit = (e: React.FormEvent) => {
    if (!question.trim() || isLoading) {
      e.preventDefault()
    }
  }

  const clearConversation = () => {
    setConversation([])
  }

  if (!ragAvailable) {
    return (
      <PageLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">
              RAG Chat - Configuration Required
            </h1>
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                RAG System Not Available
              </h2>
              <p className="text-gray-600 mb-4">
                The RAG (Retrieval-Augmented Generation) system requires an
                OpenAI API key to function.
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
                        className="text-blue-600 hover:underline"
                      >
                        OpenAI Platform
                      </a>
                    </li>
                    <li>
                      Create a{' '}
                      <code className="bg-gray-100 px-1 rounded">.env</code>{' '}
                      file in the project root
                    </li>
                    <li>
                      Add:{' '}
                      <code className="bg-gray-100 px-1 rounded">
                        OPENAI_API_KEY=your_api_key_here
                      </code>
                    </li>
                    <li>
                      Run:{' '}
                      <code className="bg-gray-100 px-1 rounded">
                        npm run rag:setup
                      </code>{' '}
                      to initialize the vector database
                    </li>
                    <li>Restart the development server</li>
                  </ol>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">RAG Chat</h1>
            <p className="text-gray-600">
              Ask questions about UN General Assembly speeches and get
              AI-powered answers based on the speech database with semantic
              search.
            </p>
          </div>

          {/* Conversation Area */}
          <Card className="mb-6 h-96 overflow-y-auto">
            <div className="p-4 space-y-4">
              {conversation.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="mb-4">
                    Start a conversation by asking a question about UN speeches.
                  </p>
                  <p className="text-sm">Examples:</p>
                  <ul className="text-sm text-left max-w-md mx-auto mt-2 space-y-1">
                    <li>• "What did countries say about climate change?"</li>
                    <li>
                      • "How has the discussion on nuclear weapons evolved?"
                    </li>
                    <li>
                      • "What are the main concerns about global security?"
                    </li>
                  </ul>
                </div>
              ) : (
                conversation.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">
                        {message.content}
                      </div>

                      {/* Show sources for assistant messages */}
                      {message.type === 'assistant' && message.ragResponse && (
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          <details className="text-sm">
                            <summary className="cursor-pointer font-medium mb-2">
                              Sources ({message.ragResponse.sources.length})
                            </summary>
                            <div className="space-y-2">
                              {message.ragResponse.sources.map((source) => (
                                <div
                                  key={source.chunk_id}
                                  className="bg-white p-2 rounded border"
                                >
                                  <div className="font-medium text-xs mb-1 flex items-center justify-between">
                                    <span>
                                      {source.country} ({source.year}) -{' '}
                                      {source.speaker}
                                    </span>
                                    <Link
                                      to={`/speech/${source.speech_id}`}
                                      className="text-blue-600 hover:text-blue-800 hover:underline ml-2"
                                      target="_blank"
                                    >
                                      View Speech
                                    </Link>
                                  </div>
                                  <div className="text-xs text-gray-600 mb-2">
                                    {source.preview}
                                  </div>
                                  <div className="text-xs text-gray-500 flex items-center justify-between">
                                    <span>
                                      Similarity:{' '}
                                      {(1 - source.distance).toFixed(3)}
                                    </span>
                                    <span className="text-gray-400">
                                      Speech ID: {source.speech_id}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              Model: {message.ragResponse.metadata.model} |
                              Tokens:{' '}
                              {message.ragResponse.metadata.usage.total_tokens}
                            </div>
                          </details>
                        </div>
                      )}

                      <div className="text-xs opacity-75 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </Card>

          {/* Input Form */}
          <Card className="p-4">
            <Form method="post" onSubmit={handleSubmit} className="space-y-4">
              {/* Question Input */}
              <div className="flex space-x-2">
                <Input
                  name="question"
                  placeholder="Ask a question about UN speeches..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="flex-1"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  disabled={isLoading}
                >
                  Filters
                </Button>
                <Button type="submit" disabled={isLoading || !question.trim()}>
                  {isLoading ? 'Asking...' : 'Ask'}
                </Button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Country
                    </label>
                    <Select
                      name="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    >
                      <option value="all">All Countries</option>
                      <option value="United States">United States</option>
                      <option value="China">China</option>
                      <option value="Russia">Russia</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="France">France</option>
                      <option value="Germany">Germany</option>
                      <option value="Japan">Japan</option>
                      <option value="India">India</option>
                      <option value="Brazil">Brazil</option>
                    </Select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Year From
                    </label>
                    <Input
                      name="yearFrom"
                      type="number"
                      min="1946"
                      max="2023"
                      placeholder="1946"
                      value={yearFrom}
                      onChange={(e) => setYearFrom(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Year To
                    </label>
                    <Input
                      name="yearTo"
                      type="number"
                      min="1946"
                      max="2024"
                      placeholder="2024"
                      value={yearTo}
                      onChange={(e) => setYearTo(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Search Limit
                    </label>
                    <Select
                      name="searchLimit"
                      value={searchLimit}
                      onChange={(e) => setSearchLimit(e.target.value)}
                    >
                      <option value="3">3 sources</option>
                      <option value="5">5 sources</option>
                      <option value="10">10 sources</option>
                      <option value="15">15 sources</option>
                    </Select>
                  </div>
                </div>
              )}

              {/* Error Display */}
              {actionData && 'error' in actionData && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {actionData.error}
                </div>
              )}
            </Form>

            {/* Clear Conversation */}
            {conversation.length > 0 && (
              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearConversation}
                  disabled={isLoading}
                >
                  Clear Conversation
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
