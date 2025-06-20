import { useLoaderData, Link } from 'react-router'
import { getCountrySpeechCounts, type CountrySpeechCount } from '~/lib/database'
import { logger, timeAsyncOperation } from '~/lib/logger'
import PageLayout from '~/components/page-layout'
import { InfoBlock } from '~/components/ui/cards'
import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import * as topojson from 'topojson-client'
import topologyData from '~/lib/topology.json'
import { iso2ToIso3 } from '~/lib/country-codes'

type LoaderData = {
  countryCounts: CountrySpeechCount[]
}

export function meta() {
  return [
    { title: 'Globe - UN Speeches' },
    {
      name: 'description',
      content: 'Interactive globe showing UN speech data by country.',
    },
  ]
}

export async function loader(): Promise<LoaderData> {
  logger.requestStart('GET', '/globe')

  return timeAsyncOperation('globe-loader', async () => {
    const countryCounts = getCountrySpeechCounts()

    logger.info('Globe data loaded', {
      countryCount: countryCounts.length,
      totalSpeeches: countryCounts.reduce((sum, c) => sum + c.speech_count, 0),
      topCountries: countryCounts.slice(0, 5).map((c) => ({
        country: c.country_name,
        speeches: c.speech_count,
      })),
    })

    return { countryCounts }
  })
}

export default function Globe() {
  const { countryCounts } = useLoaderData<LoaderData>()
  const globeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initializeGlobe = () => {
      if (!globeRef.current) return

      const container = globeRef.current
      const { width, height } = container.getBoundingClientRect()

      // Clear any existing content
      container.innerHTML = ''

      const svg = d3
        .select(container)
        .append('svg')
        .attr('width', width)
        .attr('height', height)

      const globe = svg.append('g')

      // Create projection
      const projection = d3
        .geoOrthographic()
        .scale(Math.min(width, height) / 2.5)
        .translate([width / 2, height / 2])
        .rotate([-10, -20, 0])

      const path = d3.geoPath().projection(projection)

      // Constants for interaction
      const SENSITIVITY = 75
      const ROTATION_SPEED = 0.2
      const ZOOM_EXTENT: [number, number] = [0.5, 4]
      const INITIAL_SCALE = window.innerWidth > 768 ? 1.1 : 1.0 // Adjust initial scale based on screen size
      // State variables
      let rotationStopped = false
      let isDragging = false
      let rotationInterval: NodeJS.Timeout | null = null

      // Setup zoom behavior
      const zoom = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent(ZOOM_EXTENT)
        .filter(
          (event: unknown) =>
            (!(event as Event as MouseEvent).button &&
              (event as Event).type === 'wheel') ||
            ((event as Event).type === 'touchstart' &&
              (event as Event as TouchEvent).touches?.length > 1)
        )
        .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
          projection.scale((event.transform.k * Math.min(width, height)) / 2.5)
          globe
            .selectAll('path')
            .attr('d', (d: unknown) => path(d as d3.ExtendedFeature) || '')
          globe.selectAll('circle').attr('r', projection.scale())

          if (event.transform.k === ZOOM_EXTENT[0]) {
            rotationStopped = false
            startRotation()
          }
        })

      // Setup drag behavior
      const drag = d3
        .drag<SVGSVGElement, unknown>()
        .filter(
          (event: unknown) =>
            ((event as MouseEvent).type === 'mousedown' &&
              (event as MouseEvent).button === 0) ||
            ((event as TouchEvent).type === 'touchstart' &&
              (event as TouchEvent).touches.length === 1)
        )
        .on('start', () => {
          isDragging = true
          rotationStopped = true
          if (rotationInterval) {
            clearInterval(rotationInterval)
            rotationInterval = null
          }
        })
        .on(
          'drag',
          (event: d3.D3DragEvent<SVGSVGElement, unknown, unknown>) => {
            const rotate = projection.rotate()
            const k = SENSITIVITY / projection.scale()
            projection.rotate([
              rotate[0] + event.dx * k,
              rotate[1] - event.dy * k,
            ])
            path.projection(projection)
            requestAnimationFrame(() => {
              globe
                .selectAll('path')
                .attr('d', (d: unknown) => path(d as d3.ExtendedFeature) || '')
            })
          }
        )
        .on('end', () => {
          isDragging = false
          startRotation()
        })

      // Add water background
      globe
        .append('circle')
        .attr('fill', '#ffffff')
        .attr('stroke', '#6b7280')
        .attr('stroke-width', 2)
        .attr('cx', width / 2)
        .attr('cy', height / 2)
        .attr('r', projection.scale())

      // Apply zoom and drag behaviors to SVG
      const initialTransform = d3.zoomIdentity.scale(INITIAL_SCALE)
      svg.call(zoom.transform, initialTransform)
      svg.call(zoom)
      svg.call(drag)

      // Create country lookup map
      const countryLookup = new Map()
      countryCounts.forEach((country) => {
        countryLookup.set(country.country_code, country.speech_count)
      }) // Find max count for color scaling
      const maxCount = Math.max(...countryCounts.map((c) => c.speech_count))
      const colorScale = d3
        .scaleSequential(d3.interpolateBlues)
        .domain([0, maxCount])

      // Auto-rotation function
      const startRotation = () => {
        if (!rotationInterval && !rotationStopped) {
          rotationInterval = setInterval(() => {
            if (!isDragging) {
              const rotate = projection.rotate()
              projection.rotate([
                rotate[0] + ROTATION_SPEED,
                rotate[1],
                rotate[2],
              ])
              globe
                .selectAll('path')
                .attr('d', (d: unknown) => path(d as d3.ExtendedFeature) || '')
            }
          }, 50)
        }
      }

      // Load and render world data
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const worldData = topologyData as any
        const countriesFeature = topojson.feature(
          worldData,
          worldData.objects.countries
        )
        const countries = countriesFeature as unknown as {
          features: Array<{ properties: { code: string; name: string } }>
        }

        // Render countries
        const countryPaths = globe
          .selectAll('path')
          .data(countries.features)
          .enter()
          .append('path')
          .attr('d', (d: unknown) => path(d as d3.ExtendedFeature) || '')
          .attr('fill', (d: unknown) => {
            // Convert 2-letter code to 3-letter code for lookup
            const iso3Code =
              iso2ToIso3[
                (d as { properties: { code: string } }).properties
                  .code as keyof typeof iso2ToIso3
              ]
            const count = countryLookup.get(iso3Code) || 0

            return count > 0 ? colorScale(count) : '#4a5568'
          })
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 0.5)
          .style('cursor', 'pointer')

        // Add interactivity
        countryPaths
          .on(
            'mouseover',
            function (this: SVGPathElement, event: unknown, d: unknown) {
              // Convert 2-letter code to 3-letter code for lookup
              const iso3Code =
                iso2ToIso3[
                  (d as { properties: { code: string } }).properties
                    .code as keyof typeof iso2ToIso3
                ]
              const count = countryLookup.get(iso3Code) || 0
              d3.select(this).attr('stroke-width', 2).attr('stroke', '#009edb')

              const mouseEvent = event as MouseEvent
              // Tooltip
              d3.select('body')
                .append('div')
                .attr('class', 'tooltip')
                .style('position', 'absolute')
                .style('background', 'rgba(0, 0, 0, 0.8)')
                .style('color', 'white')
                .style('padding', '8px')
                .style('border-radius', '4px')
                .style('font-size', '12px')
                .style('pointer-events', 'none')
                .style('z-index', '1000')
                .html(
                  `<strong>${
                    (d as { properties: { name: string } }).properties.name
                  }</strong><br/>${count} speeches`
                )
                .style('left', mouseEvent.pageX + 10 + 'px')
                .style('top', mouseEvent.pageY - 10 + 'px')
            }
          )
          .on('mouseout', function (this: SVGPathElement) {
            d3.select(this).attr('stroke-width', 0.5).attr('stroke', '#ffffff')

            d3.selectAll('.tooltip').remove()
          })
          .on('click', function (_event: unknown, d: unknown) {
            if (!isDragging) {
              // Convert 2-letter code to 3-letter code for lookup
              const iso3Code =
                iso2ToIso3[
                  (d as { properties: { code: string } }).properties
                    .code as keyof typeof iso2ToIso3
                ]
              const count = countryLookup.get(iso3Code) || 0
              if (count > 0) {
                // Stop rotation when navigating
                rotationStopped = true
                if (rotationInterval) {
                  clearInterval(rotationInterval)
                  rotationInterval = null
                }
                // Navigate to country speeches page using the 3-letter code
                window.location.href = `/country/${iso3Code}`
              }
            }
          })

        // Start auto-rotation
        startRotation()

        // Cleanup function
        return () => {
          if (rotationInterval) {
            clearInterval(rotationInterval)
          }
        }
      } catch (error) {
        console.error('Error loading world data:', error)
      }
    }

    initializeGlobe()
  }, [countryCounts])

  return (
    <PageLayout maxWidth="default" className="w-full">
      {/* Breadcrumb Navigation */}
      <div className="py-4">
        <div className="flex items-center text-sm text-gray-600">
          <Link to="/" className="hover:text-[#009edb] transition-colors">
            HOME
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="text-gray-900 font-medium">GLOBE</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="py-8 mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Interactive Globe
        </h1>
        <p className="text-lg text-gray-700 max-w-4xl">
          Explore UN speeches by country through our interactive globe
          visualization. Countries are colored by the number of speeches, with
          darker shades representing more diplomatic activity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {/* Globe */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="relative w-full h-[600px] bg-gray-50 rounded-lg overflow-hidden">
              <div ref={globeRef} className="w-full h-full relative z-10" />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>
                Drag to rotate • Scroll to zoom • Click countries to explore
              </span>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded"></div>
                  <span>No speeches</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-800 rounded"></div>
                  <span>Most speeches</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Speaking Countries */}
        <div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Most Active Countries
            </h3>
            <div className="space-y-3">
              {countryCounts.slice(0, 10).map((country, index) => (
                <Link
                  key={country.country_code}
                  to={`/country/${country.country_code}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-[#009edb] hover:shadow-sm transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-[#009edb] w-6">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900 group-hover:text-[#009edb] transition-colors">
                      {country.country_name || country.country_code}
                    </span>
                  </div>
                  <span className="text-sm text-gray-600 font-medium">
                    {country.speech_count.toLocaleString()}
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link
                to="/"
                className="text-sm text-[#009edb] hover:text-[#009edb]/80 transition-colors font-medium"
              >
                View all countries →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Information Section */}
      <div className="bg-gradient-to-r from-[#009edb] to-[#009edb]/90 rounded-lg p-12 text-white">
        <div className="max-w-4xl">
          <h2 className="text-3xl font-bold mb-6">About This Visualization</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Data Representation</h3>
              <p className="text-white/90 mb-4">
                The interactive globe visualizes the distribution of UN General
                Assembly speeches across member states. Color intensity reflects
                diplomatic activity, helping identify the most engaged nations
                in international discourse.
              </p>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>• Real-time country data from our database</li>
                <li>• Color-coded by speech frequency</li>
                <li>• Interactive navigation and exploration</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Usage Instructions</h3>
              <p className="text-white/90 mb-4">
                Navigate the globe using intuitive controls to explore different
                regions and discover patterns in international diplomatic
                engagement.
              </p>
              <ul className="space-y-2 text-white/80 text-sm">
                <li>• Drag to rotate the globe freely</li>
                <li>• Scroll to zoom in and out</li>
                <li>• Click countries to view their speeches</li>
                <li>• Hover for detailed information</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
