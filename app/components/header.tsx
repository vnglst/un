import { Link, useLocation } from 'react-router'
import { Globe, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { useAppContext } from '~/lib/app-context'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const { ragAvailable } = useAppContext()

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  const getNavLinkClass = (path: string) => {
    const baseClass = 'text-sm font-medium transition-colors duration-200'
    const activeClass = 'text-[#009edb] border-b-2 border-[#009edb] pb-1'
    const hoverClass = 'text-gray-700 hover:text-[#009edb]'

    return isActive(path)
      ? `${baseClass} ${activeClass}`
      : `${baseClass} ${hoverClass}`
  }

  const getMobileNavLinkClass = (path: string) => {
    const baseClass =
      'block px-4 py-3 text-sm font-medium transition-colors duration-200'
    const activeClass = 'text-[#009edb] bg-[#009edb]/10'
    const hoverClass = 'text-gray-700 hover:text-[#009edb] hover:bg-gray-50'

    return isActive(path)
      ? `${baseClass} ${activeClass}`
      : `${baseClass} ${hoverClass}`
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and title */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Globe className="h-8 w-8 text-gray-600" />
              <Link
                to="/"
                className="text-2xl font-bold text-gray-900 tracking-tight"
              >
                UN SPEECHES
              </Link>
            </div>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className={getNavLinkClass('/')}>
              Browse
            </Link>
            <Link to="/analysis" className={getNavLinkClass('/analysis')}>
              Analysis
            </Link>
            <Link to="/globe" className={getNavLinkClass('/globe')}>
              Globe
            </Link>
            {ragAvailable && (
              <Link to="/rag" className={getNavLinkClass('/rag')}>
                AI Chat
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden flex items-center justify-center w-8 h-8 text-gray-600 hover:text-[#009edb] transition-colors duration-200"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-gray-50">
            <nav className="py-2">
              <Link
                to="/"
                className={getMobileNavLinkClass('/')}
                onClick={() => setIsMenuOpen(false)}
              >
                Browse
              </Link>
              <Link
                to="/analysis"
                className={getMobileNavLinkClass('/analysis')}
                onClick={() => setIsMenuOpen(false)}
              >
                Analysis
              </Link>
              <Link
                to="/globe"
                className={getMobileNavLinkClass('/globe')}
                onClick={() => setIsMenuOpen(false)}
              >
                Globe
              </Link>
              {ragAvailable && (
                <Link
                  to="/rag"
                  className={getMobileNavLinkClass('/rag')}
                  onClick={() => setIsMenuOpen(false)}
                >
                  AI Chat
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
