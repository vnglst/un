import { Link } from 'react-router'
import { Quote, TrendingUp } from 'lucide-react'
import PageLayout from '~/components/page-layout'
import { Badge } from '~/components/ui/badge'

export function meta() {
  return [
    { title: 'Research - UN Speeches' },
    { name: 'description', content: 'Data analysis and research findings from the UN Speeches database.' },
  ]
}

export default function ResearchIndex() {
  return (
    <PageLayout maxWidth="wide">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4 tracking-tight">UN Speeches Research</h1>
        <p className="text-xl text-gray-600 max-w-3xl">
          Deep dives and data analysis uncovering trends, patterns, and insights from over 75 years of General Assembly debates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card: Quotations */}
        <Link 
          to="/research/quotations"
          className="group block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
        >
          <div className="h-48 bg-blue-50 flex items-center justify-center p-8">
             <Quote className="h-16 w-16 text-un-blue/40 group-hover:text-un-blue/60 transition-colors" />
          </div>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="blue">
                Analysis
              </Badge>
              <span className="text-xs text-gray-500">Jan 2026</span>
            </div>
            <h2 className="text-xl font-bold mb-2 group-hover:text-un-blue transition-colors">
              Most Quoted People
            </h2>
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              Who do world leaders cite to claim moral authority? From Mandela to Churchill, we analyze the most frequent citations in the last 15 years.
            </p>
            <div className="flex items-center text-un-blue font-medium text-sm group-hover:underline">
              Read Findings &rarr;
            </div>
          </div>
        </Link>

        {/* Placeholder Card: Topics */}
        <div className="group block bg-white/50 rounded-xl border border-gray-200 border-dashed p-6 opacity-75">
          <div className="h-48 flex items-center justify-center mb-6">
             <TrendingUp className="h-12 w-12 text-gray-300" />
          </div>
          <h2 className="text-lg font-semibold mb-2 text-gray-400">
            Coming Soon
          </h2>
          <p className="text-gray-500 text-sm">
            More analysis on topic trends, sentiment shifts, and linguistic patterns is coming soon.
          </p>
        </div>
      </div>
    </PageLayout>
  )
}
