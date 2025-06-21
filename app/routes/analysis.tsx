import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { Link } from 'react-router'
import PageLayout from '../components/page-layout'
import { Button } from '../components/ui/button'
import { Select } from '../components/ui/select'
import { Input } from '../components/ui/input'
import { InfoBlock } from '../components/ui/cards'

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

interface SpeechMetadata {
  id: number
  country: string
  speaker: string
  post: string
  date: string
  year: number
}

interface SimilarityData {
  speeches: SpeechMetadata[]
  similarities: Array<{
    speech1_id: number
    speech2_id: number
    similarity: number
  }>
  matrix?: number[][]
}

export default function Analysis() {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<SimilarityData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Control states
  const [selectedYear, setSelectedYear] = useState<string>('2024')
  const [threshold, setThreshold] = useState(0.5)
  const [limit, setLimit] = useState(50)
  const [viewThreshold, setViewThreshold] = useState(0.3)

  // Fixed cell size (always use large)
  const cellSize = 16

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        format: 'matrix',
        threshold: threshold.toString(),
        limit: limit.toString(),
      })

      if (selectedYear && selectedYear !== 'all') {
        params.set('year', selectedYear)
      }

      const response = await fetch(`/api/similarities?${params}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: SimilarityData = await response.json()

      if ('error' in result) {
        throw new Error(result.error as string)
      }

      setData(result)
      console.log('Loaded similarity data:', result.speeches.length, 'speeches')
    } catch (err) {
      console.error('Error loading data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setIsLoading(false)
    }
  }, [threshold, selectedYear, limit])

  useEffect(() => {
    loadData()
  }, [loadData]) // Reload when controls change

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

      // Color scale - use actual data range for better contrast
      const colorScale = d3
        .scaleSequential(d3.interpolateBlues)
        .domain([minSim, maxSim])

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
              visible: matrix[i][j] >= viewThreshold,
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
        .attr('fill', (d) => (d.visible ? colorScale(d.similarity) : '#f8f9fa'))
        .attr('opacity', (d) => (d.visible ? 1 : 0.3))
        .style('cursor', 'pointer')
        .style('stroke', 'white')
        .style('stroke-width', '0.5')
        .on('mouseover', function (event, d) {
          if (!d.visible) return

          d3.select(this).style('stroke', '#333').style('stroke-width', '2')

          const tooltipHtml = `
          <strong>Similarity: ${d.similarity.toFixed(3)}</strong><br/>
          <br/>
          <strong>${d.speech1.country}</strong> - ${d.speech1.speaker}<br/>
          <em>${d.speech1.post}</em><br/>
          <br/>
          <strong>${d.speech2.country}</strong> - ${d.speech2.speaker}<br/>
          <em>${d.speech2.post}</em>
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
    [viewThreshold]
  ) // Include dependencies

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
          <Link to="/" className="hover:text-[#009edb] transition-colors">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full"
            >
              <option value="all">All Years</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Similarity
            </label>
            <Input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              min="0"
              max="1"
              step="0.1"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Speeches
            </label>
            <Select
              value={limit.toString()}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="w-full"
            >
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
              <option value="200">200</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actions
            </label>
            <Button onClick={loadData} disabled={isLoading} className="w-full">
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>

        {/* Display Controls */}
        <div className="flex flex-col sm:flex-row sm:justify-start gap-4 sm:gap-6 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              View Threshold:
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={viewThreshold}
              onChange={(e) => setViewThreshold(parseFloat(e.target.value))}
              className="flex-1 sm:w-24"
            />
            <span className="text-sm text-gray-600 min-w-[3rem]">
              {viewThreshold.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

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
              <div className="w-20 sm:w-32 h-3 sm:h-4 bg-gradient-to-r from-blue-50 to-blue-800 border border-gray-300 rounded"></div>
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
                Adjust the year, minimum similarity threshold, and maximum
                number of speeches using the controls above
              </li>
              <li>
                Use the view threshold slider to filter which similarities are
                displayed in the matrix
              </li>
              <li>
                Adjust cell size for better visibility depending on your screen
                size
              </li>
              <li>
                Hover over cells to see detailed comparisons between speeches
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
