import * as React from 'react'
import { cn } from '@/lib/utils'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Focus: the border turns accent and a soft 3px halo sits directly against it. The old
          // ring-2 + ring-offset-2 drew a white gap between two blue lines, which read as a heavy
          // double outline — and it did not match Select, whose trigger only recolors its border.
          'border-input bg-background file:text-foreground placeholder:text-muted-foreground flex h-9 w-full rounded-md border px-3 py-2 text-sm transition-[border-color,box-shadow] file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:border-[var(--primary)] focus-visible:shadow-[0_0_0_3px_var(--focus-ring)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }
