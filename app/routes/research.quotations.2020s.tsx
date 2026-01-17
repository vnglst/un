import { Link } from 'react-router'
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

const top2020s = [
  { rank: 1, person: 'Antonio Guterres', mentions: '32*', context: 'Current SG references.' },
  { rank: 2, person: 'Nelson Mandela', mentions: 10, context: 'Moral authority.' },
  { rank: 3, person: 'Pope Francis', mentions: 9, context: 'Social justice/climate.' },
  { rank: 4, person: 'Martin Luther King', mentions: 8, context: 'Racial justice.' },
  { rank: 5, person: 'Winston Churchill', mentions: 6, context: 'Crisis leadership.' },
  { rank: 6, person: 'Kofi Annan', mentions: 4, context: 'Legacy.' },
  { rank: 7, person: 'Abraham Lincoln', mentions: 3, context: 'Democracy.' },
  { rank: 8, person: 'Eleanor Roosevelt', mentions: 2, context: 'Human Rights.' },
  { rank: 9, person: 'Mother Teresa', mentions: 2, context: 'Charity.' },
  { rank: 10, person: 'Aristotle', mentions: 2, context: 'Philosophy.' },
  { rank: 11, person: 'Ban Ki-moon', mentions: 1, context: 'Previous SG.' },
  { rank: 12, person: 'Dag Hammarskjöld', mentions: 1, context: 'UN History.' },
  { rank: 13, person: 'Mahatma Gandhi', mentions: 1, context: 'Non-violence.' },
  { rank: 14, person: 'Albert Einstein', mentions: 1, context: 'Science/Wisdom.' },
  { rank: 15, person: 'Prophet Muhammad', mentions: 1, context: 'Religion.' },
  { rank: 16, person: 'Jesus', mentions: 1, context: 'Religion.' },
  { rank: 17, person: 'Buddha', mentions: 1, context: 'Spirituality.' },
  { rank: 18, person: 'Olof Palme', mentions: 1, context: 'Peace.' },
]

const quotations = [
  {
    quote: 'Injustice anywhere is a threat to justice everywhere.',
    author: 'Martin Luther King',
    citation: 'Serbia (2022)',
    speechLink: '/speech/10344',
  },
  {
    quote: 'The warning lights are flashing.',
    author: 'Antonio Guterres',
    citation: 'Austria (2020)',
    speechLink: '/speech/3611',
  },
  {
    quote: 'Every problem is an opportunity in disguise.',
    author: 'John Adams (Cited)',
    citation: 'Montenegro (2024)',
    speechLink: '/speech/10747',
  },
  {
    quote: 'Never again.',
    author: 'Historical Slogan',
    citation: 'Estonia (2023)',
    speechLink: '/speech/10580',
  },
  {
    quote: 'There is no higher religion than human service. To work for the common good is the greatest creed.',
    author: 'Albert Schweitzer',
    citation: 'Liberia (2020)',
    speechLink: '/speech/3494',
  },
]

export function meta() {
  return [
    { title: 'The 2020s: Crisis & Urgency - UN Speeches Research' },
    { name: 'description', content: 'Analysis of most quoted people in UN speeches during the 2020s.' },
  ]
}

export default function Research2020s() {
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
        <Badge variant="amber" className="mb-4">
          The 2020s
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Crisis & Urgency
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Facing a pandemic and global instability, speakers shifted to voices of urgency and crisis leadership. The rhetoric evolved to meet the challenges of a volatile world.
        </p>
      </header>

      <article className="prose prose-lg prose-stone max-w-none">
        <h2 className="text-2xl font-bold mt-12 mb-6 text-gray-900">Most Cited Figures (2020-2024)</h2>
        <p>
          In the current decade, <strong>Antonio Guterres</strong> is frequently cited as the sitting Secretary-General. 
          Legacy figures like Mandela and King remain relevant, while Winston Churchill saw a spike in citations during the COVID-19 crisis.
        </p>

        <div className="not-prose my-8 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Rank</TableHead>
                <TableHead>Person</TableHead>
                <TableHead>Mentions</TableHead>
                <TableHead>Context</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top2020s.map((item) => (
                <TableRow key={item.person}>
                  <TableCell className="font-medium">#{item.rank}</TableCell>
                  <TableCell>
                    <Link
                      to={`/?q="${item.person}"&mode=phrase`}
                      className="text-un-blue hover:underline font-medium"
                    >
                      {item.person}
                    </Link>
                  </TableCell>
                  <TableCell>{item.mentions}</TableCell>
                  <TableCell className="text-gray-500">{item.context}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <h2 className="text-2xl font-bold mt-12 mb-6 text-gray-900">Notable Quotations</h2>

        <div className="not-prose space-y-8 my-8">
          {quotations.map((q, i) => (
            <QuotationCard key={i} {...q} />
          ))}
        </div>
      </article>
    </PageLayout>
  )
}
