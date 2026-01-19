import { Link, useLoaderData } from 'react-router'
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
import { getNotableFigures, type NotableFigure } from '~/lib/database'
import { Users } from 'lucide-react'

type LoaderData = {
  topFigures: Array<NotableFigure & { mention_count: number }>
  totalFigures: number
  totalQuotations: number
}

export async function loader(): Promise<LoaderData> {
  const allFigures = getNotableFigures()
  const topFigures = allFigures.slice(0, 20)
  const totalQuotations = allFigures.reduce((sum, f) => sum + f.mention_count, 0)

  return {
    topFigures,
    totalFigures: allFigures.length,
    totalQuotations,
  }
}

export function meta() {
  return [
    { title: 'Research: Most Quoted People - UN Speeches' },
    { name: 'description', content: 'Research analysis of the most quoted people in UN General Assembly speeches.' },
  ]
}

export default function ResearchQuotations() {
  const { topFigures, totalFigures, totalQuotations } = useLoaderData<LoaderData>()

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
          An analysis of thousands of General Assembly speeches from 1946 to 2024 reveals the enduring influence of peace icons and the rhetorical habits of world leaders.
        </p>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-12">
        <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 text-center">
          <div className="text-2xl md:text-3xl font-bold text-gray-900">{totalFigures}</div>
          <div className="text-xs md:text-sm text-gray-500">Notable Figures</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-3 md:p-4 text-center">
          <div className="text-2xl md:text-3xl font-bold text-gray-900">{totalQuotations.toLocaleString()}</div>
          <div className="text-xs md:text-sm text-gray-500">Total Mentions</div>
        </div>
      </div>

      {/* Content */}
      <article className="prose prose-lg prose-stone max-w-none">
        <p>
          Speeches at the United Nations General Assembly often reach for moral authority by citing historical figures.
          We analyzed speech "chunks" (text segments) from 1950 to 2024 to identify who is most often quoted.
        </p>

        {/* Overview Section */}
        <div className="not-prose my-12 space-y-12">
          
          {/* Top 20 Overall Table */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Top 20 Overall (1946-2024)</h3>
              <Link
                to="/research/quotations/figures"
                className="flex items-center gap-1 text-sm text-un-blue hover:underline"
              >
                <Users className="h-4 w-4" />
                View all {totalFigures} figures
              </Link>
            </div>
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
                  <TableRow key={figure.id}>
                    <TableCell className="font-medium">#{index + 1}</TableCell>
                    <TableCell>
                      <Link
                        to={`/research/quotations/figure/${encodeURIComponent(figure.name)}`}
                        className="text-un-blue hover:underline font-medium"
                      >
                        {figure.name}
                      </Link>
                    </TableCell>
                    <TableCell>{figure.mention_count}</TableCell>
                    <TableCell className="text-gray-500">{figure.category}</TableCell>
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

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">The 1990s: New World Order</h3>
                <Link to="1990s" className="text-xs font-medium text-un-blue hover:text-blue-800 uppercase tracking-wide whitespace-nowrap shrink-0 ml-4">
                  View Analysis &rarr;
                </Link>
              </div>
              <p className="text-gray-600 mb-4">
                The fall of the Berlin Wall and the end of the Cold War ushered in unprecedented optimism. <strong>Nelson Mandela's</strong> release and the Oslo Accords defined a decade of hope.
              </p>
              <div className="flex flex-wrap gap-2">
                 <Badge variant="blue">End of Cold War</Badge>
                 <Badge variant="blue">Apartheid's End</Badge>
                 <Badge variant="blue">Peace Process</Badge>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">The 1980s: Cold War Twilight</h3>
                <Link to="1980s" className="text-xs font-medium text-un-blue hover:text-blue-800 uppercase tracking-wide whitespace-nowrap shrink-0 ml-4">
                  View Analysis &rarr;
                </Link>
              </div>
              <p className="text-gray-600 mb-4">
                The final decade of the Cold War saw superpower tensions and the rise of <strong>Gorbachev's</strong> reforms. <strong>Nelson Mandela</strong> became a global symbol of resistance.
              </p>
              <div className="flex flex-wrap gap-2">
                 <Badge variant="blue">Anti-Apartheid</Badge>
                 <Badge variant="blue">Glasnost</Badge>
                 <Badge variant="blue">Disarmament</Badge>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">The 1970s: Detente & Upheaval</h3>
                <Link to="1970s" className="text-xs font-medium text-un-blue hover:text-blue-800 uppercase tracking-wide whitespace-nowrap shrink-0 ml-4">
                  View Analysis &rarr;
                </Link>
              </div>
              <p className="text-gray-600 mb-4">
                A decade marked by superpower detente, the oil crisis, and the end of the Vietnam War. <strong>China's</strong> entry into the UN in 1971 reshaped global diplomacy.
              </p>
              <div className="flex flex-wrap gap-2">
                 <Badge variant="blue">Detente</Badge>
                 <Badge variant="blue">Oil Crisis</Badge>
                 <Badge variant="blue">China's Entry</Badge>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">The 1960s: Decolonization & Crisis</h3>
                <Link to="1960s" className="text-xs font-medium text-un-blue hover:text-blue-800 uppercase tracking-wide whitespace-nowrap shrink-0 ml-4">
                  View Analysis &rarr;
                </Link>
              </div>
              <p className="text-gray-600 mb-4">
                The decade of African independence saw dozens of new nations join the UN. The Cuban Missile Crisis brought the world to the brink.
              </p>
              <div className="flex flex-wrap gap-2">
                 <Badge variant="blue">Decolonization</Badge>
                 <Badge variant="blue">Cuban Crisis</Badge>
                 <Badge variant="blue">Non-Aligned</Badge>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
               <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">The 1950s: Early Cold War</h3>
                <Link to="1950s" className="text-xs font-medium text-un-blue hover:text-blue-800 uppercase tracking-wide whitespace-nowrap shrink-0 ml-4">
                  View Analysis &rarr;
                </Link>
              </div>
              <p className="text-gray-600 mb-4">
                The formative decade of the United Nations, shaped by the Korean War and the dawn of the atomic age. <strong>Dag Hammarskjöld</strong> became the iconic Secretary-General.
              </p>
              <div className="flex flex-wrap gap-2">
                 <Badge variant="blue">Korean War</Badge>
                 <Badge variant="blue">Atomic Age</Badge>
                 <Badge variant="blue">UN Formation</Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Methodology Section */}
        <div className="border-t border-gray-200 pt-12 mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Research Methodology</h2>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">1. Building the Figure Database</h3>
          <p className="mb-6">
            We curated a database of {totalFigures} notable figures across 10 categories: philosophers, political thinkers,
            economists, scientists, writers, historical figures, civil rights leaders, religious figures, UN leaders,
            and world leaders. For each figure, we store name variations to catch different spellings and references
            (e.g., "Mahatma Gandhi", "Mohandas Gandhi", "M.K. Gandhi").
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">2. Extracting Mentions</h3>
          <p className="mb-6">
            We analyzed over 120,000 text segments ("chunks") from UN General Assembly speeches spanning 1946-2024.
            Each chunk was searched for mentions of our notable figures using pattern matching against their name variations.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">3. Identifying Direct Quotations</h3>
          <p className="mb-6">
            Not every mention is a quote. To distinguish actual quotations from mere references, we look for
            <strong> attribution patterns</strong> where the quoted text is explicitly attributed to the figure.
            This prevents false positives like marking random quoted text near a name mention as a "quote by" that person.
          </p>

          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg my-8">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <span className="text-xs font-mono text-gray-400 ml-2">attribution_patterns.py</span>
            </div>
            <div className="p-6 overflow-x-auto">
              <pre className="text-sm font-mono leading-relaxed text-gray-300">
                <code>{`# Patterns that identify quotes ATTRIBUTED to a figure
# Supports both ASCII and Unicode quotation marks

# Forward attribution: "Gandhi said '...'"
r'{name}\\s+(once\\s+)?said[,:.;]?\\s*["\\'""''](.+)["\\'""'']'

# Reverse attribution: "'...' - Gandhi"
r'["\\'""''](.+)["\\'""'']\\s*[-–—]\\s*{name}'

# Formal attribution: "As Gandhi wrote, '...'"
r'as\\s+{name}\\s+(said|wrote|put it)[,:.;]?\\s*["\\'""''](.+)["\\'""'']'

# Quoted attribution: "To quote Gandhi, '...'"
r'to quote\\s+{name}[,:.;]?\\s*["\\'""''](.+)["\\'""'']'

# In the words of: "In the words of Gandhi, '...'"
r'in the words of\\s+{name}[,:.;]?\\s*["\\'""''](.+)["\\'""'']'`}</code>
              </pre>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">4. Confidence Scoring</h3>
          <p className="mb-6">
            Each mention receives a confidence score from 0.3 to 1.0:
          </p>
          <ul className="list-disc list-inside mb-6 space-y-2 text-gray-700">
            <li><strong>0.95</strong> — Clear attribution with quoted text (e.g., <em>"Gandhi said, 'Be the change...'"</em>)</li>
            <li><strong>0.5</strong> — Weaker indicators (e.g., <em>"according to Gandhi"</em>, <em>"Gandhi believed"</em>)</li>
            <li><strong>0.3</strong> — Simple mention without attribution context</li>
          </ul>
          <p className="mb-6">
            Only mentions with clear attribution patterns (confidence ≥ 0.9) are marked as "direct quotes" and displayed
            in the quotation sections. All other mentions are tracked but shown separately.
          </p>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">5. Full Transparency</h3>
          <p className="mb-6">
            Every quotation links directly to its source speech. Click on any figure's name to see all their
            quotations with the exact speech, year, and country where each quote was cited. This allows you to
            verify any data point against the original source material.
          </p>

          <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg my-8">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <span className="text-xs font-mono text-gray-400 ml-2">database schema</span>
            </div>
            <div className="p-6 overflow-x-auto">
              <pre className="text-sm font-mono leading-relaxed text-gray-300">
                <code>{`-- Notable figures table
CREATE TABLE notable_figures (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,  -- Philosopher, Scientist, etc.
  description TEXT,
  search_patterns TEXT     -- JSON array of name variations
);

-- Quotations linked to speeches
CREATE TABLE quotations (
  id INTEGER PRIMARY KEY,
  figure_id INTEGER REFERENCES notable_figures(id),
  speech_id INTEGER REFERENCES speeches(id),
  quote_text TEXT NOT NULL,
  is_direct_quote BOOLEAN,
  confidence_score REAL    -- 0.3 to 1.0
);`}</code>
              </pre>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-900 mt-8 mb-4">Limitations</h3>
          <p className="mb-6">
            This methodology has some inherent limitations:
          </p>
          <ul className="list-disc list-inside mb-6 space-y-2 text-gray-700">
            <li>Paraphrased quotes without quotation marks are not captured as direct quotes</li>
            <li>Misattributed quotes (where a speaker incorrectly attributes a quote) are included as-is</li>
            <li>Some figures with common names may have fewer results due to stricter matching to avoid false positives</li>
            <li>Translations of speeches may vary in how they render quotations</li>
          </ul>
        </div>
      </article>
    </PageLayout>
  )
}
