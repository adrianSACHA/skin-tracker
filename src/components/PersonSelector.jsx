import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { removePersonFiles } from '../lib/uploadPhoto'
import { formatDate } from '../lib/date'
import { pluralPl, summarizePerson } from '../lib/summary'
import { usePerson } from '../context/PersonContext'
import OverflowMenu from './OverflowMenu'
import ConfirmDialog from './ConfirmDialog'

// Znamiona pogrupowane po osobie - jedno zapytanie obsługuje wszystkie karty.
function groupByPerson(lesions) {
  const map = {}
  for (const lesion of lesions) {
    if (!map[lesion.person_id]) map[lesion.person_id] = []
    map[lesion.person_id].push(lesion)
  }
  return map
}

// Linia z liczbami na karcie osoby: znamiona, zdjęcia i najbliższa kontrola.
// Gdy termin już minął, data na czerwono + plakietka „zaległe”.
function PersonSummaryLine({ summary }) {
  if (!summary) return null

  if (summary.lesionCount === 0) {
    return (
      <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
        Brak znamion
      </span>
    )
  }

  return (
    <span className="mt-1 block text-sm text-slate-600 dark:text-slate-300">
      {summary.lesionCount}{' '}
      {pluralPl(summary.lesionCount, 'znamię', 'znamiona', 'znamion')}
      {' · '}
      {summary.photoCount}{' '}
      {pluralPl(summary.photoCount, 'zdjęcie', 'zdjęcia', 'zdjęć')}
      {summary.next ? (
        <>
          {' · kontrola '}
          <strong
            className={
              summary.overdue
                ? 'text-red-700 dark:text-red-300'
                : 'text-slate-700 dark:text-slate-200'
            }
          >
            {formatDate(summary.next)}
          </strong>
          {' '}
          {summary.overdue ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
              zaległe
            </span>
          ) : null}
        </>
      ) : null}
    </span>
  )
}

// Ekran wyboru osoby ("Ja" / "Syn"). Syn nie ma własnego konta —
// jest osobą zarządzaną przez moje konto.
export default function PersonSelector() {
  const [persons, setPersons] = useState([])
  const [lesionsByPerson, setLesionsByPerson] = useState({})
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [error, setError] = useState(null)
  const [adding, setAdding] = useState(false)
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { setPerson } = usePerson()
  const navigate = useNavigate()

  const load = async () => {
    setLoading(true)
    setError(null)

    const [personsRes, lesionsRes] = await Promise.all([
      supabase
        .from('monitored_persons')
        .select('*')
        .order('created_at', { ascending: true }),
      // Jedno zapytanie na wszystkie osoby - karta pokazuje liczby i termin.
      supabase
        .from('lesions')
        .select('id, person_id, next_check_at, lesion_photos(taken_at)'),
    ])

    if (personsRes.error) setError(personsRes.error.message)
    else setPersons(personsRes.data || [])

    // Brak znamion (albo błąd odczytu) nie może psuć ekranu - karta pokaże 0.
    setLesionsByPerson(groupByPerson(lesionsRes.data || []))

    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  // Liczby + najbliższy termin dla każdej karty (liczone raz, nie w renderze).
  const summaries = useMemo(() => {
    const out = {}
    for (const person of persons) {
      out[person.id] = summarizePerson(lesionsByPerson[person.id] || [], {
        intervalWeeks: person.interval_weeks,
      })
    }
    return out
  }, [persons, lesionsByPerson])

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

  const startRename = (person) => {
    setError(null)
    setEditId(person.id)
    setEditName(person.display_name)
  }

  const saveName = async (person) => {
    const name = editName.trim()
    if (!name) return
    setSavingEdit(true)
    setError(null)
    const { error: updErr } = await supabase
      .from('monitored_persons')
      .update({ display_name: name })
      .eq('id', person.id)
    setSavingEdit(false)
    if (updErr) {
      setError(updErr.message)
      return
    }
    setEditId(null)
    toast.success('Nazwa zmieniona')
    load()
  }

  const runDelete = async (person) => {
    if (!person) return
    setDeleting(true)
    setError(null)
    // Najpierw pliki ze Storage (rekurencyjnie), potem rekord osoby — kaskada
    // w bazie usunie jej znamiona i zdjęcia.
    try {
      await removePersonFiles(person.id)
    } catch {
      /* best effort */
    }
    const { error: delErr } = await supabase
      .from('monitored_persons')
      .delete()
      .eq('id', person.id)
    setDeleting(false)
    setConfirmDelete(null)
    if (delErr) {
      setError(delErr.message)
      return
    }
    toast.success('Osoba usunięta')
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
            <li key={person.id} className="relative">
              {editId === person.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    saveName(person)
                  }}
                  className="rounded-xl border border-teal-300 bg-white p-3 dark:border-teal-700 dark:bg-slate-900"
                >
                  <label
                    htmlFor="rename-person"
                    className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
                  >
                    Nazwa osoby
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <input
                      id="rename-person"
                      type="text"
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="min-h-[44px] min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      disabled={savingEdit || !editName.trim()}
                      className="min-h-[44px] rounded-lg bg-teal-700 px-3 font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-300 dark:bg-teal-600 dark:hover:bg-teal-500 dark:disabled:bg-slate-700"
                    >
                      {savingEdit ? 'Zapisywanie…' : 'Zapisz'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditId(null)}
                      className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Anuluj
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => choose(person)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-4 pr-14 text-left transition-colors hover:border-teal-400 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-600 dark:hover:bg-teal-950/40"
                >
                  <span className="block text-lg font-semibold text-slate-800 dark:text-slate-100">
                    {person.display_name}
                  </span>
                  <PersonSummaryLine summary={summaries[person.id]} />
                  <span className="mt-1 block text-sm text-teal-700 dark:text-teal-300">
                    Otwórz mapę ciała &gt;
                  </span>
                </button>
              )}

              {editId === person.id ? null : (
                <div className="absolute right-2 top-2">
                  <OverflowMenu
                    label={'Akcje osoby ' + person.display_name}
                    items={[
                      {
                        key: 'rename',
                        label: 'Zmień nazwę',
                        onSelect: () => startRename(person),
                      },
                      { key: 'sep', separator: true },
                      {
                        key: 'delete',
                        label: 'Usuń osobę',
                        danger: true,
                        onSelect: () => setConfirmDelete(person),
                      },
                    ]}
                  />
                </div>
              )}
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

      <ConfirmDialog
        open={Boolean(confirmDelete)}
        busy={deleting}
        title="Usunąć tę osobę?"
        description={
          'Usunięte zostaną też wszystkie znamiona tej osoby oraz ich zdjęcia. ' +
          'Tej operacji nie można cofnąć.'
        }
        confirmLabel="Tak, usuń osobę"
        onConfirm={() => runDelete(confirmDelete)}
        onCancel={() => {
          if (!deleting) setConfirmDelete(null)
        }}
      />
    </div>
  )
}
