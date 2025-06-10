import { Link } from 'react-router'
import { AlertTriangle, Home, RefreshCw, Search } from 'lucide-react'
import Header from '~/components/header'
import Footer from '~/components/footer'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'

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
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex items-center justify-center">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-10 w-10 text-gray-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              {title}
            </CardTitle>
            <h1 className="text-xl font-semibold text-gray-700">{message}</h1>
          </CardHeader>

          <CardContent className="space-y-6">
            <p className="text-gray-600 text-center leading-relaxed">
              {details}
            </p>

            {showStack && stack && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Error Details:
                </h3>
                <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                  {stack}
                </pre>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 text-center">
                What you can try:
              </h2>

              <div className="grid gap-3">
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-black flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">
                      Refresh the page
                    </h3>
                    <p className="text-sm text-gray-600">
                      Sometimes a simple refresh can resolve the issue
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Home className="h-5 w-5 text-black flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">
                      Go to homepage
                    </h3>
                    <p className="text-sm text-gray-600">
                      Start fresh from the main page
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Search className="h-5 w-5 text-black flex-shrink-0" />
                  <div className="text-left">
                    <h3 className="font-medium text-gray-900">
                      Search speeches
                    </h3>
                    <p className="text-sm text-gray-600">
                      Try searching for what you were looking for
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button onClick={handleRefresh} className="w-full sm:w-auto">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>

              <Link to="/">
                <Button variant="outline" className="w-full sm:w-auto">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Homepage
                </Button>
              </Link>
            </div>

            <div className="pt-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                If this problem persists, you can{' '}
                <Link to="/" className="text-black hover:underline">
                  return to the homepage
                </Link>{' '}
                and try a different approach.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
