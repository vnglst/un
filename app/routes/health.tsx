import { isDatabaseHealthy, getDatabaseStats } from '~/lib/database'

export async function loader() {
  try {
    // First check basic database connectivity
    const isHealthy = isDatabaseHealthy()

    if (!isHealthy) {
      throw new Response(
        JSON.stringify({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
          error: 'Database health check failed',
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Get detailed database statistics
    const dbStats = getDatabaseStats()

    if (!dbStats.healthy) {
      throw new Response(
        JSON.stringify({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          database: 'disconnected',
          error: dbStats.error,
        }),
        {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      stats: {
        speechCount: dbStats.speechCount,
        databaseSize: dbStats.sizeMB,
      },
      uptime: process.uptime(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
    }
  } catch (error) {
    // If it's already a Response (thrown above), re-throw it
    if (error instanceof Response) {
      throw error
    }

    // Handle unexpected errors
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    throw new Response(
      JSON.stringify({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: errorMessage,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
  }
}

export default function Health() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-green-600 mb-4">Health Check</h1>
        <p className="text-gray-600">Service is healthy and running</p>
        <p className="text-sm text-gray-500 mt-2">
          This endpoint is used for container health checks
        </p>
      </div>
    </div>
  )
}
