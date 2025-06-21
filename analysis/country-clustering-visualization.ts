#!/usr/bin/env node

/**
 * Country Clustering Visualization Generator
 *
 * Creates an interactive HTML visualization showing countries clustered by
 * semantic similarity of their UN General Assembly speeches
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Types
interface CountryPoint {
  countryCode: string
  countryName: string
  year: number
  x: number
  y: number
  clusterId: number
  chunkCount: number
  speechCount: number
}

interface ClusterInfo {
  id: number
  name: string
  description: string
  countries: string[]
  representativeChunks: Array<{
    text: string
    country: string
    similarity: number
  }>
  color: string
}

interface AnalysisResult {
  year: number
  countries: CountryPoint[]
  clusters: ClusterInfo[]
  metadata: {
    totalCountries: number
    totalChunks: number
    processingTime: number
    umapParams: object
    clusteringParams: object
  }
}

/**
 * Generate HTML visualization
 */
function generateVisualization(data: AnalysisResult): string {
  const { year, countries, clusters, metadata } = data

  // Prepare data for D3
  const countriesJson = JSON.stringify(countries)
  const clustersJson = JSON.stringify(clusters)

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UN Speeches Country Clustering - ${year}</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f8f9fa;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 20px;
        }
        
        .header h1 {
            margin: 0;
            color: #2c3e50;
            font-size: 2.5rem;
        }
        
        .header p {
            margin: 10px 0 0 0;
            color: #6c757d;
            font-size: 1.1rem;
        }
        
        .stats {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin: 20px 0;
            flex-wrap: wrap;
        }
        
        .stat {
            text-align: center;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 6px;
            min-width: 120px;
        }
        
        .stat-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: #6c757d;
            margin-top: 4px;
        }
        
        .visualization-container {
            display: flex;
            gap: 20px;
            margin: 30px 0;
        }
        
        .chart-container {
            flex: 2;
            background: white;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 20px;
        }
        
        .chart-title {
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 15px;
            color: #2c3e50;
        }
        
        .legend-container {
            flex: 1;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 20px;
        }
        
        .legend-item {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
            padding: 8px;
            background: white;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .legend-item:hover {
            background-color: #e9ecef;
        }
        
        .legend-color {
            width: 16px;
            height: 16px;
            border-radius: 50%;
            margin-right: 10px;
            flex-shrink: 0;
        }
        
        .legend-text {
            flex-grow: 1;
        }
        
        .legend-title {
            font-weight: bold;
            font-size: 0.9rem;
            margin-bottom: 4px;
        }
        
        .legend-description {
            font-size: 0.8rem;
            color: #6c757d;
        }
        
        .tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 10px;
            border-radius: 4px;
            font-size: 12px;
            pointer-events: none;
            z-index: 1000;
            max-width: 300px;
        }
        
        .country-circle {
            cursor: pointer;
            stroke-width: 2;
            stroke: rgba(255, 255, 255, 0.8);
        }
        
        .country-circle:hover {
            stroke-width: 3;
            stroke: #333;
        }
        
        .cluster-details {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 4px solid #007bff;
        }
        
        .cluster-details h3 {
            margin: 0 0 10px 0;
            color: #2c3e50;
        }
        
        .cluster-countries {
            margin: 10px 0;
        }
        
        .cluster-countries strong {
            color: #495057;
        }
        
        .sample-chunks {
            margin-top: 15px;
        }
        
        .sample-chunk {
            background: white;
            padding: 10px;
            margin: 8px 0;
            border-radius: 4px;
            border-left: 3px solid #17a2b8;
        }
        
        .chunk-text {
            font-style: italic;
            margin-bottom: 5px;
            line-height: 1.4;
        }
        
        .chunk-country {
            font-size: 0.85rem;
            color: #6c757d;
            font-weight: bold;
        }
        
        #scatter-plot {
            width: 100%;
            height: 500px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌍 UN Speeches Country Clustering</h1>
            <p>Semantic similarity analysis of UN General Assembly speeches for ${year}</p>
            <div class="stats">
                <div class="stat">
                    <div class="stat-value">${metadata.totalCountries}</div>
                    <div class="stat-label">Countries</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${clusters.length}</div>
                    <div class="stat-label">Clusters</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${metadata.totalChunks}</div>
                    <div class="stat-label">Speech Chunks</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${(metadata.processingTime / 1000).toFixed(1)}s</div>
                    <div class="stat-label">Processing Time</div>
                </div>
            </div>
        </div>
        
        <div class="visualization-container">
            <div class="chart-container">
                <h3 class="chart-title">Country Similarity Clusters</h3>
                <svg id="scatter-plot"></svg>
            </div>
            
            <div class="legend-container">
                <h3 class="chart-title">Clusters</h3>
                <div id="legend"></div>
            </div>
        </div>
        
        <div id="cluster-details" class="cluster-details" style="display: none;">
            <h3 id="cluster-title"></h3>
            <div id="cluster-description"></div>
            <div id="cluster-countries" class="cluster-countries"></div>
            <div id="sample-chunks" class="sample-chunks"></div>
        </div>
    </div>

    <script>
        // Data
        const countries = ${countriesJson};
        const clusters = ${clustersJson};
        
        // Set up dimensions and margins
        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        const width = 600 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;
        
        // Create SVG
        const svg = d3.select("#scatter-plot")
            .attr("viewBox", \`0 0 \${width + margin.left + margin.right} \${height + margin.top + margin.bottom}\`)
            .append("g")
            .attr("transform", \`translate(\${margin.left},\${margin.top})\`);
        
        // Create scales
        const xExtent = d3.extent(countries, d => d.x);
        const yExtent = d3.extent(countries, d => d.y);
        
        const xScale = d3.scaleLinear()
            .domain(xExtent)
            .range([0, width]);
            
        const yScale = d3.scaleLinear()
            .domain(yExtent)
            .range([height, 0]);
        
        // Create color scale
        const clusterColors = {};
        clusters.forEach(cluster => {
            clusterColors[cluster.id] = cluster.color;
        });
        clusterColors[-2] = '#95a5a6'; // Color for noise/unclustered points
        
        // Create tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
        
        // Add axes
        svg.append("g")
            .attr("transform", \`translate(0,\${height})\`)
            .call(d3.axisBottom(xScale))
            .append("text")
            .attr("x", width / 2)
            .attr("y", 35)
            .style("text-anchor", "middle")
            .style("fill", "#666")
            .text("Dimension 1");
            
        svg.append("g")
            .call(d3.axisLeft(yScale))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -25)
            .attr("x", -height / 2)
            .style("text-anchor", "middle")
            .style("fill", "#666")
            .text("Dimension 2");
        
        // Add country points
        svg.selectAll(".country-circle")
            .data(countries)
            .enter()
            .append("circle")
            .attr("class", "country-circle")
            .attr("cx", d => xScale(d.x))
            .attr("cy", d => yScale(d.y))
            .attr("r", d => Math.sqrt(d.chunkCount) + 3)
            .style("fill", d => clusterColors[d.clusterId] || '#95a5a6')
            .style("fill-opacity", 0.7)
            .on("mouseover", function(event, d) {
                const cluster = clusters.find(c => c.id === d.clusterId);
                const clusterName = cluster ? cluster.name : 'Unclustered';
                
                tooltip.transition()
                    .duration(200)
                    .style("opacity", .9);
                tooltip.html(\`
                    <strong>\${d.countryName}</strong><br/>
                    Cluster: \${clusterName}<br/>
                    Speeches: \${d.speechCount}<br/>
                    Chunks: \${d.chunkCount}
                \`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            });
        
        // Create legend
        const legend = d3.select("#legend");
        
        clusters.forEach(cluster => {
            const legendItem = legend.append("div")
                .attr("class", "legend-item")
                .on("click", () => showClusterDetails(cluster));
                
            legendItem.append("div")
                .attr("class", "legend-color")
                .style("background", cluster.color);
                
            const legendText = legendItem.append("div")
                .attr("class", "legend-text");
                
            legendText.append("div")
                .attr("class", "legend-title")
                .text(cluster.name);
                
            legendText.append("div")
                .attr("class", "legend-description")
                .text(\`\${cluster.countries.length} countries\`);
        });
        
        // Add unclustered legend item if there are any
        const unclusteredCount = countries.filter(c => c.clusterId < 0).length;
        if (unclusteredCount > 0) {
            const legendItem = legend.append("div")
                .attr("class", "legend-item");
                
            legendItem.append("div")
                .attr("class", "legend-color")
                .style("background", "#95a5a6");
                
            const legendText = legendItem.append("div")
                .attr("class", "legend-text");
                
            legendText.append("div")
                .attr("class", "legend-title")
                .text("Unclustered");
                
            legendText.append("div")
                .attr("class", "legend-description")
                .text(\`\${unclusteredCount} countries\`);
        }
        
        // Function to show cluster details
        function showClusterDetails(cluster) {
            const detailsDiv = document.getElementById('cluster-details');
            const titleDiv = document.getElementById('cluster-title');
            const descriptionDiv = document.getElementById('cluster-description');
            const countriesDiv = document.getElementById('cluster-countries');
            const chunksDiv = document.getElementById('sample-chunks');
            
            titleDiv.textContent = cluster.name;
            descriptionDiv.textContent = cluster.description;
            
            countriesDiv.innerHTML = \`<strong>Countries:</strong> \${cluster.countries.join(', ')}\`;
            
            let chunksHtml = '<h4>Representative Speech Excerpts:</h4>';
            cluster.representativeChunks.forEach(chunk => {
                chunksHtml += \`
                    <div class="sample-chunk">
                        <div class="chunk-text">"\${chunk.text}"</div>
                        <div class="chunk-country">— \${chunk.country}</div>
                    </div>
                \`;
            });
            chunksDiv.innerHTML = chunksHtml;
            
            detailsDiv.style.display = 'block';
            detailsDiv.scrollIntoView({ behavior: 'smooth' });
        }
    </script>
</body>
</html>`
}

/**
 * Main execution function
 */
function main(): void {
  console.log('🎨 Generating Country Clustering Visualization')

  try {
    // Read the analysis results
    const resultsPath = join(
      process.cwd(),
      'analysis',
      'country-clusters-2024.json'
    )
    const resultsData = readFileSync(resultsPath, 'utf-8')
    const analysisResult: AnalysisResult = JSON.parse(resultsData)

    // Generate visualization
    const html = generateVisualization(analysisResult)

    // Save HTML file
    const outputPath = join(
      process.cwd(),
      'analysis',
      'country-clusters-visualization.html'
    )
    writeFileSync(outputPath, html)

    console.log(`✓ Visualization saved to ${outputPath}`)
    console.log(
      '\nOpen the HTML file in your browser to view the interactive visualization!'
    )
  } catch (error) {
    console.error('❌ Visualization generation failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main }
