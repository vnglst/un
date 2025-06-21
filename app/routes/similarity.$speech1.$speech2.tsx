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

  // Sort chunks by similarity score descending
  const sortedChunks = [...data.chunk_similarities].sort(
    (a, b) => b.similarity - a.similarity
  )

  // Get color based on similarity score
  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'text-green-700 bg-green-50 border-green-200'
    if (similarity >= 0.6) return 'text-blue-700 bg-blue-50 border-blue-200'
    if (similarity >= 0.4)
      return 'text-yellow-700 bg-yellow-50 border-yellow-200'
    return 'text-gray-700 bg-gray-50 border-gray-200'
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
                <strong>Date:</strong>{' '}
                {new Date(data.speech1.date).toLocaleDateString()}
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
                <strong>Date:</strong>{' '}
                {new Date(data.speech2.date).toLocaleDateString()}
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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Detailed Chunk Analysis
          </h2>
          <div className="text-sm text-gray-600">
            Showing {sortedChunks.length} of {data.total_chunks} chunks with
            similarities above threshold
          </div>
        </div>

        <div className="space-y-6">
          {sortedChunks.slice(0, 20).map((chunk, index) => (
            <Card key={index} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Chunk Pair #{index + 1}
                </h3>
                <div
                  className={`px-3 py-1 rounded-full text-sm font-medium border ${getSimilarityColor(chunk.similarity)}`}
                >
                  {formatSimilarity(chunk.similarity)}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center justify-between">
                    <span>{data.speech1.country}</span>
                    <span className="text-xs text-gray-500">
                      Position {chunk.chunk1_position}
                    </span>
                  </h4>
                  <div className="p-4 bg-gray-50 rounded-lg border text-sm text-gray-700 leading-relaxed">
                    {chunk.chunk1_text}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center justify-between">
                    <span>{data.speech2.country}</span>
                    <span className="text-xs text-gray-500">
                      Position {chunk.chunk2_position}
                    </span>
                  </h4>
                  <div className="p-4 bg-gray-50 rounded-lg border text-sm text-gray-700 leading-relaxed">
                    {chunk.chunk2_text}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {sortedChunks.length > 20 && (
          <div className="text-center mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600">
              Showing top 20 most similar chunks. There are{' '}
              {sortedChunks.length - 20} more chunk pairs available.
            </p>
          </div>
        )}
      </div>

      {/* Information Section */}
      <InfoBlock title="Understanding Similarity Scores">
        <div className="space-y-4">
          <p className="text-gray-700">
            Speech similarity is calculated by comparing semantic embeddings of
            text chunks. Each speech is divided into smaller segments, and each
            segment is compared to segments from the other speech to find the
            most similar passages.
          </p>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">
              Score Interpretation:
            </h3>
            <ul className="text-gray-700 space-y-1">
              <li>
                <span className="inline-block w-3 h-3 bg-green-200 rounded mr-2"></span>
                <strong>80-100%:</strong> Very high similarity - likely
                discussing the same topics with similar language
              </li>
              <li>
                <span className="inline-block w-3 h-3 bg-blue-200 rounded mr-2"></span>
                <strong>60-79%:</strong> High similarity - related topics or
                similar diplomatic positions
              </li>
              <li>
                <span className="inline-block w-3 h-3 bg-yellow-200 rounded mr-2"></span>
                <strong>40-59%:</strong> Moderate similarity - some overlapping
                themes or concepts
              </li>
              <li>
                <span className="inline-block w-3 h-3 bg-gray-200 rounded mr-2"></span>
                <strong>Below 40%:</strong> Low similarity - different topics or
                positions
              </li>
            </ul>
          </div>

          <p className="text-gray-700">
            The chunk analysis shows specific passages where the two speeches
            align most closely, helping you understand exactly which topics or
            diplomatic positions are shared between countries.
          </p>
        </div>
      </InfoBlock>
    </PageLayout>
  )
}
