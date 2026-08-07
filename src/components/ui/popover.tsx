import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'

import { cn } from '@/lib/utils'

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    /**
     * Portal target. Pass the dialog content node when this popover lives inside a modal Dialog, so
     * it renders WITHIN the dialog's react-remove-scroll subtree — otherwise (portaled to body) the
     * scroll lock swallows mouse-wheel scrolling inside the popover (only scrollbar-drag works).
     */
    container?: HTMLElement | null
  }
>(({ className, align = 'center', sideOffset = 4, container, ...props }, ref) => (
  <PopoverPrimitive.Portal container={container ?? undefined}>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-72 rounded-[6px] border border-[var(--border-color-pro)] bg-[var(--card-bg)] p-4 text-[var(--text-primary)] shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none',
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent }
