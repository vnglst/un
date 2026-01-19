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
  const topFigures = getTopFiguresForDecade(2020, 2029, 20)
  const bestQuotes = getBestQuotationsForDecade(2020, 2029, 5)

  return { topFigures, bestQuotes }
}

export function meta() {
  return [
    { title: 'The 2020s: Crisis & Urgency - UN Speeches Research' },
    { name: 'description', content: 'Analysis of most quoted people in UN speeches during the 2020s.' },
  ]
}

export default function Research2020s() {
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

      <header className="mb-8 md:mb-12">
        <Badge variant="amber" className="mb-3 md:mb-4">
          The 2020s
        </Badge>
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 tracking-tight">
          Crisis & Urgency
        </h1>
        <p className="text-base md:text-xl text-gray-600 leading-relaxed">
          Facing a pandemic and global instability, speakers shifted to voices of urgency and crisis leadership.
        </p>
      </header>

      <article className="prose prose-lg prose-stone max-w-none">
        <h2 className="text-2xl font-bold mt-12 mb-6 text-gray-900">Most Cited Figures (2020-2024)</h2>
        <p>
          In the current decade, <strong>Antonio Guterres</strong> is frequently cited as the sitting Secretary-General.
          Legacy figures like Mandela and King remain relevant, while Winston Churchill saw a spike in citations during the COVID-19 crisis.
        </p>

        <div className="not-prose my-6 md:my-8 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 md:w-[100px]">Rank</TableHead>
                <TableHead>Person</TableHead>
                <TableHead className="text-right">Mentions</TableHead>
                <TableHead className="hidden sm:table-cell">Category</TableHead>
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
                  <TableCell className="text-right">{figure.mentions}</TableCell>
                  <TableCell className="text-gray-500 hidden sm:table-cell">{figure.category}</TableCell>
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
