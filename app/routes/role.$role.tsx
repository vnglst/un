import { useLoaderData, Link, useNavigate } from 'react-router'
import {
  searchSpeeches,
  type Speech,
  type PaginationInfo,
} from '~/lib/database'
import { logger, timeAsyncOperation } from '~/lib/logger'
import Header from '~/components/header'
import Footer from '~/components/footer'
import SpeechCard from '~/components/speech-card'
import Pagination from '~/components/pagination'
import { Briefcase, ArrowLeft } from 'lucide-react'
import { Button } from '~/components/ui/button'

type LoaderData = {
  speeches: Speech[]
  pagination: PaginationInfo
  role: string
}

export function meta({ data }: { data?: LoaderData }) {
  return [
    {
      title: data?.role
        ? `${data.role} - UN Speeches`
        : 'Role Speeches - UN Speeches',
    },
    {
      name: 'description',
      content: data?.role
        ? `UN General Assembly speeches by ${data.role}.`
        : 'UN General Assembly speeches by role.',
    },
  ]
}

export async function loader({
  params,
  request,
}: {
  params: { role: string }
  request: Request
}): Promise<LoaderData> {
  const role = decodeURIComponent(params.role)
  const url = new URL(request.url)
  const page = parseInt(url.searchParams.get('page') || '1', 10)

  logger.requestStart('GET', `/role/${params.role}`, { role, page })

  return timeAsyncOperation('role-speeches-loader', async () => {
    const result = searchSpeeches({ search: role }, page, 20)

    logger.info('Role speeches loaded', {
      role,
      page,
      speechCount: result.speeches.length,
      total: result.pagination.total,
    })

    return {
      speeches: result.speeches,
      pagination: result.pagination,
      role,
    }
  })
}

export default function RoleSpeeches() {
  const { speeches, pagination, role } = useLoaderData<LoaderData>()
  const navigate = useNavigate()

  const handlePageChange = (page: number) => {
    navigate(`/role/${encodeURIComponent(role)}?page=${page}`)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link to="/" className="inline-block mb-4">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Browse
            </Button>
          </Link>

          <div className="flex items-center space-x-3 mb-2">
            <Briefcase className="h-6 w-6 text-[#009edb]" />
            <h1 className="text-3xl font-medium text-black">
              Speeches by {role}
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
            <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No speeches found for role: {role}</p>
            <Link to="/" className="mt-4 inline-block">
              <Button>Browse All Speeches</Button>
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
