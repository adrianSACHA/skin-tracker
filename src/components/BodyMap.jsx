import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  getSignedUrl,
  removeStorageFile,
  uploadBodyMapImage,
} from '../lib/uploadPhoto'
import { statusMeta } from '../lib/status'
import { usePerson } from '../context/PersonContext'

const VIEWS = [
  { key: 'front', label: 'Przód' },
  { key: 'back', label: 'Tył' },
  { key: 'left', label: 'Bok lewy' },
  { key: 'right', label: 'Bok prawy' },
  { key: 'legs_front', label: 'Nogi — przód' },
  { key: 'legs_back', label: 'Nogi — tył' },
]

export default function BodyMap() {
  const { personId } = useParams()
  const { setPerson } = usePerson()
  const navigate = useNavigate()

  const [view, setView] = useState('front')
  const [person, setLocalPerson] = useState(null)
  const [bodyMaps, setBodyMaps] = useState([])
  const [lesions, setLesions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [addMode, setAddMode] = useState(false)
  const [pending, setPending] = useState(null) // { pos_x, pos_y, label }
  const [savingPin, setSavingPin] = useState(false)

  const [refUrl, setRefUrl] = useState(null)
  const [uploadingRef, setUploadingRef] = useState(false)
  const [deletingRef, setDeletingRef] = useState(false)
  const fileInputRef = useRef(null)

  const load = async () => {
    setLoading(true)
    setError(null)

    const [personRes, mapsRes, lesionsRes] = await Promise.all([
      supabase
        .from('monitored_persons')
        .select('*')
        .eq('id', personId)
        .maybeSingle(),
      supabase.from('body_maps').select('*').eq('person_id', personId),
      supabase.from('lesions').select('*').eq('person_id', personId),
    ])

    if (personRes.error) setError(personRes.error.message)
    if (personRes.data) {
      setLocalPerson(personRes.data)
      setPerson(personRes.data) // aktualizuje kontekst (przetrwa odświeżenie)
    }
    setBodyMaps(mapsRes.data || [])
    setLesions(lesionsRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId])

  const currentMap = useMemo(
    () => bodyMaps.find((m) => m.view_name === view) || null,
    [bodyMaps, view]
  )

  const mapLesions = useMemo(
    () => lesions.filter((l) => l.body_map_id === (currentMap?.id ?? null)),
    [lesions, currentMap]
  )

  // Rozwiąż signed URL zdjęcia referencyjnego dla wybranego widoku.
  useEffect(() => {
    let active = true
    if (currentMap?.image_url) {
      getSignedUrl(currentMap.image_url)
        .then((url) => {
          if (active) setRefUrl(url)
        })
        .catch(() => {
          if (active) setRefUrl(null)
        })
    } else {
      setRefUrl(null)
    }
    return () => {
      active = false
    }
  }, [currentMap?.image_url])

  const handleImageClick = (e) => {
    if (!addMode || !currentMap) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPending({
      pos_x: Number(x.toFixed(2)),
      pos_y: Number(y.toFixed(2)),
      label: '',
    })
  }

  const savePending = async () => {
    if (!pending || !pending.label.trim() || !currentMap) return
    setSavingPin(true)

    const { error: insertError } = await supabase.from('lesions').insert({
      person_id: personId,
      body_map_id: currentMap.id,
      label: pending.label.trim(),
      pos_x: pending.pos_x,
      pos_y: pending.pos_y,
      status: 'new',
    })

    setSavingPin(false)

    if (insertError) {
      setError(insertError.message)
      return
    }

    setPending(null)
    setAddMode(false)
    load()
  }

  const handleRefUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingRef(true)
    setError(null)

    try {
      const path = await uploadBodyMapImage({ file, personId, view })
      if (currentMap) {
        const { error: updateError } = await supabase
          .from('body_maps')
          .update({ image_url: path })
          .eq('id', currentMap.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('body_maps')
          .insert({ person_id: personId, view_name: view, image_url: path })
        if (insertError) throw insertError
      }
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploadingRef(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRefDelete = async () => {
    if (!currentMap?.image_url) return
    const confirmed = window.confirm(
      'Usunąć zdjęcie tła dla tego widoku? Piny znamion zostaną zachowane.'
    )
    if (!confirmed) return

    setDeletingRef(true)
    setError(null)

    const path = currentMap.image_url

    try {
      // Zerujemy tylko obraz tła - rekord widoku i przypisania znamion zostają.
      const { error: updateError } = await supabase
        .from('body_maps')
        .update({ image_url: null })
        .eq('id', currentMap.id)
      if (updateError) throw updateError

      // Best-effort: usuń plik z prywatnego bucketu.
      try {
        await removeStorageFile(path)
      } catch {
        /* plik mógł już nie istnieć - ignorujemy */
      }

      setRefUrl(null)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingRef(false)
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Wczytywanie mapy ciała…
      </p>
    )
  }

  const currentViewLabel = VIEWS.find((v) => v.key === view)?.label

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Mapa ciała{person ? ` — ${person.display_name}` : ''}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kliknij pin, aby otworzyć szczegóły znamienia.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPending(null)
              setAddMode((v) => !v)
            }}
            disabled={!currentMap}
            className={[
              'min-h-[44px] rounded-lg px-4 font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300',
              addMode
                ? 'bg-teal-800 text-white hover:bg-teal-900 dark:bg-teal-500 dark:hover:bg-teal-400'
                : 'bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500',
              !currentMap ? 'cursor-not-allowed bg-gray-300 dark:bg-slate-700' : '',
            ].join(' ')}
            title={!currentMap ? 'Najpierw dodaj zdjęcie referencyjne' : ''}
          >
            {addMode ? 'Anuluj dodawanie' : '+ Dodaj znamię'}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingRef}
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {uploadingRef
              ? 'Wysyłanie…'
              : currentMap?.image_url
                ? 'Zmień zdjęcie tła'
                : 'Dodaj zdjęcie tła'}
          </button>
          {currentMap?.image_url ? (
            <button
              type="button"
              onClick={handleRefDelete}
              disabled={deletingRef}
              className="min-h-[44px] rounded-lg border border-red-200 bg-white px-4 font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 disabled:opacity-60 dark:border-red-900 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              {deletingRef ? 'Usuwanie…' : 'Usuń zdjęcie tła'}
            </button>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleRefUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Zakładki widoków */}
      <div className="flex flex-wrap gap-2">
        {VIEWS.map((v) => {
          const hasMap = bodyMaps.some(
            (m) => m.view_name === v.key && m.image_url
          )
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => {
                setView(v.key)
                setPending(null)
                setAddMode(false)
              }}
              className={[
                'min-h-[40px] rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300',
                view === v.key
                  ? 'bg-teal-700 text-white dark:bg-teal-600'
                  : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800',
              ].join(' ')}
            >
              {v.label}
              {hasMap ? '' : ' ·'}
            </button>
          )
        })}
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}

      {addMode ? (
        <p className="rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800 dark:bg-teal-950/40 dark:text-teal-200">
          Tryb dodawania aktywny — kliknij w zdjęciu w miejscu znamienia.
        </p>
      ) : null}

      {/* Obszar mapy */}
      {!refUrl ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Brak zdjęcia referencyjnego dla widoku „{currentViewLabel}”.
          </p>
          <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
            Dodaj zdjęcie danej okolicy ciała (przód/tył/bok/nogi), a
            następnie rozmieszczaj na nim znamiona.
          </p>
        </div>
      ) : (
        <div className="relative inline-block w-full select-none">
          <img
            src={refUrl}
            alt={`Zdjęcie referencyjne — ${currentViewLabel}`}
            onClick={handleImageClick}
            className={[
              'block w-full rounded-xl border border-slate-200 bg-black/5 dark:border-slate-800 dark:bg-black/40',
              addMode ? 'cursor-crosshair' : 'cursor-default',
            ].join(' ')}
            draggable="false"
          />

          {mapLesions.map((lesion) => {
            const meta = statusMeta(lesion.status)
            return (
              <button
                key={lesion.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/person/${personId}/lesion/${lesion.id}`)
                }}
                title={lesion.label}
                aria-label={`${lesion.label} — ${meta.label}`}
                className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white transition-transform hover:scale-125 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-400 dark:ring-slate-900"
                style={{
                  left: `${lesion.pos_x}%`,
                  top: `${lesion.pos_y}%`,
                  backgroundColor: meta.dot,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                }}
              />
            )
          })}
        </div>
      )}

      {/* Formularz nowego pinu */}
      {pending ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            savePending()
          }}
          className="space-y-3 rounded-xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-800 dark:bg-teal-950/30"
        >
          <p className="text-sm font-medium text-teal-800 dark:text-teal-200">
            Nowe znamię @ {pending.pos_x}% / {pending.pos_y}%
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              autoFocus
              value={pending.label}
              onChange={(e) =>
                setPending((p) => ({ ...p, label: e.target.value }))
              }
              placeholder="Nazwa/opis, np. „plecy, prawa łopatka”"
              className="min-h-[44px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={savingPin || !pending.label.trim()}
              className="min-h-[44px] rounded-lg bg-teal-700 px-4 font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:bg-teal-600 dark:hover:bg-teal-500 dark:disabled:bg-slate-700"
            >
              {savingPin ? 'Zapisywanie…' : 'Zapisz znamię'}
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Anuluj
            </button>
          </div>
        </form>
      ) : null}

      {/* Legenda */}
      <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500 dark:text-slate-400">
        {Object.entries({
          stable: 'Stabilne',
          watch: 'Do obserwacji',
          urgent: 'Do pilnej konsultacji',
          new: 'Nowe',
          removed: 'Usunięte',
        }).map(([key, label]) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: statusMeta(key).dot }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
