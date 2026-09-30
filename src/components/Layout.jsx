import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePerson } from '../context/PersonContext'
import { useDueReminders } from '../lib/useDueReminders'
import { useInstallPrompt } from '../lib/install'
import { notifyOverdueOnce } from '../lib/reminderNotify'
import Logo from './Logo'
import OverflowMenu from './OverflowMenu'
import { useTheme } from '../context/ThemeContext'

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

  // Menu globalne (ikona „≡", nie „⋯" — „⋯" w tej aplikacji znaczy „akcje na
  // tym obiekcie"). Zbiera wszystko, co nie jest nawigacją: zmianę osoby,
  // motyw, instalację i wylogowanie.
  const { theme, toggleTheme } = useTheme()
  const menuItems = [
    ...(person
      ? [
          {
            key: 'person',
            label: `Zmień osobę (${person.display_name})`,
            onSelect: () => navigate('/'),
          },
          { key: 'sep-person', separator: true },
        ]
      : []),
    {
      key: 'theme',
      label: theme === 'dark' ? 'Motyw: jasny' : 'Motyw: ciemny',
      onSelect: toggleTheme,
    },
    ...(canInstall || iosHint
      ? [
          {
            key: 'install',
            label: 'Zainstaluj aplikację',
            onSelect: handleInstallClick,
          },
        ]
      : []),
    { key: 'sep-end', separator: true },
    { key: 'logout', label: 'Wyloguj', onSelect: handleSignOut },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {/* JEDEN wiersz: marka + zakładki + menu globalne. Wcześniej były dwa
            wiersze (marka z kontrolkami, potem pasek zakładek), a nazwa osoby
            dublowała odnośnik logo — oba prowadziły do wyboru osoby. */}
        <div className="mx-auto flex max-w-4xl items-center gap-1 px-4 py-2 lg:max-w-6xl">
          {/* Marka bez odnośnika: „do domu" prowadzi zakładka Mapa, a zmianę
              osoby ma się świadomie wybrać z menu. */}
          <span className="inline-flex flex-shrink-0 items-center gap-2 font-semibold text-teal-800 dark:text-teal-300">
            <Logo size={28} />
            <span className="hidden sm:inline">Skin Tracker</span>
          </span>

          {person && wOsobie ? (
            <nav className="ml-1 flex min-w-0 flex-1 items-center gap-1">
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
          ) : (
            <div className="flex-1" />
          )}

          <OverflowMenu
            label={
              person && wOsobie
                ? `Menu. Osoba: ${person.display_name}`
                : 'Menu aplikacji'
            }
            items={menuItems}
            visibleLabel={person && wOsobie ? person.display_name : ''}
            icon="≡"
            buttonClassName="inline-flex min-h-[44px] flex-shrink-0 items-center gap-1.5 rounded-md border border-slate-300 px-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          />
        </div>
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
