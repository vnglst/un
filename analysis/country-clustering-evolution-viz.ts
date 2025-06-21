#!/usr/bin/env node

/**
 * Multi-Year Country Clustering Visualization Generator
 *
 * Creates an interactive HTML visualization showing countries clustered by
 * semantic similarity across multiple years (2020-2024)
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
 * Generate multi-year HTML visualization
 */
function generateMultiYearVisualization(allYearData: AnalysisResult[]): string {
  const yearsData = allYearData.map((data) => ({
    year: data.year,
    countries: data.countries,
    clusters: data.clusters,
    totalCountries: data.metadata.totalCountries,
    totalClusters: data.clusters.length,
  }))

  // Prepare data for D3
  const allDataJson = JSON.stringify(yearsData)

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UN Speeches Country Clustering Evolution (2020-2024)</title>
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
            max-width: 1400px;
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
        
        .year-controls {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin: 20px 0;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 6px;
        }
        
        .year-slider {
            flex: 1;
            max-width: 400px;
        }
        
        .year-display {
            font-size: 2rem;
            font-weight: bold;
            color: #2c3e50;
            min-width: 60px;
        }
        
        .stats-bar {
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
            transition: all 0.3s ease;
        }
        
        .country-circle:hover {
            stroke-width: 3;
            stroke: #333;
        }
        
        .evolution-summary {
            margin-top: 20px;
            padding: 15px;
            background: #e3f2fd;
            border-radius: 6px;
            border-left: 4px solid #2196f3;
        }
        
        .evolution-summary h3 {
            margin: 0 0 10px 0;
            color: #1976d2;
        }
        
        .year-summary {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 10px;
            margin: 15px 0;
        }
        
        .year-card {
            background: white;
            padding: 10px;
            border-radius: 4px;
            text-align: center;
            border: 2px solid transparent;
            cursor: pointer;
            transition: border-color 0.2s;
        }
        
        .year-card.active {
            border-color: #2196f3;
        }
        
        .year-card-year {
            font-weight: bold;
            color: #1976d2;
        }
        
        .year-card-clusters {
            font-size: 0.9rem;
            color: #666;
        }
        
        #scatter-plot {
            width: 100%;
            height: 500px;
        }
        
        .cluster-details {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 6px;
            border-left: 4px solid #007bff;
            display: none;
        }
        
        .cluster-details h3 {
            margin: 0 0 10px 0;
            color: #2c3e50;
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🌍 UN Speeches Country Clustering Evolution</h1>
            <p>Semantic similarity analysis of UN General Assembly speeches (2020-2024)</p>
        </div>
        
        <div class="evolution-summary">
            <h3>📈 Diplomatic Evolution Overview</h3>
            <p>Explore how global diplomatic patterns evolved over 5 crucial years. Use the controls below to navigate between years and see how countries cluster and uncluster based on the semantic similarity of their UN speeches.</p>
            
            <div class="year-summary" id="year-summary">
                <!-- Year cards will be populated by JavaScript -->
            </div>
        </div>
        
        <div class="year-controls">
            <div class="year-display" id="current-year">2020</div>
            <input type="range" id="year-slider" class="year-slider" min="2020" max="2024" value="2020" step="1">
            <button id="play-animation" style="padding: 8px 16px; border: none; background: #2196f3; color: white; border-radius: 4px; cursor: pointer;">▶ Play Evolution</button>
        </div>
        
        <div class="stats-bar" id="stats-bar">
            <!-- Stats will be populated by JavaScript -->
        </div>
        
        <div class="visualization-container">
            <div class="chart-container">
                <h3 class="chart-title" id="chart-title">Country Similarity Clusters - 2020</h3>
                <svg id="scatter-plot"></svg>
            </div>
            
            <div class="legend-container">
                <h3 class="chart-title">Clusters</h3>
                <div id="legend"></div>
            </div>
        </div>
        
        <div id="cluster-details" class="cluster-details">
            <h3 id="cluster-title"></h3>
            <div id="cluster-description"></div>
            <div id="cluster-countries" class="cluster-countries"></div>
            <div id="sample-chunks" class="sample-chunks"></div>
        </div>
    </div>

    <script>
        // Data
        const allYearsData = ${allDataJson};
        
        let currentYearIndex = 0;
        let isPlaying = false;
        
        // Set up dimensions and margins
        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        const width = 700 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;
        
        // Create SVG
        const svg = d3.select("#scatter-plot")
            .attr("viewBox", \`0 0 \${width + margin.left + margin.right} \${height + margin.top + margin.bottom}\`)
            .append("g")
            .attr("transform", \`translate(\${margin.left},\${margin.top})\`);
        
        // Create tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
        
        // Initialize year summary
        function initializeYearSummary() {
            const yearSummary = d3.select("#year-summary");
            
            allYearsData.forEach((yearData, index) => {
                const yearCard = yearSummary.append("div")
                    .attr("class", "year-card")
                    .classed("active", index === 0)
                    .on("click", () => {
                        currentYearIndex = index;
                        updateVisualization();
                        updateYearControls();
                    });
                    
                yearCard.append("div")
                    .attr("class", "year-card-year")
                    .text(yearData.year);
                    
                yearCard.append("div")
                    .attr("class", "year-card-clusters")
                    .text(\`\${yearData.totalClusters} clusters\`);
            });
        }
        
        // Update year controls
        function updateYearControls() {
            d3.select("#current-year").text(allYearsData[currentYearIndex].year);
            d3.select("#year-slider").property("value", allYearsData[currentYearIndex].year);
            
            // Update active year card
            d3.selectAll(".year-card").classed("active", false);
            d3.selectAll(".year-card").filter((d, i) => i === currentYearIndex).classed("active", true);
        }
        
        // Update stats
        function updateStats() {
            const currentData = allYearsData[currentYearIndex];
            const statsBar = d3.select("#stats-bar");
            
            statsBar.selectAll("*").remove();
            
            const stats = [
                { label: "Countries", value: currentData.totalCountries },
                { label: "Clusters", value: currentData.totalClusters },
                { label: "Year", value: currentData.year }
            ];
            
            const statDivs = statsBar.selectAll(".stat")
                .data(stats)
                .enter()
                .append("div")
                .attr("class", "stat");
                
            statDivs.append("div")
                .attr("class", "stat-value")
                .text(d => d.value);
                
            statDivs.append("div")
                .attr("class", "stat-label")
                .text(d => d.label);
        }
        
        // Update visualization
        function updateVisualization() {
            const currentData = allYearsData[currentYearIndex];
            const countries = currentData.countries;
            const clusters = currentData.clusters;
            
            // Update title
            d3.select("#chart-title").text(\`Country Similarity Clusters - \${currentData.year}\`);
            
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
            const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22'];
            clusters.forEach((cluster, i) => {
                clusterColors[cluster.id] = colors[i % colors.length];
            });
            clusterColors[-2] = '#95a5a6'; // Color for noise/unclustered points
            
            // Clear previous axes
            svg.selectAll(".axis").remove();
            
            // Add axes
            svg.append("g")
                .attr("class", "axis")
                .attr("transform", \`translate(0,\${height})\`)
                .call(d3.axisBottom(xScale))
                .append("text")
                .attr("x", width / 2)
                .attr("y", 35)
                .style("text-anchor", "middle")
                .style("fill", "#666")
                .text("Dimension 1");
                
            svg.append("g")
                .attr("class", "axis")
                .call(d3.axisLeft(yScale))
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", -25)
                .attr("x", -height / 2)
                .style("text-anchor", "middle")
                .style("fill", "#666")
                .text("Dimension 2");
            
            // Update country points
            const circles = svg.selectAll(".country-circle")
                .data(countries, d => d.countryCode);
            
            circles.exit().remove();
            
            circles.enter()
                .append("circle")
                .attr("class", "country-circle")
                .merge(circles)
                .transition()
                .duration(500)
                .attr("cx", d => xScale(d.x))
                .attr("cy", d => yScale(d.y))
                .attr("r", d => Math.sqrt(d.chunkCount) + 3)
                .style("fill", d => clusterColors[d.clusterId] || '#95a5a6')
                .style("fill-opacity", 0.7);
            
            // Add hover events
            svg.selectAll(".country-circle")
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
            
            // Update legend
            updateLegend(clusters, clusterColors);
            
            // Update stats
            updateStats();
        }
        
        // Update legend
        function updateLegend(clusters, clusterColors) {
            const legend = d3.select("#legend");
            legend.selectAll("*").remove();
            
            clusters.forEach(cluster => {
                const legendItem = legend.append("div")
                    .attr("class", "legend-item")
                    .on("click", () => showClusterDetails(cluster));
                    
                legendItem.append("div")
                    .attr("class", "legend-color")
                    .style("background", clusterColors[cluster.id]);
                    
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
            const currentData = allYearsData[currentYearIndex];
            const unclusteredCount = currentData.countries.filter(c => c.clusterId < 0).length;
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
        }
        
        // Show cluster details
        function showClusterDetails(cluster) {
            const detailsDiv = document.getElementById('cluster-details');
            const titleDiv = document.getElementById('cluster-title');
            const descriptionDiv = document.getElementById('cluster-description');
            const countriesDiv = document.getElementById('cluster-countries');
            const chunksDiv = document.getElementById('sample-chunks');
            
            titleDiv.textContent = cluster.name;
            descriptionDiv.textContent = cluster.description;
            
            countriesDiv.innerHTML = \`<strong>Countries (\${cluster.countries.length}):</strong> \${cluster.countries.join(', ')}\`;
            
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
        
        // Animation controls
        function playEvolution() {
            if (isPlaying) {
                isPlaying = false;
                d3.select("#play-animation").text("▶ Play Evolution");
                return;
            }
            
            isPlaying = true;
            d3.select("#play-animation").text("⏸ Pause");
            
            function nextFrame() {
                if (!isPlaying) return;
                
                currentYearIndex = (currentYearIndex + 1) % allYearsData.length;
                updateVisualization();
                updateYearControls();
                
                setTimeout(nextFrame, 2000); // 2 second delay between years
            }
            
            nextFrame();
        }
        
        // Event listeners
        d3.select("#year-slider").on("input", function() {
            const year = +this.value;
            currentYearIndex = allYearsData.findIndex(d => d.year === year);
            updateVisualization();
            updateYearControls();
        });
        
        d3.select("#play-animation").on("click", playEvolution);
        
        // Initialize
        initializeYearSummary();
        updateVisualization();
        updateYearControls();
    </script>
</body>
</html>`
}

/**
 * Main execution function
 */
function main(): void {
  console.log('🎨 Generating Multi-Year Country Clustering Visualization')

  try {
    const years = [2020, 2021, 2022, 2023, 2024]
    const allYearData: AnalysisResult[] = []

    // Read all year data
    for (const year of years) {
      const resultsPath = join(
        process.cwd(),
        'analysis',
        `country-clusters-${year}.json`
      )
      const resultsData = readFileSync(resultsPath, 'utf-8')
      const analysisResult: AnalysisResult = JSON.parse(resultsData)
      allYearData.push(analysisResult)
    }

    console.log(`✓ Loaded data for ${allYearData.length} years`)

    // Generate visualization
    const html = generateMultiYearVisualization(allYearData)

    // Save HTML file
    const outputPath = join(
      process.cwd(),
      'analysis',
      'country-clusters-evolution.html'
    )
    writeFileSync(outputPath, html)

    console.log(`✓ Multi-year visualization saved to ${outputPath}`)
    console.log(
      '\nOpen the HTML file in your browser to explore the 5-year diplomatic evolution!'
    )

    // Print summary
    console.log('\n📊 Multi-Year Analysis Summary:')
    allYearData.forEach((yearData) => {
      console.log(
        `   ${yearData.year}: ${yearData.metadata.totalCountries} countries, ${yearData.clusters.length} clusters`
      )
    })
  } catch (error) {
    console.error('❌ Multi-year visualization generation failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main }
