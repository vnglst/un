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
import { FileText, ArrowLeft } from 'lucide-react'
import { Button } from '~/components/ui/button'

type LoaderData = {
  speeches: Speech[]
  pagination: PaginationInfo
  session: number
}

export function meta({ data }: { data?: LoaderData }) {
  return [
    {
      title: data?.session
        ? `Session ${data.session} Speeches - UN Speeches`
        : 'Session Speeches - UN Speeches',
    },
    {
      name: 'description',
      content: data?.session
        ? `UN General Assembly speeches from session ${data.session}.`
        : 'UN General Assembly speeches by session.',
    },
  ]
}

export async function loader({
  params,
  request,
}: {
  params: { session: string }
  request: Request
}): Promise<LoaderData> {
  const session = parseInt(params.session, 10)
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)

  logger.requestStart('GET', `/session/${params.session}`, { session, page })

  if (isNaN(session)) {
    logger.warn('Invalid session provided', { session: params.session })
    throw new Response('Invalid session', { status: 400 })
  }

  return timeAsyncOperation('session-speeches-loader', async () => {
    const result = searchSpeeches({ session }, page, 20)

    logger.info('Session speeches loaded', {
      session,
      page,
      speechCount: result.speeches.length,
      total: result.pagination.total,
    })

    return {
      speeches: result.speeches,
      pagination: result.pagination,
      session,
    }
  })
}

export default function SessionSpeeches() {
  const { speeches, pagination, session } = useLoaderData<LoaderData>()
  const navigate = useNavigate()

  const handlePageChange = (page: number) => {
    navigate(`/session/${session}?page=${page}`)
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
          <FileText className="h-6 w-6 text-un-blue" />
          <h1 className="text-3xl font-medium text-black">
            Session {session} Speeches
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
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">
            No speeches found for session {session}
          </p>
          <Link to="/" className="mt-4 inline-block">
            <Button>Browse All Speeches</Button>
          </Link>
        </div>
      )}
    </PageLayout>
  )
}
