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

const top2000s = [
  { rank: 1, person: 'Kofi Annan', mentions: '90*', context: 'Secretary-General (1997-2006)' },
  { rank: 2, person: 'Nelson Mandela', mentions: 25, context: 'Diffusing conflict.' },
  { rank: 3, person: 'Martin Luther King', mentions: 18, context: 'Equality.' },
  { rank: 4, person: 'Mahatma Gandhi', mentions: 15, context: 'Non-violence.' },
  { rank: 5, person: 'Dag Hammarskjöld', mentions: 12, context: 'UN principles.' },
  { rank: 6, person: 'Winston Churchill', mentions: 10, context: 'History.' },
  { rank: 7, person: 'John F. Kennedy', mentions: 8, context: 'Peace.' },
  { rank: 8, person: 'Fidel Castro', mentions: 8, context: 'Anti-imperialism.' },
  { rank: 9, person: 'Mother Teresa', mentions: 6, context: 'Charity.' },
  { rank: 10, person: 'Pope John Paul II', mentions: 6, context: 'Peace.' },
  { rank: 11, person: 'Abraham Lincoln', mentions: 5, context: 'Democracy.' },
  { rank: 12, person: 'Franklin D. Roosevelt', mentions: 5, context: 'UN founder.' },
  { rank: 13, person: 'Jesus', mentions: 5, context: 'Religion.' },
  { rank: 14, person: 'Prophet Muhammad', mentions: 4, context: 'Religion.' },
  { rank: 15, person: 'Buddha', mentions: 4, context: 'Spirituality.' },
  { rank: 16, person: 'Yasser Arafat', mentions: 4, context: 'Palestine.' },
  { rank: 17, person: 'Olof Palme', mentions: 3, context: 'Peace.' },
  { rank: 18, person: 'Kwame Nkrumah', mentions: 3, context: 'Pan-Africanism.' },
  { rank: 19, person: 'Simon Bolivar', mentions: 3, context: 'Latin American unity.' },
  { rank: 20, person: 'Che Guevara', mentions: 2, context: 'Revolution.' },
]

const quotations = [
  {
    quote: 'Looking for Fidel.',
    author: 'Hugo Chavez',
    citation: 'Venezuela (2009)',
    speechLink: '/speech/4908',
  },
  {
    quote: 'Any customer can have a car painted any colour that he wants so long as it is black.',
    author: 'Henry Ford',
    citation: 'Venezuela (2008)',
    speechLink: '/speech/4820',
  },
  {
    quote: 'I think there is sufficient wisdom if it can only be energized in our section of the world.',
    author: 'Dermot Ahern',
    citation: 'Ireland (2007)',
    speechLink: '/speech/4725',
  },
  {
    quote: 'It is by reintroducing the rule of law... that we can hope to resuscitate societies.',
    author: 'Vinci Niel Clodumar',
    citation: 'Nauru (2004)',
    speechLink: '/speech/4214',
  },
  {
    quote: 'To the people of Afghanistan.',
    author: 'Hugo Chavez',
    citation: 'Venezuela (2006)',
    speechLink: '/speech/4621',
  },
]

export function meta() {
  return [
    { title: 'The 2000s: Millennium & Hope - UN Speeches Research' },
    { name: 'description', content: 'Analysis of most quoted people in UN speeches during the 2000s.' },
  ]
}

export default function Research2000s() {
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
          The 2000s
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Millennium & Hope
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          The turn of the millennium brought a focus on new beginnings, the Millennium Development Goals, and a renewed commitment to peace. 
          <strong>Kofi Annan's</strong> influence was paramount, while historical figures like <strong>Gandhi</strong> and <strong>King</strong> remained constant touchstones.
        </p>
      </header>

      <article className="prose prose-lg prose-stone max-w-none">
        <h2 className="text-2xl font-bold mt-12 mb-6 text-gray-900">Most Cited Figures (2000-2009)</h2>
        <p>
          The 2000s saw diverse citations, with <strong>Kofi Annan</strong> leading as the sitting Secretary-General. 
          The rhetoric often centered on development and resolving long-standing conflicts, invoking figures of liberation and peace.
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
              {top2000s.map((item) => (
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
          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            * Sitting Secretary-Generals are often "quoted" via references to their reports.
          </div>
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
