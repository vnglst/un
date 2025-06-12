import { Link } from 'react-router'
import { Search, Home, Globe, AlertCircle } from 'lucide-react'
import PageLayout from '~/components/page-layout'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

export default function NotFound() {
  return (
    <PageLayout maxWidth="narrow" className="flex items-center justify-center">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
              <AlertCircle className="h-10 w-10 text-gray-600" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold text-black mb-2">
            404
          </CardTitle>
          <h1 className="text-2xl font-medium text-gray-600 mb-4">
            Page Not Found
          </h1>
        </CardHeader>

        <CardContent className="text-center space-y-6">
          <p className="text-gray-600 text-lg leading-relaxed">
            The page you're looking for doesn't exist. It might have been moved,
            deleted, or you entered the wrong URL.
          </p>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Here's what you can do:
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded">
                <Search className="h-5 w-5 text-black flex-shrink-0" />
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Browse Speeches</h3>
                  <p className="text-sm text-gray-600">
                    Search through thousands of UN speeches
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded">
                <Globe className="h-5 w-5 text-black flex-shrink-0" />
                <div className="text-left">
                  <h3 className="font-medium text-gray-900">Explore Globe</h3>
                  <p className="text-sm text-gray-600">
                    View speeches by country on our interactive globe
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Link to="/">
              <Button className="w-full sm:w-auto">
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>

            <Link to="/globe">
              <Button variant="outline" className="w-full sm:w-auto">
                <Globe className="h-4 w-4 mr-2" />
                View Globe
              </Button>
            </Link>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              If you believe this is an error, please check the URL or{' '}
              <Link to="/" className="text-black hover:underline">
                return to the homepage
              </Link>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  )
}
