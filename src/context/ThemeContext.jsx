import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'skin-tracker:theme'

const ThemeContext = createContext(null)

// Tryb jasny/ciemny: sterowany klasą .dark na <html>, zapamiętywany w localStorage.
// Wartość początkowa jest też ustawiana inline w index.html, żeby uniknąć mignięcia.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme musi być użyty wewnątrz <ThemeProvider>.')
  return ctx
}
