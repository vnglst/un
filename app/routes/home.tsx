import {
  useLoaderData,
  useNavigate,
  useSearchParams,
  Form,
  Link,
} from 'react-router'
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
import PageLayout from '~/components/page-layout'
import SpeechCard from '~/components/speech-card'
import Pagination from '~/components/pagination'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { ServiceCard } from '~/components/ui/cards'
import {
  Search as SearchIcon,
  Filter,
  X,
  Calendar,
  Globe,
  MessageCircle,
} from 'lucide-react'
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

  // Get unique countries count
  const uniqueCountries = new Set(countries.map((c) => c.country_code))
  const memberStatesCount = uniqueCountries.size

  return (
    <PageLayout className="space-y-0 py-0">
      {/* Breadcrumb Navigation */}
      <div className="py-4">
        <div className="flex items-center text-sm text-gray-600">
          <span className="text-gray-900 font-medium">HOME</span>
          <span className="mx-2">&gt;</span>
          <span className="text-gray-900 font-medium">BROWSING</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          UN SPEECHES BROWSING
        </h1>
        <p className="text-lg text-gray-700 mb-6 max-w-4xl">
          Browse speeches from {memberStatesCount} member states of the United
          Nations General Assembly. Our comprehensive database provides access
          to diplomatic discourse, policy positions, and international
          perspectives on global challenges.
        </p>
      </div>

      {/* Three-Column Service Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {/* By Year */}
        <ServiceCard
          title="Browse by Year"
          description={`Explore speeches chronologically from ${Math.min(...years)} to ${Math.max(...years)}. Analyze how diplomatic discourse has evolved over decades of international relations.`}
          icon={<Calendar className="h-4 w-4 text-gray-600" />}
        >
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Recent Years:</div>
            <div className="flex flex-wrap gap-2">
              {years.slice(-6).map((year) => (
                <Link
                  key={year}
                  to={`/year/${year}`}
                  className="px-3 py-1 text-xs bg-un-blue text-white rounded hover:bg-un-blue/90 transition-colors"
                >
                  {year}
                </Link>
              ))}
            </div>
          </div>
        </ServiceCard>

        {/* By Country */}
        <ServiceCard
          title="Browse by Country"
          description={`Access speeches from all ${memberStatesCount} member states. Understand diverse national perspectives on international issues and global governance.`}
          icon={<Globe className="h-4 w-4 text-gray-600" />}
        >
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Featured Countries:</div>
            <div className="flex flex-wrap gap-2">
              {countries.slice(0, 4).map((country) => (
                <Link
                  key={country.country_code}
                  to={`/country/${country.country_code}`}
                  className="px-3 py-1 text-xs bg-un-blue text-white rounded hover:bg-un-blue/90 transition-colors"
                  title={country.country_name}
                >
                  {country.country_code}
                </Link>
              ))}
            </div>
          </div>
        </ServiceCard>

        {/* By Topic */}
        <ServiceCard
          title="Search by Topic"
          description="Find speeches covering climate change, peacekeeping, development, human rights, and other critical global issues through our advanced search capabilities."
          icon={<MessageCircle className="h-4 w-4 text-gray-600" />}
        >
          <div className="space-y-2">
            <div className="text-xs text-gray-500">Popular Topics:</div>
            <div className="flex flex-wrap gap-2">
              {['Climate', 'Peace', 'Development', 'Human Rights'].map(
                (topic) => (
                  <button
                    key={topic}
                    onClick={() => {
                      setSearchQuery(topic)
                      const params = new URLSearchParams()
                      params.set('q', topic)
                      navigate(`/?${params.toString()}`)
                    }}
                    className="px-3 py-1 text-xs bg-un-blue text-white rounded hover:bg-un-blue/90 transition-colors"
                  >
                    {topic}
                  </button>
                )
              )}
            </div>
          </div>
        </ServiceCard>
      </div>

      {/* Search Interface */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Search UN Speeches
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="text-un-blue hover:bg-un-blue/10"
          >
            <Filter className="h-4 w-4 mr-2" />
            {showFilters ? 'Hide' : 'Show'} Advanced Filters
          </Button>
        </div>

        <Form onSubmit={handleSearch} className="space-y-6">
          {/* Main search input with suggestions */}
          <div className="relative">
            <Input
              type="text"
              placeholder="Search speeches, speakers, countries, or topics..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSuggestions(e.target.value.length >= 2)
              }}
              onFocus={() => setShowSuggestions(searchQuery.length >= 2)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="bg-white border-gray-300 text-gray-900 placeholder-gray-500 h-12 text-lg"
            />

            {/* Search suggestions dropdown */}
            {showSuggestions && suggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-3 text-gray-900 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search mode selector */}
          {searchQuery.trim() && (
            <div className="flex items-center space-x-4 text-sm bg-gray-50 p-4 rounded-lg">
              <span className="text-gray-700 font-medium">Search mode:</span>
              <div className="flex space-x-4">
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
                    className="flex items-center space-x-2 cursor-pointer"
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
                      className="text-un-blue focus:ring-un-blue"
                    />
                    <span className="text-gray-700" title={mode.description}>
                      {mode.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Advanced filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-gray-200 bg-gray-50 p-6 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-un-blue focus:border-transparent"
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
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-un-blue focus:border-transparent"
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
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-un-blue focus:border-transparent"
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
            <div className="flex space-x-3">
              <Button
                type="submit"
                className="bg-un-blue hover:bg-un-blue/90 text-white px-6 py-2"
              >
                <SearchIcon className="h-4 w-4 mr-2" />
                Search Speeches
              </Button>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>
          </div>
        </Form>
      </div>

      {/* Results Section */}
      {hasActiveFilters && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Search Results
              </h2>
              <p className="text-gray-600">
                {pagination.total}{' '}
                {pagination.total === 1 ? 'result' : 'results'} found
              </p>
            </div>
          </div>

          {/* Active filters display */}
          <div className="flex flex-wrap gap-2 mb-6">
            {currentFilters.search && (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-un-blue text-white">
                {currentFilters.searchMode === 'exact' && 'Exact: '}
                {currentFilters.searchMode === 'fuzzy' && 'Any words: '}
                {currentFilters.searchMode === 'phrase' && 'Text: '}"
                {currentFilters.search}"
              </span>
            )}
            {currentFilters.country && (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-un-blue text-white">
                Country:{' '}
                {countries.find(
                  (c) => c.country_code === currentFilters.country
                )?.country_name || currentFilters.country}
              </span>
            )}
            {currentFilters.year && (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-un-blue text-white">
                Year: {currentFilters.year}
              </span>
            )}
            {currentFilters.session && (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm bg-un-blue text-white">
                Session: {currentFilters.session}
              </span>
            )}
          </div>

          {speeches.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
              <SearchIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">
                No speeches match your search criteria
              </p>
              <p className="text-gray-500">
                Try adjusting your filters or search terms
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
        </div>
      )}

      {/* Large Featured Content Block */}
      <div className="bg-gradient-to-r from-un-blue to-un-blue/90 rounded-lg p-12 text-white mb-16">
        <div className="max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="flex items-center mb-4">
                <span className="text-white/90 text-sm font-medium">01</span>
                <span className="ml-4 text-white/90">
                  Comprehensive Collection
                </span>
              </div>
              <div className="flex items-center mb-4">
                <span className="text-white/90 text-sm font-medium">02</span>
                <span className="ml-4 text-white/90">Advanced Search</span>
              </div>
              <div className="flex items-center mb-6">
                <span className="text-white/90 text-sm font-medium">03</span>
                <span className="ml-4 text-white/90">Diplomatic Insights</span>
              </div>

              <p className="text-sm text-white/80 mb-6 italic">
                Engineered for Diplomacy. Built for Research.
              </p>

              <h3 className="text-2xl font-bold mb-4">
                ALL SPEECHES ARE SOURCED FROM OFFICIAL UN GENERAL ASSEMBLY
                RECORDS
              </h3>

              <div className="flex items-center justify-between">
                <span className="text-white/90 text-sm">
                  UN Documentation Center
                </span>
                <span className="text-white/90 text-sm">2024</span>
              </div>
            </div>

            <div className="lg:pl-8">
              <div className="bg-white/10 rounded-lg p-6 backdrop-blur-sm">
                <h4 className="text-lg font-bold mb-4">Quick Statistics</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-white/90">Total Speeches:</span>
                    <span className="font-bold">
                      {pagination.total?.toLocaleString() || 'Loading...'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/90">Member States:</span>
                    <span className="font-bold">{memberStatesCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/90">Years Covered:</span>
                    <span className="font-bold">
                      {Math.min(...years)} - {Math.max(...years)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/90">Sessions:</span>
                    <span className="font-bold">{sessions.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
