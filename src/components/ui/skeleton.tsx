/* Skeleton Component - A component that displays a skeleton (a component that displays a loading state) - from shadcn/ui (exposes Skeleton) */
import { cn } from '@/lib/utils'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] animate-shimmer',
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
