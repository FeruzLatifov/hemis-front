import { memo } from 'react'

/** Highlight matching text */
export const HighlightText = memo(({ text, search }: { text: string; search: string }) => {
  if (!search || !text) return <>{text}</>
  const idx = text.toLowerCase().indexOf(search.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-yellow-100 px-0.5 dark:bg-yellow-900/40">
        {text.slice(idx, idx + search.length)}
      </mark>
      {text.slice(idx + search.length)}
    </>
  )
})
HighlightText.displayName = 'HighlightText'
