import { Link } from 'react-router'
import { Search, Home, AlertCircle } from 'lucide-react'
import PageLayout from '~/components/page-layout'
import { Button } from '~/components/ui/button'
import { ServiceCard } from '~/components/ui/cards'

export default function NotFound() {
  return (
    <PageLayout className="space-y-0 py-0">
      {/* Breadcrumb Navigation */}
      <div className="py-4">
        <div className="flex items-center text-sm text-gray-600">
          <Link to="/" className="hover:text-un-blue transition-colors">
            HOME
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="text-gray-900 font-medium">404 ERROR</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="py-12 text-center">
        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-8">
          <AlertCircle className="h-12 w-12 text-gray-600" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">
          Page Not Found
        </h2>
        <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
          The page you're looking for doesn't exist. It might have been moved,
          deleted, or you entered the wrong URL.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-1 gap-8 mb-12">
        <ServiceCard
          title="Browse Speeches"
          description="Search through thousands of UN General Assembly speeches from member states."
          icon={<Search className="h-6 w-6 text-gray-600" />}
        />
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center mb-12">
        <h3 className="text-xl font-bold text-gray-900 mb-6">
          Where would you like to go?
        </h3>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link to="/">
            <Button className="w-full sm:w-auto bg-un-blue hover:bg-un-blue/90 text-white px-8">
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Button>
          </Link>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If you believe this is an error, please check the URL or{' '}
            <Link
              to="/"
              className="text-un-blue hover:text-un-blue/80 transition-colors"
            >
              return to the homepage
            </Link>
            .
          </p>
        </div>
      </div>
    </PageLayout>
  )
}
