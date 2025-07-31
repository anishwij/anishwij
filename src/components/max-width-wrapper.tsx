import { cn } from '@/lib/utils'

export function MaxWidthWrapper({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('mx-auto h-full w-full max-w-6xl px-4 md:px-8 lg:px-20', className)}
      {...props}
    />
  )
}
