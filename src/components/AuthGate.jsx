import { lazy, Suspense, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import LoadingFallback from './LoadingFallback'

const Login = lazy(() => import('./Login'))

// Blokuje cały widok aplikacji bez aktywnej sesji.
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
        className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4"
        role="status"
        aria-live="polite"
        aria-label="Sprawdzanie dostępu"
      >
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Obracający się pierścień */}
          <div className="absolute inset-0 rounded-full border-[5px] border-teal-900/20 border-t-teal-900 motion-safe:animate-spin" />
          {/* Nieruchomy symbol "znamienia" */}
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-teal-700 bg-gradient-to-br from-teal-300 via-teal-500 to-teal-700 shadow-md">
            <span
              aria-hidden="true"
              className="h-4 w-4 rounded-full bg-teal-950/80"
            />
          </div>
        </div>
        <p className="mt-5 text-base font-semibold text-gray-800">
          Wczytywanie aplikacji…
        </p>
        <p className="mt-1 text-sm text-gray-500">
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
