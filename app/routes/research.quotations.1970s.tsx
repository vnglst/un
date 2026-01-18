import { Link, useLoaderData } from 'react-router'
import { Badge } from '~/components/ui/badge'
import { QuotationCard } from '~/components/ui/quotation-card'
import PageLayout from '~/components/page-layout'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import {
  getTopFiguresForDecade,
  getBestQuotationsForDecade,
  type Quotation,
} from '~/lib/database'

type LoaderData = {
  topFigures: Array<{ name: string; category: string; mentions: number }>
  bestQuotes: Quotation[]
}

export async function loader(): Promise<LoaderData> {
  const topFigures = getTopFiguresForDecade(1970, 1979, 20)
  const bestQuotes = getBestQuotationsForDecade(1970, 1979, 5)

  return { topFigures, bestQuotes }
}

export function meta() {
  return [
    { title: 'The 1970s: Detente & Upheaval - UN Speeches Research' },
    { name: 'description', content: 'Analysis of most quoted people in UN speeches during the 1970s.' },
  ]
}

export default function Research1970s() {
  const { topFigures, bestQuotes } = useLoaderData<LoaderData>()

  return (
    <PageLayout maxWidth="narrow">
      <div className="mb-6">
        <Link
          to="/research/quotations"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back to Research
        </Link>
      </div>

      <header className="mb-12">
        <Badge variant="indigo" className="mb-4">
          The 1970s
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Detente & Upheaval
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          A decade marked by superpower detente, the oil crisis, and the end of the Vietnam War.
          <strong> China's</strong> entry into the UN in 1971 reshaped global diplomacy.
        </p>
      </header>

      <article className="prose prose-lg prose-stone max-w-none">
        <h2 className="text-2xl font-bold mt-12 mb-6 text-gray-900">Most Cited Figures (1970-1979)</h2>
        <p>
          Secretary-General <strong>Kurt Waldheim</strong> dominated citations throughout the decade.
          <strong> Mao Zedong</strong> became prominent after China's admission to the UN in 1971, reshaping the Security Council's dynamics.
          The transition from <strong>U Thant</strong> to Waldheim marked a generational shift in UN leadership.
        </p>

        <div className="not-prose my-8 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Rank</TableHead>
                <TableHead>Person</TableHead>
                <TableHead>Mentions</TableHead>
                <TableHead>Category</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topFigures.map((figure, index) => (
                <TableRow key={figure.name}>
                  <TableCell className="font-medium">#{index + 1}</TableCell>
                  <TableCell>
                    <Link
                      to={`/research/quotations/figure/${encodeURIComponent(figure.name)}`}
                      className="text-un-blue hover:underline font-medium"
                    >
                      {figure.name}
                    </Link>
                  </TableCell>
                  <TableCell>{figure.mentions}</TableCell>
                  <TableCell className="text-gray-500">{figure.category}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <h2 className="text-2xl font-bold mt-12 mb-6 text-gray-900">Notable Quotations</h2>

        <div className="not-prose space-y-8 my-8">
          {bestQuotes.map((q) => (
            <QuotationCard
              key={q.id}
              quote={q.quote_text.length > 300 ? q.quote_text.substring(0, 300) + '...' : q.quote_text}
              author={q.figure_name}
              citation={`${q.country_name} (${q.year})`}
              speechLink={`/speech/${q.speech_id}`}
            />
          ))}
        </div>
      </article>
    </PageLayout>
  )
}
