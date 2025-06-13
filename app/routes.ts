import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('globe', 'routes/globe.tsx'),
  route('rag', 'routes/rag.tsx'),
  route('country/:code', 'routes/country.$code.tsx'),
  route('speech/:id', 'routes/speech.$id.tsx'),
  route('year/:year', 'routes/year.$year.tsx'),
  route('session/:session', 'routes/session.$session.tsx'),
  route('speaker/:speaker', 'routes/speaker.$speaker.tsx'),
  route('role/:role', 'routes/role.$role.tsx'),
  route('sitemap.xml', 'routes/sitemap[.]xml.tsx'),
  route('health', 'routes/health.tsx'),
  route('*', 'routes/404.tsx'), // Catch-all route for 404s
] satisfies RouteConfig
