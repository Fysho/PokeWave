import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeDebug() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-50">
      <div>Theme: {theme}</div>
      <div>Resolved: {resolvedTheme}</div>
      <div>HTML classes: {document.documentElement.className}</div>
      <button 
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="mt-2 px-2 py-1 bg-white/20 rounded"
      >
        Toggle
      </button>
    </div>
  )
}