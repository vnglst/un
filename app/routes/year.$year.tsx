import { useLoaderData, Link, useNavigate } from 'react-router'
import {
  searchSpeeches,
  type Speech,
  type PaginationInfo,
} from '~/lib/database'
import { logger, timeAsyncOperation } from '~/lib/logger'
import PageLayout from '~/components/page-layout'
import SpeechCard from '~/components/speech-card'
import Pagination from '~/components/pagination'
import { Calendar, ArrowLeft } from 'lucide-react'
import { Button } from '~/components/ui/button'

type LoaderData = {
  speeches: Speech[]
  pagination: PaginationInfo
  year: number
}

export function meta({ data }: { data?: LoaderData }) {
  return [
    {
      title: data?.year
        ? `${data.year} Speeches - UN Speeches`
        : 'Year Speeches - UN Speeches',
    },
    {
      name: 'description',
      content: data?.year
        ? `UN General Assembly speeches from ${data.year}.`
        : 'UN General Assembly speeches by year.',
    },
  ]
}

export async function loader({
  params,
  request,
}: {
  params: { year: string }
  request: Request
}): Promise<LoaderData> {
  const year = parseInt(params.year, 10)
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)

  logger.requestStart('GET', `/year/${params.year}`, { year, page })

  if (isNaN(year)) {
    logger.warn('Invalid year provided', { year: params.year })
    throw new Response('Invalid year', { status: 400 })
  }

  return timeAsyncOperation('year-speeches-loader', async () => {
    const result = searchSpeeches({ year }, page, 20)

    logger.info('Year speeches loaded', {
      year,
      page,
      speechCount: result.speeches.length,
      total: result.pagination.total,
    })

    return {
      speeches: result.speeches,
      pagination: result.pagination,
      year,
    }
  })
}

export default function YearSpeeches() {
  const { speeches, pagination, year } = useLoaderData<LoaderData>()
  const navigate = useNavigate()

  const handlePageChange = (page: number) => {
    navigate(`/year/${year}?page=${page}`)
  }

  return (
    <PageLayout maxWidth="wide">
      <div className="mb-8">
        <Link to="/" className="inline-block mb-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Browse
          </Button>
        </Link>

        <div className="flex items-center space-x-3 mb-2">
          <Calendar className="h-6 w-6 text-[#009edb]" />
          <h1 className="text-3xl font-medium text-black">
            Speeches from {year}
          </h1>
        </div>

        <p className="text-gray-600">
          {pagination.total} speech{pagination.total !== 1 ? 'es' : ''} found
        </p>
      </div>

      {speeches.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
            {speeches.map((speech) => (
              <SpeechCard key={speech.id} speech={speech} />
            ))}
          </div>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">No speeches found for {year}</p>
          <Link to="/" className="mt-4 inline-block">
            <Button>Browse All Speeches</Button>
          </Link>
        </div>
      )}
    </PageLayout>
  )
}
