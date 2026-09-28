import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePerson } from '../context/PersonContext'
import { useDueReminders } from '../lib/useDueReminders'
import { useInstallPrompt } from '../lib/install'
import { notifyOverdueOnce } from '../lib/reminderNotify'
import ThemeToggle from './ThemeToggle'
import Logo from './Logo'

function navClass({ isActive }) {
  return [
    'inline-flex min-h-[44px] items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-100'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100',
  ].join(' ')
}

export default function Layout({ children }) {
  const { person, setPerson } = usePerson()
  const navigate = useNavigate()
  const due = useDueReminders(person?.id)
  const { canInstall, iosHint, promptInstall } = useInstallPrompt()
  const [showInstallTip, setShowInstallTip] = useState(false)
  const [showInstallNudge, setShowInstallNudge] = useState(false)

  // Przypominacz instalacji: pokazuj raz na ~7 dni, dopóki aplikacja nie jest
  // zainstalowana (bez instalacji nie ma powiadomień w tle).
  useEffect(() => {
    if (!canInstall && !iosHint) return undefined
    const KEY = 'skin-tracker:install-nudge'
    let last = 0
    try {
      last = Number(localStorage.getItem(KEY)) || 0
    } catch {
      last = 0
    }
    if (Date.now() - last > 7 * 24 * 60 * 60 * 1000) setShowInstallNudge(true)
    return undefined
  }, [canInstall, iosHint])

  const dismissInstallNudge = () => {
    try {
      localStorage.setItem('skin-tracker:install-nudge', String(Date.now()))
    } catch {
      /* ignorujemy */
    }
    setShowInstallNudge(false)
  }

  const handleInstallClick = () => {
    if (canInstall) promptInstall()
    else setShowInstallTip((v) => !v)
  }

  // Lekkie przypomnienie: jedno powiadomienie dziennie, gdy są zaległe kontrole
  // (tylko przy otwartej aplikacji; bez Web Push).
  useEffect(() => {
    notifyOverdueOnce(due.overdue)
  }, [due.overdue])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setPerson(null)
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 lg:max-w-6xl">
          <Link
            to="/"
            className="inline-flex items-center gap-2 font-semibold text-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:text-teal-300"
          >
            <Logo size={24} />
            Skin Tracker
          </Link>
          <div className="flex items-center gap-2 text-sm">
            {person ? (
              <span className="hidden text-slate-600 sm:inline dark:text-slate-300">
                Osoba:{' '}
                <strong className="dark:text-slate-100">
                  {person.display_name}
                </strong>
              </span>
            ) : null}
            {canInstall || iosHint ? (
              <button
                type="button"
                onClick={handleInstallClick}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-2.5 text-sm font-medium text-teal-800 transition-colors hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200 dark:hover:bg-teal-900/60"
                title="Dodaj aplikację do ekranu początkowego"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4"
                >
                  <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
                </svg>
                Zainstaluj
              </button>
            ) : null}
            <ThemeToggle />
            <button
              type="button"
              onClick={handleSignOut}
              className="min-h-[44px] rounded-md px-2 text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:text-slate-400 dark:hover:text-slate-100"
            >
              Wyloguj
            </button>
          </div>
        </div>

        {showInstallTip ? (
          <div className="mx-auto max-w-4xl px-4 pb-3 lg:max-w-6xl">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-900 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-100">
              <span>
                Aby zainstalować na iPhone/iPad: dotknij{' '}
                <strong>Udostępnij</strong> (□↑), a potem{' '}
                <strong>„Dodaj do ekranu początkowego"</strong>.
              </span>
              <button
                type="button"
                onClick={() => setShowInstallTip(false)}
                className="min-h-[44px] rounded-md px-3 font-medium text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:text-teal-200"
              >
                Zamknij
              </button>
            </div>
          </div>
        ) : null}

        {person ? (
          <nav className="mx-auto flex max-w-4xl flex-wrap gap-2 px-4 pb-2 lg:max-w-6xl">
            <NavLink to={`/person/${person.id}`} end className={navClass}>
              Mapa ciała
            </NavLink>
            <NavLink to={`/person/${person.id}/list`} className={navClass}>
              Lista znamion
            </NavLink>
            <NavLink to={`/person/${person.id}/reminders`} className={navClass}>
              Kontrole
              {due.overdue > 0 ? (
                <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">
                  {due.overdue}
                </span>
              ) : due.soon > 0 ? (
                <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-teal-100 px-1.5 text-xs font-semibold text-teal-800 dark:bg-teal-900 dark:text-teal-100">
                  {due.soon}
                </span>
              ) : null}
            </NavLink>
          </nav>
        ) : null}

        {showInstallNudge && (canInstall || iosHint) ? (
          <div className="border-t border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/40">
            <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm text-teal-900 lg:max-w-6xl dark:text-teal-100">
              <span>
                Zainstaluj aplikację, żeby dostawać{' '}
                <strong>powiadomienia o kontrolach</strong>. Bez instalacji
                zostaną tylko przypomnienia w kalendarzu.
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="min-h-[44px] rounded-lg bg-teal-700 px-3 font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:bg-teal-600 dark:hover:bg-teal-500"
                >
                  Zainstaluj
                </button>
                <button
                  type="button"
                  onClick={dismissInstallNudge}
                  className="min-h-[44px] rounded-lg px-3 font-medium text-teal-800 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:text-teal-200"
                >
                  Nie teraz
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-4xl lg:max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-4xl lg:max-w-6xl px-4 py-6 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        Narzędzie wyłącznie do dokumentacji i porównywania zdjęć w czasie. Nie
        diagnozuje i nie ocenia zmian — decyzje medyczne zawsze podejmuj z
        lekarzem.
      </footer>
    </div>
  )
}
