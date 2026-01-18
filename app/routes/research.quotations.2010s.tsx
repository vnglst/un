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
  const topFigures = getTopFiguresForDecade(2010, 2019, 20)
  const bestQuotes = getBestQuotationsForDecade(2010, 2019, 5)

  return { topFigures, bestQuotes }
}

export function meta() {
  return [
    { title: 'The 2010s: Legacy & Icons - UN Speeches Research' },
    { name: 'description', content: 'Analysis of most quoted people in UN speeches during the 2010s.' },
  ]
}

export default function Research2010s() {
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
        <Badge variant="blue" className="mb-4">
          The 2010s
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Legacy & Icons
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          A decade defined by retrospection and tributes. The passing of giants like Kofi Annan and Nelson Mandela turned their words into guiding principles for the assembly.
        </p>
      </header>

      <article className="prose prose-lg prose-stone max-w-none">
        <h2 className="text-2xl font-bold mt-12 mb-6 text-gray-900">Most Cited Figures (2010-2019)</h2>
        <p>
          The 2010s were dominated by references to <strong>Kofi Annan</strong>, especially following his passing in 2018.
          <strong>Nelson Mandela</strong> and <strong>Pope Francis</strong> (following his 2015 address) were also top citations.
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
