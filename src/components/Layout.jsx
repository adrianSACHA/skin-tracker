import { Link, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePerson } from '../context/PersonContext'
import ThemeToggle from './ThemeToggle'

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

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setPerson(null)
    navigate('/')
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-4xl lg:max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/"
            className="font-semibold text-teal-800 dark:text-teal-300"
          >
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

        {person ? (
          <nav className="mx-auto flex max-w-4xl lg:max-w-6xl gap-2 px-4 pb-2">
            <NavLink to={`/person/${person.id}`} end className={navClass}>
              Mapa ciała
            </NavLink>
            <NavLink to={`/person/${person.id}/list`} className={navClass}>
              Lista znamion
            </NavLink>
            <NavLink to={`/person/${person.id}/reminders`} className={navClass}>
              Kontrole
            </NavLink>
          </nav>
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
