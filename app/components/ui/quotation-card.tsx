import { Link } from 'react-router'
import { cn } from '~/lib/utils'

interface QuotationCardProps {
  quote: string
  author: string
  citation: string
  speechLink: string
  className?: string
}

export function QuotationCard({
  quote,
  author,
  citation,
  speechLink,
  className,
}: QuotationCardProps) {
  return (
    <div
      className={cn(
        'bg-white p-6 rounded-lg border border-gray-200 shadow-sm',
        className
      )}
    >
      <blockquote className="text-xl italic text-gray-900 mb-4 border-l-4 border-un-blue pl-4">
        "{quote}"
      </blockquote>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-600 gap-2">
        <div>
          <span className="font-semibold text-gray-900">{author}</span>
          <span className="mx-2">•</span>
          Cited by <span className="font-medium">{citation}</span>
        </div>
        <Link
          to={speechLink}
          className="text-un-blue hover:underline font-medium"
        >
          View Speech &rarr;
        </Link>
      </div>
    </div>
  )
}
