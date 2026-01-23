import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import PageLayout from '~/components/page-layout'
import {
  Shield,
  Swords,
  Scale,
  Snowflake,
  DollarSign,
  Globe2,
} from 'lucide-react'

export function meta() {
  return [
    { title: 'Research: Rearmament Discourse Evolution - UN Speeches' },
    {
      name: 'description',
      content:
        "How has the world's discussion of military buildup and arms races changed from Cold War anxiety to modern moral critique?",
    },
  ]
}

// Year-by-year mention data for chart
const mentionsByYear = [
  { year: 1950, count: 14 },
  { year: 1951, count: 36 },
  { year: 1952, count: 34 },
  { year: 1953, count: 29 },
  { year: 1954, count: 27 },
  { year: 1955, count: 25 },
  { year: 1956, count: 17 },
  { year: 1957, count: 50 },
  { year: 1958, count: 70 },
  { year: 1959, count: 61 },
  { year: 1960, count: 90 },
  { year: 1961, count: 82 },
  { year: 1962, count: 116 },
  { year: 1963, count: 94 },
  { year: 1964, count: 82 },
  { year: 1965, count: 69 },
  { year: 1966, count: 65 },
  { year: 1967, count: 60 },
  { year: 1968, count: 85 },
  { year: 1969, count: 110 },
  { year: 1970, count: 62 },
  { year: 1971, count: 70 },
  { year: 1972, count: 72 },
  { year: 1973, count: 94 },
  { year: 1974, count: 112 },
  { year: 1975, count: 119 },
  { year: 1976, count: 155 },
  { year: 1977, count: 163 },
  { year: 1978, count: 214 },
  { year: 1979, count: 198 },
  { year: 1980, count: 235 },
  { year: 1981, count: 260 },
  { year: 1982, count: 252 },
  { year: 1983, count: 287 },
  { year: 1984, count: 303 },
  { year: 1985, count: 260 },
  { year: 1986, count: 220 },
  { year: 1987, count: 173 },
  { year: 1988, count: 152 },
  { year: 1989, count: 106 },
  { year: 1990, count: 89 },
  { year: 1991, count: 66 },
  { year: 1992, count: 55 },
  { year: 1993, count: 44 },
  { year: 1994, count: 40 },
  { year: 1995, count: 34 },
  { year: 1996, count: 39 },
  { year: 1997, count: 39 },
  { year: 1998, count: 48 },
  { year: 1999, count: 30 },
  { year: 2000, count: 27 },
  { year: 2001, count: 18 },
  { year: 2002, count: 12 },
  { year: 2003, count: 14 },
  { year: 2004, count: 12 },
  { year: 2005, count: 12 },
  { year: 2006, count: 13 },
  { year: 2007, count: 24 },
  { year: 2008, count: 21 },
  { year: 2009, count: 26 },
  { year: 2010, count: 15 },
  { year: 2011, count: 13 },
  { year: 2012, count: 18 },
  { year: 2013, count: 10 },
  { year: 2014, count: 12 },
  { year: 2015, count: 17 },
  { year: 2016, count: 16 },
  { year: 2017, count: 20 },
  { year: 2018, count: 14 },
  { year: 2019, count: 23 },
  { year: 2020, count: 15 },
  { year: 2021, count: 20 },
  { year: 2022, count: 17 },
  { year: 2023, count: 23 },
  { year: 2024, count: 34 },
]

// Decade statistics
const decadeStats = [
  {
    decade: '1950s',
    mentions: 363,
    countries: 66,
    context: 'Early Cold War, Korean War',
  },
  {
    decade: '1960s',
    mentions: 853,
    countries: 116,
    context: 'Cuban Missile Crisis, decolonization',
  },
  {
    decade: '1970s',
    mentions: 1259,
    countries: 145,
    context: 'Détente debates, SALT treaties',
  },
  {
    decade: '1980s',
    mentions: 2248,
    countries: 156,
    context: "Reagan buildup, 'Star Wars'",
  },
  {
    decade: '1990s',
    mentions: 484,
    countries: 146,
    context: 'Peace dividend, Soviet collapse',
  },
  {
    decade: '2000s',
    mentions: 179,
    countries: 86,
    context: 'Terrorism dominates agenda',
  },
  {
    decade: '2010s',
    mentions: 158,
    countries: 75,
    context: 'Climate/refugees overtake',
  },
  {
    decade: '2020s',
    mentions: 109,
    countries: 58,
    context: 'Ukraine, renewed concern',
  },
]

// Top discussants by era
const topDiscussants1980s = [
  { country: 'USSR', mentions: 75 },
  { country: 'Romania', mentions: 69 },
  { country: 'Ukrainian SSR', mentions: 68 },
  { country: 'Byelorussian SSR', mentions: 59 },
  { country: 'West Germany', mentions: 48 },
  { country: 'Bulgaria', mentions: 47 },
]

const topDiscussants2020s = [
  { country: 'Costa Rica', mentions: 8 },
  { country: 'Nepal', mentions: 7 },
  { country: 'Bolivia', mentions: 5 },
  { country: 'Holy See', mentions: 4 },
  { country: 'Cuba', mentions: 4 },
  { country: 'Kyrgyzstan', mentions: 4 },
]

// Timeline with speech references
const timeline = [
  {
    year: '1950s',
    era: 'Early Cold War',
    icon: Swords,
    color: 'red',
    narrative:
      'The arms race begins in earnest. Soviet delegates warn of Western militarism while the Korean War heightens nuclear anxieties.',
    keySpeech: {
      id: 5048,
      country: 'USSR',
      speaker: 'Mr. Gromyko',
      year: 1958,
      quote:
        'Are unaware of the full danger of the continuing arms race which, like a mountain avalanche, is absorbing material and human resources on an ever-increasing scale and diverting them to the production of means of destruction.',
      context:
        "Gromyko frames the arms race as an unstoppable force consuming humanity's resources.",
    },
  },
  {
    year: '1962',
    era: 'Cuban Missile Crisis',
    icon: Shield,
    color: 'orange',
    narrative:
      'The world comes closest to nuclear war. UN speeches reflect existential fear as both superpowers accuse each other of aggressive militarization.',
    stats: { mentions: 116, label: 'mentions in 1962 alone' },
  },
  {
    year: '1984',
    era: 'Cold War Peak',
    icon: Swords,
    color: 'purple',
    narrative:
      "Reagan's military buildup triggers the highest-ever rearmament discourse. Eastern Bloc nations dominate the conversation, warning of 'star wars' in space.",
    keySpeech: {
      id: 6838,
      country: 'East Germany',
      speaker: 'Mr. Fischer',
      year: 1984,
      quote:
        "The arms race is assuming dimensions which exceed all previously known extremes. As recent developments show, the arms build-up is intended to extend even into outer space. Terms like 'star wars' can give us only a vague idea of the threats to which mankind and the planet earth are exposed.",
      context:
        'East Germany articulates the peak Cold War anxiety about weaponizing space.',
    },
    stats: { mentions: 303, label: 'all-time peak mentions' },
  },
  {
    year: '1989-1991',
    era: 'The Great Decline',
    icon: Snowflake,
    color: 'blue',
    narrative:
      "The Berlin Wall falls and the USSR dissolves. Rearmament discourse collapses by 78% as the 'peace dividend' replaces confrontation.",
    keySpeech: {
      id: 9416,
      country: 'Venezuela',
      speaker: 'Carlos Andres Peres',
      year: 1991,
      quote:
        'We warned that the arms race would lead the world into an unprecedented critical situation, and that growing military expenditure would create conflicts for the big Powers themselves. Today, one of the great empires, that of the cold war, no longer exists.',
      context:
        'Venezuela reflects on the end of an era, noting that warnings about the arms race proved prescient.',
    },
    stats: {
      before: 303,
      after: 66,
      metric: 'mentions',
      yearRange: '1984→1991',
    },
  },
  {
    year: '2000s',
    era: 'The Quiet Years',
    icon: Scale,
    color: 'gray',
    narrative:
      'Terrorism dominates post-9/11 discourse. Rearmament fades to minimal levels as nations focus on counter-terrorism and regional conflicts.',
    stats: { mentions: 179, label: 'total for entire decade' },
  },
  {
    year: '2020s',
    era: 'The New Critics',
    icon: DollarSign,
    color: 'green',
    narrative:
      'Small, neutral nations emerge as the primary voices critiquing military spending. The framing shifts from strategic competition to moral failure — money spent on arms instead of climate and development.',
    keySpeech: {
      id: 3267,
      country: 'Costa Rica',
      speaker: 'Arnoldo Andre Tinoco',
      year: 2023,
      quote:
        'Almost 15 years ago military spending was slightly over $1 trillion. Ten years later, global military spending has more than doubled, exceeding $2 trillion, despite the fact that Article 26 of the Charter of the United Nations prescribes the pursuit of international peace and security with minimum spending on arms.',
      context:
        'Costa Rica, which has no military, invokes the UN Charter to critique global militarization.',
    },
    keySpeech2: {
      id: 8759,
      country: 'Kyrgyzstan',
      speaker: 'Sadyr Zhaparov',
      year: 2024,
      quote:
        'We observe a troubling paradox: global military spending is growing, while least developed and vulnerable states continue to suffer from a lack of resources for their development and survival.',
      context:
        "Kyrgyzstan frames military spending as a moral failure that diverts resources from the world's poorest.",
    },
  },
  {
    year: '2024',
    era: 'Post-Ukraine Uptick',
    icon: Globe2,
    color: 'red',
    narrative:
      "Ukraine's invasion triggers modest increase in rearmament discourse, but the conversation remains different from the Cold War — focused on costs and consequences rather than bloc confrontation.",
    keySpeech: {
      id: 3276,
      country: 'Sri Lanka',
      speaker: 'Ranil Wickremesinghe',
      year: 2023,
      quote:
        'Global military expenditures have risen today to record levels reaching $2.24 trillion. That reflects the strategic trust deficit among the powerful. Key arms control frameworks that were instrumental in maintaining system stability in the past have collapsed.',
      context:
        'Sri Lanka connects rising military spending to the breakdown of arms control treaties.',
    },
    stats: { mentions: 34, label: '2024 mentions (highest since 1999)' },
  },
]

function BarChart({
  data,
  maxValue,
}: {
  data: { year: number; count: number }[]
  maxValue: number
}) {
  const chartHeight = 128

  // Find the peak year (1984)
  const peakYear = 1984

  return (
    <div>
      <div className="flex items-end gap-px" style={{ height: chartHeight }}>
        {data.map((d) => {
          const barHeight = Math.max(
            (d.count / maxValue) * chartHeight,
            d.count > 0 ? 2 : 0
          )
          const isPeak = d.year === peakYear
          const isColdWar = d.year >= 1950 && d.year <= 1991
          const isPostColdWar = d.year > 1991

          return (
            <div
              key={d.year}
              className="flex-1 min-w-0 flex flex-col items-center justify-end h-full"
            >
              <div
                className={`w-full rounded-t transition-opacity cursor-pointer ${
                  isPeak
                    ? 'bg-red-500 opacity-100'
                    : isColdWar
                      ? 'bg-red-400 opacity-70 hover:opacity-100'
                      : isPostColdWar
                        ? 'bg-green-500 opacity-60 hover:opacity-100'
                        : 'bg-gray-400 opacity-50'
                }`}
                style={{ height: barHeight }}
                title={`${d.year}: ${d.count} mentions`}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-px mt-2 text-[7px] sm:text-[8px] text-gray-400">
        <div className="flex-1 text-left">1950</div>
        <div className="flex-1 text-center">1984 (peak)</div>
        <div className="flex-1 text-right">2024</div>
      </div>
    </div>
  )
}

export default function ResearchRearmament() {
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
        <Badge className="mb-4 bg-red-100 text-red-800 border-red-200">
          Discourse Analysis
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
          The Rise and Fall of Rearmament Discourse
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          From Cold War confrontation to moral critique — how UN speeches about
          military buildup changed from superpower accusations to small-nation
          advocacy.
        </p>
      </header>

      {/* Key Statistics */}
      <section className="mb-16">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
          Key Statistics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-red-50 rounded-xl p-3 md:p-5 text-center">
            <div className="text-2xl md:text-3xl font-bold text-red-600">
              1984
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              Peak year (303 mentions)
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 md:p-5 text-center">
            <div className="text-2xl md:text-3xl font-bold text-blue-600">
              -78%
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              Decline 1984→1991
            </div>
          </div>
          <div className="bg-green-50 rounded-xl p-3 md:p-5 text-center">
            <div className="text-2xl md:text-3xl font-bold text-green-600">
              Costa Rica
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              Top voice in 2020s
            </div>
          </div>
          <div className="bg-amber-50 rounded-xl p-3 md:p-5 text-center">
            <div className="text-2xl md:text-3xl font-bold text-amber-600">
              $2.4T
            </div>
            <div className="text-xs md:text-sm text-gray-600">
              Global military spend (2023)
            </div>
          </div>
        </div>
      </section>

      {/* Main Chart */}
      <section className="mb-16">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          75 Years of Rearmament Discourse
        </h2>
        <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
          Mentions of rearmament, arms race, military buildup, and related terms
          in UN speeches (1950-2024)
        </p>
        <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
          <BarChart data={mentionsByYear} maxValue={320} />
          <div className="flex flex-wrap justify-between gap-2 text-xs text-gray-500 mt-4 pt-4 border-t">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-400 rounded"></span>
              Cold War era (1950-1991)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded"></span>
              Post-Cold War (1992-2024)
            </span>
          </div>
        </div>
      </section>

      {/* Decade Evolution */}
      <section className="mb-16">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
          Evolution by Decade
        </h2>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200">
              <TableHead className="font-semibold text-gray-900">
                Decade
              </TableHead>
              <TableHead className="text-right font-semibold text-gray-900">
                Mentions
              </TableHead>
              <TableHead className="text-right font-semibold text-gray-900 hidden sm:table-cell">
                Countries
              </TableHead>
              <TableHead className="font-semibold text-gray-900 hidden md:table-cell">
                Context
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {decadeStats.map((row, i) => (
              <TableRow
                key={row.decade}
                className={i % 2 === 0 ? 'bg-gray-50' : ''}
              >
                <TableCell className="font-medium">{row.decade}</TableCell>
                <TableCell className="text-right font-mono">
                  {row.mentions.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono hidden sm:table-cell">
                  {row.countries}
                </TableCell>
                <TableCell className="text-gray-500 text-sm hidden md:table-cell">
                  {row.context}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Who Talks About It */}
      <section className="mb-16">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
          Who Discusses Rearmament?
        </h2>
        <p className="text-gray-600 mb-6">
          The speakers changed dramatically. Cold War discourse was dominated by
          the Eastern Bloc accusing the West. Today, small neutral nations
          critique global military spending.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* 1980s */}
          <div className="bg-red-50 rounded-xl p-4 md:p-6 border border-red-100">
            <h3 className="font-bold text-red-800 mb-3">
              1980s: Eastern Bloc Dominated
            </h3>
            <div className="space-y-2">
              {topDiscussants1980s.map((d, i) => (
                <div key={d.country} className="flex justify-between text-sm">
                  <span className={i < 4 ? 'font-medium' : ''}>
                    {d.country}
                  </span>
                  <span className="text-red-600 font-mono">{d.mentions}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-red-700 mt-4">
              Eastern Bloc (8 countries): 373 mentions
              <br />
              Western Bloc (10 countries): 112 mentions
            </p>
          </div>

          {/* 2020s */}
          <div className="bg-green-50 rounded-xl p-4 md:p-6 border border-green-100">
            <h3 className="font-bold text-green-800 mb-3">
              2020s: Small Nations Lead
            </h3>
            <div className="space-y-2">
              {topDiscussants2020s.map((d) => (
                <div key={d.country} className="flex justify-between text-sm">
                  <span>{d.country}</span>
                  <span className="text-green-600 font-mono">{d.mentions}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-green-700 mt-4">
              Nations without large militaries now drive the discourse, framing
              it as a moral and developmental issue.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mb-16">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 md:mb-8">
          Historical Timeline
        </h2>
        <div className="space-y-8 md:space-y-12">
          {timeline.map((item, index) => {
            const colorMap: Record<
              string,
              { bg: string; border: string; text: string }
            > = {
              red: {
                bg: 'bg-red-50',
                border: 'border-red-200',
                text: 'text-red-700',
              },
              orange: {
                bg: 'bg-orange-50',
                border: 'border-orange-200',
                text: 'text-orange-700',
              },
              purple: {
                bg: 'bg-purple-50',
                border: 'border-purple-200',
                text: 'text-purple-700',
              },
              blue: {
                bg: 'bg-blue-50',
                border: 'border-blue-200',
                text: 'text-blue-700',
              },
              green: {
                bg: 'bg-green-50',
                border: 'border-green-200',
                text: 'text-green-700',
              },
              gray: {
                bg: 'bg-gray-50',
                border: 'border-gray-200',
                text: 'text-gray-700',
              },
            }
            const colors = colorMap[item.color] || colorMap.gray

            return (
              <div key={item.year} className="relative pl-10 md:pl-12">
                {/* Timeline line */}
                {index !== timeline.length - 1 && (
                  <div className="absolute left-3 md:left-5 top-8 md:top-10 bottom-0 w-px bg-gray-200" />
                )}

                {/* Timeline dot */}
                <div
                  className={`absolute left-0 md:left-2 top-0 w-6 h-6 md:w-7 md:h-7 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center z-10`}
                >
                  <item.icon
                    className={`h-3 w-3 md:h-4 md:w-4 ${colors.text}`}
                  />
                </div>

                {/* Content */}
                <div
                  className={`${colors.bg} rounded-xl p-4 md:p-6 border ${colors.border}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-xl font-bold ${colors.text}`}>
                      {item.year}
                    </span>
                    <Badge variant="secondary">{item.era}</Badge>
                  </div>

                  <p className="text-gray-700 mb-4 leading-relaxed">
                    {item.narrative}
                  </p>

                  {item.stats && 'before' in item.stats && (
                    <div className="bg-white/60 rounded-lg p-3 mb-4 flex flex-wrap items-center gap-2 md:gap-4">
                      <div className="text-center">
                        <div className="text-lg md:text-2xl font-bold text-gray-400">
                          {item.stats.before}
                        </div>
                        <div className="text-[10px] md:text-xs text-gray-500">
                          before
                        </div>
                      </div>
                      <div className="text-lg md:text-2xl text-gray-300">
                        &rarr;
                      </div>
                      <div className="text-center">
                        <div
                          className={`text-lg md:text-2xl font-bold ${colors.text}`}
                        >
                          {item.stats.after}
                        </div>
                        <div className="text-[10px] md:text-xs text-gray-500">
                          after
                        </div>
                      </div>
                      <div className="flex-1 basis-full sm:basis-auto text-xs md:text-sm text-gray-600 mt-2 sm:mt-0">
                        {item.stats.metric}
                        <br />
                        <span className="text-[10px] md:text-xs text-gray-400">
                          {item.stats.yearRange}
                        </span>
                      </div>
                    </div>
                  )}

                  {item.stats &&
                    'label' in item.stats &&
                    !('before' in item.stats) && (
                      <div className="bg-white/60 rounded-lg p-3 mb-4">
                        <span className={`text-2xl font-bold ${colors.text}`}>
                          {item.stats.mentions}
                        </span>
                        <span className="text-sm text-gray-600 ml-2">
                          {item.stats.label}
                        </span>
                      </div>
                    )}

                  {/* Primary Quote */}
                  {item.keySpeech && (
                    <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Primary Source
                        </span>
                        <span className="text-xs text-gray-400">
                          {item.keySpeech.country}, {item.keySpeech.year}
                        </span>
                      </div>
                      <blockquote className="text-sm md:text-base text-gray-800 italic mb-3 border-l-4 border-gray-200 pl-3 md:pl-4">
                        "{item.keySpeech.quote}"
                      </blockquote>
                      <p className="text-xs md:text-sm text-gray-500 mb-3">
                        {item.keySpeech.context}
                      </p>
                      <Link
                        to={`/speech/${item.keySpeech.id}`}
                        className="text-un-blue text-sm font-medium hover:underline inline-flex items-center gap-1"
                      >
                        View Full Speech &rarr;
                      </Link>
                    </div>
                  )}

                  {/* Secondary Quote */}
                  {item.keySpeech2 && (
                    <div className="bg-white rounded-lg p-3 md:p-4 border border-gray-100 mt-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          Additional Source
                        </span>
                        <span className="text-xs text-gray-400">
                          {item.keySpeech2.country}, {item.keySpeech2.year}
                        </span>
                      </div>
                      <blockquote className="text-sm md:text-base text-gray-800 italic mb-3 border-l-4 border-gray-200 pl-3 md:pl-4">
                        "{item.keySpeech2.quote}"
                      </blockquote>
                      <p className="text-xs md:text-sm text-gray-500 mb-3">
                        {item.keySpeech2.context}
                      </p>
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
        <div className="bg-gradient-to-br from-red-50/50 to-green-50/50 rounded-2xl p-5 md:p-8 border border-gray-200">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
            The Great Transformation
          </h2>
          <p className="text-base md:text-lg text-gray-700 leading-relaxed mb-4">
            Rearmament discourse didn't just decline — it{' '}
            <strong>migrated</strong>. In the Cold War, major powers accused
            each other of dangerous militarization. Today, small neutral nations
            critique <em>all</em> major powers for prioritizing weapons over
            human needs.
          </p>
          <p className="text-sm md:text-base text-gray-600">
            The framing shifted from{' '}
            <strong>"your country is arming dangerously"</strong> to{' '}
            <strong>
              "humanity spends too much on weapons instead of addressing climate
              change and poverty."
            </strong>
          </p>
        </div>
      </section>

      {/* Methodology */}
      <section className="border-t border-gray-200 pt-8 md:pt-12">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">
          Research Methodology
        </h2>
        <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6 leading-relaxed">
          This analysis uses pattern-matching across{' '}
          <strong>200,000+ speech chunks</strong> to identify mentions of
          rearmament-related terms. Terms tracked include: rearmament, arms
          race, military buildup, defense spending, military expenditure,
          militarization, and weapons acquisition.
        </p>

        <div className="bg-gray-900 rounded-xl overflow-hidden max-w-full">
          <div className="flex items-center gap-2 px-3 md:px-4 py-2 md:py-3 bg-gray-800 border-b border-gray-700">
            <span className="text-[10px] md:text-xs font-mono text-gray-400">
              discourse_tracking.sql
            </span>
          </div>
          <div className="p-3 md:p-5 overflow-x-auto max-w-full">
            <pre className="text-xs md:text-sm font-mono leading-relaxed text-gray-300 whitespace-pre-wrap break-words">
              <code>{`-- Track rearmament discourse over time
SELECT s.year, COUNT(*) as mentions
FROM chunk_topics ct
JOIN chunks c ON ct.chunk_id = c.id
JOIN speeches s ON c.speech_id = s.id
WHERE ct.concept_id = (
  SELECT id FROM concepts
  WHERE name = 'rearmament'
)
GROUP BY s.year ORDER BY s.year;

-- Compare by country bloc
SELECT country_code, SUM(mention_count)
FROM country_decade_positions
WHERE concept_id = 1 AND decade = 1980
GROUP BY country_code
ORDER BY 2 DESC;`}</code>
            </pre>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}
