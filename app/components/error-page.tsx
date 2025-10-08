import { Link } from 'react-router'
import {
  AlertTriangle,
  Home,
  RefreshCw,
  Search,
} from 'lucide-react'
import PageLayout from '~/components/page-layout'
import { Button } from '~/components/ui/button'
import { ServiceCard } from '~/components/ui/cards'

interface ErrorPageProps {
  title?: string
  message?: string
  details?: string
  showStack?: boolean
  stack?: string
}

export default function ErrorPage({
  title = 'Something went wrong',
  message = 'An unexpected error occurred',
  details = "We're sorry, but something went wrong. Please try again or return to the homepage.",
  showStack = false,
  stack,
}: ErrorPageProps) {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <PageLayout className="space-y-0 py-0">
      {/* Breadcrumb Navigation */}
      <div className="py-4">
        <div className="flex items-center text-sm text-gray-600">
          <Link to="/" className="hover:text-un-blue transition-colors">
            HOME
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="text-gray-900 font-medium">ERROR</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="py-12 text-center">
        <div className="w-24 h-24 bg-red-50 rounded-lg flex items-center justify-center mx-auto mb-8">
          <AlertTriangle className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{title}</h1>
        <h2 className="text-xl text-gray-700 mb-6">{message}</h2>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          {details}
        </p>
      </div>

      {/* Error Details */}
      {showStack && stack && (
        <div className="bg-gray-50 rounded-lg p-6 mb-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Technical Details:
          </h3>
          <div className="bg-white rounded border border-gray-200 p-4 overflow-x-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {stack}
            </pre>
          </div>
        </div>
      )}

      {/* Recovery Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        <ServiceCard
          title="Refresh Page"
          description="Sometimes a simple refresh can resolve temporary issues and restore functionality."
          icon={<RefreshCw className="h-6 w-6 text-gray-600" />}
        />

        <ServiceCard
          title="Go to Homepage"
          description="Start fresh from our main page and navigate to what you were looking for."
          icon={<Home className="h-6 w-6 text-gray-600" />}
        />

        <ServiceCard
          title="Search Speeches"
          description="Try searching for UN speeches or browse our comprehensive database."
          icon={<Search className="h-6 w-6 text-gray-600" />}
        />
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center mb-12">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          What would you like to try?
        </h3>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button
            onClick={handleRefresh}
            className="w-full sm:w-auto bg-un-blue hover:bg-un-blue/90 text-white px-8"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>

          <Link to="/">
            <Button
              variant="outline"
              className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 px-8"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Button>
          </Link>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If this problem persists, you can{' '}
            <Link
              to="/"
              className="text-un-blue hover:text-un-blue/80 transition-colors"
            >
              return to the homepage
            </Link>{' '}
            and try a different approach.
          </p>
        </div>
      </div>
    </PageLayout>
  )
}
