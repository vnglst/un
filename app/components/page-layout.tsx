import { ReactNode } from 'react'
import Header from './header'
import Footer from './footer'

interface PageLayoutProps {
  children: ReactNode
  className?: string
  maxWidth?: 'default' | 'wide' | 'narrow'
}

export default function PageLayout({
  children,
  className = '',
  maxWidth = 'default',
}: PageLayoutProps) {
  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'narrow':
        return 'max-w-4xl'
      case 'wide':
        return 'max-w-7xl'
      case 'default':
      default:
        return 'max-w-6xl'
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 overflow-x-hidden">
      <Header />

      <main
        className={`flex-1 ${getMaxWidthClass()} w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 ${className}`}
      >
        {children}
      </main>

      <Footer />
    </div>
  )
}
