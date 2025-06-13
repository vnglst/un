#!/usr/bin/env node

/**
 * Climate Change Similarity Visualization
 *
 * This script creates visualizations for the climate change similarity analysis results.
 * It generates HTML files with D3.js charts showing trends over time.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

// Types (matching the analysis script)
interface ChunkSimilarity {
  chunkId: number
  speechId: number
  year: number
  session: number
  speaker: string | null
  chunkText: string
  chunkIndex: number
  similarity: number
  distance: number
}

interface YearlyAnalysis {
  year: number
  totalChunks: number
  averageSimilarity: number
  maxSimilarity: number
  minSimilarity: number
  topChunks: ChunkSimilarity[]
  speechCount: number
}

interface AnalysisResult {
  targetPhrase: string
  countryCode: string
  yearRange: { start: number; end: number }
  totalChunks: number
  overallStats: {
    averageSimilarity: number
    maxSimilarity: number
    minSimilarity: number
  }
  yearlyAnalysis: YearlyAnalysis[]
  topSimilarChunks: ChunkSimilarity[]
  trendData: Array<{
    year: number
    avgSimilarity: number
    maxSimilarity: number
  }>
}

/**
 * Load analysis results from JSON file
 */
function loadResults(): AnalysisResult {
  const resultsPath = join(
    process.cwd(),
    'analysis',
    'climate-similarity-results.json'
  )

  if (!existsSync(resultsPath)) {
    console.error('❌ Results file not found. Please run the analysis first:')
    console.error('   node analysis/climate-similarity-analysis.ts')
    process.exit(1)
  }

  const resultsData = readFileSync(resultsPath, 'utf-8')
  return JSON.parse(resultsData) as AnalysisResult
}

/**
 * Generate HTML visualization
 */
function generateVisualization(results: AnalysisResult): string {
  const trendData = JSON.stringify(results.trendData)
  const yearlyData = JSON.stringify(
    results.yearlyAnalysis.map((ya) => ({
      year: ya.year,
      avgSimilarity: ya.averageSimilarity,
      maxSimilarity: ya.maxSimilarity,
      minSimilarity: ya.minSimilarity,
      totalChunks: ya.totalChunks,
      speechCount: ya.speechCount,
    }))
  )

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>USA Climate Change Speech Similarity Analysis</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8fafc;
            color: #1e293b;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #0f766e 0%, #0d9488 100%);
            color: white;
            padding: 30px;
        }
        .header h1 {
            margin: 0 0 10px 0;
            font-size: 2rem;
            font-weight: 700;
        }
        .header p {
            margin: 0;
            font-size: 1.1rem;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .stat-card {
            background: #f1f5f9;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #0f766e;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 0.9rem;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .chart-container {
            margin: 30px 0;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
        }
        .chart-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 15px;
            color: #1e293b;
        }
        .axis {
            font-size: 12px;
        }
        .line {
            fill: none;
            stroke-width: 2.5;
        }
        .line.avg-similarity {
            stroke: #0f766e;
        }
        .line.max-similarity {
            stroke: #dc2626;
        }
        .dot {
            fill: white;
            stroke-width: 2;
        }
        .dot.avg-similarity {
            stroke: #0f766e;
        }
        .dot.max-similarity {
            stroke: #dc2626;
        }
        .tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s;
        }
        .legend {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 15px;
            font-size: 14px;
        }
        .legend-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .legend-color {
            width: 16px;
            height: 3px;
            border-radius: 2px;
        }
        .top-chunks {
            margin-top: 30px;
        }
        .chunk-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .chunk-header {
            display: flex;
            justify-content: between;
            align-items: center;
            margin-bottom: 10px;
        }
        .chunk-similarity {
            background: #0f766e;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.875rem;
            font-weight: 600;
        }
        .chunk-meta {
            font-size: 0.875rem;
            color: #64748b;
            margin-bottom: 8px;
        }
        .chunk-text {
            color: #374151;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌍 USA Climate Change Speech Similarity Analysis</h1>
            <p>Analyzing similarity to: "${results.targetPhrase}"</p>
            <p>Period: ${results.yearRange.start}-${results.yearRange.end} | Total Chunks: ${results.totalChunks.toLocaleString()}</p>
        </div>
        
        <div class="content">
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${(results.overallStats.averageSimilarity * 100).toFixed(1)}%</div>
                    <div class="stat-label">Average Similarity</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${(results.overallStats.maxSimilarity * 100).toFixed(1)}%</div>
                    <div class="stat-label">Peak Similarity</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${results.yearlyAnalysis.length}</div>
                    <div class="stat-label">Years Analyzed</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${results.yearlyAnalysis.reduce((sum, ya) => sum + ya.speechCount, 0)}</div>
                    <div class="stat-label">Total Speeches</div>
                </div>
            </div>
            
            <div class="chart-container">
                <h3 class="chart-title">Climate Change Similarity Trends Over Time</h3>
                <div id="similarity-chart"></div>
                <div class="legend">
                    <div class="legend-item">
                        <div class="legend-color" style="background: #0f766e;"></div>
                        <span>Average Similarity</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #dc2626;"></div>
                        <span>Maximum Similarity</span>
                    </div>
                </div>
            </div>
            
            <div class="chart-container">
                <h3 class="chart-title">Speech Volume by Year</h3>
                <div id="volume-chart"></div>
            </div>
            
            <div class="top-chunks">
                <h3 class="chart-title">Top 10 Most Similar Speech Chunks</h3>
                ${results.topSimilarChunks
                  .slice(0, 10)
                  .map(
                    (chunk, index) => `
                    <div class="chunk-item">
                        <div class="chunk-header">
                            <span><strong>#${index + 1}</strong></span>
                            <span class="chunk-similarity">${(chunk.similarity * 100).toFixed(1)}%</span>
                        </div>
                        <div class="chunk-meta">
                            <strong>Year:</strong> ${chunk.year} | 
                            <strong>Speaker:</strong> ${chunk.speaker || 'Unknown'} | 
                            <strong>Session:</strong> ${chunk.session}
                        </div>
                        <div class="chunk-text">${chunk.chunkText}</div>
                    </div>
                `
                  )
                  .join('')}
            </div>
        </div>
    </div>
    
    <div class="tooltip"></div>
    
    <script>
        // Data
        const trendData = ${trendData};
        const yearlyData = ${yearlyData};
        
        // Chart dimensions
        const margin = { top: 20, right: 30, bottom: 40, left: 60 };
        const width = 800 - margin.left - margin.right;
        const height = 400 - margin.bottom - margin.top;
        
        // Create similarity trends chart
        function createSimilarityChart() {
            const svg = d3.select("#similarity-chart")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);
                
            const g = svg.append("g")
                .attr("transform", \`translate(\${margin.left},\${margin.top})\`);
            
            // Scales
            const xScale = d3.scaleLinear()
                .domain(d3.extent(trendData, d => d.year))
                .range([0, width]);
                
            const yScale = d3.scaleLinear()
                .domain([0, d3.max(trendData, d => Math.max(d.avgSimilarity, d.maxSimilarity))])
                .range([height, 0]);
            
            // Line generators
            const avgLine = d3.line()
                .x(d => xScale(d.year))
                .y(d => yScale(d.avgSimilarity))
                .curve(d3.curveMonotoneX);
                
            const maxLine = d3.line()
                .x(d => xScale(d.year))
                .y(d => yScale(d.maxSimilarity))
                .curve(d3.curveMonotoneX);
            
            // Add axes
            g.append("g")
                .attr("class", "axis")
                .attr("transform", \`translate(0,\${height})\`)
                .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
                
            g.append("g")
                .attr("class", "axis")
                .call(d3.axisLeft(yScale).tickFormat(d3.format(".1%")));
            
            // Add lines
            g.append("path")
                .datum(trendData)
                .attr("class", "line avg-similarity")
                .attr("d", avgLine);
                
            g.append("path")
                .datum(trendData)
                .attr("class", "line max-similarity")
                .attr("d", maxLine);
            
            // Add dots with tooltips
            const tooltip = d3.select(".tooltip");
            
            g.selectAll(".dot.avg-similarity")
                .data(trendData)
                .enter().append("circle")
                .attr("class", "dot avg-similarity")
                .attr("cx", d => xScale(d.year))
                .attr("cy", d => yScale(d.avgSimilarity))
                .attr("r", 4)
                .on("mouseover", (event, d) => {
                    tooltip.style("opacity", 1)
                        .html(\`<strong>\${d.year}</strong><br/>Avg Similarity: \${(d.avgSimilarity * 100).toFixed(1)}%\`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", () => tooltip.style("opacity", 0));
                
            g.selectAll(".dot.max-similarity")
                .data(trendData)
                .enter().append("circle")
                .attr("class", "dot max-similarity")
                .attr("cx", d => xScale(d.year))
                .attr("cy", d => yScale(d.maxSimilarity))
                .attr("r", 4)
                .on("mouseover", (event, d) => {
                    tooltip.style("opacity", 1)
                        .html(\`<strong>\${d.year}</strong><br/>Max Similarity: \${(d.maxSimilarity * 100).toFixed(1)}%\`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", () => tooltip.style("opacity", 0));
            
            // Add axis labels
            g.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (height / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .style("font-size", "12px")
                .text("Similarity Score");
                
            g.append("text")
                .attr("transform", \`translate(\${width / 2}, \${height + margin.bottom})\`)
                .style("text-anchor", "middle")
                .style("font-size", "12px")
                .text("Year");
        }
        
        // Create volume chart
        function createVolumeChart() {
            const svg = d3.select("#volume-chart")
                .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);
                
            const g = svg.append("g")
                .attr("transform", \`translate(\${margin.left},\${margin.top})\`);
            
            // Scales
            const xScale = d3.scaleBand()
                .domain(yearlyData.map(d => d.year))
                .range([0, width])
                .padding(0.1);
                
            const yScale = d3.scaleLinear()
                .domain([0, d3.max(yearlyData, d => d.totalChunks)])
                .range([height, 0]);
            
            // Add axes
            g.append("g")
                .attr("class", "axis")
                .attr("transform", \`translate(0,\${height})\`)
                .call(d3.axisBottom(xScale));
                
            g.append("g")
                .attr("class", "axis")
                .call(d3.axisLeft(yScale));
            
            // Add bars
            const tooltip = d3.select(".tooltip");
            
            g.selectAll(".bar")
                .data(yearlyData)
                .enter().append("rect")
                .attr("class", "bar")
                .attr("x", d => xScale(d.year))
                .attr("width", xScale.bandwidth())
                .attr("y", d => yScale(d.totalChunks))
                .attr("height", d => height - yScale(d.totalChunks))
                .attr("fill", "#0f766e")
                .attr("opacity", 0.7)
                .on("mouseover", (event, d) => {
                    tooltip.style("opacity", 1)
                        .html(\`<strong>\${d.year}</strong><br/>Chunks: \${d.totalChunks}<br/>Speeches: \${d.speechCount}\`)
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", () => tooltip.style("opacity", 0));
            
            // Add axis labels
            g.append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", 0 - (height / 2))
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .style("font-size", "12px")
                .text("Number of Chunks");
                
            g.append("text")
                .attr("transform", \`translate(\${width / 2}, \${height + margin.bottom})\`)
                .style("text-anchor", "middle")
                .style("font-size", "12px")
                .text("Year");
        }
        
        // Initialize charts
        createSimilarityChart();
        createVolumeChart();
    </script>
</body>
</html>`
}

/**
 * Main execution function
 */
function main(): void {
  console.log('📊 Generating Climate Change Similarity Visualization...')

  try {
    // Load results
    const results = loadResults()
    console.log(
      `✓ Loaded results for ${results.totalChunks} chunks from ${results.yearRange.start}-${results.yearRange.end}`
    )

    // Generate HTML visualization
    const html = generateVisualization(results)

    // Save visualization
    const outputPath = join(
      process.cwd(),
      'analysis',
      'climate-similarity-visualization.html'
    )
    writeFileSync(outputPath, html)
    console.log(`✓ Visualization saved to ${outputPath}`)

    console.log('\n🎉 Visualization completed successfully!')
    console.log(
      '📂 Open the HTML file in your browser to view the interactive charts.'
    )
  } catch (error) {
    console.error('❌ Visualization generation failed:', error)
    process.exit(1)
  }
}

// Run the visualization generator
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main }
