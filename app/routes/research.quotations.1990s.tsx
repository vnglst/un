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
  const topFigures = getTopFiguresForDecade(1990, 1999, 20)
  const bestQuotes = getBestQuotationsForDecade(1990, 1999, 5)

  return { topFigures, bestQuotes }
}

export function meta() {
  return [
    { title: 'The 1990s: New World Order - UN Speeches Research' },
    { name: 'description', content: 'Analysis of most quoted people in UN speeches during the 1990s.' },
  ]
}

export default function Research1990s() {
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
        <Badge variant="secondary" className="mb-4">
          The 1990s
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          New World Order
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          The fall of the Berlin Wall and the end of the Cold War ushered in unprecedented optimism.
          <strong> Nelson Mandela's</strong> release and the Oslo Accords defined a decade of hope for peace and reconciliation.
        </p>
      </header>

      <article className="prose prose-lg prose-stone max-w-none">
        <h2 className="text-2xl font-bold mt-12 mb-6 text-gray-900">Most Cited Figures (1990-1999)</h2>
        <p>
          The 1990s saw two Secretary-Generals dominate citations: <strong>Boutros Boutros-Ghali</strong> and <strong>Kofi Annan</strong>.
          <strong> Nelson Mandela's</strong> release from prison and subsequent presidency made him an iconic figure of reconciliation.
          The Middle East peace process brought <strong>Rabin</strong> and <strong>Arafat</strong> into focus.
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
