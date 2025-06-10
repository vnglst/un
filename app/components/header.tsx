import { Link, useLocation } from 'react-router'
import { Globe, Search, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()

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
    const baseClass = 'flex items-center space-x-1 text-sm'
    const activeClass = 'text-black font-medium'
    const hoverClass = 'text-gray-600 hover:text-black'

    return isActive(path)
      ? `${baseClass} ${activeClass}`
      : `${baseClass} ${hoverClass}`
  }

  const getMobileNavLinkClass = (path: string) => {
    const baseClass = 'flex items-center space-x-2 px-4 py-3 text-sm'
    const activeClass = 'text-black font-medium'
    const hoverClass = 'text-gray-600 hover:text-black'

    return isActive(path)
      ? `${baseClass} ${activeClass}`
      : `${baseClass} ${hoverClass}`
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and title */}
          <div className="flex items-center space-x-3">
            <Globe className="h-6 w-6 text-gray-900" />
            <Link
              to="/"
              className="text-lg font-medium text-black hidden sm:block"
            >
              UN General Assembly Speeches
            </Link>
            <Link to="/" className="text-lg font-medium text-black sm:hidden">
              UN Speeches
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className={getNavLinkClass('/')}>
              <Search className="h-4 w-4" />
              <span>Browse</span>
            </Link>
            <Link to="/globe" className={getNavLinkClass('/globe')}>
              <Globe className="h-4 w-4" />
              <span>Globe</span>
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden flex items-center justify-center w-8 h-8 text-gray-600 hover:text-black"
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
          <div className="md:hidden border-t border-gray-200">
            <nav className="py-4 space-y-1">
              <Link
                to="/"
                className={getMobileNavLinkClass('/')}
                onClick={() => setIsMenuOpen(false)}
              >
                <Search className="h-4 w-4" />
                <span>Browse</span>
              </Link>
              <Link
                to="/globe"
                className={getMobileNavLinkClass('/globe')}
                onClick={() => setIsMenuOpen(false)}
              >
                <Globe className="h-4 w-4" />
                <span>Globe</span>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
