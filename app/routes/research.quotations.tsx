import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import PageLayout from '~/components/page-layout'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'

const topOverall = [
  { rank: 1, person: 'Ban Ki-moon', mentions: 60, context: 'Secretary-General (2007-2016)' },
  { rank: 2, person: 'Kofi Annan', mentions: 40, context: 'Secretary-General (1997-2006)' },
  { rank: 3, person: 'Antonio Guterres', mentions: 38, context: 'Secretary-General (2017-Present)' },
  { rank: 4, person: 'Pope Francis', mentions: 36, context: 'Religious Leader' },
  { rank: 5, person: 'Nelson Mandela', mentions: 36, context: 'Peace Icon' },
  { rank: 6, person: 'Martin Luther King', mentions: 22, context: 'Civil Rights Leader' },
  { rank: 7, person: 'Dag Hammarskjöld', mentions: 14, context: 'Secretary-General (1953-1961)' },
  { rank: 8, person: 'Winston Churchill', mentions: 13, context: 'UK Prime Minister' },
  { rank: 9, person: 'Mahatma Gandhi', mentions: 7, context: 'Independence Leader' },
  { rank: 10, person: 'John F. Kennedy', mentions: 7, context: 'US President' },
  { rank: 11, person: 'Albert Einstein', mentions: 7, context: 'Physicist' },
  { rank: 12, person: 'Jesus', mentions: 6, context: 'Religious Figure' },
  { rank: 13, person: 'Prophet Muhammad', mentions: 5, context: 'Religious Figure' },
  { rank: 14, person: 'Buddha', mentions: 5, context: 'Religious Figure' },
  { rank: 15, person: 'Aristotle', mentions: 5, context: 'Philosopher' },
  { rank: 16, person: 'Abraham Lincoln', mentions: 5, context: 'US President' },
  { rank: 17, person: 'Malala Yousafzai', mentions: 3, context: 'Activist' },
  { rank: 18, person: 'Fidel Castro', mentions: 3, context: 'Cuban Leader' },
  { rank: 19, person: 'Eleanor Roosevelt', mentions: 3, context: 'Human Rights Diplomat' },
  { rank: 20, person: 'Olof Palme', mentions: 2, context: 'Swedish PM' },
]

export function meta() {
  return [
    { title: 'Research: Most Quoted People - UN Speeches' },
    { name: 'description', content: 'Research analysis of the most quoted people in UN General Assembly speeches.' },
  ]
}

export default function ResearchQuotations() {
  return (
    <PageLayout maxWidth="narrow">
      <div className="mb-6">
        <Link
          to="/research"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back to Research
        </Link>
      </div>

      {/* Article Header */}
      <header className="mb-12">
        <Badge variant="blue" className="mb-4">
          Analysis
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
          Who are the most quoted people in UN history?
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          An analysis of thousands of General Assembly speeches from 2010 to 2024 reveals the enduring influence of peace icons and the rhetorical habits of world leaders.
        </p>
      </header>

      {/* Content */}
      <article className="prose prose-lg prose-stone max-w-none">
        <p>
          Speeches at the United Nations General Assembly often reach for moral authority by citing historical figures. 
          We analyzed speech "chunks" (text segments) from 2010 to 2024 to identify who is most often quoted.
        </p>

        {/* Overview Section */}
        <div className="not-prose my-12 space-y-12">
          
          {/* Top 20 Overall Table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="font-bold text-gray-900">Top 20 Overall (2010-2024)</h3>
            </div>
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
                {topOverall.map((item) => (
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

          {/* Themes Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">The 2010s: Legacy & Icons</h3>
                <Link to="2010s" className="text-xs font-medium text-un-blue hover:text-blue-800 uppercase tracking-wide whitespace-nowrap shrink-0 ml-4">
                  View Analysis &rarr;
                </Link>
              </div>
              <p className="text-gray-600 mb-4">
                A decade defined by retrospection and tributes. The passing of <strong>Kofi Annan</strong> and <strong>Nelson Mandela</strong> turned their words into guiding principles for the assembly. Pope Francis's historic address also left a lasting mark.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="blue">Peace & Reconciliation</Badge>
                <Badge variant="blue">Moral Authority</Badge>
                <Badge variant="blue">Human Rights</Badge>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">The 2020s: Crisis & Urgency</h3>
                <Link to="2020s" className="text-xs font-medium text-un-blue hover:text-blue-800 uppercase tracking-wide whitespace-nowrap shrink-0 ml-4">
                  View Analysis &rarr;
                </Link>
              </div>
              <p className="text-gray-600 mb-4">
                Facing a pandemic and global instability, speakers shifted to voices of urgency. <strong>Antonio Guterres's</strong> "warning lights" and <strong>Churchill's</strong> crisis leadership became central themes, alongside persistent calls for racial justice invoking <strong>MLK</strong>.
              </p>
              <div className="flex flex-wrap gap-2">
                 <Badge variant="blue">Racial Justice</Badge>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">The 2000s: Millennium & Hope</h3>
                <Link to="2000s" className="text-xs font-medium text-un-blue hover:text-blue-800 uppercase tracking-wide whitespace-nowrap shrink-0 ml-4">
                  View Analysis &rarr;
                </Link>
              </div>
              <p className="text-gray-600 mb-4">
                The turn of the millennium brought a focus on new beginnings. <strong>Kofi Annan's</strong> influence was paramount, while historical figures like <strong>Gandhi</strong> and <strong>King</strong> remained constant touchstones.
              </p>
              <div className="flex flex-wrap gap-2">
                 <Badge variant="blue">Millennium Goals</Badge>
                 <Badge variant="blue">Development</Badge>
                 <Badge variant="blue">Peace</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Methodology Section */}
        <div className="border-t border-gray-200 pt-12 mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Research Methodology</h2>
          <p className="mb-6">
            This data was compiled by analyzing over 1 million text segments ("chunks") from the United Nations General Assembly speech database. 
            We used pattern matching to identify moments where speakers explicitly attributed words to others using phrases like <em>'he said'</em>, <em>'she said'</em>, or <em>'quoted'</em>.
          </p>
          
          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg my-8">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <span className="text-xs font-mono text-gray-400 ml-2">analysis.sql</span>
            </div>
            <div className="p-6 overflow-x-auto">
              <pre className="text-sm font-mono leading-relaxed text-gray-300">
                <code>{`-- Identify potential quotations using text pattern matching
SELECT 
  s.year,
  c.speech_id,
  c.content as quote_context
FROM chunks c
JOIN speeches s ON c.speech_id = s.id
WHERE 
  (c.content LIKE '%said "%"%' 
   OR c.content LIKE '%quoted "%"%')
  AND s.year >= 2010
ORDER BY s.year DESC;`}</code>
              </pre>
            </div>
          </div>

          <p>
            The results were then aggregated by person to determine the most frequently cited figures. 
            For identifying specific individuals (e.g., "Ban Ki-moon"), we performed secondary passes to count mentions within these quotation contexts.
          </p>
        </div>
      </article>
    </PageLayout>
  )
}
