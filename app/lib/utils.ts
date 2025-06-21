import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Highlights overlapping text between consecutive chunks by making overlapping parts light grey
 */
export function highlightOverlappingText(
  currentText: string,
  previousText: string | null
): string {
  if (!previousText) return currentText

  // Find the longest common substring that appears at the end of previous text
  // and at the beginning of current text
  const overlap = findTextOverlap(previousText, currentText)
  
  if (!overlap || overlap.length < 10) return currentText // Only highlight if overlap is significant

  // Escape special regex characters and create pattern
  const escapedOverlap = overlap.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  
  // Replace the overlapping part at the beginning of current text with gradient version
  const regex = new RegExp(`^(\\s*)(${escapedOverlap})`, 'i')
  const highlightedText = currentText.replace(
    regex,
    `$1<span class="bg-gradient-to-r from-white via-gray-300 to-gray-500 bg-clip-text text-transparent">$2</span>`
  )

  return highlightedText
}

/**
 * Find overlapping text between the end of previous text and beginning of current text
 */
function findTextOverlap(previousText: string, currentText: string): string {
  const prevTrimmed = previousText.trim()
  const currTrimmed = currentText.trim()
  
  let maxOverlap = ''
  
  // Try different lengths of overlap, starting from a reasonable minimum
  const minOverlapLength = 10
  const maxOverlapLength = Math.min(prevTrimmed.length, currTrimmed.length, 500)
  
  for (let len = maxOverlapLength; len >= minOverlapLength; len--) {
    const endOfPrevious = prevTrimmed.slice(-len)
    const startOfCurrent = currTrimmed.slice(0, len)
    
    // Check for exact match (case insensitive)
    if (endOfPrevious.toLowerCase() === startOfCurrent.toLowerCase()) {
      maxOverlap = startOfCurrent
      break
    }
    
    // Check for word-boundary aligned overlap to avoid cutting words in half
    const words = endOfPrevious.split(/\s+/)
    if (words.length > 1) {
      // Try removing the first word (which might be partial) and check again
      const wordAlignedEnd = words.slice(1).join(' ')
      if (wordAlignedEnd.length >= minOverlapLength) {
        const correspondingStart = currTrimmed.slice(0, wordAlignedEnd.length)
        if (wordAlignedEnd.toLowerCase() === correspondingStart.toLowerCase()) {
          maxOverlap = correspondingStart
          break
        }
      }
    }
  }
  
  return maxOverlap
}
