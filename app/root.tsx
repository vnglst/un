import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router'
import type { LinksFunction } from 'react-router'
import { logger } from '~/lib/logger'
import ErrorPage from '~/components/error-page'

import './app.css'

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full bg-white text-gray-900">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

export default function App() {
  return <Outlet />
}

export function ErrorBoundary({ error }: { error: unknown }) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  // Log the error
  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details

    logger.warn('Route error boundary triggered', {
      status: error.status,
      statusText: error.statusText,
      message,
      details,
    })

    // Handle 404 errors specifically
    if (error.status === 404) {
      return (
        <ErrorPage
          title="Page Not Found"
          message="404 - The page you're looking for doesn't exist"
          details="The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL."
        />
      )
    }

    // Handle other HTTP errors
    return (
      <ErrorPage
        title={`Error ${error.status}`}
        message={error.statusText || 'An error occurred'}
        details={details}
      />
    )
  } else if (error instanceof Error) {
    logger.error('Application error boundary triggered', error, {
      errorName: error.name,
      message: error.message,
    })

    if (import.meta.env.DEV) {
      details = error.message
      stack = error.stack
    }

    return (
      <ErrorPage
        title="Application Error"
        message={error.name || 'An unexpected error occurred'}
        details={details}
        showStack={import.meta.env.DEV}
        stack={stack}
      />
    )
  } else {
    logger.error('Unknown error in error boundary', undefined, {
      error: String(error),
    })

    return (
      <ErrorPage
        title="Unknown Error"
        message="Something unexpected happened"
        details="An unknown error occurred. Please try refreshing the page or return to the homepage."
      />
    )
  }
}
