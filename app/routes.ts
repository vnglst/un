import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('about', 'routes/about.tsx'),
  route('country/:code', 'routes/country.$code.tsx'),
  route('speech/:id', 'routes/speech.$id.tsx'),
  route('year/:year', 'routes/year.$year.tsx'),
  route('session/:session', 'routes/session.$session.tsx'),
  route('speaker/:speaker', 'routes/speaker.$speaker.tsx'),
  route('role/:role', 'routes/role.$role.tsx'),
  route('sitemap.xml', 'routes/sitemap[.]xml.tsx'),
  route('health', 'routes/health.tsx'),
  route('research', 'routes/research.index.tsx'),
  route('research/quotations', 'routes/research.quotations.tsx'),
  route('research/quotations/1950s', 'routes/research.quotations.1950s.tsx'),
  route('research/quotations/1960s', 'routes/research.quotations.1960s.tsx'),
  route('research/quotations/1970s', 'routes/research.quotations.1970s.tsx'),
  route('research/quotations/1980s', 'routes/research.quotations.1980s.tsx'),
  route('research/quotations/1990s', 'routes/research.quotations.1990s.tsx'),
  route('research/quotations/2000s', 'routes/research.quotations.2000s.tsx'),
  route('research/quotations/2010s', 'routes/research.quotations.2010s.tsx'),
  route('research/quotations/2020s', 'routes/research.quotations.2020s.tsx'),
  route(
    'research/quotations/figures',
    'routes/research.quotations.figures.tsx'
  ),
  route(
    'research/quotations/figure/:name',
    'routes/research.quotations.figure.$name.tsx'
  ),
  route('research/greenland', 'routes/research.greenland.tsx'),
  route(
    'research/two-state-solution',
    'routes/research.two-state-solution.tsx'
  ),
  route('research/rearmament', 'routes/research.rearmament.tsx'),
  route('research/un-evolution', 'routes/research.un-evolution.tsx'),
  route('*', 'routes/404.tsx'), // Catch-all route for 404s
] satisfies RouteConfig
