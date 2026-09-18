import { Link, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePerson } from '../context/PersonContext'

function navClass({ isActive }) {
  return [
    'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-teal-100 text-teal-800'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
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
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="font-semibold text-teal-800">
            Skin Tracker
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {person ? (
              <span className="hidden text-slate-600 sm:inline">
                Profil: <strong>{person.display_name}</strong>
              </span>
            ) : null}
            <button
              type="button"
              onClick={handleSignOut}
              className="min-h-[36px] rounded-md px-2 text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300"
            >
              Wyloguj
            </button>
          </div>
        </div>

        {person ? (
          <nav className="mx-auto flex max-w-4xl gap-2 px-4 pb-2">
            <NavLink to={`/person/${person.id}`} end className={navClass}>
              Mapa ciała
            </NavLink>
            <NavLink to={`/person/${person.id}/list`} className={navClass}>
              Lista znamion
            </NavLink>
          </nav>
        ) : null}
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        {children}
      </main>

      <footer className="mx-auto w-full max-w-4xl px-4 py-6 text-xs leading-relaxed text-slate-400">
        Narzędzie wyłącznie do dokumentacji i porównywania zdjęć w czasie. Nie
        diagnozuje i nie ocenia zmian — decyzje medyczne zawsze podejmuj z
        lekarzem.
      </footer>
    </div>
  )
}
