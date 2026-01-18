import { useLoaderData, Link } from 'react-router'
import { getNotableFigures, type NotableFigure } from '~/lib/database'
import PageLayout from '~/components/page-layout'
import { Badge } from '~/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'

type LoaderData = {
  figures: Array<NotableFigure & { mention_count: number }>
  byCategory: Record<string, Array<NotableFigure & { mention_count: number }>>
}

export function meta() {
  return [
    { title: 'All Quoted Figures - UN Speeches Research' },
    { name: 'description', content: 'Browse all notable figures quoted in UN General Assembly speeches.' },
  ]
}

export async function loader(): Promise<LoaderData> {
  const figures = getNotableFigures()

  // Group by category
  const byCategory: Record<string, Array<NotableFigure & { mention_count: number }>> = {}
  figures.forEach((f) => {
    if (!byCategory[f.category]) {
      byCategory[f.category] = []
    }
    byCategory[f.category].push(f)
  })

  return { figures, byCategory }
}

const categoryOrder = [
  'World Leader',
  'UN Leader',
  'Civil Rights Leader',
  'Philosopher',
  'Writer',
  'Scientist',
  'Economist',
  'Religious Figure',
  'Historical Figure',
  'Political Thinker',
]

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
    default:
      return 'default'
  }
}

export default function FiguresIndex() {
  const { figures, byCategory } = useLoaderData<LoaderData>()

  const sortedCategories = categoryOrder.filter((cat) => byCategory[cat]?.length > 0)

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

      <header className="mb-12">
        <Badge variant="blue" className="mb-4">
          Archive
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          All Quoted Figures
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Browse {figures.length} notable figures mentioned in UN General Assembly speeches.
          Click on any name to see their quotes and the speeches where they appear.
        </p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
        {sortedCategories.slice(0, 5).map((cat) => (
          <div key={cat} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{byCategory[cat].length}</div>
            <div className="text-xs text-gray-500">{cat}s</div>
          </div>
        ))}
      </div>

      {/* Figures by Category */}
      <div className="space-y-12">
        {sortedCategories.map((category) => (
          <section key={category}>
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Badge variant={getCategoryBadgeVariant(category)}>{category}</Badge>
              <span className="text-gray-400 font-normal text-lg">
                ({byCategory[category].length})
              </span>
            </h2>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Mentions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {byCategory[category].map((figure) => (
                    <TableRow key={figure.id}>
                      <TableCell>
                        <Link
                          to={`/research/quotations/figure/${encodeURIComponent(figure.name)}`}
                          className="text-un-blue hover:underline font-medium"
                        >
                          {figure.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">
                        {figure.description || figure.subcategory || '—'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {figure.mention_count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ))}
      </div>
    </PageLayout>
  )
}
