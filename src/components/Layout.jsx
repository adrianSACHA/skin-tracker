import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
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
  const location = useLocation()

  // Nawigacja jest związana z KONKRETNĄ osobą (adresy zawierają jej id),
  // więc pokazujemy ją tylko wewnątrz osoby. Na ekranie „Wybierz osobę”
  // prowadziłaby do poprzednio wybranej osoby — a na telefonie nie było
  // nawet widać, której (ticket 14, ustalenie 2).
  const wOsobie = location.pathname.startsWith('/person/')
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
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-2 lg:max-w-6xl">
          <Link
            to="/"
            className="inline-flex min-w-0 items-center gap-2 font-semibold text-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:text-teal-300"
          >
            <Logo size={24} />
            <span className="truncate">Skin Tracker</span>
          </Link>
          <div className="flex flex-shrink-0 items-center gap-2 text-sm">
            {canInstall || iosHint ? (
              <button
                type="button"
                onClick={handleInstallClick}
                aria-label="Zainstaluj aplikację"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-md border border-teal-200 bg-teal-50 px-2.5 text-sm font-medium text-teal-800 transition-colors hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-200 dark:hover:bg-teal-900/60"
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
                <span className="hidden sm:inline">Zainstaluj</span>
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

        {person && wOsobie ? (
          <nav className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 px-4 pb-2 lg:max-w-6xl">
            {/* W czyjej dokumentacji jesteś — widoczne TAKŻE na telefonie
                (wcześniej nazwa osoby była ukryta poniżej 640 px) i klikalne,
                żeby świadomie zmienić osobę. */}
            <Link
              to="/"
              title="Zmień osobę"
              aria-label={`Osoba: ${person.display_name}. Zmień osobę`}
              className="inline-flex min-h-[44px] max-w-[9rem] items-center gap-1 rounded-md border border-slate-300 px-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <span className="truncate">{person.display_name}</span>
              <span aria-hidden="true" className="text-slate-400">
                ▾
              </span>
            </Link>
            <NavLink to={`/person/${person.id}`} end className={navClass}>
              <span className="sm:hidden">Mapa</span>
              <span className="hidden sm:inline">Mapa ciała</span>
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

      </header>

      <main className="mx-auto w-full max-w-4xl lg:max-w-6xl flex-1 px-4 py-4">
        {children}
      </main>
      {/* Komunikaty o instalacji trzymamy NA DOLE, poza nagłówkiem: na telefonie
          nagłówek zjadał 43% ekranu, zanim cokolwiek było widać (przycisk
          „Zainstaluj” wypychał wiersz do dwóch linii, a baner dokładał 129 px).
          Na krótkich ekranach `main` ma `flex-1`, więc i tak lądują przy dolnej
          krawędzi. */}
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
                  className="min-h-[44px] rounded-lg bg-teal-700 px-3 font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:bg-teal-700 dark:hover:bg-teal-800"
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


      {/* Zastrzeżenie dla CAŁEJ aplikacji w jednym miejscu (zasada z ADR-0001).
          Bez powtórek na poszczególnych ekranach i ciaśniejsze: wcześniej
          zajmowało 107 px na każdym ekranie (ticket 13). Treść zostaje. */}
      <footer className="mx-auto w-full max-w-4xl px-4 py-3 text-[11px] leading-snug text-slate-500 lg:max-w-6xl dark:text-slate-400">
        Tylko do dokumentacji i porównywania zdjęć. Nie diagnozuje ani nie
        ocenia zmian — decyzje medyczne podejmuj z lekarzem.
      </footer>
    </div>
  )
}
