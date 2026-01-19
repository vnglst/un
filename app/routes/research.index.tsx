import { Link } from 'react-router'
import { Quote, TrendingUp, Globe, Scale } from 'lucide-react'
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
          <div className="h-32 md:h-48 bg-blue-50 flex items-center justify-center p-6 md:p-8">
             <Quote className="h-12 w-12 md:h-16 md:w-16 text-un-blue/40 group-hover:text-un-blue/60 transition-colors" />
          </div>
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <Badge variant="blue">
                Analysis
              </Badge>
              <span className="text-xs text-gray-500">Jan 2026</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold mb-2 group-hover:text-un-blue transition-colors">
              Most Quoted People
            </h2>
            <p className="text-gray-600 text-sm mb-3 md:mb-4 line-clamp-3">
              Who do world leaders cite to claim moral authority? From Mandela to Churchill, we analyze the most frequent citations in the last 15 years.
            </p>
            <div className="flex items-center text-un-blue font-medium text-sm group-hover:underline">
              Read Findings &rarr;
            </div>
          </div>
        </Link>

        {/* Card: Greenland */}
        <Link
          to="/research/greenland"
          className="group block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
        >
          <div className="h-32 md:h-48 bg-cyan-50 flex items-center justify-center p-6 md:p-8">
             <Globe className="h-12 w-12 md:h-16 md:w-16 text-cyan-600/40 group-hover:text-cyan-600/60 transition-colors" />
          </div>
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <Badge variant="blue">
                Case Study
              </Badge>
              <span className="text-xs text-gray-500">Jan 2026</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold mb-2 group-hover:text-cyan-700 transition-colors">
              The Greenlandic Pivot
            </h2>
            <p className="text-gray-600 text-sm mb-3 md:mb-4 line-clamp-3">
              From Cold War strategic coordinate to global climate harbinger. A 75-year evolution of sovereignty thinking in the UN Hall.
            </p>
            <div className="flex items-center text-cyan-700 font-medium text-sm group-hover:underline">
              View Evolution &rarr;
            </div>
          </div>
        </Link>

        {/* Card: Two-State Solution */}
        <Link
          to="/research/two-state-solution"
          className="group block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
        >
          <div className="h-32 md:h-48 bg-amber-50 flex items-center justify-center p-6 md:p-8">
             <Scale className="h-12 w-12 md:h-16 md:w-16 text-amber-600/40 group-hover:text-amber-600/60 transition-colors" />
          </div>
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <Badge variant="blue">
                Data Analysis
              </Badge>
              <span className="text-xs text-gray-500">Jan 2026</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold mb-2 group-hover:text-amber-700 transition-colors">
              The Two-State Solution
            </h2>
            <p className="text-gray-600 text-sm mb-3 md:mb-4 line-clamp-3">
              From 1947 partition to 2024 urgency. How a concept took 54 years to become the universal diplomatic framework for Israeli-Palestinian peace.
            </p>
            <div className="flex items-center text-amber-700 font-medium text-sm group-hover:underline">
              View Analysis &rarr;
            </div>
          </div>
        </Link>

        {/* Placeholder Card: Topics */}
        <div className="group block bg-white/50 rounded-xl border border-gray-200 border-dashed p-4 md:p-6 opacity-75">
          <div className="h-32 md:h-48 flex items-center justify-center mb-4 md:mb-6">
             <TrendingUp className="h-10 w-10 md:h-12 md:w-12 text-gray-300" />
          </div>
          <h2 className="text-base md:text-lg font-semibold mb-2 text-gray-400">
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
