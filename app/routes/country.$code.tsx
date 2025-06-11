import { useLoaderData, useNavigate, Link } from 'react-router'
import {
  getSpeechesByCountryCode,
  getCountries,
  type Speech,
  type PaginationInfo,
} from '~/lib/database'
import { logger, timeAsyncOperation } from '~/lib/logger'
import Header from '~/components/header'
import Footer from '~/components/footer'
import SpeechCard from '~/components/speech-card'
import Pagination from '~/components/pagination'
import { Button } from '~/components/ui/button'
import { ArrowLeft, Globe } from 'lucide-react'

type LoaderData = {
  speeches: Speech[]
  pagination: PaginationInfo
  countryName: string
  countryCode: string
}

export function meta({ data }: { data: LoaderData }) {
  if (!data) {
    return [
      { title: 'Country Not Found' },
      {
        name: 'description',
        content: 'The requested country could not be found.',
      },
    ]
  }

  return [
    { title: `${data.countryName} - UN Speeches` },
    {
      name: 'description',
      content: `${data.pagination.total} speeches from ${data.countryName}.`,
    },
  ]
}

export async function loader({
  request,
  params,
}: {
  request: Request
  params: { code: string }
}) {
  const { code } = params
  const url = new URL(request.url)
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))

  logger.requestStart('GET', `/country/${code}`, {
    countryCode: code,
    page,
    searchParams: Object.fromEntries(url.searchParams),
  })

  return timeAsyncOperation('country-loader', async () => {
    // Get speeches for this country
    const result = getSpeechesByCountryCode(code, page, 20)

    // Get country name
    const countries = getCountries()
    const country = countries.find((c) => c.country_code === code)

    if (result.speeches.length === 0 && page === 1) {
      logger.warn('Country not found', { countryCode: code })
      throw new Response('Country not found', { status: 404 })
    }

    logger.info('Country page loaded', {
      countryCode: code,
      countryName: country?.country_name,
      speechCount: result.speeches.length,
      totalSpeeches: result.pagination.total,
      page,
    })

    return {
      speeches: result.speeches,
      pagination: result.pagination,
      countryName: country?.country_name || code,
      countryCode: code,
    }
  })
}

export default function CountrySpeeches() {
  const { speeches, pagination, countryName, countryCode } =
    useLoaderData<LoaderData>()
  const navigate = useNavigate()

  const handlePageChange = (page: number) => {
    navigate(`/country/${countryCode}?page=${page}`)
  }

  return (
    <>
      <div className="min-h-screen flex flex-col bg-white relative z-10">
        <Header />

        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Navigation */}
          <div className="mb-6">
            <Link to="/globe">
              <Button variant="outline" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Globe
              </Button>
            </Link>
          </div>
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-medium text-black mb-2">
              {countryName}
            </h1>
          </div>
          {/* Results Summary */}
          <div className="mb-6">
            <p className="text-gray-600 text-sm">{pagination.total} speeches</p>
          </div>
          {/* Results */}
          {speeches.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                No speeches found for {countryName}.
              </p>
              <Link to="/globe" className="mt-4 inline-block">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Globe
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                {speeches.map((speech: Speech) => (
                  <SpeechCard key={speech.id} speech={speech} />
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
    </>
  )
}
