import { useLoaderData, Link } from 'react-router'
import { getSpeechById, type Speech } from '~/lib/database'
import { logger, timeAsyncOperation } from '~/lib/logger'
import Header from '~/components/header'
import Footer from '~/components/footer'
import { Button } from '~/components/ui/button'
import { Calendar, User, FileText, ArrowLeft } from 'lucide-react'

type LoaderData = {
  speech: Speech
}

export function meta({ data }: { data?: LoaderData }) {
  return [
    {
      title: data?.speech
        ? `${data.speech.speaker} - UN Speeches`
        : 'Speech - UN Speeches',
    },
    {
      name: 'description',
      content: data?.speech
        ? `Speech by ${data.speech.speaker} from ${data.speech.country_name}.`
        : 'UN General Assembly speech.',
    },
  ]
}

export async function loader({
  params,
}: {
  params: { id: string }
}): Promise<LoaderData> {
  const speechId = parseInt(params.id, 10)

  logger.requestStart('GET', `/speech/${params.id}`, { speechId })

  if (isNaN(speechId)) {
    logger.warn('Invalid speech ID provided', { id: params.id })
    throw new Response('Invalid speech ID', { status: 400 })
  }

  return timeAsyncOperation('speech-detail-loader', async () => {
    const speech = getSpeechById(speechId)

    if (!speech) {
      logger.warn('Speech not found', { speechId })
      throw new Response('Speech not found', { status: 404 })
    }

    logger.info('Speech detail loaded', {
      speechId,
      speaker: speech.speaker,
      country: speech.country_name,
      year: speech.year,
      textLength: speech.text.length,
    })

    return { speech }
  })
}

export default function SpeechDetail() {
  const { speech } = useLoaderData<LoaderData>()

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link to="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Speeches
            </Button>
          </Link>
        </div>

        <div className="border border-gray-200 rounded">
          <div className="border-b border-gray-200 bg-gray-50 p-4">
            <h1 className="text-xl font-medium text-black mb-2">
              {speech.country_name || speech.country_code}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <Link
                to={`/year/${speech.year}`}
                className="flex items-center space-x-1 hover:text-[#009edb] transition-colors"
              >
                <Calendar className="h-4 w-4" />
                <span>{speech.year}</span>
              </Link>
              <Link
                to={`/session/${speech.session}`}
                className="flex items-center space-x-1 hover:text-[#009edb] transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span>Session {speech.session}</span>
              </Link>
            </div>

            {speech.speaker && (
              <div className="mt-3 pt-3 border-t border-gray-300">
                <div className="flex items-center space-x-2 text-sm text-gray-700">
                  <User className="h-4 w-4" />
                  <Link
                    to={`/speaker/${encodeURIComponent(speech.speaker)}`}
                    className="font-medium hover:text-[#009edb] transition-colors"
                  >
                    {speech.speaker}
                  </Link>
                  {speech.post && (
                    <>
                      <span>•</span>
                      <Link
                        to={`/role/${encodeURIComponent(speech.post)}`}
                        className="hover:text-[#009edb] transition-colors"
                      >
                        {speech.post}
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-white">
            <div className="whitespace-pre-wrap text-gray-900 leading-relaxed">
              {speech.text}
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link to="/">
            <Button size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  )
}
