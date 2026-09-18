import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  TransformComponent,
  TransformWrapper,
  useTransformEffect,
} from 'react-zoom-pan-pinch'
import { supabase } from '../lib/supabase'
import {
  getSignedUrl,
  removeStorageFile,
  uploadBodyMapImage,
} from '../lib/uploadPhoto'
import { STATUSES, statusMeta } from '../lib/status'
import { usePerson } from '../context/PersonContext'
import StatusBadge from './StatusBadge'

const VIEWS = [
  { key: 'front', label: 'Przód' },
  { key: 'back', label: 'Tył' },
  { key: 'left', label: 'Bok lewy' },
  { key: 'right', label: 'Bok prawy' },
  { key: 'legs_front', label: 'Nogi — przód' },
  { key: 'legs_back', label: 'Nogi — tył' },
]

// Subskrybuje zmiany transformu (zoom). Render-prop nie odświeża się sam,
// a potrzebujemy aktualnej skali do przeciwskali pinów i wskaźnika %.
function ZoomScaleWatcher({ onChange }) {
  useTransformEffect((ref) => {
    onChange(ref.state.scale)
  })
  return null
}

export default function BodyMap() {
  const { personId } = useParams()
  const { setPerson } = usePerson()
  const navigate = useNavigate()

  const [view, setView] = useState(null)
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
  const [showAddView, setShowAddView] = useState(false)
  const [addViewKey, setAddViewKey] = useState('')
  const fileInputRef = useRef(null)
  const addInputRef = useRef(null)
  const pointerRef = useRef(null) // start wciśnięcia - rozróżnia klik od przesuwania
  const [scale, setScale] = useState(1) // aktualna skala zoomu tła
  const [selectedId, setSelectedId] = useState(null) // wybrany pin -> panel akcji
  const [editForm, setEditForm] = useState(null) // { label, status }
  const [moveModeId, setMoveModeId] = useState(null) // pin w trybie przesuwania
  const [drag, setDrag] = useState(null) // { id, x, y } podczas przeciągania
  const [savingEdit, setSavingEdit] = useState(false)
  const contentDivRef = useRef(null)

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

  const viewByKey = useMemo(
    () => Object.fromEntries(bodyMaps.map((m) => [m.view_name, m])),
    [bodyMaps]
  )

  // Pkt 1: pokazujemy TYLKO widoki mające aktualnie zdjęcie tła.
  const availableViews = useMemo(
    () => VIEWS.filter((v) => viewByKey[v.key]?.image_url),
    [viewByKey]
  )

  // Widoki bez zdjęcia tła - można je dodać przez "+ Dodaj widok".
  const viewsToAdd = useMemo(
    () => VIEWS.filter((v) => !viewByKey[v.key]?.image_url),
    [viewByKey]
  )

  // Wybrany widok, o ile nadal istnieje; inaczej pierwszy dostępny.
  const activeView = useMemo(() => {
    if (view && availableViews.some((v) => v.key === view)) return view
    return availableViews[0]?.key ?? null
  }, [view, availableViews])

  const currentMap = activeView ? viewByKey[activeView] || null : null

  const mapLesions = useMemo(
    () => lesions.filter((l) => l.body_map_id === (currentMap?.id ?? null)),
    [lesions, currentMap]
  )

  // Rozwiąż signed URL zdjęcia referencyjnego dla aktywnego widoku.
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

  // Zapamiętaj start wciśnięcia, żeby odróżnić klik od przesuwania zdjęcia.
  const handlePointerDown = (e) => {
    pointerRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleImageClick = (e) => {
    if (!addMode || !currentMap) return
    const start = pointerRef.current
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 6) {
      return // to było przesuwanie (pan), nie klik
    }
    // Współrzędne liczone względem prostokąta obrazu - odporne na zoom/pan,
    // bo transformacja jest jednorodna (skala + przesunięcie).
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setPending({
      pos_x: Number(Math.min(100, Math.max(0, x)).toFixed(2)),
      pos_y: Number(Math.min(100, Math.max(0, y)).toFixed(2)),
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

  const handleRefUpload = async (e, targetView) => {
    const file = e.target.files?.[0]
    if (!file || !targetView) return
    setUploadingRef(true)
    setError(null)

    const existing = viewByKey[targetView] || null

    try {
      const path = await uploadBodyMapImage({
        file,
        personId,
        view: targetView,
      })
      if (existing) {
        const { error: updateError } = await supabase
          .from('body_maps')
          .update({ image_url: path })
          .eq('id', existing.id)
        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('body_maps')
          .insert({ person_id: personId, view_name: targetView, image_url: path })
        if (insertError) throw insertError
      }
      setView(targetView)
      setShowAddView(false)
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploadingRef(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (addInputRef.current) addInputRef.current.value = ''
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

  // --- Punkt 3: panel akcji pinu, edycja, przesuwanie ---
  const selectedLesion = useMemo(
    () => lesions.find((l) => l.id === selectedId) || null,
    [lesions, selectedId]
  )

  const closePanel = () => {
    setSelectedId(null)
    setEditForm(null)
    setMoveModeId(null)
  }

  const openPanel = (lesion) => {
    if (moveModeId === lesion.id) return // w trybie przesuwania klik nie otwiera panelu
    setPending(null)
    setAddMode(false)
    setEditForm(null)
    setSelectedId((id) => (id === lesion.id ? null : lesion.id))
  }

  const startEdit = (lesion) => {
    setMoveModeId(null)
    setEditForm({ label: lesion.label, status: lesion.status })
  }

  const saveEdit = async () => {
    if (!selectedLesion || !editForm) return
    const label = editForm.label.trim()
    if (!label) {
      setError('Nazwa znamienia nie może być pusta.')
      return
    }
    setSavingEdit(true)
    const { error: updErr } = await supabase
      .from('lesions')
      .update({ label, status: editForm.status })
      .eq('id', selectedLesion.id)
    setSavingEdit(false)
    if (updErr) {
      setError(updErr.message)
      return
    }
    // Aktualizacja lokalna (bez przeładowania mapy).
    setLesions((prev) =>
      prev.map((l) =>
        l.id === selectedLesion.id ? { ...l, label, status: editForm.status } : l
      )
    )
    setEditForm(null)
  }

  // Przeciąganie pinu w trybie "Przesuń".
  const startPinDrag = (e, lesion) => {
    if (!contentDivRef.current) return
    e.preventDefault()
    e.stopPropagation()
    const rect = contentDivRef.current.getBoundingClientRect()
    let last = null
    const move = (ev) => {
      const x = Math.min(
        100,
        Math.max(0, ((ev.clientX - rect.left) / rect.width) * 100)
      )
      const y = Math.min(
        100,
        Math.max(0, ((ev.clientY - rect.top) / rect.height) * 100)
      )
      last = { x: Number(x.toFixed(2)), y: Number(y.toFixed(2)) }
      setDrag({ id: lesion.id, ...last })
    }
    const up = async () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      setDrag(null)
      setMoveModeId(null)
      if (!last) return
      const { error: updErr } = await supabase
        .from('lesions')
        .update({ pos_x: last.x, pos_y: last.y })
        .eq('id', lesion.id)
      if (updErr) {
        setError(updErr.message)
        return
      }
      setLesions((prev) =>
        prev.map((l) =>
          l.id === lesion.id ? { ...l, pos_x: last.x, pos_y: last.y } : l
        )
      )
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Wczytywanie mapy ciała…
      </p>
    )
  }

  const currentViewLabel = VIEWS.find((v) => v.key === activeView)?.label

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
            disabled={uploadingRef || !activeView}
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {uploadingRef ? 'Wysyłanie…' : 'Zmień zdjęcie tła'}
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
            onChange={(e) => handleRefUpload(e, activeView)}
            className="hidden"
          />
          <input
            ref={addInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleRefUpload(e, addViewKey)}
            className="hidden"
          />
        </div>
      </div>

      {/* Zakładki widoków - tylko te z aktualnym zdjęciem tła (pkt 1) */}
      <div className="flex flex-wrap items-center gap-2">
        {availableViews.map((v) => (
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
              activeView === v.key
                ? 'bg-teal-700 text-white dark:bg-teal-600'
                : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800',
            ].join(' ')}
          >
            {v.label}
          </button>
        ))}

        {viewsToAdd.length > 0 ? (
          <button
            type="button"
            onClick={() => {
              setAddViewKey((k) =>
                viewsToAdd.some((v) => v.key === k) ? k : viewsToAdd[0].key
              )
              setShowAddView((s) => !s)
            }}
            className="min-h-[40px] rounded-full border border-dashed border-slate-300 px-4 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {showAddView ? 'Zamknij' : '+ Dodaj widok'}
          </button>
        ) : null}
      </div>

      {/* Panel dodawania nowego widoku (bez zdjęcia tła) */}
      {showAddView && viewsToAdd.length > 0 ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
          <label
            htmlFor="add-view"
            className="text-slate-700 dark:text-slate-200"
          >
            Nowy widok
          </label>
          <select
            id="add-view"
            value={addViewKey || viewsToAdd[0].key}
            onChange={(e) => setAddViewKey(e.target.value)}
            className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            {viewsToAdd.map((v) => (
              <option key={v.key} value={v.key}>
                {v.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => addInputRef.current?.click()}
            disabled={uploadingRef}
            className="min-h-[40px] rounded-lg bg-teal-700 px-4 font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            {uploadingRef ? 'Wysyłanie…' : 'Wgraj zdjęcie'}
          </button>
        </div>
      ) : null}

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
          {activeView ? (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Brak zdjęcia referencyjnego dla widoku „{currentViewLabel}”.
              </p>
              <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                Wgraj zdjęcie tła, aby korzystać z tego widoku.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Brak widoków ciała.
              </p>
              <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                Kliknij „+ Dodaj widok”, wybierz okolicę ciała i wgraj zdjęcie
                referencyjne, aby zacząć.
              </p>
            </>
          )}
        </div>
      ) : (
        <TransformWrapper
          minScale={1}
          maxScale={6}
          centerOnInit
          doubleClick={{ disabled: true }}
          wheel={{ step: 0.15 }}
          panning={{ disabled: Boolean(moveModeId) }}
        >
          {(utils) => {
            const inv = 1 / scale // przeciwskala, żeby piny nie rosły przy zoomie
            return (
              <>
                <ZoomScaleWatcher onChange={setScale} />
                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-slate-500 dark:text-slate-400">
                    Przybliż (kółko / pinch) i przesuń, aby precyzyjnie trafić
                    {addMode ? ' — tryb dodawania aktywny' : ''}.
                  </span>
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => utils.zoomOut()}
                      aria-label="Oddal"
                      className="h-9 w-9 rounded-lg border border-slate-300 bg-white text-lg font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      −
                    </button>
                    <span className="w-12 text-center text-xs text-slate-500 dark:text-slate-400">
                      {Math.round(scale * 100)}%
                    </span>
                    <button
                      type="button"
                      onClick={() => utils.zoomIn()}
                      aria-label="Przybliż"
                      className="h-9 w-9 rounded-lg border border-slate-300 bg-white text-lg font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => utils.resetTransform()}
                      className="ml-1 min-h-[36px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      Dopasuj
                    </button>
                  </div>
                </div>

                <TransformComponent
                  wrapperClass="rounded-xl border border-slate-200 bg-black/5 dark:border-slate-800 dark:bg-black/40"
                  wrapperStyle={{
                    width: '100%',
                    height: 'auto',
                    overflow: 'hidden',
                  }}
                  contentStyle={{ width: '100%' }}
                >
                  <div
                    ref={contentDivRef}
                    className="relative w-full select-none"
                    onPointerDown={handlePointerDown}
                    onClick={handleImageClick}
                    style={addMode ? { cursor: 'crosshair' } : undefined}
                  >
                    <img
                      src={refUrl}
                      alt={`Zdjęcie referencyjne — ${currentViewLabel}`}
                      className="block w-full"
                      draggable="false"
                    />

                    {mapLesions.map((lesion) => {
                      const meta = statusMeta(lesion.status)
                      const dragging = drag?.id === lesion.id
                      const inMove = moveModeId === lesion.id
                      return (
                        <button
                          key={lesion.id}
                          type="button"
                          onPointerDown={(e) => {
                            if (inMove) startPinDrag(e, lesion)
                            else e.stopPropagation()
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            openPanel(lesion)
                          }}
                          title={lesion.label}
                          aria-label={`${lesion.label} — ${meta.label}`}
                          className={[
                            'absolute h-5 w-5 rounded-full ring-2 ring-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-400 dark:ring-slate-900',
                            selectedId === lesion.id
                              ? 'ring-4 ring-teal-400'
                              : 'hover:ring-teal-300',
                            inMove ? 'cursor-move' : '',
                          ].join(' ')}
                          style={{
                            left: `${dragging ? drag.x : lesion.pos_x}%`,
                            top: `${dragging ? drag.y : lesion.pos_y}%`,
                            transform: `translate(-50%, -50%) scale(${inv})`,
                            backgroundColor: meta.dot,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                          }}
                        />
                      )
                    })}

                    {pending ? (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute block h-4 w-4 rounded-full border-2 border-teal-600 bg-teal-400/60"
                        style={{
                          left: `${pending.pos_x}%`,
                          top: `${pending.pos_y}%`,
                          transform: `translate(-50%, -50%) scale(${inv})`,
                        }}
                      />
                    ) : null}
                  </div>
                </TransformComponent>
              </>
            )
          }}
        </TransformWrapper>
      )}

      {/* Panel akcji wybranego pinu (pkt 3) - bez usuwania (pkt 4) */}
      {selectedLesion ? (
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selectedLesion.status} />
              <span className="font-medium text-slate-800 dark:text-slate-100">
                {selectedLesion.label}
              </span>
            </div>
            <button
              type="button"
              onClick={closePanel}
              className="rounded-md px-2 py-1 text-sm text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 dark:hover:text-slate-200"
            >
              Zamknij
            </button>
          </div>

          {editForm ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="pin-label"
                    className="mb-1 block text-sm text-slate-700 dark:text-slate-200"
                  >
                    Nazwa / opis
                  </label>
                  <input
                    id="pin-label"
                    type="text"
                    value={editForm.label}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, label: e.target.value }))
                    }
                    className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="pin-status"
                    className="mb-1 block text-sm text-slate-700 dark:text-slate-200"
                  >
                    Status
                  </label>
                  <select
                    id="pin-status"
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, status: e.target.value }))
                    }
                    className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {statusMeta(s).label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveEdit}
                  disabled={savingEdit}
                  className="min-h-[44px] rounded-lg bg-teal-700 px-4 font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:bg-teal-600 dark:hover:bg-teal-500 dark:disabled:bg-slate-700"
                >
                  {savingEdit ? 'Zapisywanie…' : 'Zapisz zmiany'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditForm(null)}
                  className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Anuluj
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  navigate(`/person/${personId}/lesion/${selectedLesion.id}`)
                }
                className="min-h-[44px] rounded-lg bg-teal-700 px-4 font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:bg-teal-600 dark:hover:bg-teal-500"
              >
                Szczegóły
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditForm(null)
                  setMoveModeId(selectedLesion.id)
                }}
                disabled={moveModeId === selectedLesion.id}
                className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {moveModeId === selectedLesion.id ? 'Przesuwanie…' : 'Przesuń'}
              </button>
              <button
                type="button"
                onClick={() => startEdit(selectedLesion)}
                className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Edytuj
              </button>
            </div>
          )}

          {moveModeId === selectedLesion.id ? (
            <p className="text-xs text-teal-700 dark:text-teal-300">
              Tryb przesuwania: przeciągnij pin na docelowe miejsce. Po
              puszczeniu pozycja zapisze się automatycznie.
            </p>
          ) : null}
        </div>
      ) : null}

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
