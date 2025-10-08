import { Link, useLoaderData } from 'react-router'
import {
  CheckCircle,
  Database,
  Clock,
  Server,
  Activity,
  HardDrive,
} from 'lucide-react'
import PageLayout from '~/components/page-layout'
import { Card } from '~/components/ui/card'
import { isDatabaseHealthy, getDatabaseStats } from '~/lib/database'
import { logger } from '~/lib/logger'

export async function loader() {
  try {
    logger.info('Health check requested')

    // First check basic database connectivity
    const isHealthy = isDatabaseHealthy()

    if (!isHealthy) {
      logger.error('Database health check failed - connectivity issue')
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
      logger.error('Database statistics retrieval failed', {
        error: dbStats.error,
        speechCount: dbStats.speechCount,
        databaseSize: dbStats.sizeMB,
      })
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

    logger.info('Health check completed successfully', {
      speechCount: dbStats.speechCount,
      databaseSize: dbStats.sizeMB,
      countriesCount: dbStats.countriesCount,
      yearsSpanned: dbStats.yearsSpanned,
    })

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      stats: {
        speechCount: dbStats.speechCount,
        databaseSize: dbStats.sizeMB,
        countriesCount: dbStats.countriesCount,
        yearsSpanned: dbStats.yearsSpanned,
        avgSpeechLength: dbStats.avgSpeechLength,
      },
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      memoryUsage: process.memoryUsage(),
    }
  } catch (error) {
    // If it's already a Response (thrown above), re-throw it
    if (error instanceof Response) {
      throw error
    }

    // Handle unexpected errors with detailed logging
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined

    logger.error('Unexpected error during health check', {
      error: errorMessage,
      stack: errorStack,
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      memoryUsage: process.memoryUsage(),
    })

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
  const data = useLoaderData<typeof loader>()

  // Format memory usage for display
  const formatBytes = (bytes: number) => {
    const mb = bytes / 1024 / 1024
    return `${mb.toFixed(1)} MB`
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
          <span className="text-gray-900 font-medium">HEALTH CHECK</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="py-12">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900">System Health</h1>
            <p className="text-lg text-gray-600">
              Service status and diagnostics
            </p>
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Server className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Service Status
              </h3>
              <p className="text-green-600 font-medium">
                {data.status === 'healthy' ? 'Healthy & Running' : 'Unhealthy'}
              </p>
              <p className="text-sm text-gray-500">
                {data.environment} environment
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Database</h3>
              <p className="text-green-600 font-medium">
                {data.database === 'connected' ? 'Connected' : 'Disconnected'}
              </p>
              <p className="text-sm text-gray-500">
                {data.stats.speechCount?.toLocaleString()} speeches
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">System</h3>
              <p className="text-green-600 font-medium">
                {data.environment} Ready
              </p>
              <p className="text-sm text-gray-500">
                Node.js {data.nodeVersion.replace('v', '')}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Database Statistics */}
      <Card className="p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Database Statistics
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <HardDrive className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Database Size</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.stats.databaseSize}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Database className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Speeches</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.stats.speechCount?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold">
                {data.stats.countriesCount}
              </div>
              <div>
                <p className="text-sm text-gray-600">Countries</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.stats.countriesCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Years Covered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data.stats.yearsSpanned}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Content Statistics
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Speech Length:</span>
                  <span className="font-medium text-gray-900">
                    {data.stats.avgSpeechLength?.toLocaleString()} characters
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data Coverage:</span>
                  <span className="font-medium text-gray-900">
                    {data.stats.yearsSpanned} ({data.stats.countriesCount}{' '}
                    countries)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                System Status
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Database Connection:</span>
                  <span className="font-medium text-green-600">
                    {data.database === 'connected' ? 'Active' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Status:</span>
                  <span className="font-medium text-green-600">
                    {data.status === 'healthy' ? 'Operational' : 'Error'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Check:</span>
                  <span className="font-medium text-gray-900">
                    {new Date(data.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* System Information */}
      <Card className="p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          System Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Runtime Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Environment:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {data.environment}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Node.js Version:</span>
                <span className="font-medium text-gray-900">
                  {data.nodeVersion}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Check:</span>
                <span className="font-medium text-gray-900">
                  {new Date(data.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Memory Usage
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">RSS (Resident Set):</span>
                <span className="font-medium text-gray-900">
                  {formatBytes(data.memoryUsage.rss)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Heap Used:</span>
                <span className="font-medium text-gray-900">
                  {formatBytes(data.memoryUsage.heapUsed)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Heap Total:</span>
                <span className="font-medium text-gray-900">
                  {formatBytes(data.memoryUsage.heapTotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">External:</span>
                <span className="font-medium text-gray-900">
                  {formatBytes(data.memoryUsage.external)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Technical Note */}
      <div className="bg-gray-50 rounded-lg p-6 mb-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Technical Information
        </h3>
        <p className="text-gray-600 mb-4">
          This health check endpoint provides comprehensive monitoring data
          including database connectivity, performance metrics, memory usage,
          and system statistics. Response includes detailed timing information
          for troubleshooting and optimization.
        </p>
        <div className="flex space-x-4">
          <Link
            to="/"
            className="text-un-blue hover:text-un-blue/80 transition-colors font-medium"
          >
            ← Return to Homepage
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}
