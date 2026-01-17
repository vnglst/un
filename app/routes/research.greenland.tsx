import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import PageLayout from '~/components/page-layout'
import { Globe, Shield, Users, Thermometer, Radar, Anchor } from 'lucide-react'

export function meta() {
  return [
    { title: 'Research: Greenland Sovereignty Evolution - UN Speeches' },
    { name: 'description', content: 'A data-driven study of how Greenland\'s role has been discussed in the UN General Assembly from 1948 to the present.' },
  ]
}

const timeline = [
  {
    decade: "1940s",
    title: "The Strategic Triangle",
    icon: Radar,
    narrative: "In the dawn of the Cold War, Greenland was defined as a geographic pillar for trans-polar military operations. It was framing by the East as an 'insolently arrogant' coordinate on a 'Map of the Third World War'.",
    keySpeech: {
      id: 6889,
      year: 1948,
      country: "USSR",
      speaker: "Mr. Vyshinsky",
      quote: "3,400 miles one way from Fairbanks, Alaska, to Vladivostok; 3,500 miles from a Greenland base to Sverdlovsk.",
      context: "The USSR delegation uses specific strike distances to argue that the United States is building a trans-polar aggressive infrastructure, linking Alaska and Greenland as twin threat vectors."
    }
  },
  {
    decade: "1950s",
    title: "The Colony Debate",
    icon: Shield,
    narrative: "While Denmark sought to integrate Greenland, the Global South explicitly categorized it as a colony. This era marked the first time the UN discussed Greenland's 'advance towards independence'.",
    keySpeech: {
      id: 5686,
      year: 1954,
      country: "India",
      speaker: "Mr. Krishna Menon",
      quote: "The Gold Coast, Nigeria... and Greenland, which was a Danish colony, have all shown an advance towards independence.",
      context: "India's celebrated diplomat Krishna Menon groups Greenland with African nations like Nigeria, signaling that Greenland's status was viewed through the lens of worldwide decolonization."
    }
  },
  {
    decade: "1960s",
    title: "Multilateral Sacrifice",
    icon: Globe,
    narrative: "During the height of the nuclear arms race, Greenland was offered as a 'geographic laboratory' for disarmament. Denmark used its sovereignty to propose the island as a neutral ground for global inspection.",
    keySpeech: {
      id: 1226,
      year: 1960,
      country: "Denmark",
      speaker: "H.M. King Frederik IX",
      quote: "My Government would be prepared to consider opening up... the vast territory of Greenland as part of a mutually balanced inspection arrangement.",
      context: "The King of Denmark personally addresses the Assembly, offering his country's largest territory as a sacrificial 'first step' to break the international deadlock on arms control."
    }
  },
  {
    decade: "1980s",
    title: "The ABM Tension",
    icon: Radar,
    narrative: "The 1980s saw a return to strategic anxiety. The focus shifted from conventional bases to high-tech surveillance, with specific 'radar facilities' in Thule becoming a flashpoint for treaty compliance.",
    keySpeech: {
      id: 9594,
      year: 1988,
      country: "USSR",
      speaker: "Mr. Shevardnadze",
      quote: "Allay our concern with respect to United States radar facilities in Greenland... By doing that, we would strengthen the ABM Treaty regime.",
      context: "Foreign Minister Shevardnadze explicitly links northern surveillance facilities to the survival of the global Anti-Ballistic Missile Treaty regime."
    }
  },
  {
    decade: "1990s",
    title: "The Inuit Transition",
    icon: Users,
    narrative: "A fundamental shift in terminology occurred. After decades of military and colonial discourse, the UN speeches began to focus on 'indigenous partnership' and the 'Inuit' identity of the territory.",
    keySpeech: {
      id: 3018,
      year: 1993,
      country: "Denmark",
      speaker: "Mr. Helveg Petersen",
      quote: "In collaboration with the Home Rule Government of Greenland, we support all efforts to increase awareness of the special situation facing indigenous peoples.",
      context: "Denmark repositions its relationship with Greenland as a partnership, bringing the Home Rule Government into the UN's emerging framework for indigenous rights."
    }
  },
  {
    decade: "2010s",
    title: "The Receding Ice",
    icon: Anchor,
    narrative: "Diplomatic protocol finalized Greenland's parity. The Danish Prime Minister began sharing the UN stage with the Greenlandic Premier while warning that Arctic changes were no longer 'regional' but global.",
    keySpeech: {
      id: 10905,
      year: 2014,
      country: "Denmark",
      speaker: "Helle Thorning-Schmidt",
      quote: "I had the privilege, together with the Premier of Greenland, of hosting a visit... We travelled together by dog sleigh on the receding ice.",
      context: "This speech marks the definitive shift where Greenland's physical environment becomes its primary diplomatic currency."
    }
  },
  {
    decade: "2020s",
    title: "Planetary Alarm",
    icon: Thermometer,
    narrative: "In the 2020s, Greenland is no longer an Arctic sideshow but the definitive 'Planetary Thermometer'. Its melting ice sheet represents a version of 'environmental Armageddon' for island nations.",
    keySpeech: {
      id: 3629,
      year: 2020,
      country: "Fiji",
      speaker: "Frank Bainimarama",
      quote: "Greenland lost a piece of its ice shelf that is larger than a number of small island nations.",
      context: "Fiji's Prime Minister creates a direct security link between the melting peak of Greenland and the survival of the Pacific Islands, cementing Greenland's role as a global existential benchmarket."
    }
  }
]

export default function ResearchGreenland() {
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

      <header className="mb-12">
        <Badge variant="blue" className="mb-4">
          Case Study
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900">
          The Greenlandic Pivot
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          How international thinking shifted from 'Polar Strike Zone' to 'Indigenous Sovereignty' to 'Global Existential Crisis' (1948–2021).
        </p>
      </header>

      <div className="space-y-16">
        {timeline.map((item, index) => (
          <section key={item.decade} className="relative pl-8 md:pl-0">
            {/* Timeline Line */}
            {index !== timeline.length - 1 && (
              <div className="absolute left-0 md:left-1/2 top-10 bottom-0 w-px bg-gray-200 -ml-px" />
            )}
            
            <div className={`flex flex-col md:flex-row items-start gap-8 ${index % 2 === 0 ? '' : 'md:flex-row-reverse'}`}>
              {/* Point */}
              <div className="absolute left-[-4px] md:left-1/2 md:-ml-5 top-0 w-10 h-10 rounded-full bg-white border-2 border-un-blue flex items-center justify-center z-10 shadow-sm">
                <item.icon className="h-5 w-5 text-un-blue" />
              </div>

              {/* Content Card */}
              <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl font-bold text-un-blue">{item.decade}</span>
                  <Badge variant="secondary">{item.title}</Badge>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {item.narrative}
                </p>
                
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Primary Source Insight</span>
                    <span className="text-xs text-gray-400">{item.keySpeech.year} · {item.keySpeech.country}</span>
                  </div>
                  <blockquote className="text-lg italic text-gray-800 mb-4 bg-white p-4 rounded-lg border-l-4 border-un-blue/20">
                    "{item.keySpeech.quote}"
                  </blockquote>

                  {item.keySpeech.context && (
                    <p className="text-sm text-gray-500 mb-4 leading-relaxed italic">
                      {item.keySpeech.context}
                    </p>
                  )}

                  <Link 
                    to={`/speech/${item.keySpeech.id}`}
                    className="text-un-blue text-sm font-medium hover:underline inline-flex items-center gap-1"
                  >
                    View Speech Context →
                  </Link>
                </div>
              </div>
              <div className="flex-1 hidden md:block" />
            </div>
          </section>
        ))}
      </div>

      {/* Methodology Section */}
      <div className="border-t border-gray-200 pt-16 mt-24">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
           Research Methodology
        </h2>
        <p className="text-gray-600 mb-8 leading-relaxed">
          This research was compiled using a multi-modal search strategy against the <strong>10,952 speeches</strong> in our database. We utilized a combination of exact-word indexing (FTS5), fuzzy matching, and semantic vector embeddings to ensure a thorough decade-by-decade extraction.
        </p>

        <div className="space-y-8">
          {/* FTS5 Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">1. High-Precision Keyword Analysis (FTS5)</h3>
            <p className="text-sm text-gray-600 mb-4">
              To distinguish Greenland-specific mentions from related concepts (and false positives like "continuity"), we used SQLite's FTS5 virtual tables.
            </p>
            <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                <span className="text-xs font-mono text-gray-400">precision_search.sql</span>
              </div>
              <div className="p-5 overflow-x-auto">
                <pre className="text-sm font-mono leading-relaxed text-gray-300">
                  <code>{`-- Exact match with context snippet
SELECT 
  s.year, 
  s.country_name, 
  snippet(speeches_fts, 0, '<b>', '</b>', '...', 30) 
FROM speeches_fts 
JOIN speeches s ON s.id = rowid 
WHERE speeches_fts MATCH 'Greenland' 
ORDER BY s.year ASC;`}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Strategic Search Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">2. Strategic Cluster Searching</h3>
            <p className="text-sm text-gray-600 mb-4">
              We identified the 'Strategic Triangle' by targeting co-occurrence of geographic and geopolitical terms.
            </p>
            <div className="bg-gray-900 rounded-xl overflow-hidden shadow-lg">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-800 border-b border-gray-700">
                <span className="text-xs font-mono text-gray-400">strategic_triangle.sql</span>
              </div>
              <div className="p-5 overflow-x-auto">
                <pre className="text-sm font-mono leading-relaxed text-gray-300">
                  <code>{`-- Finding the Alaska-Greenland Cold War link
SELECT s.year, s.country_name 
FROM speeches_fts 
JOIN speeches s ON s.id = rowid 
WHERE speeches_fts MATCH 'Greenland AND (Alaska OR Atlantic OR "Cold War")';`}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Vector Search Section */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">3. Semantic Vector Search</h3>
            <p className="text-sm text-gray-600 mb-4">
              CONCEPTUAL searching using <code>Xenova/bge-small-en-v1.5</code> embeddings allowed us to find speeches that discussed "Arctic sovereignty" without necessarily using the word "Greenland".
            </p>
            <div className="p-6 bg-blue-50/50 rounded-xl border border-blue-100 italic text-sm text-blue-800">
              "Searching for: 'Greenland independence and Danish administration' uncovered 1950s speeches discussing the 'advance towards independence' that standard keyword searches often rank lower."
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
