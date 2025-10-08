import { Link } from 'react-router'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  baseUrl: string
  queryParams?: Record<string, string>
}

export default function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  queryParams = {},
}: PaginationProps) {
  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(queryParams)
    if (page > 1) {
      params.set('page', page.toString())
    } else {
      params.delete('page')
    }
    const queryString = params.toString()
    return queryString ? `${baseUrl}?${queryString}` : baseUrl
  }

  const getPageNumbers = () => {
    const delta = 1 // Show 1 page on each side of current
    const range = []
    const rangeWithDots = []

    // Always show first page
    rangeWithDots.push(1)

    // Calculate the range around current page
    const rangeStart = Math.max(2, currentPage - delta)
    const rangeEnd = Math.min(totalPages - 1, currentPage + delta)

    // Add dots after first page if needed
    if (rangeStart > 2) {
      rangeWithDots.push('...')
    }

    // Add pages around current page
    for (let i = rangeStart; i <= rangeEnd; i++) {
      range.push(i)
    }
    rangeWithDots.push(...range)

    // Add dots before last page if needed
    if (rangeEnd < totalPages - 1) {
      rangeWithDots.push('...')
    }

    // Always show last page if there's more than 1 page
    if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-1 mt-8 mb-4">
      {/* Previous Button */}
      {currentPage > 1 ? (
        <Link
          to={buildPageUrl(currentPage - 1)}
          className="flex items-center justify-center w-9 h-9 rounded hover:bg-gray-100 transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5 text-un-blue" />
        </Link>
      ) : (
        <div className="flex items-center justify-center w-9 h-9 rounded cursor-not-allowed">
          <ChevronLeft className="h-5 w-5 text-gray-300" />
        </div>
      )}

      {/* Page Numbers */}
      {getPageNumbers().map((page, index) => (
        <div key={index}>
          {page === '...' ? (
            <span className="flex items-center justify-center w-9 h-9 text-gray-500">
              ...
            </span>
          ) : (
            <Link
              to={buildPageUrl(page as number)}
              className={`
                flex items-center justify-center w-9 h-9 rounded font-medium text-sm transition-colors
                ${
                  currentPage === page
                    ? 'bg-un-blue text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }
              `}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? 'page' : undefined}
            >
              {page}
            </Link>
          )}
        </div>
      ))}

      {/* Next Button */}
      {currentPage < totalPages ? (
        <Link
          to={buildPageUrl(currentPage + 1)}
          className="flex items-center justify-center w-9 h-9 rounded hover:bg-gray-100 transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5 text-un-blue" />
        </Link>
      ) : (
        <div className="flex items-center justify-center w-9 h-9 rounded cursor-not-allowed">
          <ChevronRight className="h-5 w-5 text-gray-300" />
        </div>
      )}
    </div>
  )
}
