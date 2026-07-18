import type { ReactNode } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

interface DetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Accessible title — becomes the Sheet's aria-labelledby target (required). */
  title: ReactNode
  /** Optional sub-line under the title (e.g. an ID). */
  description?: ReactNode
  /** Optional leading icon rendered next to the title. */
  icon?: ReactNode
  /** Optional sticky footer (e.g. a Close/Save button row). */
  footer?: ReactNode
  side?: 'right' | 'left'
  /** Width utility override; defaults to a roomy detail width. */
  widthClassName?: string
  children: ReactNode
}

/**
 * Shared detail slide-over. Built on the Radix-backed Sheet so every drawer gets
 * focus trap, focus restoration, Escape-to-close, scroll lock, and aria-modal
 * for free — the 20+ hand-rolled fixed-overlay drawers had none of these.
 *
 * Content scrolls in the middle; header and footer stay pinned.
 */
export function DetailDrawer({
  open,
  onOpenChange,
  title,
  description,
  icon,
  footer,
  side = 'right',
  widthClassName = 'w-full max-w-2xl sm:max-w-2xl',
  children,
}: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn('gap-0 p-0', widthClassName)}
        // Radix warns when a Dialog has no description; opt out explicitly when
        // this drawer doesn't render one (SheetDescription auto-wires when it does).
        {...(description ? {} : { 'aria-describedby': undefined })}
      >
        <SheetHeader className="flex-row items-center gap-3 border-b p-6 text-left">
          {icon}
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate">{title}</SheetTitle>
            {description ? (
              <SheetDescription className="truncate">{description}</SheetDescription>
            ) : null}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {footer ? <SheetFooter className="border-t p-6">{footer}</SheetFooter> : null}
      </SheetContent>
    </Sheet>
  )
}

export default DetailDrawer
