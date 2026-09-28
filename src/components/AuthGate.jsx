import { lazy, Suspense, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import LoadingFallback from './LoadingFallback'
import Logo from './Logo'

const Login = lazy(() => import('./Login'))

// Blokuje cały widok aplikacji bez zalogowania.
// Wzorzec 1:1 z repo numizmatycznego (session === undefined = stan ładowania).
export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession)
      }
    )

    return () => listener.subscription.unsubscribe()
  }, [])

  if (session === undefined) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 dark:bg-slate-950"
        role="status"
        aria-live="polite"
        aria-label="Sprawdzanie dostępu"
      >
        <Logo
          size={72}
          className="motion-safe:animate-pulse motion-reduce:opacity-90"
        />
        <p className="mt-5 text-base font-semibold text-slate-800 dark:text-slate-100">
          Wczytywanie aplikacji…
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Sprawdzanie dostępu i przygotowywanie danych
        </p>
      </div>
    )
  }

  if (!session) {
    return (
      <Suspense fallback={<LoadingFallback label="Wczytywanie…" />}>
        <Login />
      </Suspense>
    )
  }

  return children
}
