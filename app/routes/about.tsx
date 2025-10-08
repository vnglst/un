import PageLayout from '~/components/page-layout'
import { Search, Database, Users } from 'lucide-react'
import { Link } from 'react-router'
import { FeatureCard } from '~/components/ui/cards'

export function meta() {
  return [
    { title: 'About - UN Speeches' },
    {
      name: 'description',
      content:
        'Learn about the UN Speeches database and our mission to make diplomatic discourse accessible.',
    },
  ]
}

export default function About() {
  return (
    <PageLayout>
      {/* Breadcrumb Navigation */}
      <div className="py-4">
        <div className="flex items-center text-sm text-gray-600">
          <Link to="/" className="hover:text-un-blue transition-colors">
            HOME
          </Link>
          <span className="mx-2">&gt;</span>
          <span className="text-gray-900 font-medium">ABOUT</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          About UN Speeches
        </h1>
        <p className="text-lg text-gray-700 mb-6 max-w-4xl">
          A modern web application for browsing and searching speeches from the
          UN General Assembly. Built with React Router v7, TypeScript, and D3.js
          for data visualization.
        </p>
      </div>

      {/* Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
        <FeatureCard
          title="Advanced Search"
          description="Full-text search with multiple modes (phrase, exact, fuzzy matching)"
          icon={<Search className="h-8 w-8 text-white" />}
        />

        <FeatureCard
          title="Rich Filtering"
          description="Filter by country, year, session, and speaker with fast performance"
          icon={<Database className="h-8 w-8 text-white" />}
        />

        <FeatureCard
          title="Responsive Design"
          description="Works seamlessly on desktop and mobile devices"
          icon={<Users className="h-8 w-8 text-white" />}
        />
      </div>

      {/* Tech Stack Information */}
      <div className="bg-gradient-to-r from-un-blue to-un-blue/90 rounded-lg p-12 text-white mb-16">
        <h2 className="text-3xl font-bold mb-6">Technology Stack</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Frontend</h3>
            <ul className="space-y-2 text-white/90">
              <li>• React Router v7</li>
              <li>• TypeScript</li>
              <li>• Tailwind CSS</li>
              <li>• D3.js for interactive visualization</li>
            </ul>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Backend & Database</h3>
            <ul className="space-y-2 text-white/90">
              <li>• SQLite with FTS (Full-Text Search)</li>
              <li>• Node.js with Better SQLite3</li>
              <li>• Docker deployment</li>
              <li>• Fast performance optimization</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Creator Information */}
      <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          About the Creator
        </h2>
        <p className="text-gray-700 mb-4">
          This project was created to make UN General Assembly speeches more
          accessible for research, analysis, and public understanding of
          international discourse.
        </p>
        <p className="text-gray-700">
          Learn more about the creator at{' '}
          <a
            href="https://koenvangilst.nl"
            target="_blank"
            rel="noopener noreferrer"
            className="text-un-blue hover:text-un-blue/80 transition-colors font-medium"
          >
            koenvangilst.nl
          </a>
        </p>
      </div>
    </PageLayout>
  )
}
