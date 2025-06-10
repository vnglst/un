import * as React from 'react'
import { cn } from '~/lib/utils'

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-9 w-full rounded border border-gray-300 bg-white px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-black disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    )
  }
)
Select.displayName = 'Select'

// For compatibility with the search component, create these simple wrapper components
const SelectTrigger = ({ children }: { children: React.ReactNode }) => children
const SelectValue = () => null
const SelectContent = ({ children }: { children: React.ReactNode }) => children
const SelectItem = ({
  value,
  children,
  ...props
}: {
  value: string
  children: React.ReactNode
}) => (
  <option value={value} {...props}>
    {children}
  </option>
)

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
