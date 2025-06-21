# UN Speeches 2024 - Speech-to-Speech Similarity Analysis

This folder contains the speech similarity matrix analysis for UN General Assembly 2024 speeches.

## Files

- **`speech-similarity-matrix-2024.ts`** - Main analysis script that computes pairwise similarities between speeches from 40 selected countries
- **`speech-similarity-2024.json`** - Generated similarity data (40x40 matrix with speech metadata)
- **`speech-similarity-matrix-2024.html`** - Interactive visualization of the similarity matrix

## How to Run

```bash
# Generate the similarity matrix
npm run analysis:speech-similarity

# Open the visualization
open analysis/speech-similarity-matrix-2024.html
```

## Analysis Overview

This analysis:

1. **Selects 40 representative countries** from major powers, different regions, and diplomatically interesting cases
2. **Computes pairwise cosine similarity** between speech embeddings (using the first chunk of each speech)
3. **Generates an interactive heatmap** showing similarity patterns between countries

## Selected Countries

The analysis focuses on 40 countries including:

- **Major Powers**: USA, CHN, RUS, GBR, FRA, DEU, JPN, IND
- **Regional Representatives**: BRA, CAN, AUS, KOR, ITA, ESP, NLD
- **Diplomatic Interest**: ISR, PSE, UKR, TUR, IRN, SAU, EGY
- **African Nations**: ZAF, NGA, KEN, ETH, GHA, SEN, RWA, AGO
- **Latin America**: ARG, MEX, CHL, COL, PER, VEN
- **Nordic Countries**: NOR, SWE, DNK, FIN

## Key Findings

From the 2024 analysis:

- **Highest similarity**: Germany ↔ UK (0.7883)
- **Nordic cluster**: Norway-Sweden very similar (0.7868)
- **Cross-regional patterns**: India-Kenya, Denmark-Palestine showing unexpected similarities
- **Average similarity**: ~0.77 across all pairs

## Visualization Features

The interactive matrix allows you to:

- **Adjust similarity threshold** to filter out lower similarities
- **Change cell size** for better readability
- **Hover for details** showing country pairs, speakers, and similarity scores
- **Dynamic color scale** based on actual data range for optimal contrast

## Technical Notes

- Uses sqlite-vec extension for efficient embedding retrieval
- Embeddings are 1536-dimensional vectors from OpenAI's text-embedding-3-small model
- Analysis processes ~40 countries in under 30 seconds
- Color scale dynamically adjusts to data range (0.756-0.788) for better visual contrast
