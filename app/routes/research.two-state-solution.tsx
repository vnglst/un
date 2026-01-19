import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import PageLayout from '~/components/page-layout'
import { Scale, Users, Flag, Handshake, FileText, Globe2 } from 'lucide-react'

export function meta() {
  return [
    { title: 'Research: Two-State Solution Evolution - UN Speeches' },
    { name: 'description', content: 'A data-driven study of how the two-state solution concept evolved in UN General Assembly speeches from 1947 to 2024.' },
  ]
}

// Data for the terminology evolution chart
const terminologyData = {
  twoStateSolution: [
    { year: 2001, count: 1 }, { year: 2002, count: 2 }, { year: 2003, count: 1 }, { year: 2004, count: 7 },
    { year: 2005, count: 4 }, { year: 2006, count: 3 }, { year: 2007, count: 8 }, { year: 2008, count: 7 },
    { year: 2009, count: 16 }, { year: 2010, count: 12 }, { year: 2011, count: 20 }, { year: 2012, count: 20 },
    { year: 2013, count: 23 }, { year: 2014, count: 22 }, { year: 2015, count: 21 }, { year: 2016, count: 28 },
    { year: 2017, count: 25 }, { year: 2018, count: 33 }, { year: 2019, count: 30 }, { year: 2020, count: 25 },
    { year: 2021, count: 23 }, { year: 2022, count: 28 }, { year: 2023, count: 22 }, { year: 2024, count: 62 }
  ],
  palestinianPeople: [
    { year: 1967, count: 4 }, { year: 1968, count: 13 }, { year: 1969, count: 12 }, { year: 1970, count: 16 },
    { year: 1974, count: 61 }, { year: 1979, count: 112 }, { year: 1983, count: 113 }, { year: 1988, count: 100 },
    { year: 1993, count: 32 }, { year: 2000, count: 33 }, { year: 2011, count: 63 }, { year: 2024, count: 47 }
  ],
  palestinianState: [
    { year: 1977, count: 12 }, { year: 1983, count: 14 }, { year: 1989, count: 36 }, { year: 2001, count: 39 },
    { year: 2011, count: 67 }, { year: 2024, count: 40 }
  ]
}

// Key statistics by decade
const decadeStats = [
  { decade: "1947-1959", framework: "Partition Plan", keyTerm: "partition", speeches: 47, countries: 15 },
  { decade: "1960s", framework: "Self-Determination", keyTerm: "Palestinian people", speeches: 48, countries: 28 },
  { decade: "1970s", framework: "PLO Recognition", keyTerm: "legitimate rights", speeches: 97, countries: 67 },
  { decade: "1980s", framework: "Statehood Movement", keyTerm: "Palestinian state", speeches: 81, countries: 72 },
  { decade: "1990s", framework: "Peace Process", keyTerm: "Oslo/negotiations", speeches: 49, countries: 45 },
  { decade: "2000s", framework: "Two-State Solution", keyTerm: "two-state solution", speeches: 135, countries: 34 },
  { decade: "2010s", framework: "Statehood Bid", keyTerm: "State of Palestine", speeches: 358, countries: 113 },
  { decade: "2020s", framework: "Renewed Urgency", keyTerm: "two-state solution", speeches: 183, countries: 125 }
]

// Timeline data with speech IDs for linking
const timeline = [
  {
    year: "1947",
    era: "The Partition Plan",
    icon: Scale,
    color: "amber",
    narrative: "The UN proposes dividing Mandatory Palestine into separate Jewish and Arab states. Arab nations denounce it as a violation of self-determination principles.",
    keySpeech: {
      id: 2137,
      country: "Syria",
      speaker: "Mr. El-Khouri",
      quote: "Partition of Palestine into two separate States, granting the lion's share to the Jews and depriving the rightful owners of the country of their homeland... We cannot give weight to such recommendations; they violate one of the fundamental principles of the Charter — namely, the right of self-determination of peoples.",
      context: "Syria articulates the foundational Arab opposition to partition, framing it as a colonial imposition rather than a just solution."
    }
  },
  {
    year: "1967-1974",
    era: "Palestinian Identity Emerges",
    icon: Users,
    color: "orange",
    narrative: "The Six-Day War transforms the discourse. 'Palestinian people' becomes standard terminology, and the PLO gains UN recognition as their sole representative.",
    keySpeech: {
      id: 375,
      country: "Yugoslavia",
      speaker: "Mr. Minic",
      quote: "Palestine Liberation Organization [PLO] to be its sole legitimate representative. We are convinced that at this session appropriate decisions will be adopted in this direction and that the Palestinian representatives will be granted equal participation in all efforts to overcome the Middle East crisis.",
      context: "Yugoslavia, representing the Non-Aligned Movement, calls for PLO participation in peace efforts — a position that would become international consensus."
    },
    stats: { before: 4, after: 112, metric: "'Palestinian people' mentions", yearRange: "1967→1979" }
  },
  {
    year: "1980s",
    era: "The Statehood Movement",
    icon: Flag,
    color: "red",
    narrative: "Calls for an independent Palestinian state intensify. The 1988 Palestinian Declaration of Independence triggers a global surge in statehood discourse.",
    keySpeech: {
      id: 9582,
      country: "Jordan",
      speaker: "Mr. Masri",
      quote: "Palestinian State on the soil of the Palestinian homeland. At the same time, we resolutely assert that Jordan will continue to perform its national role as a major party to the Arab-Israeli conflict... Palestinian identity has at no time been in conflict with or opposition to Jordanian identity.",
      context: "Jordan acknowledges the separate Palestinian identity while maintaining its special relationship — a nuanced position reflecting the complexity of the era."
    },
    stats: { before: 7, after: 36, metric: "'Palestinian state' mentions", yearRange: "1988→1989" }
  },
  {
    year: "1993",
    era: "The Oslo Era",
    icon: Handshake,
    color: "green",
    narrative: "Mutual recognition replaces confrontation. The Oslo Accords are celebrated as a 'triumph of reason' opening possibilities for coexistence.",
    keySpeech: {
      id: 2902,
      country: "Namibia",
      speaker: "Mr. Gurirab",
      quote: "Historic breakthrough represented by mutual recognition and the declaration of principles signed between Israel and the Palestine Liberation Organization (PLO) on Palestinian self-rule in Gaza and the city of Jericho. Despite their long enmity, the leaders of the State of Israel and the PLO summoned the political courage to embrace peace.",
      context: "Namibia, itself newly independent after a long struggle, celebrates the breakthrough while acknowledging this is only 'a first step'."
    }
  },
  {
    year: "2001",
    era: "Two-State Solution Codified",
    icon: FileText,
    color: "blue",
    narrative: "The explicit phrase 'two-state solution' enters UN diplomatic vocabulary. Yasser Arafat uses it to frame Palestinian aspirations in terms the international community will adopt as standard.",
    keySpeech: {
      id: 4563,
      country: "Palestine",
      speaker: "Yasser Arafat",
      quote: "Two-State solution — Israel and Palestine — and with regard to expeditiously resuming the peace process. For our part, we will exert every possible effort to achieve those objectives.",
      context: "This is the FIRST explicit use of 'two-state solution' in the UN speeches database — a term that would become the universal framework for peace negotiations."
    },
    stats: { before: 0, after: 62, metric: "'Two-state solution' mentions", yearRange: "2000→2024" }
  },
  {
    year: "2006",
    era: "Israeli Acceptance",
    icon: Scale,
    color: "indigo",
    narrative: "Israel officially embraces the two-state framework, though with conditions. The concept achieves near-universal acceptance as the basis for negotiations.",
    keySpeech: {
      id: 10028,
      country: "Israel",
      speaker: "Tzipi Livni",
      quote: "Two-State vision. It requires each people to accept that their rights are realized through the establishment of their own homeland, not in the homeland of others. The second principle for peace is drawn from the concept of living in peace and security... the State of Palestine that emerges next to Israel cannot be a terror State.",
      context: "Israel's Foreign Minister formally endorses two states while establishing security conditions — marking a significant shift in official Israeli UN rhetoric."
    }
  },
  {
    year: "2011",
    era: "The Statehood Bid",
    icon: Globe2,
    color: "purple",
    narrative: "Palestine seeks full UN membership, generating the highest-ever mentions of 'Palestinian state' (67 speeches). The bid transforms the two-state solution from aspiration to diplomatic demand.",
    keySpeech: {
      id: 7324,
      country: "Jordan",
      speaker: "King Abdullah II",
      quote: "Two-State solution that ends the conflict by meeting the needs of both sides is, and can be, the only secure and lasting peace. A solution comprised of two States — a sovereign, independent and viable Palestine and Israel, accepted and secure — is the core of all major international proposals, including the Arab Peace Initiative.",
      context: "King Abdullah frames two states as the consensus position of all major peace initiatives, from the Quartet to the Arab Peace Initiative."
    }
  },
  {
    year: "2024",
    era: "Post-October 7 Urgency",
    icon: Scale,
    color: "red",
    narrative: "The two-state solution reaches its highest-ever mention count (62 speeches) amid calls for a 'Global Alliance' to implement it. The ICJ advisory opinion adds legal weight to the framework.",
    keySpeech: {
      id: 8634,
      country: "Norway",
      speaker: "Espen Barth Eide",
      quote: "Two days ago, almost a hundred Member states took part in a meeting called by Saudi Arabia, the EU and Norway, launching a Global Alliance to implement the two state solution. Three decades after the Oslo Accords, more and more states are realizing that endlessly waiting for the right moment to negotiate will not work.",
      context: "Norway, architect of the original Oslo process, calls for moving beyond negotiation toward implementation — reflecting frustration with 30 years of stalled progress."
    },
    keySpeech2: {
      id: 8711,
      country: "United States",
      speaker: "President Biden",
      quote: "Two-state solution, where the world — where Israel enjoys security and peace and full recognition and normalized relations with all its neighbors, where Palestinians live in security, dignity, and self-determination in a state of their own.",
      context: "President Biden reaffirms US commitment to two states while linking it to regional normalization — the Abraham Accords framework."
    }
  }
]

function BarChart({ data, maxValue, color = "blue" }: { data: { year: number; count: number }[]; maxValue: number; color?: string }) {
  const colorClasses: Record<string, string> = {
    blue: "bg-un-blue",
    green: "bg-green-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500"
  }

  const chartHeight = 128 // pixels (h-32)

  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: chartHeight }}>
        {data.map((d) => {
          const barHeight = Math.max((d.count / maxValue) * chartHeight, d.count > 0 ? 4 : 0)
          return (
            <div key={d.year} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full">
              <div
                className={`w-full ${colorClasses[color] || colorClasses.blue} rounded-t opacity-80 hover:opacity-100 transition-opacity cursor-pointer`}
                style={{ height: barHeight }}
                title={`${d.year}: ${d.count} speeches`}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1 mt-2">
        {data.map((d) => (
          <div key={d.year} className="flex-1 min-w-0 text-center">
            <span className="text-[10px] text-gray-400">{d.year.toString().slice(2)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ResearchTwoStateSolution() {
  return (
    <PageLayout maxWidth="narrow">
      <div className="mb-6">
        <Link
          to="/research"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          &larr; Back to Research
        </Link>
      </div>

      <header className="mb-12">
        <Badge variant="blue" className="mb-4">
          Data Analysis
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
          The Two-State Solution
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          How a 1947 partition concept became the universal framework for Israeli-Palestinian peace — traced through 77 years of UN General Assembly speeches.
        </p>
      </header>

      {/* Key Statistics */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-un-blue/5 rounded-xl p-3 md:p-5 text-center">
            <div className="text-2xl md:text-3xl font-bold text-un-blue">1947</div>
            <div className="text-xs md:text-sm text-gray-600">Partition concept introduced</div>
          </div>
          <div className="bg-green-50 rounded-xl p-3 md:p-5 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">2001</div>
            <div className="text-xs md:text-sm text-gray-600">First "two-state solution" use</div>
          </div>
          <div className="bg-purple-50 rounded-xl p-3 md:p-5 text-center">
            <div className="text-2xl md:text-3xl font-bold text-purple-600">125</div>
            <div className="text-xs md:text-sm text-gray-600">Countries using term (2020s)</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-3 md:p-5 text-center">
            <div className="text-2xl md:text-3xl font-bold text-orange-600">62</div>
            <div className="text-xs md:text-sm text-gray-600">Speeches in 2024 (record)</div>
          </div>
        </div>
      </section>

      {/* Chart: Two-State Solution Mentions */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Rise of the "Two-State Solution" Phrase</h2>
        <p className="text-gray-600 mb-6">Number of UN speeches explicitly mentioning "two-state solution" per year (2001-2024)</p>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <BarChart
            data={terminologyData.twoStateSolution}
            maxValue={65}
            color="blue"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-4 pt-4 border-t">
            <span>First use: 2001 (Arafat)</span>
            <span>Peak: 2024 (62 speeches)</span>
          </div>
        </div>
      </section>

      {/* Decade Evolution Table */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Evolution by Decade</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Era</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Framework</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Key Term</th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Countries</th>
              </tr>
            </thead>
            <tbody>
              {decadeStats.map((row, i) => (
                <tr key={row.decade} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-3 px-4 font-medium">{row.decade}</td>
                  <td className="py-3 px-4 text-gray-600">{row.framework}</td>
                  <td className="py-3 px-4">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{row.keyTerm}</code>
                  </td>
                  <td className="py-3 px-4 text-right font-mono">{row.countries}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Timeline */}
      <section className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">Historical Timeline</h2>
        <div className="space-y-12">
          {timeline.map((item, index) => {
            const colorMap: Record<string, { bg: string; border: string; text: string }> = {
              amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
              orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
              red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
              green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
              blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
              indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
              purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' }
            }
            const colors = colorMap[item.color] || colorMap.blue

            return (
              <div key={item.year} className="relative pl-8 md:pl-12">
                {/* Timeline line */}
                {index !== timeline.length - 1 && (
                  <div className="absolute left-3 md:left-5 top-10 bottom-0 w-px bg-gray-200" />
                )}

                {/* Timeline dot */}
                <div className={`absolute left-0 md:left-2 top-0 w-6 h-6 md:w-7 md:h-7 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center z-10`}>
                  <item.icon className={`h-3 w-3 md:h-4 md:w-4 ${colors.text}`} />
                </div>

                {/* Content */}
                <div className={`${colors.bg} rounded-xl p-6 border ${colors.border}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xl font-bold ${colors.text}`}>{item.year}</span>
                    <Badge variant="secondary">{item.era}</Badge>
                  </div>

                  <p className="text-gray-700 mb-4 leading-relaxed">{item.narrative}</p>

                  {item.stats && (
                    <div className="bg-white/60 rounded-lg p-3 mb-4 flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-400">{item.stats.before}</div>
                        <div className="text-xs text-gray-500">before</div>
                      </div>
                      <div className="text-2xl text-gray-300">&rarr;</div>
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${colors.text}`}>{item.stats.after}</div>
                        <div className="text-xs text-gray-500">after</div>
                      </div>
                      <div className="flex-1 text-sm text-gray-600">
                        {item.stats.metric}<br/>
                        <span className="text-xs text-gray-400">{item.stats.yearRange}</span>
                      </div>
                    </div>
                  )}

                  {/* Primary Quote */}
                  <div className="bg-white rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Primary Source</span>
                      <span className="text-xs text-gray-400">{item.keySpeech.country}</span>
                    </div>
                    <blockquote className="text-gray-800 italic mb-3 border-l-4 border-gray-200 pl-4">
                      "{item.keySpeech.quote}"
                    </blockquote>
                    <p className="text-sm text-gray-500 mb-3">{item.keySpeech.context}</p>
                    <Link
                      to={`/speech/${item.keySpeech.id}`}
                      className="text-un-blue text-sm font-medium hover:underline inline-flex items-center gap-1"
                    >
                      View Full Speech &rarr;
                    </Link>
                  </div>

                  {/* Secondary Quote (if exists) */}
                  {item.keySpeech2 && (
                    <div className="bg-white rounded-lg p-4 border border-gray-100 mt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Additional Source</span>
                        <span className="text-xs text-gray-400">{item.keySpeech2.country}</span>
                      </div>
                      <blockquote className="text-gray-800 italic mb-3 border-l-4 border-gray-200 pl-4">
                        "{item.keySpeech2.quote}"
                      </blockquote>
                      <p className="text-sm text-gray-500 mb-3">{item.keySpeech2.context}</p>
                      <Link
                        to={`/speech/${item.keySpeech2.id}`}
                        className="text-un-blue text-sm font-medium hover:underline inline-flex items-center gap-1"
                      >
                        View Full Speech &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Key Insight */}
      <section className="mb-16">
        <div className="bg-gradient-to-br from-un-blue/5 to-un-blue/10 rounded-2xl p-8 border border-un-blue/20">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">The 54-Year Gap</h2>
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            The concept of two states in Palestine dates to <strong>1947</strong>, but the specific phrase "two-state solution" only entered UN diplomatic vocabulary in <strong>2001</strong> — a 54-year gap between concept and standardized terminology.
          </p>
          <p className="text-gray-600">
            As <strong>Uruguay noted in 2011</strong>: "two-State solution, which Uruguay has supported since 1947" — acknowledging that the framework predates the phrase by more than half a century.
          </p>
        </div>
      </section>

      {/* Methodology */}
      <section className="border-t border-gray-200 pt-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Research Methodology</h2>
        <p className="text-gray-600 mb-6 leading-relaxed">
          This analysis draws from <strong>10,952 UN General Assembly speeches</strong> (1946-2024). We tracked the evolution of key terminology through exact-phrase matching and contextual analysis.
        </p>

        <div className="bg-gray-900 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
            <span className="text-xs font-mono text-gray-400">terminology_tracking.sql</span>
          </div>
          <div className="p-5 overflow-x-auto">
            <pre className="text-sm font-mono leading-relaxed text-gray-300">
              <code>{`-- Track "two-state solution" emergence
SELECT year, COUNT(*) as mentions
FROM speeches
WHERE text LIKE '%two-state solution%'
   OR text LIKE '%two state solution%'
GROUP BY year ORDER BY year;

-- Compare with earlier "Palestinian state" usage
SELECT year, COUNT(*) as mentions
FROM speeches
WHERE text LIKE '%Palestinian state%'
   OR text LIKE '%State of Palestine%'
GROUP BY year ORDER BY year;`}</code>
            </pre>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
