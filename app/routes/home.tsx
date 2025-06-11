import { useLoaderData, useNavigate, useSearchParams, Form } from 'react-router'
import {
  searchSpeeches,
  searchSpeechesWithHighlights,
  getSearchSuggestions,
  getCountries,
  getYears,
  getSessions,
  type HighlightedSpeech,
  type PaginationInfo,
  type SearchFilters,
} from '~/lib/database'
import { logger, timeAsyncOperation } from '~/lib/logger'
import Header from '~/components/header'
import Footer from '~/components/footer'
import SpeechCard from '~/components/speech-card'
import Pagination from '~/components/pagination'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Search as SearchIcon, Filter, X } from 'lucide-react'
import { useState, useEffect } from 'react'

type LoaderData = {
  speeches: HighlightedSpeech[]
  pagination: PaginationInfo
  countries: Array<{ country_name: string; country_code: string }>
  years: number[]
  sessions: number[]
  currentFilters: SearchFilters
  suggestions?: string[]
}

export function meta() {
  return [
    { title: 'UN Speeches' },
    {
      name: 'description',
      content: 'Browse UN General Assembly speeches.',
    },
  ]
}

export async function loader({
  request,
}: {
  request: Request
}): Promise<LoaderData> {
  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))

  logger.requestStart('GET', url.pathname, {
    searchParams: Object.fromEntries(url.searchParams),
    page,
  })

  return timeAsyncOperation('home-loader', async () => {
    // Extract search filters from URL parameters
    const filters: SearchFilters = {
      search: url.searchParams.get('q') || undefined,
      country: url.searchParams.get('country') || undefined,
      year: url.searchParams.get('year')
        ? parseInt(url.searchParams.get('year')!, 10)
        : undefined,
      session: url.searchParams.get('session')
        ? parseInt(url.searchParams.get('session')!, 10)
        : undefined,
      searchMode:
        (url.searchParams.get('mode') as 'exact' | 'phrase' | 'fuzzy') ||
        'phrase',
    }

    logger.info('Home loader filters', { filters, page })

    // Use highlighted search if there's a search term, otherwise regular search
    const result =
      filters.search && filters.search.trim()
        ? searchSpeechesWithHighlights(filters, page, 20)
        : {
            ...searchSpeeches(filters, page, 20),
            speeches: searchSpeeches(filters, page, 20)
              .speeches as HighlightedSpeech[],
          }

    const countries = getCountries()
    const years = getYears()
    const sessions = getSessions()

    // Get search suggestions if there's a partial search term
    const suggestions =
      filters.search && filters.search.trim().length >= 2
        ? getSearchSuggestions(filters.search, 5)
        : []

    logger.info('Home loader completed', {
      speechCount: result.speeches.length,
      totalResults: result.pagination.total,
      suggestionCount: suggestions.length,
      hasSearchTerm: !!filters.search,
    })

    return {
      ...result,
      countries,
      years,
      sessions,
      currentFilters: filters,
      suggestions,
    }
  })
}

export default function Home() {
  const {
    speeches,
    pagination,
    countries,
    years,
    sessions,
    currentFilters,
    suggestions,
  } = useLoaderData<LoaderData>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)

  // Local state for form inputs
  const [searchQuery, setSearchQuery] = useState(currentFilters.search || '')
  const [selectedCountry, setSelectedCountry] = useState(
    currentFilters.country || ''
  )
  const [selectedYear, setSelectedYear] = useState(
    currentFilters.year?.toString() || ''
  )
  const [selectedSession, setSelectedSession] = useState(
    currentFilters.session?.toString() || ''
  )
  const [searchMode, setSearchMode] = useState(
    currentFilters.searchMode || 'phrase'
  )
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Update local state when URL changes
  useEffect(() => {
    setSearchQuery(currentFilters.search || '')
    setSelectedCountry(currentFilters.country || '')
    setSelectedYear(currentFilters.year?.toString() || '')
    setSelectedSession(currentFilters.session?.toString() || '')
    setSearchMode(currentFilters.searchMode || 'phrase')
  }, [currentFilters])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim())
      if (searchMode !== 'phrase') {
        params.set('mode', searchMode)
      }
    }
    if (selectedCountry) params.set('country', selectedCountry)
    if (selectedYear) params.set('year', selectedYear)
    if (selectedSession) params.set('session', selectedSession)

    navigate(`/?${params.toString()}`)
    setShowSuggestions(false)
  }

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', page.toString())
    navigate(`/?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedCountry('')
    setSelectedYear('')
    setSelectedSession('')
    setSearchMode('phrase')
    setShowSuggestions(false)
    navigate('/')
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion)
    setShowSuggestions(false)
    // Trigger search with the suggestion
    const params = new URLSearchParams()
    params.set('q', suggestion)
    if (searchMode !== 'phrase') {
      params.set('mode', searchMode)
    }
    if (selectedCountry) params.set('country', selectedCountry)
    if (selectedYear) params.set('year', selectedYear)
    if (selectedSession) params.set('session', selectedSession)
    navigate(`/?${params.toString()}`)
  }

  const hasActiveFilters =
    currentFilters.search ||
    currentFilters.country ||
    currentFilters.year ||
    currentFilters.session

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-black mb-2">Speeches</h1>
        </div>

        {/* Search Form */}
        <div className="border border-gray-200 rounded p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
          <Form onSubmit={handleSearch} className="space-y-4">
            {/* Main search input with suggestions */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search speeches, speakers, or countries..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setShowSuggestions(e.target.value.length >= 2)
                }}
                onFocus={() => setShowSuggestions(searchQuery.length >= 2)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              />

              {/* Search suggestions dropdown */}
              {showSuggestions && suggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-sm">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-2 text-gray-900 hover:bg-gray-50 first:rounded-t last:rounded-b"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Search mode selector */}
            {searchQuery.trim() && (
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-600">Search mode:</span>
                <div className="flex space-x-2">
                  {[
                    {
                      value: 'phrase',
                      label: 'Phrase',
                      description: 'Find phrases',
                    },
                    {
                      value: 'exact',
                      label: 'Exact',
                      description: 'Exact matches only',
                    },
                    {
                      value: 'fuzzy',
                      label: 'Any words',
                      description: 'Find any of these words',
                    },
                  ].map((mode) => (
                    <label
                      key={mode.value}
                      className="flex items-center space-x-1 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="searchMode"
                        value={mode.value}
                        checked={searchMode === mode.value}
                        onChange={(e) =>
                          setSearchMode(
                            e.target.value as 'exact' | 'phrase' | 'fuzzy'
                          )
                        }
                        className="text-black focus:ring-black"
                      />
                      <span className="text-gray-600" title={mode.description}>
                        {mode.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Advanced filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => setSelectedCountry(e.target.value)}
                    className="w-full h-9 rounded border border-gray-300 bg-white text-gray-900 px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">All countries</option>
                    {countries.map((country) => (
                      <option
                        key={country.country_code}
                        value={country.country_code}
                      >
                        {country.country_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="w-full h-9 rounded border border-gray-300 bg-white text-gray-900 px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">All years</option>
                    {years.map((year) => (
                      <option key={year} value={year.toString()}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session
                  </label>
                  <select
                    value={selectedSession}
                    onChange={(e) => setSelectedSession(e.target.value)}
                    className="w-full h-9 rounded border border-gray-300 bg-white text-gray-900 px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">All sessions</option>
                    {sessions.map((session) => (
                      <option key={session} value={session.toString()}>
                        Session {session}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-4">
              <div className="flex space-x-2">
                <Button type="submit" variant="primary">
                  <SearchIcon className="h-4 w-4 mr-2" />
                  Search
                </Button>
                {hasActiveFilters && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={clearFilters}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="h-4 w-4 mr-2" />
                      {showFilters ? 'Hide' : 'Show'} Filters
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Form>
        </div>

        {/* Results */}
        <div className="mb-6">
          <p className="text-gray-600 text-sm">
            {pagination.total} {pagination.total === 1 ? 'result' : 'results'}
          </p>

          {/* Active filters display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-3">
              {currentFilters.search && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-black text-white">
                  {currentFilters.searchMode === 'exact' && 'Exact: '}
                  {currentFilters.searchMode === 'fuzzy' && 'Any words: '}
                  {currentFilters.searchMode === 'phrase' && 'Text: '}"
                  {currentFilters.search}"
                </span>
              )}
              {currentFilters.country && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-black text-white">
                  Country:{' '}
                  {countries.find(
                    (c) => c.country_code === currentFilters.country
                  )?.country_name || currentFilters.country}
                </span>
              )}
              {currentFilters.year && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-black text-white">
                  Year: {currentFilters.year}
                </span>
              )}
              {currentFilters.session && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-black text-white">
                  Session: {currentFilters.session}
                </span>
              )}
            </div>
          )}
        </div>

        {speeches.length === 0 ? (
          <div className="text-center py-12">
            <SearchIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg mb-2">
              {hasActiveFilters
                ? 'No speeches match your search criteria'
                : 'No speeches found'}
            </p>
            <p className="text-gray-500">
              {hasActiveFilters
                ? 'Try adjusting your filters or search terms'
                : 'Something went wrong loading the speeches'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {speeches.map((speech: HighlightedSpeech) => (
                <SpeechCard
                  key={speech.id}
                  speech={speech}
                  highlighted={!!currentFilters.search}
                />
              ))}
            </div>

            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
