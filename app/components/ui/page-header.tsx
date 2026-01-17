import { Link } from 'react-router'
import { ArrowLeft } from 'lucide-react'
import { cn } from '~/lib/utils'

interface PageHeaderProps {
  backLink: string
  title: string
  className?: string
}

export function PageHeader({ backLink, title, className }: PageHeaderProps) {
  return (
    <div className={cn('bg-white border-b border-gray-200', className)}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-4">
          <Link
            to={backLink}
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
      </div>
    </div>
  )
}
