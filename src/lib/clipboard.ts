/**
 * Copy text to the clipboard, working on BOTH secure (HTTPS/localhost) and insecure
 * (plain HTTP, e.g. http://172.18.9.1) origins. `navigator.clipboard` exists ONLY in a
 * secure context; on insecure origins it is undefined, so we fall back to the legacy
 * hidden-textarea + `execCommand('copy')` path. Returns whether the copy actually happened,
 * so callers only claim success when the clipboard really changed.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (window.isSecureContext && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // secure-context copy denied/failed → try the legacy path below
  }
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok
  } catch {
    return false
  }
}
