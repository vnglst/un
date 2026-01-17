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
  searchSpeechesWithEmbeddings,
  type HighlightedSpeech,
  type SpeechWithSimilarity,
  type PaginationInfo,
  type SearchFilters,
} from '~/lib/database'
import { logger, timeAsyncOperation } from '~/lib/logger'
import SpeechCard from '~/components/speech-card'
import Pagination from '~/components/pagination'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Search as SearchIcon, Filter, X } from 'lucide-react'
import { useState } from 'react'

type LoaderData = {
  speeches: (HighlightedSpeech | SpeechWithSimilarity)[]
  pagination: PaginationInfo
  currentFilters: SearchFilters
  hasSearched: boolean
  isSemanticSearch: boolean
}

export function meta() {
  return [
    { title: 'UN Speeches' },
    {
      name: 'description',
      content: 'Search UN General Assembly speeches.',
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
        (url.searchParams.get('mode') as
          | 'exact'
          | 'phrase'
          | 'fuzzy'
          | 'semantic') || 'phrase',
    }

    const hasSearched = !!(
      filters.search ||
      filters.country ||
      filters.year ||
      filters.session
    )

    logger.info('Home loader filters', { filters, page })

    const isSemanticSearch = filters.searchMode === 'semantic'

    // Use semantic search if mode is 'semantic' and there's a search term
    let result
    if (isSemanticSearch && filters.search && filters.search.trim()) {
      result = await searchSpeechesWithEmbeddings(filters, page, 20)
    } else if (filters.search && filters.search.trim()) {
      result = searchSpeechesWithHighlights(filters, page, 20)
    } else {
      const regularResult = searchSpeeches(filters, page, 20)
      result = {
        ...regularResult,
        speeches: regularResult.speeches as HighlightedSpeech[],
      }
    }

    return {
      speeches: result.speeches,
      pagination: result.pagination,
      currentFilters: filters,
      hasSearched,
      isSemanticSearch,
    }
  })
}

export default function Home() {
  const {
    speeches,
    pagination,
    currentFilters,
    hasSearched,
    isSemanticSearch,
  } = useLoaderData<LoaderData>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [showFilters, setShowFilters] = useState(false)
  const [searchValue, setSearchValue] = useState(currentFilters.search || '')

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const params = new URLSearchParams()

    const query = formData.get('q') as string
    if (query?.trim()) {
      params.set('q', query.trim())
    }

    const country = formData.get('country') as string
    if (country && country !== 'all') {
      params.set('country', country)
    }

    const year = formData.get('year') as string
    if (year && year !== 'all') {
      params.set('year', year)
    }

    const session = formData.get('session') as string
    if (session && session !== 'all') {
      params.set('session', session)
    }

    const mode = formData.get('mode') as string
    if (mode && mode !== 'phrase') {
      params.set('mode', mode)
    }

    navigate(`/?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchValue('')
    navigate('/')
  }

  const hasActiveFilters = !!(
    currentFilters.search ||
    currentFilters.country ||
    currentFilters.year ||
    currentFilters.session
  )

  // Show Google-style landing page if no search has been performed
  if (!hasSearched) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <div className="w-full max-w-2xl">
          {/* Logo */}
          <div className="absolute top-0 right-0 p-6 flex gap-6">
            <Link
              to="/research"
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Research
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-2">
              UN Speeches
            </h1>
            <p className="text-gray-600">Search UN General Assembly speeches</p>
          </div>

          {/* Search Form */}
          <Form method="get" onSubmit={handleSearch}>
            <div className="relative mb-8">
              <div className="flex items-center w-full h-12 rounded-full border border-gray-300 hover:shadow-lg focus-within:shadow-lg transition-all bg-white">
                <SearchIcon className="h-5 w-5 text-gray-400 ml-5 flex-shrink-0" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search speeches..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="flex-1 h-full border-0 focus:ring-0 focus:outline-none px-4 text-base bg-transparent rounded-full"
                  autoFocus
                />
                {searchValue && (
                  <button
                    type="button"
                    onClick={() => setSearchValue('')}
                    className="mr-5 text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-3 mb-8">
              <Button
                type="submit"
                className="bg-un-blue hover:bg-un-blue/90 text-white px-6 sm:px-8 py-2.5 text-sm font-medium"
              >
                Search Speeches
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="border-gray-300 px-4 sm:px-6 py-2.5 text-sm font-medium"
              >
                <Filter className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Advanced Filters</span>
                <span className="sm:hidden">Filters</span>
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="bg-gray-50 rounded-lg p-4 sm:p-6 mb-4">
                <h3 className="font-semibold mb-4 text-gray-900">
                  Advanced Filters
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Mode
                    </label>
                    <select
                      name="mode"
                      defaultValue="phrase"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-un-blue focus:ring-un-blue"
                    >
                      <option value="phrase">Phrase Match</option>
                      <option value="exact">Exact Match</option>
                      <option value="fuzzy">Fuzzy Match</option>
                      <option value="semantic">Semantic Search (AI)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year
                    </label>
                    <input
                      type="number"
                      name="year"
                      placeholder="e.g., 2020"
                      min="1946"
                      max="2024"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-un-blue focus:ring-un-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session
                    </label>
                    <input
                      type="number"
                      name="session"
                      placeholder="e.g., 75"
                      min="1"
                      max="100"
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-un-blue focus:ring-un-blue"
                    />
                  </div>
                </div>
              </div>
            )}
          </Form>
        </div>
      </div>
    )
  }

  // Show results page
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Desktop Layout */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link
              to="/"
              className="text-lg font-bold text-gray-900 hover:text-un-blue whitespace-nowrap flex-shrink-0"
            >
              UN Speeches
            </Link>

            <Link
              to="/research"
              className="hidden md:block text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Research
            </Link>

            <Form
              method="get"
              onSubmit={handleSearch}
              className="flex-1 max-w-3xl"
            >
              <div className="flex items-center h-11 rounded-full border border-gray-300 hover:shadow-md focus-within:shadow-md transition-all bg-white">
                <SearchIcon className="h-4 w-4 text-gray-400 ml-4 flex-shrink-0" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search speeches..."
                  defaultValue={currentFilters.search}
                  className="flex-1 h-full border-0 focus:ring-0 focus:outline-none px-3 text-sm bg-transparent rounded-full"
                />
                <input
                  type="hidden"
                  name="country"
                  value={currentFilters.country || ''}
                />
                <input
                  type="hidden"
                  name="year"
                  value={currentFilters.year || ''}
                />
                <input
                  type="hidden"
                  name="session"
                  value={currentFilters.session || ''}
                />
                <input
                  type="hidden"
                  name="mode"
                  value={currentFilters.searchMode}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="mr-1 bg-un-blue hover:bg-un-blue/90 text-white h-9 px-5 text-sm font-medium rounded-full"
                >
                  Search
                </Button>
              </div>
            </Form>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span className="hidden lg:inline">Filters</span>
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden lg:inline">Clear</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-3">
            <div className="flex items-center justify-between">
              <Link
                to="/"
                className="text-lg font-bold text-gray-900 hover:text-un-blue"
              >
                UN Speeches
              </Link>
              <Link
                  to="/research"
                  className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                  Research
                </Link>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <Filter className="h-4 w-4" />
                </button>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <Form method="get" onSubmit={handleSearch}>
              <div className="flex items-center h-11 rounded-full border border-gray-300 hover:shadow-md focus-within:shadow-md transition-all bg-white">
                <SearchIcon className="h-4 w-4 text-gray-400 ml-4 flex-shrink-0" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search speeches..."
                  defaultValue={currentFilters.search}
                  className="flex-1 h-full border-0 focus:ring-0 focus:outline-none px-3 text-sm bg-transparent rounded-full"
                />
                <input
                  type="hidden"
                  name="country"
                  value={currentFilters.country || ''}
                />
                <input
                  type="hidden"
                  name="year"
                  value={currentFilters.year || ''}
                />
                <input
                  type="hidden"
                  name="session"
                  value={currentFilters.session || ''}
                />
                <input
                  type="hidden"
                  name="mode"
                  value={currentFilters.searchMode}
                />
                <Button
                  type="submit"
                  size="sm"
                  className="mr-1 bg-un-blue hover:bg-un-blue/90 text-white h-9 px-4 text-sm font-medium rounded-full"
                >
                  Search
                </Button>
              </div>
            </Form>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Form method="get" onSubmit={handleSearch}>
                <input
                  type="hidden"
                  name="q"
                  value={currentFilters.search || ''}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Search Mode
                    </label>
                    <select
                      name="mode"
                      defaultValue={currentFilters.searchMode}
                      className="w-full text-sm rounded-md border-gray-300"
                    >
                      <option value="phrase">Phrase</option>
                      <option value="exact">Exact</option>
                      <option value="fuzzy">Fuzzy</option>
                      <option value="semantic">Semantic (AI)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <input
                      type="number"
                      name="year"
                      defaultValue={currentFilters.year || ''}
                      placeholder="e.g., 2020"
                      className="w-full text-sm rounded-md border-gray-300"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Session
                    </label>
                    <input
                      type="number"
                      name="session"
                      defaultValue={currentFilters.session || ''}
                      placeholder="e.g., 75"
                      className="w-full text-sm rounded-md border-gray-300"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      type="submit"
                      size="sm"
                      className="w-full bg-un-blue hover:bg-un-blue/90"
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              </Form>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Results Summary */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            About {pagination.total.toLocaleString()} results
            {currentFilters.search && ` for "${currentFilters.search}"`}
            {isSemanticSearch && (
              <Badge variant="purple" className="ml-2">
                AI Semantic Search
              </Badge>
            )}
          </p>
        </div>

        {/* Speech Cards */}
        {speeches.length === 0 ? (
          <div className="text-center py-12">
            <SearchIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No speeches found
            </h3>
            <p className="text-gray-600 mb-4">
              Try adjusting your search terms or filters
            </p>
            <Button onClick={clearFilters}>Clear all filters</Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
              {speeches.map((speech) => (
                <SpeechCard key={speech.id} speech={speech} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                baseUrl="/"
                queryParams={Object.fromEntries(searchParams)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
