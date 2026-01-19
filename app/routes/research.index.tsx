import { Link } from 'react-router'
import { Quote, Globe, Scale, Swords, Bot, Terminal, Database, Sparkles } from 'lucide-react'
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

        {/* Card: Rearmament */}
        <Link
          to="/research/rearmament"
          className="group block bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden"
        >
          <div className="h-32 md:h-48 bg-red-50 flex items-center justify-center p-6 md:p-8">
             <Swords className="h-12 w-12 md:h-16 md:w-16 text-red-600/40 group-hover:text-red-600/60 transition-colors" />
          </div>
          <div className="p-4 md:p-6">
            <div className="flex items-center gap-2 mb-2 md:mb-3">
              <Badge variant="blue">
                Discourse Analysis
              </Badge>
              <span className="text-xs text-gray-500">Jan 2026</span>
            </div>
            <h2 className="text-lg md:text-xl font-bold mb-2 group-hover:text-red-700 transition-colors">
              Rearmament Discourse
            </h2>
            <p className="text-gray-600 text-sm mb-3 md:mb-4 line-clamp-3">
              From Cold War confrontation to moral critique. How UN speeches about military buildup changed from superpower accusations to small-nation advocacy.
            </p>
            <div className="flex items-center text-red-700 font-medium text-sm group-hover:underline">
              View Analysis &rarr;
            </div>
          </div>
        </Link>
      </div>

      {/* Methodology Section */}
      <div className="mt-16 pt-12 border-t border-gray-200">
        <div className="mb-8">
          <Badge variant="blue" className="mb-3">
            Methodology
          </Badge>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 tracking-tight">AI-Assisted Humanities Research</h2>
          <p className="text-lg text-gray-600 max-w-3xl">
            This research was conducted using Claude Code, an AI coding agent, to explore whether such tools can meaningfully enhance research in the humanities.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-violet-100 rounded-lg">
                <Terminal className="h-5 w-5 text-violet-600" />
              </div>
              <h3 className="font-bold text-gray-900">Conversational Exploration</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Instead of writing queries from scratch, research questions are posed in natural language. The AI agent translates these into SQL queries, iterates on results, and surfaces patterns that might otherwise require significant technical expertise to uncover.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Database className="h-5 w-5 text-emerald-600" />
              </div>
              <h3 className="font-bold text-gray-900">Database Enhancement</h3>
            </div>
            <p className="text-gray-600 text-sm">
              The agent helped design and populate new database tables (like quotations and notable figures), write extraction scripts with proper Unicode handling, and validate results through sampling and temporal analysis.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-gray-900">Pattern Recognition</h3>
            </div>
            <p className="text-gray-600 text-sm">
              By rapidly testing hypotheses ("Who gets quoted more: philosophers or religious figures?"), the agent enables exploratory research that would traditionally require days of manual query-writing and data processing.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900">Iterative Refinement</h3>
            </div>
            <p className="text-gray-600 text-sm">
              The workflow involves constant iteration: finding false positives, adjusting patterns, re-running analysis, and validating against source material. The agent maintains context across sessions, learning from debugging to improve extraction quality.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6 md:p-8">
          <h3 className="font-bold text-gray-900 mb-4">The Research Question</h3>
          <p className="text-gray-700 mb-4">
            Can coding agents like Claude Code make humanities research more accessible? Traditional digital humanities work requires expertise in programming, databases, and statistical analysis. AI assistants may lower these barriers, allowing researchers to focus on interpretation rather than implementation.
          </p>
          <p className="text-gray-700 mb-6">
            This project serves as a case study: every research page here was created through conversation with an AI agent, from initial data exploration to final visualization. The agent wrote the SQL queries, Python scripts, and React components—guided by human questions and judgment.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://claude.com/product/claude-code"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              <Bot className="h-4 w-4" />
              About Claude Code
            </a>
            <a
              href="https://github.com/vnglst/un-speeches"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              View Source Code
            </a>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
