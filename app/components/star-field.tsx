import { useEffect, useRef } from 'react'

export default function StarField() {
  const starsRef = useRef<HTMLDivElement>(null)

  // Add stars to the background
  const addStars = () => {
    if (!starsRef.current) return

    const starsContainer = starsRef.current
    const STAR_COUNT = 100

    // Clear existing stars
    starsContainer.innerHTML = ''

    // Remove dark background - let page background show through
    starsContainer.style.background = 'transparent'

    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    for (let i = 0; i < STAR_COUNT; i++) {
      const star = document.createElement('div')
      star.className = 'star'
      const size = Math.random() * 2 + 1
      star.style.width = `${size}px`
      star.style.height = `${size}px`
      star.style.top = `${Math.random() * windowHeight}px`
      star.style.left = `${Math.random() * windowWidth}px`
      star.style.position = 'absolute'
      star.style.background = '#009edb' // UN light blue for subtle accent
      star.style.borderRadius = '50%'
      star.style.opacity = `${Math.random() * 0.3 + 0.1}` // Very subtle opacity for white background

      // Add twinkling animation with random duration and delay
      star.style.setProperty('--duration', `${2 + Math.random() * 3}s`) // 2-5 seconds
      star.style.setProperty('--delay', `${Math.random() * 3}s`) // 0-3 seconds delay

      starsContainer.appendChild(star)
    }
  }

  useEffect(() => {
    // Initialize stars
    addStars()

    // Re-add stars on window resize
    const handleResize = () => addStars()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return (
    <div
      ref={starsRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
      id="stars-container"
    />
  )
}
