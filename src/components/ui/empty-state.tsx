/* Empty State Component - A reusable component for displaying empty states */
import * as React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  className?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 p-4 rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <Icon className="h-12 w-12 text-primary/60" />
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-6 max-w-md">
          {description}
        </p>
      )}
      {action && (
        <Button
          onClick={action.onClick}
          className="bg-gradient-to-r from-primary via-blue-600 to-primary bg-size-200 bg-pos-0 hover:bg-pos-100 text-white shadow-lg hover:shadow-xl transition-all duration-500 transform hover:scale-105 font-semibold"
        >
          {action.icon && (
            <div className="p-1 rounded-md bg-white/20 mr-2">
              <action.icon className="h-5 w-5" />
            </div>
          )}
          {action.label}
        </Button>
      )}
    </div>
  )
}

