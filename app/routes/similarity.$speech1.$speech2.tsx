import { useLoaderData, Link } from 'react-router'
import { LoaderFunctionArgs } from 'react-router'
import PageLayout from '../components/page-layout'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { InfoBlock } from '../components/ui/cards'
import { ArrowLeft } from 'lucide-react'
import {
  getSimilarityComparison,
  type SimilarityComparison,
} from '~/lib/database'
import { highlightOverlappingText } from '~/lib/utils'

export function meta({ data }: { data: SimilarityComparison }) {
  if (!data) {
    return [{ title: 'Similarity Comparison - UN Speeches Browser' }]
  }

  return [
    {
      title: `Similarity: ${data.speech1.country} vs ${data.speech2.country} - UN Speeches Browser`,
    },
    {
      name: 'description',
      content: `Compare semantic similarity between speeches from ${data.speech1.country} and ${data.speech2.country} with detailed chunk analysis.`,
    },
  ]
}

export async function loader({ params }: LoaderFunctionArgs) {
  const { speech1, speech2 } = params

  if (!speech1 || !speech2) {
    throw new Response('Missing speech IDs', { status: 400 })
  }

  try {
    const data = getSimilarityComparison(speech1, speech2)
    return data
  } catch (error) {
    console.error('Error loading similarity comparison:', error)
    throw new Response('Failed to load similarity data', { status: 500 })
  }
}

export default function SimilarityComparison() {
  const data = useLoaderData<SimilarityComparison>()

  // Database already returns best matches sorted by chunk1_position, no need for additional processing
  const chunkMatches = data.chunk_similarities

  // Get color based on similarity score - more subtle colors for better readability
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'text-emerald-700 bg-emerald-50'
    if (similarity >= 0.6) return 'text-blue-700 bg-blue-50'
    if (similarity >= 0.4) return 'text-amber-700 bg-amber-50'
    return 'text-gray-600 bg-gray-100'
  }

  const formatSimilarity = (similarity: number) => {
    return (similarity * 100).toFixed(1) + '%'
  }

  return (
    <PageLayout maxWidth="wide">
      {/* Breadcrumb Navigation */}
      <div className="py-4">
        <div className="flex items-center text-sm text-gray-600">
          <Link
            to="/"
            className="hover:text-[var(--color-primary)] transition-colors"
          >
            HOME
          </Link>
          <span className="mx-2">&gt;</span>
          <Link
            to="/analysis"
            className="hover:text-[var(--color-primary)] transition-colors"
          >
            ANALYSIS
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="text-gray-900 font-medium">
            SIMILARITY COMPARISON
          </span>
        </div>
      </div>

      {/* Back Button */}
      <div className="py-4">
        <Link to="/analysis">
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Analysis
          </Button>
        </Link>
      </div>

      {/* Header Section */}
      <div className="py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Speech Similarity Comparison
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {data.speech1.country}
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Speaker:</strong> {data.speech1.speaker}
              </p>
              <p>
                <strong>Position:</strong> {data.speech1.post}
              </p>
              <p>
                <strong>Year:</strong> {data.speech1.year}
              </p>
            </div>
            <div className="mt-4">
              <Link to={`/speech/${data.speech1.id}`}>
                <Button variant="outline" size="sm">
                  View Full Speech
                </Button>
              </Link>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {data.speech2.country}
            </h2>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Speaker:</strong> {data.speech2.speaker}
              </p>
              <p>
                <strong>Position:</strong> {data.speech2.post}
              </p>
              <p>
                <strong>Year:</strong> {data.speech2.year}
              </p>
            </div>
            <div className="mt-4">
              <Link to={`/speech/${data.speech2.id}`}>
                <Button variant="outline" size="sm">
                  View Full Speech
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Overall Similarity */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-[var(--color-primary)] mb-2">
              {formatSimilarity(data.overall_similarity)}
            </div>
            <div className="text-lg text-gray-700">
              Overall Similarity Score
            </div>
            <div className="mt-4 text-sm text-gray-600 max-w-2xl mx-auto">
              This score represents the semantic similarity between these two
              speeches, calculated using advanced language models and cosine
              similarity.
            </div>
          </div>
        </div>
      </div>

      {/* Chunk Analysis */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Side-by-Side Speech Comparison
            </h2>
            <p className="text-sm text-gray-600">
              Reading {chunkMatches.length} sections from {data.speech1.country}{' '}
              alongside their best matches from {data.speech2.country}
            </p>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-600">{data.speech1.country}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-600">{data.speech2.country}</span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {chunkMatches.slice(0, 50).map((match, index) => {
            // Get previous chunk text for overlap detection
            const previousChunkText =
              index > 0 ? chunkMatches[index - 1].chunk1_text : null
            const highlightedText = highlightOverlappingText(
              match.chunk1_text,
              previousChunkText
            )

            return (
              <div
                key={index}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden"
              >
                {/* Header with position and similarity */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-600">
                    Section {match.chunk1_position + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">Similarity</span>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${getSimilarityColor(match.similarity)}`}
                    >
                      {formatSimilarity(match.similarity)}
                    </div>
                  </div>
                </div>

                {/* Side-by-side content */}
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  <div className="p-6 border-r border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <h4 className="font-semibold text-gray-900">
                        {data.speech1.country}
                      </h4>
                    </div>
                    <div
                      className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: highlightedText }}
                    />
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <h4 className="font-semibold text-gray-900">
                        {data.speech2.country}
                      </h4>
                      <span className="text-xs text-gray-500 ml-auto">
                        Best match: Position {match.chunk2_position + 1}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                      {match.chunk2_text}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {chunkMatches.length > 50 && (
          <div className="text-center mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              Showing first 50 chunks from {data.speech1.country}. There are{' '}
              {chunkMatches.length - 50} more chunks available.
            </p>
          </div>
        )}
      </div>

      {/* Information Section */}
      <InfoBlock title="Understanding This Comparison">
        <div className="space-y-4">
          <p className="text-gray-700">
            This chronological comparison shows both speeches side-by-side,
            section by section, in the order they were delivered. This allows
            you to see how the narrative flow and argumentation develops in
            parallel between the two countries.
          </p>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Reading Guide:</h3>
            <ul className="text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>
                  <strong>Left column:</strong> {data.speech1.country}'s speech
                  sections in chronological order
                </span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 flex-shrink-0"></div>
                <span>
                  <strong>Right column:</strong> {data.speech2.country}'s speech
                  sections in chronological order
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="inline-block w-3 h-3 bg-emerald-50 rounded mt-1.5 flex-shrink-0"></span>
                <span>
                  <strong>Similarity scores:</strong> Show how semantically
                  similar each pair of sections are, even though they appear at
                  the same position in their respective speeches
                </span>
              </li>
            </ul>
          </div>

          <p className="text-gray-700">
            Notice how different countries structure their arguments: some may
            address economic issues first, others might start with security
            concerns, etc. The similarity scores help identify when both
            countries happen to discuss similar topics at the same point in
            their speeches.
          </p>
        </div>
      </InfoBlock>
    </PageLayout>
  )
}
