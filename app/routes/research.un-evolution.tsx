import { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router'
import { Badge } from '~/components/ui/badge'
import PageLayout from '~/components/page-layout'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import * as d3 from 'd3-geo'
import * as d3Drag from 'd3-drag'
import * as d3Selection from 'd3-selection'
import * as d3Scale from 'd3-scale'
import { interpolateReds } from 'd3-scale-chromatic'
import * as topojson from 'topojson-client'
import topologyData from '~/lib/topology.json'
import evolutionData from '~/lib/evolution-data.json'
import { MousePointer2, Play, Pause } from 'lucide-react'

export function meta() {
  return [
    { title: 'Research: Evolution of UN Discourse' },
    {
      name: 'description',
      content:
        'How 75 years of speeches reveal the changing priorities of the United Nations.',
    },
  ]
}

// -----------------------------------------------------------------------------
// D3 Globe Component
// -----------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GlobeVisualization({ data, metric }: { data: any[]; metric: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Rotation state: lambda (long), phi (lat), gamma (tilt)
  const [rotation, setRotation] = useState<[number, number, number]>([0, 0, 0])
  const [isDragging, setIsDragging] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Parse topology
  const world = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return topojson.feature(topologyData, topologyData.objects.countries)
  }, [])

  // Basic ISO 3 to 2 mapping for visualization matching
  const getIso2 = (iso3: string) => {
    const map: Record<string, string> = {
      AFG: 'AF',
      AGO: 'AO',
      ALB: 'AL',
      ARE: 'AE',
      ARG: 'AR',
      ARM: 'AM',
      AUS: 'AU',
      AUT: 'AT',
      AZE: 'AZ',
      BDI: 'BI',
      BEL: 'BE',
      BEN: 'BJ',
      BFA: 'BF',
      BGD: 'BD',
      BGR: 'BG',
      BHR: 'BH',
      BHS: 'BS',
      BIH: 'BA',
      BLR: 'BY',
      BLZ: 'BZ',
      BOL: 'BO',
      BRA: 'BR',
      BRB: 'BB',
      BRN: 'BN',
      BTN: 'BT',
      BWA: 'BW',
      CAF: 'CF',
      CAN: 'CA',
      CHE: 'CH',
      CHL: 'CL',
      CHN: 'CN',
      CIV: 'CI',
      CMR: 'CM',
      COD: 'CD',
      COG: 'CG',
      COL: 'CO',
      COM: 'KM',
      CPV: 'CV',
      CRI: 'CR',
      CUB: 'CU',
      CYP: 'CY',
      CZE: 'CZ',
      DEU: 'DE',
      DJI: 'DJ',
      DMA: 'DM',
      DNK: 'DK',
      DOM: 'DO',
      DZA: 'DZ',
      ECU: 'EC',
      EGY: 'EG',
      ERI: 'ER',
      ESP: 'ES',
      EST: 'EE',
      ETH: 'ET',
      FIN: 'FI',
      FJI: 'FJ',
      FRA: 'FR',
      GAB: 'GA',
      GBR: 'GB',
      GEO: 'GE',
      GHA: 'GH',
      GIN: 'GN',
      GMB: 'GM',
      GNB: 'GW',
      GNQ: 'GQ',
      GRC: 'GR',
      GRD: 'GD',
      GTM: 'GT',
      GUY: 'GY',
      HND: 'HN',
      HRV: 'HR',
      HTI: 'HT',
      HUN: 'HU',
      IDN: 'ID',
      IND: 'IN',
      IRL: 'IE',
      IRN: 'IR',
      IRQ: 'IQ',
      ISL: 'IS',
      ISR: 'IL',
      ITA: 'IT',
      JAM: 'JM',
      JOR: 'JO',
      JPN: 'JP',
      KAZ: 'KZ',
      KEN: 'KE',
      KGZ: 'KG',
      KHM: 'KH',
      KOR: 'KR',
      KWT: 'KW',
      LAO: 'LA',
      LBN: 'LB',
      LBR: 'LR',
      LBY: 'LY',
      LCA: 'LC',
      LKA: 'LK',
      LSO: 'LS',
      LTU: 'LT',
      LUX: 'LU',
      LVA: 'LV',
      MAR: 'MA',
      MDA: 'MD',
      MDG: 'MG',
      MDV: 'MV',
      MEX: 'MX',
      MKD: 'MK',
      MLI: 'ML',
      MLT: 'MT',
      MMR: 'MM',
      MNE: 'ME',
      MNG: 'MN',
      MOZ: 'MZ',
      MRT: 'MR',
      MUS: 'MU',
      MWI: 'MW',
      MYS: 'MY',
      NAM: 'NA',
      NER: 'NE',
      NGA: 'NG',
      NIC: 'NI',
      NLD: 'NL',
      NOR: 'NO',
      NPL: 'NP',
      NZL: 'NZ',
      OMN: 'OM',
      PAK: 'PK',
      PAN: 'PA',
      PER: 'PE',
      PHL: 'PH',
      PNG: 'PG',
      POL: 'PL',
      PRK: 'KP',
      PRT: 'PT',
      PRY: 'PY',
      QAT: 'QA',
      ROU: 'RO',
      RUS: 'RU',
      RWA: 'RW',
      SAU: 'SA',
      SDN: 'SD',
      SEN: 'SN',
      SGP: 'SG',
      SLB: 'SB',
      SLE: 'SL',
      SLV: 'SV',
      SOM: 'SO',
      SRB: 'RS',
      SSD: 'SS',
      STP: 'ST',
      SUR: 'SR',
      SVK: 'SK',
      SVN: 'SI',
      SWE: 'SE',
      SWZ: 'SZ',
      SYC: 'SC',
      SYR: 'SY',
      TCD: 'TD',
      TGO: 'TG',
      THA: 'TH',
      TJK: 'TJ',
      TKM: 'TM',
      TLS: 'TL',
      TON: 'TO',
      TTO: 'TT',
      TUN: 'TN',
      TUR: 'TR',
      TUV: 'TV',
      TWN: 'TW',
      TZA: 'TZ',
      UGA: 'UG',
      UKR: 'UA',
      URY: 'UY',
      USA: 'US',
      UZB: 'UZ',
      VCT: 'VC',
      VEN: 'VE',
      VNM: 'VN',
      VUT: 'VU',
      WSM: 'WS',
      YEM: 'YE',
      ZAF: 'ZA',
      ZMB: 'ZM',
      ZWE: 'ZW',
    }
    return map[iso3] || iso3.substring(0, 2)
  }

  // Pre-process data lookup
  const mapValues = useMemo(() => {
    const lookup = new Map()
    let maxVal = 0
    data.forEach((d) => {
      const iso2 = getIso2(d.id)
      const val = d[metric]
      lookup.set(iso2, val)
      if (val > maxVal) maxVal = val
    })
    return { lookup, maxVal }
  }, [data, metric])

  // Dynamic color scale based on max value in dataset
  const colorScale = useMemo(() => {
    // Domain from 1% to Max% (ignoring 0) for better gradient
    return d3Scale
      .scaleSequential(interpolateReds)
      .domain([0, mapValues.maxVal || 20])
  }, [mapValues.maxVal])

  // Drag behavior setup
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const selection = d3Selection.select(canvas)

    // Initial rotation needed for the drag handler to know starting point
    // We use a mutable ref for the drag behavior to access current rotation
    // without re-binding the drag handler on every state change
    let currRotation = rotation

    const drag = d3Drag
      .drag()
      .on('start', () => {
        setIsDragging(true)
        setHasInteracted(true)
      })
      .on('drag', (event) => {
        const k = 0.5 // Sensitivity
        // Update rotation based on drag dx/dy
        // Note: d3-geo rotation is [lambda, phi, gamma]
        // dx affects lambda (longitude), dy affects phi (latitude)
        const newRotation: [number, number, number] = [
          currRotation[0] + event.dx * k,
          currRotation[1] - event.dy * k,
          currRotation[2],
        ]
        currRotation = newRotation
        setRotation(newRotation)
      })
      .on('end', () => {
        setIsDragging(false)
      })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selection.call(drag as any)
  }, []) // Bind once

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // Projection
    const projection = d3
      .geoOrthographic()
      .scale(width / 2.2)
      .translate([width / 2, height / 2])
      .rotate(rotation)

    const path = d3.geoPath(projection, ctx)

    // Clear
    ctx.clearRect(0, 0, width, height)

    // Draw Sphere/Ocean
    ctx.beginPath()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    path({ type: 'Sphere' } as any)
    ctx.fillStyle = '#f8fafc'
    ctx.fill()
    ctx.strokeStyle = '#e2e8f0'
    ctx.stroke()

    // Draw Countries
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    world.features.forEach((feature) => {
      const code = feature.properties?.code
      const value = mapValues.lookup.get(code) || 0

      ctx.beginPath()
      path(feature)

      if (value > 0) {
        ctx.fillStyle = colorScale(value)
      } else {
        ctx.fillStyle = '#e5e7eb'
      }

      ctx.fill()
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 0.5
      ctx.stroke()
    })

    // Auto-rotate slowly if not dragging and hasn't interacted
    let animation: number
    if (!isDragging && !hasInteracted) {
      animation = requestAnimationFrame(() => {
        setRotation((r) => [r[0] + 0.1, r[1], r[2]])
      })
    }

    return () => cancelAnimationFrame(animation)
  }, [rotation, isDragging, hasInteracted, world, mapValues, colorScale])

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-full aspect-square max-w-[500px] mx-auto cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          width={800}
          height={800}
          className="w-full h-full"
        />
        <div className="absolute top-4 left-4 text-xs text-gray-400 flex items-center gap-1 pointer-events-none">
          <MousePointer2 className="w-3 h-3" />
          Drag to rotate
        </div>
      </div>

      {/* Legend moved outside of the globe container */}
      <div className="bg-white/90 p-3 rounded text-xs shadow-sm border border-gray-100 flex items-center gap-4 flex-wrap justify-center">
        <div className="text-gray-500 font-medium whitespace-nowrap">
          Mentions ({metric.replace('_', ' ')})
        </div>
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#67000d] rounded-sm"></span> High
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#ef3b2c] rounded-sm"></span> Medium
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#fcbba1] rounded-sm"></span> Low
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-gray-200 rounded-sm"></span> None
          </div>
        </div>
      </div>
    </div>
  )
}

// -----------------------------------------------------------------------------
// Main Page Component
// -----------------------------------------------------------------------------

export default function ResearchEvolution() {
  const [mapMetric, setMapMetric] = useState('sc_reform')
  const [selectedYear, setSelectedYear] = useState(2024)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hiddenRegions, setHiddenRegions] = useState<Set<string>>(new Set())
  const { timeline, map_data } = evolutionData

  const handleLegendClick = (dataKey: string) => {
    setHiddenRegions((prev) => {
      const next = new Set(prev)
      if (next.has(dataKey)) {
        next.delete(dataKey)
      } else {
        next.add(dataKey)
      }
      return next
    })
  }

  // Animation loop
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isPlaying) {
      interval = setInterval(() => {
        setSelectedYear((prev) => (prev >= 2024 ? 1946 : prev + 1))
      }, 500)
    }
    return () => clearInterval(interval)
  }, [isPlaying])

  // Aggregate timeline data by decade
  const decadeData = useMemo(() => {
    const decades: Record<string, { count: number; sums: Record<string, number> }> = {}

    timeline.forEach((row) => {
      const decade = `${Math.floor(row.year / 10) * 10}s`
      if (!decades[decade]) {
        decades[decade] = { count: 0, sums: {} }
      }
      decades[decade].count++

      // Sum all numeric fields
      Object.entries(row).forEach(([key, value]) => {
        if (key !== 'year' && typeof value === 'number') {
          decades[decade].sums[key] = (decades[decade].sums[key] || 0) + value
        }
      })
    })

    // Convert to array with averages
    return Object.entries(decades)
      .map(([decade, data]) => {
        const avg: Record<string, string | number> = { decade }
        Object.entries(data.sums).forEach(([key, sum]) => {
          avg[key] = Math.round((sum / data.count) * 10) / 10 // 1 decimal place
        })
        return avg
      })
      .sort((a, b) => String(a.decade).localeCompare(String(b.decade)))
  }, [timeline])

  // 1. Create a map of Country ID -> Region
  const countryRegionMap = useMemo(() => {
    const map = new Map<string, string>()
    map_data.forEach((d) => {
      if (d.id && d.region) {
        map.set(d.id, d.region)
      }
    })
    return map
  }, [map_data])

  // 2. Generate map data for the selected year based on Regional averages
  const currentYearMapData = useMemo(() => {
    const yearStats = timeline.find((d) => d.year === selectedYear)
    if (!yearStats) return []

    return map_data.map((country) => {
      const region = countryRegionMap.get(country.id)
      if (!region) return { ...country, [mapMetric]: 0 }

      const key = `${region}_${mapMetric}`
      // Note: 'timeline' has percentages (0-100) for these keys
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const val = (yearStats as any)[key] || 0

      return {
        id: country.id,
        [mapMetric]: val,
      }
    })
  }, [selectedYear, mapMetric, timeline, map_data, countryRegionMap])

  return (
    <PageLayout maxWidth="default">
      <div className="mb-6">
        <Link
          to="/research"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← Back to Research
        </Link>
      </div>

      <header className="mb-12 max-w-4xl">
        <Badge className="mb-4 bg-indigo-100 text-indigo-800 border-indigo-200">
          Deep Dive Analysis
        </Badge>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight text-gray-900 leading-tight">
          The Evolution of UN Discourse
        </h1>
        <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
          How 75 years of speeches reveal the changing soul of the United
          Nations — visualized through region-stacked volume and interactive
          geography.
        </p>
      </header>

      {/* Regional Groups Legend */}
      <div className="mb-12 p-4 bg-gray-50 rounded-lg border border-gray-200 text-sm">
        <p className="font-medium text-gray-700 mb-3">UN Regional Groups:</p>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-gray-600">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#16a34a] shrink-0"></span>
            <span>
              <strong>Africa</strong>
              <span className="hidden sm:inline"> — Nigeria, Egypt, Kenya</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#9333ea] shrink-0"></span>
            <span>
              <strong>Asia</strong>
              <span className="hidden sm:inline"> — China, India, Japan</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#ea580c] shrink-0"></span>
            <span>
              <strong>LatAm</strong>
              <span className="hidden sm:inline"> — Brazil, Mexico, Argentina</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#dc2626] shrink-0"></span>
            <span>
              <strong>E. Europe</strong>
              <span className="hidden sm:inline"> — Russia, Poland, Ukraine</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-[#2563eb] shrink-0"></span>
            <span>
              <strong>West</strong>
              <span className="hidden sm:inline"> — USA, UK, France, Germany</span>
            </span>
          </div>
        </div>
      </div>

      {/* 1. Security Council Reform */}
      <section className="mb-20 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 prose prose-stone">
          <h2 className="text-2xl font-bold text-gray-900 not-prose mb-4">
            1. The Crisis of Structure
          </h2>
          <p>
            For the first 45 years, structural reform was rarely discussed. The
            focus was on <em>using</em> the Security Council, not changing it.
          </p>
          <p>
            Since 2000, mentions have skyrocketed, peaking around the 2005 World
            Summit ("In Larger Freedom").
          </p>
          <p className="font-semibold text-gray-800">
            Note how the "West" (Blue) has recently joined the chorus in the
            2020s, a significant departure from its historical silence on
            reform, likely driven by geopolitical deadlocks.
          </p>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[400px]">
          <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
            % of Speeches Mentioning "Security Council Reform"
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={decadeData}
              margin={{ top: 5, right: 30, left: 0, bottom: 40 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis
                dataKey="decade"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                formatter={(value) => [`${Number(value ?? 0).toFixed(1)}%`, '']}
              />
              <Legend
                onClick={(e) => e.value && handleLegendClick(e.value)}
                wrapperStyle={{ cursor: 'pointer' }}
                formatter={(value) => (
                  <span
                    style={{
                      color: hiddenRegions.has(value) ? '#ccc' : '#333',
                      textDecoration: hiddenRegions.has(value)
                        ? 'line-through'
                        : 'none',
                    }}
                  >
                    {value}
                  </span>
                )}
              />
              <Bar
                dataKey="Africa_sc_reform"
                name="Africa"
                fill="#16a34a"
                hide={hiddenRegions.has('Africa')}
              />
              <Bar
                dataKey="Asia_sc_reform"
                name="Asia"
                fill="#9333ea"
                hide={hiddenRegions.has('Asia')}
              />
              <Bar
                dataKey="LatAm_sc_reform"
                name="LatAm"
                fill="#ea580c"
                hide={hiddenRegions.has('LatAm')}
              />
              <Bar
                dataKey="EasternEu_sc_reform"
                name="E. Europe"
                fill="#dc2626"
                hide={hiddenRegions.has('E. Europe')}
              />
              <Bar
                dataKey="West_sc_reform"
                name="West (WEOG)"
                fill="#2563eb"
                hide={hiddenRegions.has('West (WEOG)')}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 2. The Rise of Human Rights */}
      <section className="mb-20 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 prose prose-stone">
          <h3 className="text-xl font-bold text-gray-900 not-prose mb-2">
            2. The Rise of Human Rights
          </h3>
          <p>
            "Human Rights" was a minor theme until the end of the Cold War. The
            1990s saw an explosion of interest, driven by the belief that rights
            are universal and transcend borders.
          </p>
          <p>
            Western (Blue) and Latin American (Orange) nations have consistently
            championed this discourse.
          </p>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[400px]">
          <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
            % of Speeches Mentioning "Human Rights"
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={decadeData}
              margin={{ top: 5, right: 30, left: 0, bottom: 40 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis
                dataKey="decade"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                formatter={(value) => [`${Number(value ?? 0).toFixed(1)}%`, '']}
              />
              <Legend
                onClick={(e) => e.value && handleLegendClick(e.value)}
                wrapperStyle={{ cursor: 'pointer' }}
                formatter={(value) => (
                  <span
                    style={{
                      color: hiddenRegions.has(value) ? '#ccc' : '#333',
                      textDecoration: hiddenRegions.has(value)
                        ? 'line-through'
                        : 'none',
                    }}
                  >
                    {value}
                  </span>
                )}
              />
              <Bar
                dataKey="Africa_human_rights"
                name="Africa"
                fill="#16a34a"
                hide={hiddenRegions.has('Africa')}
              />
              <Bar
                dataKey="Asia_human_rights"
                name="Asia"
                fill="#9333ea"
                hide={hiddenRegions.has('Asia')}
              />
              <Bar
                dataKey="LatAm_human_rights"
                name="LatAm"
                fill="#ea580c"
                hide={hiddenRegions.has('LatAm')}
              />
              <Bar
                dataKey="EasternEu_human_rights"
                name="E. Europe"
                fill="#dc2626"
                hide={hiddenRegions.has('E. Europe')}
              />
              <Bar
                dataKey="West_human_rights"
                name="West"
                fill="#2563eb"
                hide={hiddenRegions.has('West')}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 3. The Resilience of Sovereignty */}
      <section className="mb-20 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 prose prose-stone">
          <h3 className="text-xl font-bold text-gray-900 not-prose mb-2">
            3. The Resilience of Sovereignty
          </h3>
          <p>
            "Sovereignty" peaked during the decolonization era but dipped during
            the "unipolar" 1990s.
          </p>
          <p>
            It is now making a fierce comeback in the 2020s. Note the rising red
            (Eastern Europe) and green (Africa) bars, signaling a pushback
            against interventionism.
          </p>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[400px]">
          <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">
            % of Speeches Mentioning "Sovereignty"
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={decadeData}
              margin={{ top: 5, right: 30, left: 0, bottom: 40 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f0f0f0"
              />
              <XAxis
                dataKey="decade"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
                formatter={(value) => [`${Number(value ?? 0).toFixed(1)}%`, '']}
              />
              <Legend
                onClick={(e) => e.value && handleLegendClick(e.value)}
                wrapperStyle={{ cursor: 'pointer' }}
                formatter={(value) => (
                  <span
                    style={{
                      color: hiddenRegions.has(value) ? '#ccc' : '#333',
                      textDecoration: hiddenRegions.has(value)
                        ? 'line-through'
                        : 'none',
                    }}
                  >
                    {value}
                  </span>
                )}
              />
              <Bar
                dataKey="Africa_sovereignty"
                name="Africa"
                fill="#16a34a"
                hide={hiddenRegions.has('Africa')}
              />
              <Bar
                dataKey="Asia_sovereignty"
                name="Asia"
                fill="#9333ea"
                hide={hiddenRegions.has('Asia')}
              />
              <Bar
                dataKey="LatAm_sovereignty"
                name="LatAm"
                fill="#ea580c"
                hide={hiddenRegions.has('LatAm')}
              />
              <Bar
                dataKey="EasternEu_sovereignty"
                name="E. Europe"
                fill="#dc2626"
                hide={hiddenRegions.has('E. Europe')}
              />
              <Bar
                dataKey="West_sovereignty"
                name="West"
                fill="#2563eb"
                hide={hiddenRegions.has('West')}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 3. Global Visualization */}
      <section className="mb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Global Perspectives ({selectedYear})
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-6">
            Interactive Globe: Drag to rotate. Color intensity shows frequency
            of mentions (%).
          </p>

          <div className="flex justify-center gap-2 flex-wrap mb-8">
            {[
              { id: 'sc_reform', label: 'Security Council Reform' },
              { id: 'multilateralism', label: 'Multilateralism' },
              { id: 'human_rights', label: 'Human Rights' },
              { id: 'sovereignty', label: 'Sovereignty' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMapMetric(m.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  mapMetric === m.id
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="max-w-xl mx-auto bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex justify-between text-xs text-gray-500 font-medium">
                <span>1946</span>
                <span>{selectedYear}</span>
                <span>2024</span>
              </div>
              <input
                type="range"
                min="1946"
                max="2024"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(parseInt(e.target.value))
                  setIsPlaying(false)
                }}
                className="w-full accent-indigo-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-8 flex flex-col items-center justify-center">
          <GlobeVisualization data={currentYearMapData} metric={mapMetric} />
        </div>
      </section>

    </PageLayout>
  )
}
