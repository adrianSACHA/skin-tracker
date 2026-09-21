import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { usePerson } from '../context/PersonContext'

// Ekran wyboru osoby ("Ja" / "Syn"). Syn nie ma własnego konta —
// jest osobą zarządzaną przez moje konto.
export default function PersonSelector() {
  const [persons, setPersons] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState(null)
  const [adding, setAdding] = useState(false)
  const { setPerson } = usePerson()
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    const { data, error: loadError } = await supabase
      .from('monitored_persons')
      .select('*')
      .order('created_at', { ascending: true })

    if (loadError) setError(loadError.message)
    else setPersons(data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    setError(null)
    setAdding(true)

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
      setError('Brak zalogowania.')
      setAdding(false)
      return
    }

    const { error: insertError } = await supabase
      .from('monitored_persons')
      .insert({ owner_user_id: userData.user.id, display_name: newName.trim() })

    setAdding(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setNewName('')
    load()
  }

  const choose = (person) => {
    setPerson(person)
    navigate(`/person/${person.id}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
          Wybierz osobę
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Dla kogo chcesz teraz prowadzić dokumentację?
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Wczytywanie osób…
        </p>
      ) : persons.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Brak osób. Dodaj pierwszą osobę poniżej (np. „Ja”).
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {persons.map((person) => (
            <li key={person.id}>
              <button
                type="button"
                onClick={() => choose(person)}
                className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-teal-400 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-600 dark:hover:bg-teal-950/40"
              >
                <span className="block text-lg font-semibold text-slate-800 dark:text-slate-100">
                  {person.display_name}
                </span>
                <span className="mt-1 block text-sm text-teal-700 dark:text-teal-300">
                  Otwórz mapę ciała →
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleAdd}
        className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      >
        <label
          htmlFor="new-person"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          Dodaj osobę
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="new-person"
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="np. Ja"
            className="min-h-[44px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={adding || !newName.trim()}
            className="min-h-[44px] rounded-lg bg-teal-700 px-4 font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:bg-teal-600 dark:hover:bg-teal-500 dark:disabled:bg-slate-700"
          >
            {adding ? 'Dodawanie…' : 'Dodaj'}
          </button>
        </div>
      </form>
    </div>
  )
}
