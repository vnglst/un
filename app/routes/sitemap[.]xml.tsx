import type { LoaderFunctionArgs } from 'react-router'
import {
  getCountries,
  getYears,
  getSessions,
  getSpeakers,
  getRoles,
  getAllSpeechIds,
} from '~/lib/database'
import { logger } from '~/lib/logger'

export async function loader({ request }: LoaderFunctionArgs) {
  logger.info('Generating sitemap')

  try {
    const url = new URL(request.url)
    const baseUrl = `${url.protocol}//${url.host}`

    // Get all data needed for sitemap
    const [countries, years, sessions, speakers, roles, speechIds] = [
      getCountries(),
      getYears(),
      getSessions(),
      getSpeakers(),
      getRoles(),
      getAllSpeechIds(),
    ]

    logger.info('Sitemap data loaded', {
      countries: countries.length,
      years: years.length,
      sessions: sessions.length,
      speakers: speakers.length,
      roles: roles.length,
      speeches: speechIds.length,
    })

    // Generate sitemap XML
    const sitemap = generateSitemap(baseUrl, {
      countries,
      years,
      sessions,
      speakers,
      roles,
      speechIds,
    })

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    logger.error('Error generating sitemap', error)
    return new Response('Error generating sitemap', { status: 500 })
  }
}

interface SitemapData {
  countries: Array<{ country_name: string; country_code: string }>
  years: number[]
  sessions: number[]
  speakers: string[]
  roles: string[]
  speechIds: number[]
}

function generateSitemap(baseUrl: string, data: SitemapData): string {
  const urls: string[] = []

  // Add static pages
  urls.push(createUrlEntry(baseUrl, '/', 'daily', '1.0'))

  // Add country pages
  data.countries.forEach((country) => {
    const countryUrl = `/country/${encodeURIComponent(country.country_code)}`
    urls.push(createUrlEntry(baseUrl, countryUrl, 'weekly', '0.7'))
  })

  // Add year pages
  data.years.forEach((year) => {
    const yearUrl = `/year/${year}`
    urls.push(createUrlEntry(baseUrl, yearUrl, 'weekly', '0.6'))
  })

  // Add session pages
  data.sessions.forEach((session) => {
    const sessionUrl = `/session/${session}`
    urls.push(createUrlEntry(baseUrl, sessionUrl, 'weekly', '0.6'))
  })

  // Add speaker pages (limit to avoid too many URLs)
  data.speakers.slice(0, 1000).forEach((speaker) => {
    const speakerUrl = `/speaker/${encodeURIComponent(speaker)}`
    urls.push(createUrlEntry(baseUrl, speakerUrl, 'monthly', '0.5'))
  })

  // Add role pages (limit to avoid too many URLs)
  data.roles.slice(0, 500).forEach((role) => {
    const roleUrl = `/role/${encodeURIComponent(role)}`
    urls.push(createUrlEntry(baseUrl, roleUrl, 'monthly', '0.5'))
  })

  // Add individual speech pages (limit to most recent speeches)
  data.speechIds.slice(-5000).forEach((id) => {
    const speechUrl = `/speech/${id}`
    urls.push(createUrlEntry(baseUrl, speechUrl, 'yearly', '0.4'))
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`
}

function createUrlEntry(
  baseUrl: string,
  path: string,
  changefreq: string,
  priority: string
): string {
  const url = `${baseUrl}${path}`
  const lastmod = new Date().toISOString().split('T')[0] // YYYY-MM-DD format

  return `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
