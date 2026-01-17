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

const top2010s = [
  { rank: 1, person: 'Kofi Annan', mentions: 144, context: 'Tributes and human rights legacy.' },
  { rank: 2, person: 'Ban Ki-moon', mentions: '80*', context: 'Sitting Secretary-General references.' },
  { rank: 3, person: 'Nelson Mandela', mentions: 31, context: 'Peace and reconciliation.' },
  { rank: 4, person: 'Pope Francis', mentions: 27, context: "Laudato Si' and 2015 address." },
  { rank: 5, person: 'Martin Luther King', mentions: 21, context: 'Justice and equality.' },
  { rank: 6, person: 'Dag Hammarskjöld', mentions: 20, context: 'UN mission and principles.' },
  { rank: 7, person: 'Fidel Castro', mentions: 12, context: 'Historical context/aligned nations.' },
  { rank: 8, person: 'Albert Einstein', mentions: 10, context: 'Wisdom on solving problems.' },
  { rank: 9, person: 'Mahatma Gandhi', mentions: 10, context: 'Non-violence principles.' },
  { rank: 10, person: 'John F. Kennedy', mentions: 9, context: 'Peace and diplomacy.' },
  { rank: 11, person: 'Buddha', mentions: 9, context: 'Spiritual references.' },
  { rank: 12, person: 'Jesus', mentions: 7, context: 'Peace and charity.' },
  { rank: 13, person: 'Winston Churchill', mentions: 7, context: 'Statecraft and history.' },
  { rank: 14, person: 'Abraham Lincoln', mentions: 6, context: 'Democracy and governance.' },
  { rank: 15, person: 'Antonio Guterres', mentions: 6, context: 'Early term references.' },
  { rank: 16, person: 'Franklin D. Roosevelt', mentions: 5, context: 'UN founder context.' },
  { rank: 17, person: 'Jawaharlal Nehru', mentions: 4, context: 'Non-Aligned Movement.' },
  { rank: 18, person: 'Prophet Muhammad', mentions: 4, context: 'Religious references.' },
  { rank: 19, person: 'Aristotle', mentions: 4, context: 'Political philosophy.' },
  { rank: 20, person: 'Malala Yousafzai', mentions: 3, context: 'Education rights.' },
]

const quotations = [
  {
    quote: 'We have the means and the capacity to deal with our problems, if only we can find the political will.',
    author: 'Kofi Annan',
    citation: 'Madagascar (2018)',
    speechLink: '/speech/51',
  },
  {
    quote: 'It always seems impossible until it is done.',
    author: 'Nelson Mandela',
    citation: 'Greece (2018)',
    speechLink: '/speech/110',
  },
  {
    quote: 'You may never know what results come from your action. But if you do nothing, there will be no result.',
    author: 'Mahatma Gandhi',
    citation: 'Guyana (2019)',
    speechLink: '/speech/8814',
  },
  {
    quote: 'The United Nations was not created in order to bring us to heaven, but in order to save us from hell.',
    author: 'Dag Hammarskjöld',
    citation: 'Australia (2010)',
    speechLink: '/speech/806',
  },
  {
    quote: 'Peace is an imperative for the survival of mankind. It represents the deepest aspirations of men and women throughout the world.',
    author: 'Sheikh Hasina',
    citation: 'Bangladesh (2018)',
    speechLink: '/speech/5225',
  },
]

export function meta() {
  return [
    { title: 'The 2010s: Legacy & Icons - UN Speeches Research' },
    { name: 'description', content: 'Analysis of most quoted people in UN speeches during the 2010s.' },
  ]
}

export default function Research2010s() {
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
                <TableHead>Context</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {top2010s.map((item) => (
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
