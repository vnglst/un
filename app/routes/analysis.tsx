import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import PageLayout from '../components/page-layout'

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

interface Speech {
  id: number
  country: string
  speaker: string
  title: string
  date: string
  index: number
}

interface SimilarityData {
  speeches: Speech[]
  similarities: number[][]
}

export default function Analysis() {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const thresholdRef = useRef<HTMLInputElement>(null)
  const thresholdValueRef = useRef<HTMLSpanElement>(null)
  const cellSizeRef = useRef<HTMLSelectElement>(null)

  useEffect(() => {
    // Load the similarity data and initialize visualization
    fetch('/speech-similarity-2024.json')
      .then((response) => response.json())
      .then((data: SimilarityData) => {
        console.log('Loaded similarity data:', data.speeches.length, 'speeches')
        initializeVisualization(data)
      })
      .catch((error) => {
        console.error('Error loading data:', error)
      })
  }, [])

  const initializeVisualization = (data: SimilarityData) => {
    const { speeches, similarities } = data

    // Update stats
    document.getElementById('total-speeches')!.textContent =
      speeches.length.toString()

    // Calculate statistics
    const allSimilarities = similarities.flat().filter((sim) => sim < 1.0)
    const avgSim =
      allSimilarities.reduce((a, b) => a + b, 0) / allSimilarities.length
    const maxSim = Math.max(...allSimilarities)
    const minSim = Math.min(...allSimilarities)

    document.getElementById('avg-similarity')!.textContent = avgSim.toFixed(3)
    document.getElementById('max-similarity')!.textContent = maxSim.toFixed(3)

    // Set up the visualization
    const svg = d3.select(svgRef.current)
    const tooltip = d3.select(tooltipRef.current)

    // Color scale - use actual data range for better contrast
    const colorScale = d3
      .scaleSequential(d3.interpolateBlues)
      .domain([minSim, maxSim])

    // Update legend labels with actual range
    const legendLabels = document.getElementById('legend-labels')!
    legendLabels.innerHTML = `
      <span>${minSim.toFixed(3)}</span>
      <span>${((minSim + maxSim) / 2).toFixed(3)}</span>
      <span>${maxSim.toFixed(3)}</span>
    `

    // Update threshold slider to use actual data range
    const thresholdSlider = thresholdRef.current!
    thresholdSlider.min = minSim.toFixed(3)
    thresholdSlider.max = maxSim.toFixed(3)
    thresholdSlider.value = minSim.toFixed(3)
    thresholdSlider.step = '0.001'
    thresholdValueRef.current!.textContent = minSim.toFixed(3)

    let currentThreshold = minSim // Start with minimum to show all data
    let currentCellSize = 12

    const updateMatrix = () => {
      svg.selectAll('*').remove()

      const margin = { top: 100, right: 100, bottom: 100, left: 100 }
      const cellSize = currentCellSize
      const width = speeches.length * cellSize + margin.left + margin.right
      const height = speeches.length * cellSize + margin.top + margin.bottom

      svg.attr('width', width).attr('height', height)

      const g = svg
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

      // Create cells
      g.selectAll('.matrix-cell')
        .data(
          speeches.flatMap((speech1, i) =>
            speeches.map((speech2, j) => ({
              i,
              j,
              speech1: speech1,
              speech2: speech2,
              similarity: similarities[i][j],
              visible: similarities[i][j] >= currentThreshold,
            }))
          )
        )
        .enter()
        .append('rect')
        .attr('class', 'matrix-cell')
        .attr('x', (d) => d.j * cellSize)
        .attr('y', (d) => d.i * cellSize)
        .attr('width', cellSize)
        .attr('height', cellSize)
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
            <em>${d.speech1.title}</em><br/>
            <br/>
            <strong>${d.speech2.country}</strong> - ${d.speech2.speaker}<br/>
            <em>${d.speech2.title}</em>
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
      const countryPositions = new Map()

      // Calculate country positions
      speeches.forEach((speech, i) => {
        if (!countryPositions.has(speech.country)) {
          countryPositions.set(speech.country, [])
        }
        countryPositions.get(speech.country).push(i)
      })

      // Add country labels
      countries.forEach((country) => {
        const positions = countryPositions.get(country)
        const avgPos =
          positions.reduce((a: number, b: number) => a + b, 0) /
          positions.length

        // X-axis label (top)
        g.append('text')
          .attr('class', 'axis-label')
          .attr('x', avgPos * cellSize + cellSize / 2)
          .attr('y', -10)
          .attr('text-anchor', 'middle')
          .style('font-size', '10px')
          .style('fill', '#666')
          .text(country)

        // Y-axis label (left)
        g.append('text')
          .attr('class', 'axis-label')
          .attr('x', -10)
          .attr('y', avgPos * cellSize + cellSize / 2)
          .attr('text-anchor', 'end')
          .attr('alignment-baseline', 'middle')
          .style('font-size', '10px')
          .style('fill', '#666')
          .text(country)
      })

      // Add country group separators
      let currentPos = 0
      countries.forEach((country) => {
        const positions = countryPositions.get(country)
        currentPos += positions.length

        if (currentPos < speeches.length) {
          // Vertical line
          g.append('line')
            .attr('class', 'country-group')
            .attr('x1', currentPos * cellSize)
            .attr('x2', currentPos * cellSize)
            .attr('y1', 0)
            .attr('y2', speeches.length * cellSize)
            .style('fill', 'none')
            .style('stroke', '#999')
            .style('stroke-width', '1')
            .style('stroke-dasharray', '2,2')

          // Horizontal line
          g.append('line')
            .attr('class', 'country-group')
            .attr('x1', 0)
            .attr('x2', speeches.length * cellSize)
            .attr('y1', currentPos * cellSize)
            .attr('y2', currentPos * cellSize)
            .style('fill', 'none')
            .style('stroke', '#999')
            .style('stroke-width', '1')
            .style('stroke-dasharray', '2,2')
        }
      })
    }

    // Event listeners
    thresholdRef.current!.addEventListener('input', function () {
      currentThreshold = parseFloat(this.value)
      thresholdValueRef.current!.textContent = currentThreshold.toFixed(3)
      updateMatrix()
    })

    cellSizeRef.current!.addEventListener('change', function () {
      currentCellSize = parseInt(this.value)
      updateMatrix()
    })

    // Initial render
    updateMatrix()
  }

  return (
    <PageLayout>
      <div className="container mx-auto max-w-7xl bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-3">
          🌍 UN General Assembly 2024
        </h1>
        <div className="text-center text-gray-600 mb-8 text-lg">
          Speech Similarity Matrix - 40 Selected Countries
        </div>

        <div className="flex justify-center gap-6 mb-8 flex-wrap">
          <div className="flex items-center gap-2">
            <label htmlFor="threshold" className="font-medium text-gray-700">
              Similarity Threshold:
            </label>
            <input
              ref={thresholdRef}
              type="range"
              id="threshold"
              min="0"
              max="1"
              step="0.01"
              defaultValue="0.3"
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            />
            <span
              ref={thresholdValueRef}
              id="threshold-value"
              className="text-sm"
            >
              0.30
            </span>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="cellSize" className="font-medium text-gray-700">
              Cell Size:
            </label>
            <select
              ref={cellSizeRef}
              id="cellSize"
              defaultValue="12"
              className="px-3 py-1 border border-gray-300 rounded text-sm"
            >
              <option value="8">Small</option>
              <option value="12">Medium</option>
              <option value="16">Large</option>
              <option value="20">Extra Large</option>
            </select>
          </div>
        </div>

        <div className="flex justify-center overflow-auto border border-gray-300 rounded-lg bg-white mb-6">
          <svg ref={svgRef} id="matrix"></svg>
        </div>

        <div className="flex justify-center items-center mb-4 gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm">Low Similarity</span>
            <div className="w-48 h-5 bg-gradient-to-r from-blue-50 to-blue-800 border border-gray-300 rounded"></div>
            <span className="text-sm">High Similarity</span>
          </div>
        </div>

        <div id="legend-labels" className="flex justify-center">
          <div className="flex justify-between w-48 text-xs text-gray-600">
            <span>0.0</span>
            <span>0.5</span>
            <span>1.0</span>
          </div>
        </div>

        <div className="flex justify-center gap-8 mt-6 text-sm text-gray-600">
          <div className="text-center">
            <div
              id="total-speeches"
              className="text-lg font-bold text-gray-800"
            >
              -
            </div>
            <div>Total Speeches</div>
          </div>
          <div className="text-center">
            <div
              id="avg-similarity"
              className="text-lg font-bold text-gray-800"
            >
              -
            </div>
            <div>Average Similarity</div>
          </div>
          <div className="text-center">
            <div
              id="max-similarity"
              className="text-lg font-bold text-gray-800"
            >
              -
            </div>
            <div>Maximum Similarity</div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">About This Analysis</h2>
          <p className="text-gray-700 mb-4">
            This interactive matrix shows semantic similarities between UN
            General Assembly speeches from 40 selected countries in 2024. Each
            cell represents the similarity between two countries' speeches, with
            darker blue indicating higher similarity.
          </p>
          <p className="text-gray-700">
            <strong>Key insights:</strong> Hover over cells to see detailed
            comparisons. Use the threshold slider to filter similarities and the
            cell size selector to adjust the visualization. The analysis reveals
            interesting patterns like the high similarity between Germany and UK
            (0.788), Nordic country clustering, and unexpected cross-regional
            diplomatic alignments.
          </p>
        </div>
      </div>

      <div
        ref={tooltipRef}
        id="tooltip"
        className="absolute bg-black bg-opacity-90 text-white p-3 rounded-md text-sm leading-relaxed max-w-xs pointer-events-none z-50 shadow-lg"
        style={{ display: 'none' }}
      ></div>
    </PageLayout>
  )
}
