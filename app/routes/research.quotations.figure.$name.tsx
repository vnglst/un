import { useLoaderData, Link } from 'react-router'
import {
  getNotableFigureByName,
  getQuotationsForFigure,
  getQuotationStatsForFigure,
  type NotableFigure,
  type Quotation,
  type QuotationStats,
} from '~/lib/database'
import PageLayout from '~/components/page-layout'
import { Badge } from '~/components/ui/badge'
import { QuotationCard } from '~/components/ui/quotation-card'
import { Calendar, MapPin, Quote, ExternalLink } from 'lucide-react'

type LoaderData = {
  figure: NotableFigure
  quotations: Quotation[]
  stats: QuotationStats
}

export function meta({ data }: { data?: LoaderData }) {
  return [
    {
      title: data?.figure
        ? `${data.figure.name} - Quotes in UN Speeches`
        : 'Figure - UN Speeches',
    },
    {
      name: 'description',
      content: data?.figure
        ? `${data.stats.total_mentions} mentions of ${data.figure.name} in UN General Assembly speeches (${data.stats.year_range}).`
        : 'Notable figure quoted in UN speeches.',
    },
  ]
}

export async function loader({
  params,
}: {
  params: { name: string }
}): Promise<LoaderData> {
  const name = decodeURIComponent(params.name)

  const figure = getNotableFigureByName(name)

  if (!figure) {
    throw new Response('Figure not found', { status: 404 })
  }

  const stats = getQuotationStatsForFigure(figure.id)
  const quotations = getQuotationsForFigure(figure.id, {
    limit: 100,
    minConfidence: 0.3,
  })

  return { figure, quotations, stats }
}

function getCategoryBadgeVariant(category: string): 'blue' | 'purple' | 'amber' | 'indigo' | 'default' {
  switch (category) {
    case 'Philosopher':
      return 'purple'
    case 'Scientist':
      return 'blue'
    case 'Writer':
      return 'indigo'
    case 'World Leader':
    case 'UN Leader':
      return 'amber'
    case 'Civil Rights Leader':
      return 'default'
    default:
      return 'default'
  }
}

export default function FigureDetail() {
  const { figure, quotations, stats } = useLoaderData<LoaderData>()

  // Separate high-confidence direct quotes from mentions
  const directQuotes = quotations.filter(q => q.is_direct_quote && q.confidence_score >= 0.7)
  const mentions = quotations.filter(q => !q.is_direct_quote || q.confidence_score < 0.7)

  return (
    <PageLayout maxWidth="narrow">
      <div className="mb-6">
        <Link
          to="/research/quotations"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back to Quotations Research
        </Link>
      </div>

      {/* Header */}
      <header className="mb-12">
        <Badge variant={getCategoryBadgeVariant(figure.category)} className="mb-4">
          {figure.category}
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          {figure.name}
        </h1>
        {figure.description && (
          <p className="text-xl text-gray-600 leading-relaxed mb-4">
            {figure.description}
          </p>
        )}
        {(figure.birth_year || figure.death_year) && (
          <p className="text-gray-500">
            {figure.birth_year && figure.birth_year < 0 ? `${Math.abs(figure.birth_year)} BCE` : figure.birth_year}
            {figure.birth_year && figure.death_year && ' – '}
            {figure.death_year && figure.death_year < 0 ? `${Math.abs(figure.death_year)} BCE` : figure.death_year}
          </p>
        )}
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{stats.total_mentions}</div>
          <div className="text-sm text-gray-500">Total Mentions</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{stats.direct_quotes}</div>
          <div className="text-sm text-gray-500">Direct Quotes</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{stats.year_range.split('-')[0]}</div>
          <div className="text-sm text-gray-500">First Mention</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">{stats.year_range.split('-')[1]}</div>
          <div className="text-sm text-gray-500">Latest Mention</div>
        </div>
      </div>

      {/* Top Countries */}
      {stats.top_countries.length > 0 && (
        <div className="mb-12">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Most Frequent Citing Countries
          </h2>
          <div className="flex flex-wrap gap-2">
            {stats.top_countries.slice(0, 8).map((c) => (
              <span
                key={c.country}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                {c.country}
                <span className="text-gray-500">({c.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Direct Quotes Section */}
      {directQuotes.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Quote className="h-6 w-6" />
            Direct Quotations ({directQuotes.length})
          </h2>
          <div className="space-y-6">
            {directQuotes.map((q) => (
              <div
                key={q.id}
                className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm"
              >
                <blockquote className="text-lg text-gray-800 italic mb-4 border-l-4 border-un-blue pl-4">
                  "{q.quote_text.length > 500 ? q.quote_text.substring(0, 500) + '...' : q.quote_text}"
                </blockquote>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {q.year}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {q.country_name}
                    </span>
                  </div>
                  <Link
                    to={`/speech/${q.speech_id}`}
                    className="flex items-center gap-1 text-un-blue hover:underline"
                  >
                    View Speech
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Mentions Section */}
      {mentions.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            All Mentions ({mentions.length})
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Year</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Country</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Context</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Speech</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {mentions.slice(0, 50).map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{q.year}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{q.country_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">
                      {q.quote_text.substring(0, 100)}...
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/speech/${q.speech_id}`}
                        className="text-un-blue hover:underline text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {mentions.length > 50 && (
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-center text-sm text-gray-500">
                Showing 50 of {mentions.length} mentions
              </div>
            )}
          </div>
        </section>
      )}
    </PageLayout>
  )
}
