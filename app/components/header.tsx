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
    const baseClass = 'flex items-center space-x-1 transition-colors'
    const activeClass = 'text-white font-semibold'
    const hoverClass = 'hover:text-un-light-blue'

    return isActive(path)
      ? `${baseClass} ${activeClass}`
      : `${baseClass} ${hoverClass}`
  }

  const getMobileNavLinkClass = (path: string) => {
    const baseClass = 'flex items-center space-x-2 px-4 py-2 transition-colors'
    const activeClass =
      'bg-white/10 text-white font-semibold border-l-4 border-white'
    const hoverClass = 'hover:bg-un-dark-blue'

    return isActive(path)
      ? `${baseClass} ${activeClass}`
      : `${baseClass} ${hoverClass}`
  }

  return (
    <header className="bg-un-blue text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and title */}
          <div className="flex items-center space-x-2">
            <Globe className="h-8 w-8" />
            <Link to="/" className="text-xl font-bold hidden sm:block">
              UN General Assembly Speeches
            </Link>
            <Link to="/" className="text-lg font-bold sm:hidden">
              UN Speeches
            </Link>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex space-x-6">
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
            className="md:hidden flex items-center justify-center w-8 h-8 hover:text-un-light-blue transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-un-dark-blue">
            <nav className="py-4 space-y-2">
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
