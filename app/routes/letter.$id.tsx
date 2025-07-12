import { useLoaderData, Link } from 'react-router'
import { getLetterById, type Letter } from '~/lib/database'
import PageLayout from '~/components/page-layout'
import { Calendar, User, ArrowLeft, Copy, Check } from 'lucide-react'
import { useState } from 'react'
import type { LoaderFunctionArgs } from 'react-router'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type React from 'react'

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params

  if (!id || isNaN(Number(id))) {
    throw new Response('Invalid letter ID', { status: 400 })
  }

  const letter = getLetterById(Number(id))

  if (!letter) {
    throw new Response('Letter not found', { status: 404 })
  }

  return { letter }
}

export function meta({ data }: { data: { letter: Letter } }) {
  if (!data?.letter) {
    return [{ title: 'Letter Not Found - UN Speeches' }]
  }

  const { letter } = data
  return [
    {
      title: `${letter.subject || 'Diplomatic Letter'} - UN Speeches`,
    },
    {
      name: 'description',
      content: `Diplomatic letter to ${letter.addressed_to}${letter.subject ? `: ${letter.subject}` : ''}`,
    },
  ]
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-un-blue transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 mr-2 text-green-600" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 mr-2" />
          Copy Letter
        </>
      )}
    </button>
  )
}

export default function LetterDetail() {
  const { letter } = useLoaderData<typeof loader>()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const parseMetadata = (metadata: string | null | undefined) => {
    if (!metadata) return null
    try {
      return JSON.parse(metadata)
    } catch {
      return null
    }
  }

  const metadata = parseMetadata(letter.metadata)

  return (
    <PageLayout maxWidth="narrow">
      <div className="mb-6">
        <Link
          to="/letters"
          className="inline-flex items-center text-sm text-gray-600 hover:text-un-blue mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Letters
        </Link>
      </div>

      <article className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-8">
          <header className="mb-8 border-b border-gray-200 pb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {letter.subject || 'Diplomatic Letter'}
            </h1>

            <div className="space-y-3">
              <div className="flex items-center text-gray-600">
                <User className="w-5 h-5 mr-3 flex-shrink-0" />
                <div>
                  <span className="font-medium">Addressed to:</span>
                  <div className="text-gray-900 font-medium">
                    {letter.addressed_to}
                  </div>
                </div>
              </div>

              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-3 flex-shrink-0" />
                <div>
                  <span className="font-medium">Date:</span>
                  <span className="ml-2">
                    {formatDate(letter.date_created)}
                  </span>
                </div>
              </div>
            </div>

            {metadata && (
              <div className="mt-4">
                <div className="flex flex-wrap gap-2">
                  {metadata.country_code && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {metadata.country_code}
                    </span>
                  )}
                  {metadata.topic && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      {metadata.topic}
                    </span>
                  )}
                  {metadata.urgency && (
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        metadata.urgency === 'high'
                          ? 'bg-red-100 text-red-800'
                          : metadata.urgency === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {metadata.urgency} priority
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-end">
              <CopyButton text={letter.content} />
            </div>
          </header>

          <div className="prose prose-gray max-w-none">
            <style
              dangerouslySetInnerHTML={{
                __html: `
                .footnotes ol li p {
                  display: inline;
                  margin-bottom: 0;
                }
                .footnotes ol li p:not(:last-child)::after {
                  content: " ";
                }
                .footnotes ol li {
                  scroll-margin-top: 100px;
                }
                sup + sup::before {
                  content: ",";
                  color: #6b7280;
                  font-weight: 500;
                }
              `,
              }}
            />
            <div className="text-gray-900 leading-relaxed bg-gray-50 p-6 rounded-lg border">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  // Custom styling for footnote references - remove links, just show numbers
                  sup: ({ children }) => {
                    // Extract just the number from the footnote reference
                    const extractNumber = (child: unknown): string => {
                      if (typeof child === 'string') return child
                      if (
                        child &&
                        typeof child === 'object' &&
                        'props' in child
                      ) {
                        const element = child as {
                          props?: { children?: unknown }
                        }
                        if (element.props?.children) {
                          if (typeof element.props.children === 'string') {
                            return element.props.children
                          }
                          if (Array.isArray(element.props.children)) {
                            return element.props.children
                              .map(extractNumber)
                              .join('')
                          }
                        }
                      }
                      return ''
                    }

                    const number = Array.isArray(children)
                      ? children.map(extractNumber).join('')
                      : extractNumber(children)

                    return (
                      <sup className="text-gray-600 font-medium">{number}</sup>
                    )
                  },
                  // Style footnote definitions section - make footnotes inline
                  section: ({
                    children,
                    ...props
                  }: React.HTMLAttributes<HTMLElement> & {
                    'data-footnotes'?: boolean
                  }) => {
                    if (props['data-footnotes']) {
                      return (
                        <section
                          {...props}
                          className="footnotes"
                          id="footnotes"
                        >
                          {children}
                        </section>
                      )
                    }
                    return <section {...props}>{children}</section>
                  },
                  // Style headings with plain text - hide footnotes headings
                  h1: ({ children }) => {
                    // Hide "Footnotes" headings
                    if (
                      typeof children === 'string' &&
                      children.toLowerCase().includes('footnotes')
                    ) {
                      return null
                    }
                    return <h1 className="mb-4">{children}</h1>
                  },
                  h2: ({ children }) => {
                    // Hide "Footnotes" headings
                    if (
                      typeof children === 'string' &&
                      children.toLowerCase().includes('footnotes')
                    ) {
                      return null
                    }
                    return <h2 className="mb-3">{children}</h2>
                  },
                  h3: ({ children }) => {
                    // Hide "Footnotes" headings
                    if (
                      typeof children === 'string' &&
                      children.toLowerCase().includes('footnotes')
                    ) {
                      return null
                    }
                    return <h3 className="mb-2">{children}</h3>
                  },
                  h4: ({ children }) => {
                    // Hide "Footnotes" headings
                    if (
                      typeof children === 'string' &&
                      children.toLowerCase().includes('footnotes')
                    ) {
                      return null
                    }
                    return <h4 className="mb-2">{children}</h4>
                  },
                  // Hide horizontal rules (lines)
                  hr: () => null,
                  p: ({ children }) => <p className="mb-4">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-4 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-4 space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-300 pl-4 italic my-4 text-gray-700">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children }) => (
                    <code className="bg-gray-200 px-1 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="bg-gray-200 p-3 rounded overflow-x-auto text-sm font-mono mb-4">
                      {children}
                    </pre>
                  ),
                  a: ({ href, children }) => {
                    // Hide footnote back-reference links (↩)
                    if (
                      href?.startsWith('#user-content-fnref-') ||
                      children === '↩'
                    ) {
                      return null
                    }

                    return (
                      <a
                        href={href}
                        className="text-un-blue hover:text-un-blue-dark underline"
                        target={href?.startsWith('#') ? undefined : '_blank'}
                        rel={
                          href?.startsWith('#')
                            ? undefined
                            : 'noopener noreferrer'
                        }
                      >
                        {children}
                      </a>
                    )
                  },
                }}
              >
                {letter.content}
              </ReactMarkdown>
            </div>
          </div>

          {/* Referenced Speeches Section */}
          {metadata && (metadata.speech_ids || metadata.session_numbers) && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Referenced UN Speeches
              </h3>
              <div className="space-y-3">
                {metadata.speech_ids && metadata.speech_ids.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Speech IDs:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {metadata.speech_ids.map((speechId: number) => (
                        <Link
                          key={speechId}
                          to={`/speech/${speechId}`}
                          className="inline-flex items-center px-3 py-1 text-sm font-medium text-un-blue bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors"
                        >
                          Speech #{speechId}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </article>

      <div className="mt-8 text-center">
        <Link
          to="/letters"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-un-blue hover:bg-un-blue-dark rounded-md transition-colors"
        >
          View All Letters
        </Link>
      </div>
    </PageLayout>
  )
}
