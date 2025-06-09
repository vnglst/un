import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '~/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-un-blue text-white shadow hover:bg-un-dark-blue hover:shadow-md',
        destructive:
          'bg-red-500 text-white shadow-sm hover:bg-red-600 hover:shadow-md',
        outline:
          'border border-un-blue text-un-blue bg-white shadow-sm hover:bg-un-blue hover:text-white hover:shadow-md',
        secondary:
          'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-300 hover:text-gray-950 hover:shadow-md',
        ghost: 'hover:bg-gray-100 hover:text-gray-900 hover:shadow-sm',
        link: 'text-un-blue underline-offset-4 hover:underline hover:text-un-dark-blue',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
