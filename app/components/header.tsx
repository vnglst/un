import { Link, useLocation } from 'react-router'
import { Globe, Search, Menu, X, MessageSquare } from 'lucide-react'
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
    const baseClass =
      'flex items-center space-x-1 text-sm drop-shadow-sm transition-all duration-200'
    const activeClass =
      'text-white font-medium bg-white/20 px-3 py-2 rounded-lg backdrop-blur-sm'
    const hoverClass =
      'text-white/90 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg'

    return isActive(path)
      ? `${baseClass} ${activeClass}`
      : `${baseClass} ${hoverClass}`
  }

  const getMobileNavLinkClass = (path: string) => {
    const baseClass =
      'flex items-center space-x-2 px-4 py-3 text-sm transition-all duration-200'
    const activeClass = 'text-white font-medium bg-white/20 backdrop-blur-sm'
    const hoverClass = 'text-white/90 hover:text-white hover:bg-white/10'

    return isActive(path)
      ? `${baseClass} ${activeClass}`
      : `${baseClass} ${hoverClass}`
  }

  return (
    <header className="border-b border-[#009edb]/30 bg-gradient-to-r from-[#009edb] to-[#009edb]/95 shadow-lg relative overflow-hidden">
      {/* Glossy overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/5 pointer-events-none"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex items-center justify-between h-16">
          {/* Logo and title */}
          <div className="flex items-center space-x-3">
            <Globe className="h-6 w-6 text-white drop-shadow-sm" />
            <Link
              to="/"
              className="text-lg font-medium text-white drop-shadow-sm"
            >
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
            <Link to="/rag" className={getNavLinkClass('/rag')}>
              <MessageSquare className="h-4 w-4" />
              <span>RAG Chat</span>
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden flex items-center justify-center w-8 h-8 text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
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
          <div className="md:hidden border-t border-white/20 bg-black/10 backdrop-blur-sm">
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
              <Link
                to="/rag"
                className={getMobileNavLinkClass('/rag')}
                onClick={() => setIsMenuOpen(false)}
              >
                <MessageSquare className="h-4 w-4" />
                <span>RAG Chat</span>
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
