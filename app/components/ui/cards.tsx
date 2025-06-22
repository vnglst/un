import { ReactNode } from 'react'
import { cn } from '~/lib/utils'

interface ServiceCardProps {
  title: string
  description: string
  icon: ReactNode
  children?: ReactNode
  className?: string
}

export function ServiceCard({
  title,
  description,
  icon,
  children,
  className,
}: ServiceCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg p-6 shadow-sm border border-gray-200',
        className
      )}
    >
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 bg-white border border-gray-300 rounded flex items-center justify-center mr-3">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      </div>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      {children}
    </div>
  )
}

interface FeatureCardProps {
  title: string
  description: string
  icon: ReactNode
  className?: string
}

export function FeatureCard({
  title,
  description,
  icon,
  className,
}: FeatureCardProps) {
  return (
    <div className={cn('text-center', className)}>
      <div className="w-16 h-16 bg-un-blue rounded-lg flex items-center justify-center mx-auto mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  )
}

interface InfoBlockProps {
  title: string
  children: ReactNode
  variant?: 'default' | 'blue'
  className?: string
}

export function InfoBlock({
  title,
  children,
  variant = 'default',
  className,
}: InfoBlockProps) {
  const baseClasses = 'rounded-lg p-8 mb-12 shadow-sm border'
  const variantClasses = {
    default: 'bg-white border-gray-200',
    blue: 'bg-gradient-to-r from-un-blue to-un-blue/90 text-white border-transparent',
  }

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)}>
      <h2
        className={cn(
          'text-2xl font-bold mb-4',
          variant === 'blue' ? 'text-white' : 'text-gray-900'
        )}
      >
        {title}
      </h2>
      {children}
    </div>
  )
}
