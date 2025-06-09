import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('globe', 'routes/globe.tsx'),
  route('country/:code', 'routes/country.$code.tsx'),
  route('speech/:id', 'routes/speech.$id.tsx'),
  route('health', 'routes/health.tsx'),
  route('*', 'routes/404.tsx'), // Catch-all route for 404s
] satisfies RouteConfig
