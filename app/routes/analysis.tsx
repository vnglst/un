import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as d3 from 'd3'
import {
  Link,
  useSearchParams,
  useLoaderData,
  useNavigation,
  type LoaderFunctionArgs,
} from 'react-router'
import PageLayout from '../components/page-layout'
import { Button } from '../components/ui/button'
import { Select } from '../components/ui/select'
import { InfoBlock } from '../components/ui/cards'
import {
  getSimilarityAnalysis,
  getSimilarityCountries,
  type SimilarityData,
  type SpeechMetadata,
} from '~/lib/database'
import { logger, timeAsyncOperation } from '~/lib/logger'

export function meta() {
  return [
    { title: 'Analysis - UN Speeches Browser' },
    {
      name: 'description',
      content:
        'Interactive analysis and visualizations of UN General Assembly speeches.',
    },
  ]
}

type LoaderData = {
  data: SimilarityData
  availableCountries: string[]
  selectedCountries: string[]
  selectedYear: number | null
  threshold: number
}

// Default countries list - defined outside component to avoid re-renders
const DEFAULT_COUNTRIES = [
  'United States of America',
  'China',
  'Russian Federation',
  'United Kingdom',
  'France',
  'Germany',
  'Japan',
  'India',
  'Pakistan',
  'Ukraine',
  'Iran',
  'Brazil',
  'Canada',
  'Australia',
  'South Africa',
  'Nigeria',
  'Egypt',
  'Saudi Arabia',
  'Turkey',
  'Israel',
  'Mexico',
  'Argentina',
  'South Korea',
  'Indonesia',
  'Thailand',
  'Singapore',
  'Sweden',
  'Norway',
  'Netherlands',
  'Spain',
  'Italy',
  'Poland',
]

export async function loader({
  request,
}: LoaderFunctionArgs): Promise<LoaderData> {
  const url = new URL(request.url)

  logger.requestStart('GET', url.pathname, {
    searchParams: Object.fromEntries(url.searchParams),
  })

  return timeAsyncOperation('analysis-loader', async () => {
    const threshold = 0.3
    const selectedYear = url.searchParams.get('year') || '2024'
    const yearNum =
      selectedYear && selectedYear !== 'all' ? parseInt(selectedYear, 10) : null

    const selectedCountriesParam = url.searchParams.get('countries')
    const selectedCountries = selectedCountriesParam
      ? selectedCountriesParam.split(',').filter(Boolean)
      : DEFAULT_COUNTRIES

    logger.info('Analysis loader params', {
      selectedYear,
      yearNum,
      selectedCountries: selectedCountries.length,
      threshold,
    })

    // Get similarity data with matrix
    const data = getSimilarityAnalysis(
      selectedCountries,
      yearNum || undefined,
      threshold,
      true
    )

    // Get available countries (exclude already selected ones)
    const allAvailableCountries = getSimilarityCountries(
      yearNum || undefined,
      threshold
    )
    const availableCountries = allAvailableCountries.filter(
      (country) => !selectedCountries.includes(country)
    )

    logger.info('Analysis loader completed', {
      speechCount: data.speeches.length,
      similarityCount: data.similarities.length,
      availableCountriesCount: availableCountries.length,
    })

    return {
      data,
      availableCountries,
      selectedCountries,
      selectedYear: yearNum,
      threshold,
    }
  })
}

export default function Analysis() {
  const {
    data,
    availableCountries: initialAvailableCountries,
    selectedCountries: initialSelectedCountries,
    selectedYear: initialSelectedYear,
  } = useLoaderData<LoaderData>()

  const navigation = useNavigation()
  const isLoading = navigation.state === 'loading'

  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // URL-based state management
  const [searchParams, setSearchParams] = useSearchParams()

  // Get state from URL or use loader defaults
  const selectedYear =
    searchParams.get('year') ||
    (initialSelectedYear ? initialSelectedYear.toString() : '2024')
  const selectedCountriesParam = searchParams.get('countries')

  // Use useMemo to prevent selectedCountries from changing on every render
  const selectedCountries = useMemo(() => {
    return selectedCountriesParam
      ? selectedCountriesParam.split(',').filter(Boolean)
      : initialSelectedCountries
  }, [selectedCountriesParam, initialSelectedCountries])

  const [availableCountries, setAvailableCountries] = useState<string[]>(
    initialAvailableCountries
  )
  const [countryToAdd, setCountryToAdd] = useState<string>('')

  const cellSize = 28

  // Update available countries when loader data changes
  useEffect(() => {
    setAvailableCountries(initialAvailableCountries)
  }, [initialAvailableCountries])

  // Helper function to update URL params
  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams)

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          newParams.delete(key)
        } else {
          newParams.set(key, value)
        }
      })

      setSearchParams(newParams, { replace: true })
    },
    [searchParams, setSearchParams]
  )

  // Update selected year
  const setSelectedYear = useCallback(
    (year: string) => {
      updateSearchParams({ year })
    },
    [updateSearchParams]
  )

  // Update selected countries
  const setSelectedCountries = useCallback(
    (countries: string[]) => {
      updateSearchParams({
        countries: countries.length > 0 ? countries.join(',') : null,
      })
    },
    [updateSearchParams]
  )

  const addCountry = (country: string) => {
    if (country && !selectedCountries.includes(country)) {
      setSelectedCountries([...selectedCountries, country])
      setAvailableCountries(availableCountries.filter((c) => c !== country))
      setCountryToAdd('')
    }
  }

  const removeCountry = (country: string) => {
    setSelectedCountries(selectedCountries.filter((c) => c !== country))
    if (!availableCountries.includes(country)) {
      setAvailableCountries([...availableCountries, country].sort())
    }
  }

  const initializeVisualization = useCallback(
    (speeches: SpeechMetadata[], matrix: number[][]) => {
      if (!svgRef.current || !tooltipRef.current) return

      // Calculate statistics for reference (though not displayed in this version)
      const allSimilarities = matrix
        .flat()
        .filter((sim) => sim > 0 && sim < 1.0)

      const maxSim = Math.max(...allSimilarities)
      const minSim = Math.min(...allSimilarities)

      // Set up the visualization
      const svg = d3.select(svgRef.current)
      const tooltip = d3.select(tooltipRef.current)

      // Clear previous content
      svg.selectAll('*').remove()

      // Get theme colors from CSS custom properties
      const primaryColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-un-blue')
        .trim()

      // Color scale - use theme colors for brand consistency
      const colorScale = d3
        .scaleSequential()
        .domain([minSim, maxSim])
        .interpolator(d3.interpolateRgb('#f0f9ff', primaryColor))

      // Calculate responsive dimensions
      const containerWidth = svgRef.current.parentElement?.clientWidth || 800
      const maxCellSize = Math.max(
        4,
        Math.min(cellSize, Math.floor((containerWidth - 200) / speeches.length))
      )
      const actualCellSize = Math.max(4, maxCellSize)

      const responsiveMargin = {
        top: Math.max(50, Math.min(100, containerWidth * 0.1)),
        right: Math.max(20, Math.min(100, containerWidth * 0.05)),
        bottom: Math.max(20, Math.min(100, containerWidth * 0.05)),
        left: Math.max(50, Math.min(100, containerWidth * 0.1)),
      }

      const width =
        speeches.length * actualCellSize +
        responsiveMargin.left +
        responsiveMargin.right

      const height =
        speeches.length * actualCellSize +
        responsiveMargin.top +
        responsiveMargin.bottom

      svg
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)

      const g = svg
        .append('g')
        .attr(
          'transform',
          `translate(${responsiveMargin.left},${responsiveMargin.top})`
        )

      // Create cells
      g.selectAll('.matrix-cell')
        .data(
          speeches.flatMap((speech1, i) =>
            speeches.map((speech2, j) => ({
              i,
              j,
              speech1: speech1,
              speech2: speech2,
              similarity: matrix[i][j],
            }))
          )
        )
        .enter()
        .append('rect')
        .attr('class', 'matrix-cell')
        .attr('x', (d) => d.j * actualCellSize)
        .attr('y', (d) => d.i * actualCellSize)
        .attr('width', actualCellSize)
        .attr('height', actualCellSize)
        .attr('fill', (d) =>
          d.similarity === 1 ? '#007bb5' : colorScale(d.similarity)
        )
        .style('cursor', 'pointer')
        .style('stroke', 'white')
        .style('stroke-width', '0.5')
        .on('mouseover', function (event, d) {
          d3.select(this).style('stroke', '#333').style('stroke-width', '2')

          const tooltipHtml = `
    <div class="tooltip-content">
      <strong>Similarity: ${d.similarity.toFixed(3)}</strong><br/>
      <br/>
      <strong>${d.speech1.country}</strong> - ${d.speech1.speaker}<br/>
      <em>${d.speech1.post}</em><br/>
      <br/>
      <strong>${d.speech2.country}</strong> - ${d.speech2.speaker}<br/>
      <em>${d.speech2.post}</em><br/>
      <br/>
      <span style="color: var(--color-un-blue); font-weight: 500; font-size: 11px;">
        Click to view detailed comparison
      </span>
    </div>
    `

          tooltip
            .html(tooltipHtml)
            .style('display', 'block')
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 10 + 'px')
        })
        .on('mouseout', function () {
          d3.select(this).style('stroke', 'white').style('stroke-width', '0.5')
          tooltip.style('display', 'none')
        })
        .on('click', function (_, d) {
          // Navigate to the similarity comparison page
          window.location.href = `/similarity/${d.speech1.id}/${d.speech2.id}`
        })

      // Add country labels on axes
      const countries = [...new Set(speeches.map((s) => s.country))].sort()
      const countryPositions = new Map<string, number[]>()

      // Calculate country positions
      speeches.forEach((speech, i) => {
        if (!countryPositions.has(speech.country)) {
          countryPositions.set(speech.country, [])
        }
        countryPositions.get(speech.country)!.push(i)
      })

      // Add country labels
      const labelFontSize = Math.max(8, Math.min(12, actualCellSize * 0.8))

      countries.forEach((country) => {
        const positions = countryPositions.get(country) || []
        const avgPos = positions.reduce((a, b) => a + b, 0) / positions.length

        // X-axis label (top)
        g.append('text')
          .attr('class', 'axis-label')
          .attr('x', avgPos * actualCellSize + actualCellSize / 2)
          .attr('y', -10)
          .attr('text-anchor', 'start')
          .attr(
            'transform',
            `rotate(-90, ${avgPos * actualCellSize + actualCellSize / 2}, -10)`
          )
          .style('font-size', `${labelFontSize}px`)
          .style('fill', '#666')
          .text(country)

        // Y-axis label (left)
        g.append('text')
          .attr('class', 'axis-label')
          .attr('x', -10)
          .attr('y', avgPos * actualCellSize + actualCellSize / 2)
          .attr('text-anchor', 'end')
          .attr('alignment-baseline', 'middle')
          .style('font-size', `${labelFontSize}px`)
          .style('fill', '#666')
          .text(country)
      })
    },
    []
  ) // No dependencies since thresholds are now constants

  useEffect(() => {
    if (data?.matrix && data.speeches.length > 0) {
      initializeVisualization(data.speeches, data.matrix)
    }
  }, [data, initializeVisualization]) // Re-render when data changes

  return (
    <PageLayout maxWidth="wide">
      {/* Breadcrumb Navigation */}
      <div className="py-4">
        <div className="flex items-center text-sm text-gray-600">
          <Link to="/" className="hover:text-un-blue transition-colors">
            HOME
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="text-gray-900 font-medium">ANALYSIS</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Speech Similarity Analysis
        </h1>
        <p className="text-lg text-gray-700 mb-6 max-w-4xl">
          Interactive semantic similarity matrix showing relationships between
          UN General Assembly speeches. Explore how different countries'
          diplomatic positions align on global issues.
        </p>
      </div>

      {/* Controls Section */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Analysis Controls
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full"
            >
              {Array.from({ length: 2024 - 1946 + 1 }, (_, i) => {
                const year = 2024 - i
                return (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                )
              })}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Country
            </label>
            <div className="flex gap-2">
              <Select
                value={countryToAdd}
                onChange={(e) => setCountryToAdd(e.target.value)}
                className="flex-1"
              >
                <option value="">Select a country...</option>
                {availableCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </Select>
              <Button
                onClick={() => addCountry(countryToAdd)}
                disabled={!countryToAdd}
                className="px-3 py-1 text-sm"
              >
                Add
              </Button>
            </div>
          </div>
        </div>

        {/* Selected Countries */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Selected Countries ({selectedCountries.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {selectedCountries.map((country) => (
              <div
                key={country}
                className="flex items-center gap-2 px-3 py-1 bg-un-blue/10 text-un-blue rounded-full text-sm border border-un-blue/20"
              >
                <span>{country}</span>
                <button
                  onClick={() => removeCountry(country)}
                  className="hover:text-un-blue/80 font-bold transition-colors"
                  title={`Remove ${country}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {isLoading && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">Loading similarity data...</p>
        </div>
      )}

      {/* Visualization Section */}
      {data && (
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Similarity Matrix
            </h2>
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600">
              <span className="whitespace-nowrap">Low Similarity</span>
              <div className="w-20 sm:w-32 h-3 sm:h-4 bg-gradient-to-r from-blue-50 to-un-blue border border-gray-300 rounded"></div>
              <span className="whitespace-nowrap">High Similarity</span>
            </div>
          </div>

          <div className="w-full overflow-auto border border-gray-200 rounded-lg bg-gray-50">
            <div className="min-w-fit flex justify-center">
              <svg ref={svgRef} id="matrix" className="max-w-full h-auto"></svg>
            </div>
          </div>

          {/* Statistics */}
          <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 mt-6 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {data.speeches.length}
              </div>
              <div className="text-sm text-gray-600">Total Speeches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {data.similarities.length}
              </div>
              <div className="text-sm text-gray-600">Similarity Pairs</div>
            </div>
          </div>
        </div>
      )}

      {/* Information Section */}
      <InfoBlock title="About This Analysis">
        <div className="space-y-4">
          <p className="text-gray-700">
            This interactive matrix shows semantic similarities between UN
            General Assembly speeches. Each cell represents the similarity
            between two speeches, with darker blue indicating higher similarity.
            The similarity is calculated using cosine similarity between speech
            embeddings generated by advanced language models.
          </p>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">How to use:</h3>
            <ul className="text-gray-700 space-y-1 list-disc list-inside">
              <li>
                The visualization starts with major world powers. Add or remove
                countries using the controls above
              </li>
              <li>
                Adjust the year and minimum similarity threshold to focus on
                specific time periods and relationships
              </li>
              <li>
                Use the view threshold slider to filter which similarities are
                displayed in the matrix
              </li>
              <li>
                Hover over cells to see detailed comparisons between speeches
              </li>
              <li>
                Click the × button next to any country name to remove it from
                the analysis
              </li>
            </ul>
          </div>
        </div>
      </InfoBlock>

      <div
        ref={tooltipRef}
        id="tooltip"
        className="absolute bg-black bg-opacity-90 text-white p-3 rounded-md text-sm leading-relaxed max-w-xs pointer-events-none z-50 shadow-lg"
        style={{ display: 'none' }}
      ></div>
    </PageLayout>
  )
}
