import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
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
import {
  BODY_AREAS,
  CUSTOM_AREA,
  areaLabel,
  areaOrder,
  isPredefinedArea,
  nextLesionLabel,
  slugify,
} from '../lib/bodyAreas'
import { usePerson } from '../context/PersonContext'
import LesionInfoPanel from './LesionInfoPanel'
import ConfirmDialog from './ConfirmDialog'

// Subskrybuje zmiany transformu (zoom). Render-prop nie odświeża się sam,
// a potrzebujemy aktualnej skali do przeciwskali pinów i wskaźnika %.
function ZoomScaleWatcher({ onChange }) {
  useTransformEffect((ref) => {
    onChange(ref.state.scale)
  })
  return null
}

// Menu „⋯" w nagłówku widoku mapy (akcje tła + ustawienia widoku).
// Własna implementacja (brak biblioteki menu): zamyka się na Escape i klik
// poza, fokus wraca do przycisku-triggera.
function OverflowMenu({ label, items }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)
  const btnRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        btnRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={btnRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => setOpen((v) => !v)}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-xl leading-none text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
      >
        ⋯
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-60 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {items.map((item) =>
            item.separator ? (
              <div
                key={item.key}
                role="separator"
                className="my-1 h-px bg-slate-200 dark:bg-slate-700"
              />
            ) : (
              <button
                key={item.key}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  item.onSelect()
                }}
                className={[
                  'block w-full px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-300',
                  item.danger
                    ? 'text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700',
                ].join(' ')}
              >
                {item.label}
              </button>
            )
          )}
        </div>
      ) : null}
    </div>
  )
}

// Wczytaj zdjęcie z góry (poza DOM), żeby poznać jego wymiary i zarezerwować
// miejsce — inaczej treść pod mapą „skacze", gdy zdjęcie doładuje się po
// skeletonie. URL jest cache'owany, więc realny <img> pojawi się od razu.
function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => reject(new Error('Nie udało się wczytać zdjęcia.'))
    img.src = url
  })
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

  const [refState, setRefState] = useState({ view: null, url: null })
  // Zapamiętany stosunek boków zdjęcia (do wysokości skeletona) — kolumny ciała
  // zwykle mają ten sam format, więc kolejne przełączenia nie „skaczą".
  const lastAspectRef = useRef('3 / 4')
  const [uploadingRef, setUploadingRef] = useState(false)
  const [deletingRef, setDeletingRef] = useState(false)
  const [refConfirm, setRefConfirm] = useState(false)
  const [showAddView, setShowAddView] = useState(false)
  const [addViewKey, setAddViewKey] = useState('')
  const [customAreaName, setCustomAreaName] = useState('')
  const [showViewSettings, setShowViewSettings] = useState(false)
  const [renameSelect, setRenameSelect] = useState('')
  const [renameCustom, setRenameCustom] = useState('')
  const [savingView, setSavingView] = useState(false)
  const [viewDeleteConfirm, setViewDeleteConfirm] = useState(false)
  const [deletingView, setDeletingView] = useState(false)
  const fileInputRef = useRef(null) // zmiana tła: wybór z plików
  const cameraInputRef = useRef(null) // zmiana tła: aparat
  const addInputRef = useRef(null) // dodawanie widoku: wybór z plików
  const addCameraRef = useRef(null) // dodawanie widoku: aparat
  const pointerRef = useRef(null) // start wciśnięcia - rozróżnia klik od przesuwania
  const [scale, setScale] = useState(1) // aktualna skala zoomu tła
  const [selectedId, setSelectedId] = useState(null) // wybrany pin -> panel akcji
  const [pulse, setPulse] = useState(null) // { id, n } - re-trigger animacji pinu
  const [hoveredId, setHoveredId] = useState(null) // tooltip przy pinie (desktop)
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
      supabase
        .from('lesions')
        .select('*, lesion_photos(taken_at, photo_url)')
        .eq('person_id', personId),
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
  // Etykieta widoku ze słownika okolic (albo własna nazwa, gdy spoza słownika).
  const availableViews = useMemo(
    () =>
      bodyMaps
        .filter((m) => m.image_url)
        .map((m) => ({ key: m.view_name, label: areaLabel(m.view_name) }))
        .sort(
          (a, b) =>
            areaOrder(a.key) - areaOrder(b.key) ||
            a.label.localeCompare(b.label)
        ),
    [bodyMaps]
  )

  // Okolice bez zdjęcia tła - można je dodać przez "+ Dodaj widok".
  const viewsToAdd = useMemo(
    () => BODY_AREAS.filter((a) => !viewByKey[a.key]?.image_url),
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

  // Rozwiąż signed URL zdjęcia referencyjnego i WSTĘPNIE je wczytaj (poza DOM),
  // żeby poznać wymiary. `refState.view` mówi, dla jakiego widoku rozwiązano
  // URL — dzięki temu przy zmianie zakładki widzimy skeleton (a nie zdjęcie
  // innego widoku) aż nowe zdjęcie faktycznie się wczyta.
  useEffect(() => {
    let active = true
    const view = activeView

    async function resolve() {
      if (!currentMap?.image_url) {
        if (active) setRefState({ view, url: null })
        return
      }
      try {
        const url = await getSignedUrl(currentMap.image_url)
        const dims = await preloadImage(url).catch(() => ({}))
        if (!active) return
        if (dims.w && dims.h) lastAspectRef.current = `${dims.w} / ${dims.h}`
        setRefState({ view, url })
      } catch {
        if (active) setRefState({ view, url: null })
      }
    }

    resolve()
    return () => {
      active = false
    }
  }, [activeView, currentMap?.image_url])

  // Esc zamyka modal ustawień widoku.
  useEffect(() => {
    if (!showViewSettings) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') setShowViewSettings(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showViewSettings])

  // Zapamiętaj start wciśnięcia, żeby odróżnić klik od przesuwania zdjęcia.
  const handlePointerDown = (e) => {
    pointerRef.current = { x: e.clientX, y: e.clientY }
  }

  const handleImageClick = (e) => {
    if (!currentMap) return
    if (!addMode) {
      // Klik w tło mapy odznacza aktywny pin.
      setSelectedId(null)
      return
    }
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
      // Nazwa z prefiksu okolicy + numer (można nadpisać ręcznie).
      label: nextLesionLabel(activeView, mapLesions),
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

    toast.success('Znamię dodane')
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
      setCustomAreaName('')
      if (fileInputRef.current) fileInputRef.current.value = ''
      if (addInputRef.current) addInputRef.current.value = ''
    }
  }

  const runDeleteRef = async () => {
    if (!currentMap?.image_url) return

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

      setRefState({ view: null, url: null })
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingRef(false)
      setRefConfirm(false)
    }
  }

  // --- Ustawienia widoku: zmiana nazwy okolicy + usunięcie widoku ---
  const openViewSettings = () => {
    if (!currentMap) return
    const predefined = isPredefinedArea(currentMap.view_name)
    setRenameSelect(predefined ? currentMap.view_name : CUSTOM_AREA)
    setRenameCustom(predefined ? '' : currentMap.view_name)
    setShowViewSettings(true)
  }

  const closeViewSettings = () => {
    setShowViewSettings(false)
    setSavingView(false)
  }

  const saveViewRename = async () => {
    if (!currentMap) return
    const nextKey =
      renameSelect === CUSTOM_AREA ? slugify(renameCustom) : renameSelect
    if (!nextKey) {
      setError('Podaj nazwę okolicy ciała.')
      return
    }
    if (nextKey === currentMap.view_name) {
      closeViewSettings()
      return
    }
    if (bodyMaps.some((m) => m.view_name === nextKey && m.id !== currentMap.id)) {
      setError('Widok o tej nazwie już istnieje.')
      return
    }
    setSavingView(true)
    setError(null)
    const { error: updErr } = await supabase
      .from('body_maps')
      .update({ view_name: nextKey })
      .eq('id', currentMap.id)

    if (updErr) {
      setSavingView(false)
      setError(updErr.message)
      return
    }
    // Ticket 02: prefiks nazw znamion jest niezmienny — NIE przepisujemy
    // istniejących `lesions.label`. Nowe znamiona dostaną nowy prefiks.
    setView(nextKey)
    closeViewSettings()
    toast.success('Nazwa widoku zmieniona')
    await load()
  }

  // Usunięcie widoku = rekord `body_maps` + wszystkie znamiona tego widoku
  // (i ich pliki). Wymaga potwierdzenia, bo kasuje też znamiona (ticket 07).
  const runDeleteView = async () => {
    if (!currentMap) return
    setDeletingView(true)
    setError(null)

    const mapId = currentMap.id
    const bgPath = currentMap.image_url
    const viewLesions = lesions.filter((l) => l.body_map_id === mapId)
    const photoPaths = viewLesions.flatMap((l) =>
      (l.lesion_photos || []).map((p) => p.photo_url)
    )

    try {
      // `lesions.body_map_id` jest `on delete set null`, więc rekord widoku
      // usuwamy PO znamionach — inaczej zostałyby osierocone (bez widoku).
      if (viewLesions.length > 0) {
        const { error: delLesionsErr } = await supabase
          .from('lesions')
          .delete()
          .eq('body_map_id', mapId)
        if (delLesionsErr) throw delLesionsErr
      }
      const { error: delMapErr } = await supabase
        .from('body_maps')
        .delete()
        .eq('id', mapId)
      if (delMapErr) throw delMapErr

      // Best-effort: sprzątanie plików (tło + zdjęcia znamion).
      for (const path of [bgPath, ...photoPaths]) {
        if (!path) continue
        try {
          await removeStorageFile(path)
        } catch {
          /* plik mógł już nie istnieć - ignorujemy */
        }
      }

      setView(null)
      setViewDeleteConfirm(false)
      closeViewSettings()
      toast.success('Widok usunięty')
      await load()
    } catch (err) {
      setError(err.message)
    } finally {
      setDeletingView(false)
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
    setSelectedId(lesion.id)
    // Re-trigger animacji pulsowania klikniętego pinu (+ sprzątanie po animacji).
    setPulse((p) => ({ id: lesion.id, n: (p?.id === lesion.id ? p.n : 0) + 1 }))
    window.setTimeout(() => {
      setPulse((p) => (p && p.id === lesion.id ? null : p))
    }, 450)
  }

  const updateLesionStatus = async (id, status) => {
    const { error: updErr } = await supabase
      .from('lesions')
      .update({ status })
      .eq('id', id)
    if (updErr) {
      setError(updErr.message)
      return
    }
    setLesions((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)))
    toast.success('Zmiany zapisane')
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
    toast.success('Zmiany zapisane')
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
      toast.success('Zmiany zapisane')
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

  const currentViewLabel = areaLabel(activeView)
  const hasViews = availableViews.length > 0
  // Zdjęcie referencyjne aktywnego widoku — pokazujemy je tylko, gdy URL został
  // rozwiązany dla TEGO widoku; inaczej (zmiana zakładki) widzimy ładowanie.
  const refUrl = refState.view === activeView ? refState.url : null
  const refLoading =
    Boolean(currentMap?.image_url) && refState.view !== activeView
  // Docelowa okolica dla „+ Dodaj widok": klucz słownika albo własna nazwa.
  const addViewTarget =
    addViewKey === CUSTOM_AREA ? customAreaName.trim() : addViewKey

  // `inputRef` wybiera źródło: aparat (capture) albo plik. Walidacja wspólna.
  const startAddViewUpload = (inputRef) => {
    if (!addViewTarget) {
      setError('Podaj nazwę okolicy ciała.')
      return
    }
    // Blokujemy tylko okolicę, która MA już zdjęcie tła. Wiersz bez zdjęcia
    // (np. po „Usuń zdjęcie tła") tylko zaktualizujemy przy uploadzie.
    if (viewByKey[addViewTarget]?.image_url) {
      setError('Taki widok już istnieje — wybierz inną okolicę.')
      return
    }
    inputRef.current?.click()
  }

  const openAddView = () => {
    setAddViewKey((k) =>
      viewsToAdd.some((v) => v.key === k)
        ? k
        : viewsToAdd[0]?.key || CUSTOM_AREA
    )
    setCustomAreaName('')
    setError(null)
    setShowAddView(true)
  }

  // Dodawanie widoku to osobny ekran — nie pokazujemy przy tym bieżącego widoku
  // (mapy ani zakładek), żeby nie mylić z dodawaniem znamienia.
  if (showAddView) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setShowAddView(false)}
          className="inline-flex items-center text-sm font-medium text-teal-700 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:text-teal-300"
        >
          ← Mapa ciała
        </button>
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Dodaj widok{person ? ` — ${person.display_name}` : ''}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Wybierz okolicę ciała i wgraj zdjęcie referencyjne. Znamiona dodasz
            później, w tym widoku.
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

        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="add-view"
              className="text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Okolica ciała
            </label>
            <select
              id="add-view"
              value={addViewKey || viewsToAdd[0]?.key || CUSTOM_AREA}
              onChange={(e) => setAddViewKey(e.target.value)}
              className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {viewsToAdd.map((v) => (
                <option key={v.key} value={v.key}>
                  {v.label}
                </option>
              ))}
              <option value={CUSTOM_AREA}>Inna okolica (własna nazwa)…</option>
            </select>
          </div>

          {addViewKey === CUSTOM_AREA ? (
            <div className="flex flex-col gap-1">
              <label
                htmlFor="add-view-custom"
                className="text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Własna nazwa okolicy
              </label>
              <input
                id="add-view-custom"
                type="text"
                value={customAreaName}
                onChange={(e) => setCustomAreaName(e.target.value)}
                placeholder="np. „Plecy prawa”"
                className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-1 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => startAddViewUpload(addCameraRef)}
              disabled={uploadingRef || !addViewTarget}
              className="min-h-[44px] rounded-lg bg-teal-700 px-4 font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 disabled:cursor-not-allowed disabled:bg-gray-300 dark:bg-teal-600 dark:hover:bg-teal-500 dark:disabled:bg-slate-700"
            >
              {uploadingRef ? 'Wysyłanie…' : 'Zrób zdjęcie'}
            </button>
            <button
              type="button"
              onClick={() => startAddViewUpload(addInputRef)}
              disabled={uploadingRef || !addViewTarget}
              className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Wybierz z plików
            </button>
            <button
              type="button"
              onClick={() => setShowAddView(false)}
              disabled={uploadingRef}
              className="min-h-[44px] rounded-lg px-4 font-medium text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 disabled:opacity-60 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Anuluj
            </button>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Zdjęcie trafi jako tło tego widoku. Jeśli okolica istnieje już bez
            zdjęcia, tło zostanie do niej dodane.
          </p>
        </div>

        <input
          ref={addInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleRefUpload(e, addViewTarget)}
          className="hidden"
        />
        <input
          ref={addCameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleRefUpload(e, addViewTarget)}
          className="hidden"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Strefa widoków: zakładki + „+ Dodaj widok".
          To osobna strefa od akcji znamion („+ Dodaj znamię" jest przy mapie). */}
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
              'min-h-[44px] rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300',
              activeView === v.key
                ? 'bg-teal-700 text-white dark:bg-teal-600'
                : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800',
            ].join(' ')}
          >
            {v.label}
          </button>
        ))}
        <button
          type="button"
          onClick={openAddView}
          className={
            hasViews
              ? 'min-h-[44px] rounded-full border border-dashed border-slate-300 px-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
              : 'min-h-[52px] rounded-lg bg-teal-700 px-5 text-base font-semibold text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:bg-teal-600 dark:hover:bg-teal-500'
          }
        >
          + Dodaj widok
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            Mapa ciała{person ? ` — ${person.display_name}` : ''}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Kliknij pin, aby otworzyć szczegóły znamienia.
          </p>
        </div>

        {/* Akcje bieżącego widoku: „+ Dodaj znamię" + menu „⋯".
            „+ Dodaj widok" jest osobno — w strefie zakładek (nie tutaj). */}
        <div className="flex flex-wrap items-center gap-2">
          {hasViews ? (
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
                !currentMap
                  ? 'cursor-not-allowed bg-gray-300 dark:bg-slate-700'
                  : '',
              ].join(' ')}
              title={!currentMap ? 'Najpierw dodaj zdjęcie referencyjne' : ''}
            >
              {addMode ? 'Anuluj dodawanie' : '+ Dodaj znamię'}
            </button>
          ) : null}

          {hasViews ? (
            <OverflowMenu
              label="Więcej akcji widoku"
              items={[
                {
                  key: 'change-bg-camera',
                  label: uploadingRef
                    ? 'Wysyłanie…'
                    : 'Zmień zdjęcie tła (aparat)',
                  onSelect: () => cameraInputRef.current?.click(),
                },
                {
                  key: 'change-bg-file',
                  label: 'Zmień zdjęcie tła (plik)',
                  onSelect: () => fileInputRef.current?.click(),
                },
                ...(currentMap?.image_url
                  ? [
                      {
                        key: 'remove-bg',
                        label: deletingRef
                          ? 'Usuwanie…'
                          : 'Usuń zdjęcie tła',
                        danger: true,
                        onSelect: () => setRefConfirm(true),
                      },
                    ]
                  : []),
                { key: 'separator', separator: true },
                {
                  key: 'view-settings',
                  label: 'Ustawienia widoku…',
                  onSelect: openViewSettings,
                },
              ]}
            />
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleRefUpload(e, activeView)}
            className="hidden"
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleRefUpload(e, activeView)}
            className="hidden"
          />
        </div>
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

      {/* Layout (pkt layout): mobile = 1 kolumna; desktop (lg) = mapa + panel obok */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:gap-6">
        <div className="lg:mx-auto lg:w-full lg:max-w-[700px]">
      {/* Obszar mapy */}
      {refLoading ? (
        <div role="status" aria-live="polite" className="space-y-3">
          <span className="sr-only">
            Wczytywanie widoku „{currentViewLabel}”…
          </span>
          <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            {/* Pasek narzędzi mapy */}
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="h-4 w-44 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="flex items-center gap-1">
                <div className="h-11 w-11 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="h-11 w-12 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-11 w-11 rounded-lg bg-slate-200 dark:bg-slate-800" />
                <div className="h-11 w-20 rounded-lg bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
            {/* Zdjęcie referencyjne + piny */}
            <div
              className="relative w-full overflow-hidden rounded-lg bg-slate-200 dark:bg-slate-800"
              style={{ aspectRatio: lastAspectRef.current }}
            >
              <div className="absolute left-[30%] top-[25%] h-4 w-4 rounded-full bg-slate-300 dark:bg-slate-700" />
              <div className="absolute left-[64%] top-[52%] h-4 w-4 rounded-full bg-slate-300 dark:bg-slate-700" />
              <div className="absolute left-[44%] top-[74%] h-4 w-4 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>
          </div>
        </div>
      ) : !refUrl ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
          {activeView ? (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Brak zdjęcia referencyjnego dla widoku „{currentViewLabel}”.
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Wgraj zdjęcie tła, aby korzystać z tego widoku.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Brak widoków ciała.
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
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
                      className="h-11 w-11 rounded-lg border border-slate-300 bg-white text-lg font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
                      className="h-11 w-11 rounded-lg border border-slate-300 bg-white text-lg font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => utils.resetTransform()}
                      className="ml-1 min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
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
                      const isSel = selectedId === lesion.id
                      const showTip = (hoveredId === lesion.id || selectedId === lesion.id) && !inMove
                      return (
                        <Fragment key={lesion.id}>
                        <button
                          type="button"
                          onPointerDown={(e) => {
                            if (inMove) startPinDrag(e, lesion)
                            else e.stopPropagation()
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            openPanel(lesion)
                          }}
                          onMouseEnter={() => setHoveredId(lesion.id)}
                          onMouseLeave={() =>
                            setHoveredId((h) => (h === lesion.id ? null : h))
                          }
                          onFocus={() => setHoveredId(lesion.id)}
                          onBlur={() =>
                            setHoveredId((h) => (h === lesion.id ? null : h))
                          }
                          aria-label={`${lesion.label} — ${meta.label}`}
                          className={[
                            'pin-hit absolute h-5 w-5 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-400',
                            isSel
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-teal-500 dark:ring-offset-teal-400'
                              : 'ring-2 ring-white hover:ring-teal-300 dark:ring-slate-900',
                            inMove ? 'cursor-move' : '',
                          ].join(' ')}
                          style={{
                            left: `${dragging ? drag.x : lesion.pos_x}%`,
                            top: `${dragging ? drag.y : lesion.pos_y}%`,
                            transform: `translate(-50%, -50%) scale(${inv})`,
                            backgroundColor: meta.dot,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                          }}
                        >
                          {isSel && pulse?.id === lesion.id ? (
                            <span
                              key={pulse.n}
                              aria-hidden="true"
                              className="pin-pulse pointer-events-none absolute inset-0 block rounded-full"
                            />
                          ) : null}
                        </button>

                        {/* Tooltip (desktop) - ten sam układ co piny, więc
                            trzyma się pina przy zoomie/panie. */}
                        {showTip ? (
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute"
                            style={{
                              left: `${dragging ? drag.x : lesion.pos_x}%`,
                              top: `${dragging ? drag.y : lesion.pos_y}%`,
                              transform: `translate(-50%, -50%) scale(${inv})`,
                            }}
                          >
                            <span className="pin-tip absolute bottom-full left-1/2 mb-3 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-lg dark:bg-slate-100 dark:text-slate-900">
                              {lesion.label}
                            </span>
                          </span>
                        ) : null}
                        </Fragment>
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

          </div>

        {/* Prawa kolumna: panel informacyjny (sticky na desktopie) */}
        <div className="mt-4 lg:mt-0 lg:sticky lg:top-4">
          <LesionInfoPanel
            lesion={selectedLesion}
            editForm={editForm}
            onEditFormChange={setEditForm}
            onSaveEdit={saveEdit}
            savingEdit={savingEdit}
            onStartEdit={startEdit}
            onCancelEdit={() => setEditForm(null)}
            onOpenDetail={() =>
              selectedLesion &&
              navigate(`/person/${personId}/lesion/${selectedLesion.id}`, {
                state: { from: 'map' },
              })
            }
            onStartMove={() => {
              setEditForm(null)
              setMoveModeId(selectedLesion.id)
            }}
            moveModeId={moveModeId}
            onStatusChange={(status) =>
              selectedLesion && updateLesionStatus(selectedLesion.id, status)
            }
            onClose={closePanel}
          />
        </div>

      {/* Formularz nowego pinu */}
      {pending ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            savePending()
          }}
          className="space-y-3 rounded-xl border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-800 dark:bg-teal-950/30"
        >
          <div>
            <label
              htmlFor="new-lesion-label"
              className="block text-sm font-medium text-teal-800 dark:text-teal-200"
            >
              Nazwa znamienia (możesz nadpisać)
            </label>
            <p className="mt-0.5 text-xs text-teal-700 dark:text-teal-300">
              Okolica „{currentViewLabel}” nadała prefiks · nowa pozycja:{' '}
              {pending.pos_x}% / {pending.pos_y}%
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="new-lesion-label"
              type="text"
              autoFocus
              value={pending.label}
              onChange={(e) =>
                setPending((p) => ({ ...p, label: e.target.value }))
              }
              placeholder="np. „znamię przy łopatce”"
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
      </div>

      {/* Legenda — etykiety spójne z resztą UI (jedno źródło: status.js). */}
      <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-500 dark:text-slate-400">
        {STATUSES.map((key) => {
          const meta = statusMeta(key)
          return (
            <span key={key} className="inline-flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: meta.dot }}
                aria-hidden="true"
              />
              {meta.label}
            </span>
          )
        })}
      </div>

      {/* Potwierdzenie usunięcia tła - spójne z usuwaniem znamienia/zdjęcia
          (własny modal zamiast natywnego window.confirm). */}
      <ConfirmDialog
        open={refConfirm}
        busy={deletingRef}
        title="Usunąć zdjęcie tła?"
        description="Usunięte zostanie tylko zdjęcie tła tego widoku. Piny znamion i ich historia pozostaną zachowane."
        confirmLabel="Tak, usuń zdjęcie tła"
        onConfirm={runDeleteRef}
        onCancel={() => {
          if (!deletingRef) setRefConfirm(false)
        }}
      />

      {/* Panel ustawień widoku (ticket 06: modal). Zmiana nazwy okolicy +
          usunięcie widoku (ticket 07/12). */}
      {showViewSettings && currentMap ? (
        <div
          role="presentation"
          onClick={closeViewSettings}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="view-settings-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between gap-2">
              <h2
                id="view-settings-title"
                className="text-lg font-semibold text-slate-800 dark:text-slate-100"
              >
                Ustawienia widoku
              </h2>
              <button
                type="button"
                onClick={closeViewSettings}
                className="rounded-md px-2 py-1 text-sm text-slate-500 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 dark:text-slate-300 dark:hover:text-slate-100"
              >
                Zamknij
              </button>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Widok: <strong>{currentViewLabel}</strong> · znamion:{' '}
              {mapLesions.length}
            </p>

            <div className="space-y-2">
              <label
                htmlFor="rename-area"
                className="block text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                Okolica ciała
              </label>
              <select
                id="rename-area"
                value={renameSelect || CUSTOM_AREA}
                onChange={(e) => setRenameSelect(e.target.value)}
                className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {BODY_AREAS.map((a) => (
                  <option key={a.key} value={a.key}>
                    {a.label}
                  </option>
                ))}
                <option value={CUSTOM_AREA}>Inna okolica (własna nazwa)…</option>
              </select>
              {renameSelect === CUSTOM_AREA ? (
                <input
                  type="text"
                  value={renameCustom}
                  onChange={(e) => setRenameCustom(e.target.value)}
                  placeholder="np. „Plecy prawa”"
                  aria-label="Własna nazwa okolicy"
                  className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-1 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              ) : null}
              <button
                type="button"
                onClick={saveViewRename}
                disabled={savingView}
                className="min-h-[44px] rounded-lg bg-teal-700 px-4 font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 disabled:opacity-60 dark:bg-teal-600 dark:hover:bg-teal-500"
              >
                {savingView ? 'Zapisywanie…' : 'Zapisz nazwę'}
              </button>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Zmiana nazwy nie przepisuje nazw istniejących znamion — nowe
                znamiona dostaną nowy prefiks.
              </p>
            </div>

            <div className="space-y-2 rounded-lg border border-red-200 p-3 dark:border-red-900/60">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Usunięcie widoku kasuje też wszystkie znamiona w nim
                ({mapLesions.length}) i ich zdjęcia.
              </p>
              <button
                type="button"
                onClick={() => setViewDeleteConfirm(true)}
                className="min-h-[44px] rounded-lg border border-red-200 bg-white px-4 font-medium text-red-700 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-200 dark:border-red-900 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40"
              >
                Usuń widok
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Potwierdzenie usunięcia widoku (kasuje też znamiona) */}
      <ConfirmDialog
        open={viewDeleteConfirm}
        busy={deletingView}
        title="Usunąć widok?"
        description={`Usunięty zostanie widok „${currentViewLabel}” oraz ${mapLesions.length} znamion w nim (wraz z ich zdjęciami). Tej operacji nie można cofnąć.`}
        confirmLabel="Tak, usuń widok"
        onConfirm={runDeleteView}
        onCancel={() => {
          if (!deletingView) setViewDeleteConfirm(false)
        }}
      />
    </div>
  )
}
