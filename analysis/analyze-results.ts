import fs from 'fs'

const data = JSON.parse(
  fs.readFileSync(
    '/Users/koenvangilst/Code/un-speeches-v2/analysis/speech-similarity-2024.json',
    'utf8'
  )
)
const { speeches, similarities } = data

console.log('📊 2024 UN Speeches Similarity Analysis Results\n')

// Basic statistics
const allSimilarities: number[] = similarities
  .flat()
  .filter((sim: number) => sim < 1.0)
const avgSim =
  allSimilarities.reduce((a: number, b: number) => a + b, 0) /
  allSimilarities.length
const maxSim = Math.max(...allSimilarities)
const minSim = Math.min(...allSimilarities)

console.log(`📈 Overall Statistics:`)
console.log(`  Total speeches: ${speeches.length}`)
console.log(`  Average similarity: ${avgSim.toFixed(4)}`)
console.log(`  Maximum similarity: ${maxSim.toFixed(4)}`)
console.log(`  Minimum similarity: ${minSim.toFixed(4)}`)

// Find top similar pairs
const pairs = []
for (let i = 0; i < speeches.length; i++) {
  for (let j = i + 1; j < speeches.length; j++) {
    pairs.push({
      speech1: speeches[i],
      speech2: speeches[j],
      similarity: similarities[i][j],
    })
  }
}

const topPairs = pairs.sort((a, b) => b.similarity - a.similarity).slice(0, 10)
console.log(`\n🔝 Top 10 Most Similar Speech Pairs:`)
topPairs.forEach((pair, idx) => {
  console.log(
    `  ${idx + 1}. ${pair.speech1.country} ↔ ${pair.speech2.country} (${pair.similarity.toFixed(4)})`
  )
  console.log(`     ${pair.speech1.speaker} | ${pair.speech2.speaker}`)
})

// Find some interesting cross-continent pairs
const interestingPairs = pairs
  .filter(
    (p) =>
      (p.speech1.country === 'DEU' && p.speech2.country === 'GBR') ||
      (p.speech1.country === 'USA' && p.speech2.country === 'CHN') ||
      (p.speech1.country === 'RUS' && p.speech2.country === 'UKR') ||
      (p.speech1.country === 'ISR' && p.speech2.country === 'PSE')
  )
  .sort((a, b) => b.similarity - a.similarity)

console.log(`\n🌍 Some Notable Bilateral Similarities:`)
interestingPairs.forEach((pair) => {
  console.log(
    `  ${pair.speech1.country} ↔ ${pair.speech2.country}: ${pair.similarity.toFixed(4)}`
  )
})

console.log(
  `\n✅ Analysis complete! Open the HTML file to explore the interactive matrix.`
)
