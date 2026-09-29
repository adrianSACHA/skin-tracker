import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { supabase } from '../lib/supabase'
import { notifyDueChanged } from '../lib/dueSignal'
import { formatDate } from '../lib/date'
import { STATUSES, statusMeta } from '../lib/status'
import { useIntervalWeeks } from '../lib/interval'
import { toast } from 'sonner'
import { removeStorageFile } from '../lib/uploadPhoto'
import { useTheme } from '../context/ThemeContext'
import SignedImage from './SignedImage'
import StatusBadge from './StatusBadge'
import LesionName from './LesionName'
import PhotoUploadForm from './PhotoUploadForm'
import CalendarReminderButton from './CalendarReminderButton'
import ConfirmDialog from './ConfirmDialog'
import OverflowMenu from './OverflowMenu'

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  )
}

export default function LesionDetail() {
  const { personId, lesionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { theme } = useTheme()

  // Skąd przyszliśmy - żeby „Wróć" cofnęło do poprzedniego widoku.
  const backBySection = {
    list: { to: `/person/${personId}/list`, label: '< Wróć do listy znamion' },
    reminders: {
      to: `/person/${personId}/reminders`,
      label: '< Wróć do kontroli',
    },
  }
  const back = backBySection[location.state?.from] || {
    to: `/person/${personId}`,
    label: '< Wróć do mapy ciała',
  }

  const [lesion, setLesion] = useState(null)
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // Wejście z zakładki „Kontrole" (przycisk „Dodaj zdjęcie") otwiera formularz.
  const [showUpload, setShowUpload] = useState(Boolean(location.state?.openUpload))
  const [confirm, setConfirm] = useState(null) // { kind: 'lesion' | 'photo', photo? }
  const [deleting, setDeleting] = useState(false)

  const [compareA, setCompareA] = useState(null) // id zdjęcia
  const [compareB, setCompareB] = useState(null)
  const [opacity, setOpacity] = useState(50)
  // Interwał kontroli jest ustawiany w JEDNYM miejscu (lista znamion) - tutaj
  // tylko odczytujemy wartość, żeby nie było dwóch rozjeżdżających się pól.
  const [intervalWeeks] = useIntervalWeeks(personId)
  const [leadDays, setLeadDays] = useState(7)
  const [enlarge, setEnlarge] = useState(null) // powiększone zdjęcie (lightbox)
  const compareRef = useRef(null)
  const compareDragRef = useRef(false)

  const inputClass =
    'min-h-[44px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'

  // "Wstecz": jeśli mamy wpisy w historii tego widoku, cofnij o krok (np. do
  // mapy ciała); w razie wejścia z linku wprost - przejdź jawnie do mapy.
  const goBack = () => {
    const idx = window.history.state?.idx
    if (typeof idx === 'number' && idx > 0) navigate(-1)
    else navigate(back.to)
  }

  // Przeciąganie uchwytu porównania (mobile: palcem, desktop: myszą).
  const setCompareFromX = (clientX) => {
    const box = compareRef.current
    if (!box) return
    const rect = box.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    setOpacity(Math.max(0, Math.min(100, Math.round(pct))))
  }

  const onCompareDown = (e) => {
    compareDragRef.current = true
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* brak pointer capture - ignorujemy */
    }
    setCompareFromX(e.clientX)
  }

  const onCompareMove = (e) => {
    if (!compareDragRef.current) return
    setCompareFromX(e.clientX)
  }

  const onCompareUp = () => {
    compareDragRef.current = false
  }

  const load = async () => {
    setLoading(true)
    setError(null)

    const [lesionRes, photosRes, personRes] = await Promise.all([
      supabase
        .from('lesions')
        .select('*, body_maps(view_name)')
        .eq('id', lesionId)
        .maybeSingle(),
      supabase
        .from('lesion_photos')
        .select('*')
        .eq('lesion_id', lesionId)
        .order('taken_at', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('monitored_persons')
        .select('*')
        .eq('id', personId)
        .maybeSingle(),
    ])

    if (lesionRes.error) setError(lesionRes.error.message)
    setLesion(lesionRes.data || null)

    const ld = personRes?.data?.reminder_lead_days
    setLeadDays(Number.isFinite(ld) ? ld : 7)

    setPhotos(photosRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesionId])

  // Domyślnie porównuj pierwsze i ostatnie zdjęcie.
  useEffect(() => {
    if (photos.length >= 1) {
      setCompareA((prev) => prev ?? photos[0].id)
      setCompareB((prev) => prev ?? photos[photos.length - 1].id)
    }
  }, [photos])

  const photoA = useMemo(
    () => photos.find((p) => p.id === compareA) || null,
    [photos, compareA]
  )
  const photoB = useMemo(
    () => photos.find((p) => p.id === compareB) || null,
    [photos, compareB]
  )

  const lastDate = photos.length ? photos[photos.length - 1].taken_at : null

  const sizeData = useMemo(
    () =>
      photos
        .filter((p) => p.size_mm !== null && p.size_mm !== undefined)
        .map((p) => ({ date: formatDate(p.taken_at), size: Number(p.size_mm) })),
    [photos]
  )

  // Tekstowe podsumowanie trendu - czytelne też dla czytników ekranu
  // (wykres sam w sobie jest tylko grafiką). Bez oceny medycznej.
  const sizeSummary = useMemo(() => {
    if (sizeData.length < 2) return null
    const first = sizeData[0]
    const last = sizeData[sizeData.length - 1]
    const diff = last.size - first.size
    const num = (n) => Number(n).toLocaleString('pl-PL', { maximumFractionDigits: 1 })
    const signed = (n) => `${n > 0 ? '+' : '−'}${num(Math.abs(n))}`
    if (Math.abs(diff) < 0.05) {
      return `Zakres: ${first.date} (${num(first.size)} mm) → ${last.date} (${num(last.size)} mm). Bez istotnej zmiany rozmiaru.`
    }
    const pct = first.size ? ` (${signed(Math.round((diff / first.size) * 100))}%)` : ''
    const dir = diff > 0 ? 'wzrost' : 'spadek'
    return `Zakres: ${first.date} (${num(first.size)} mm) → ${last.date} (${num(last.size)} mm). Zmiana: ${signed(diff)} mm${pct} — ${dir}.`
  }, [sizeData])

  // Kolory wykresu dopasowane do trybu jasny/ciemny.
  const dark = theme === 'dark'
  const gridStroke = dark ? '#334155' : '#e2e8f0'
  const tickFill = dark ? '#cbd5e1' : '#475569'
  const lineStroke = dark ? '#2dd4bf' : '#0f766e'
  const tooltipStyle = dark
    ? {
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        color: '#e2e8f0',
      }
    : undefined

  const updateStatus = async (status) => {
    const { error: updateError } = await supabase
      .from('lesions')
      .update({ status })
      .eq('id', lesionId)
    if (updateError) {
      setError(updateError.message)
      return
    }
    setLesion((prev) => (prev ? { ...prev, status } : prev))
    toast.success('Zmiany zapisane')
    notifyDueChanged()
  }

  // Usuwanie odbywa się WYŁĄCZNIE tutaj (LesionDetail), po potwierdzeniu w
  // modalu. Na mapie ciała / pinie nie ma żadnego przycisku usuwania (pkt 4).
  const askDeleteLesion = () => setConfirm({ kind: 'lesion' })
  const askDeletePhoto = (photo) => setConfirm({ kind: 'photo', photo })

  const runDeleteLesion = async () => {
    setDeleting(true)
    const paths = photos.map((p) => p.photo_url).filter(Boolean)

    const { error: deleteError } = await supabase
      .from('lesions')
      .delete()
      .eq('id', lesionId)

    if (deleteError) {
      setDeleting(false)
      setConfirm(null)
      setError(deleteError.message)
      return
    }

    // Best-effort: usuń też pliki zdjęć z prywatnego bucketu.
    await Promise.allSettled(paths.map((p) => removeStorageFile(p)))

    setDeleting(false)
    setConfirm(null)
    toast.success('Znamię usunięte')
    notifyDueChanged()
    navigate(`/person/${personId}`)
  }

  const runDeletePhoto = async (photo) => {
    setDeleting(true)
    const { error: deleteError } = await supabase
      .from('lesion_photos')
      .delete()
      .eq('id', photo.id)

    if (deleteError) {
      setDeleting(false)
      setConfirm(null)
      setError(deleteError.message)
      return
    }

    // Best-effort: usuń też sam plik z prywatnego bucketu.
    try {
      await removeStorageFile(photo.photo_url)
    } catch {
      /* plik mógł już nie istnieć — ignorujemy */
    }

    setDeleting(false)
    setConfirm(null)
    toast.success('Zdjęcie usunięte')
    notifyDueChanged()
    setCompareA(null)
    setCompareB(null)
    load()
  }

  if (loading) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Wczytywanie znamienia…
      </p>
    )
  }

  if (!lesion) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Nie znaleziono znamienia.
        </p>
        <button
          type="button"
          onClick={goBack}
          className="self-start text-sm font-medium text-teal-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 dark:text-teal-300"
        >
          {back.label}
        </button>
      </div>
    )
  }

  const meta = statusMeta(lesion.status)
  const chrono = [...photos].reverse() // najnowsze na górze

  // Akcje rzadkie i nieodwracalne trzymamy w menu „⋯” — nie zajmują miejsca
  // i nie krzyczą na ekranie (usuwanie znamienia zdarza się raz na jakiś
  // czas, a zmiana statusu jest tu, bo status i tak widać jako plakietkę).
  const menuItems = [
    ...STATUSES.map((s) => ({
      key: `status-${s}`,
      label: statusMeta(s).label,
      checked: s === lesion.status,
      onSelect: () => updateStatus(s),
    })),
    { key: 'sep', separator: true },
    {
      key: 'delete',
      label: 'Usuń znamię',
      danger: true,
      onSelect: askDeleteLesion,
    },
  ]

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={goBack}
        className="self-start text-sm font-medium text-teal-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300 dark:text-teal-300"
      >
        {back.label}
        </button>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}

      {/* Nagłówek */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            <LesionName
              label={lesion.label}
              viewName={lesion.body_maps?.view_name}
              areaClassName="font-normal text-slate-400 dark:text-slate-500"
            />
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={lesion.status} />
            <span className="text-sm text-slate-500 dark:text-slate-400">
              Zdjęć: {photos.length}
              {lastDate ? ` · ostatnia: ${formatDate(lastDate)}` : ''}
              {` · kontrola co ${intervalWeeks} tyg.`}
            </span>
          </div>
        </div>
        <OverflowMenu label="Akcje znamienia" items={menuItems} />
      </div>

      {/* Akcje */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setShowUpload((v) => !v)}
          className="min-h-[44px] rounded-lg bg-teal-700 px-4 font-medium text-white transition-colors hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:bg-teal-600 dark:hover:bg-teal-500"
        >
          {showUpload ? 'Zamknij formularz' : '+ Dodaj zdjęcie'}
        </button>

        <CalendarReminderButton
          label={lesion.label}
          lastDate={lastDate}
          intervalWeeks={intervalWeeks}
          leadDays={leadDays}
        />
      </div>

      {showUpload ? (
        <PhotoUploadForm
          lesion={lesion}
          personId={personId}
          onUploaded={async () => {
            setCompareA(null)
            setCompareB(null)
            await load()
            setShowUpload(false)
          }}
          onCancel={() => setShowUpload(false)}
        />
      ) : null}

      {/* Brak zdjęć */}
      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Brak zdjęć. Dodaj pierwsze zdjęcie powyżej.
        </div>
      ) : (
        <>
          {/* Porównanie (opacity slider) */}
          {photos.length >= 2 ? (
            <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Porównanie zdjęć
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="compare-a"
                    className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
                  >
                    Zdjęcie A (spód)
                  </label>
                  <select
                    id="compare-a"
                    value={compareA || ''}
                    onChange={(e) => setCompareA(e.target.value)}
                    className={`${inputClass} w-full text-sm`}
                  >
                    {photos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {formatDate(p.taken_at)}
                        {p.size_mm ? ` · ${p.size_mm} mm` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="compare-b"
                    className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400"
                  >
                    Zdjęcie B (wierzchnia warstwa)
                  </label>
                  <select
                    id="compare-b"
                    value={compareB || ''}
                    onChange={(e) => setCompareB(e.target.value)}
                    className={`${inputClass} w-full text-sm`}
                  >
                    {photos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {formatDate(p.taken_at)}
                        {p.size_mm ? ` · ${p.size_mm} mm` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                ref={compareRef}
                onPointerDown={onCompareDown}
                onPointerMove={onCompareMove}
                onPointerUp={onCompareUp}
                onPointerCancel={onCompareUp}
                className="relative mx-auto aspect-square w-full max-w-sm touch-none select-none overflow-hidden rounded-xl border border-slate-200 bg-black/5 dark:border-slate-800 dark:bg-black/40"
              >
                <SignedImage
                  path={photoA?.photo_url}
                  alt={`Zdjęcie ${photoA ? formatDate(photoA.taken_at) : 'A'}`}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <SignedImage
                  path={photoB?.photo_url}
                  alt={`Zdjęcie ${photoB ? formatDate(photoB.taken_at) : 'B'}`}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ clipPath: `inset(0 ${100 - opacity}% 0 0)` }}
                />
                {/* Uchwyt porównania (przeciągnij w poziomie). */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 flex w-0 -translate-x-1/2 items-center justify-center"
                  style={{ left: `${opacity}%` }}
                >
                  <span className="absolute inset-y-0 w-0.5 bg-white/80" />
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-sm font-semibold text-slate-700 shadow">
                    ⇄
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="w-24 text-xs text-slate-500 dark:text-slate-400">
                  {photoA ? formatDate(photoA.taken_at) : '—'}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="h-2 flex-1 accent-teal-700 dark:accent-teal-400"
                  aria-label="Suwak porównania (pozycja)"
                />
                <span className="w-24 text-right text-xs text-slate-500 dark:text-slate-400">
                  {photoB ? formatDate(photoB.taken_at) : '—'}
                </span>
              </div>
            </section>
          ) : null}

          {/* Oś czasu zdjęć + ABCDE */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
              Historia zdjęć
            </h2>
            <ol className="space-y-3">
              {chrono.map((photo) => (
                <li
                  key={photo.id}
                  className="flex gap-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                >
                  <button
                    type="button"
                    onClick={() => setEnlarge(photo)}
                    aria-label={`Powiększ zdjęcie z ${formatDate(photo.taken_at)}`}
                    className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 sm:h-24 sm:w-24"
                  >
                    <SignedImage
                      path={photo.photo_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                  <div className="min-w-0 flex-1 space-y-1 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {formatDate(photo.taken_at)}
                      </span>
                      <button
                        type="button"
                        onClick={() => askDeletePhoto(photo)}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      >
                        <TrashIcon />
                        Usuń zdjęcie
                      </button>
                    </div>
                    {photo.size_mm ? (
                      <p className="text-slate-600 dark:text-slate-300">
                        Rozmiar: {photo.size_mm} mm
                      </p>
                    ) : null}
                    <p className="text-slate-600 dark:text-slate-300">
                      A: {photo.asymmetry ? 'tak' : 'nie'} · B:{' '}
                      {photo.border_irregular ? 'tak' : 'nie'}
                      {photo.color_description
                        ? ` · C: ${photo.color_description}`
                        : ''}
                    </p>
                    {photo.evolution_notes ? (
                      <p className="text-slate-600 dark:text-slate-300">
                        E: {photo.evolution_notes}
                      </p>
                    ) : null}
                    {photo.notes ? (
                      <p className="text-slate-500 dark:text-slate-400">
                        {photo.notes}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
          {/* Wykres rozmiaru */}
          {sizeData.length >= 2 ? (
            <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">
                Trend rozmiaru (mm)
              </h2>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={sizeData}
                    margin={{ top: 8, right: 16, bottom: 8, left: -16 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: tickFill }}
                      minTickGap={16}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: tickFill }}
                      width={40}
                      unit="mm"
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line
                      type="monotone"
                      dataKey="size"
                      stroke={lineStroke}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              {sizeSummary ? (
                <>
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {sizeSummary}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    To tylko odczyt zapisanych pomiarów. Zmiany rozmiaru oceniaj
                    z lekarzem.
                  </p>
                </>
              ) : null}
            </section>
          ) : null}

        </>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Status „{meta.label}” to Twoja prywatna organizacja dokumentacji, nie
        ocena medyczna.
      </p>

      <ConfirmDialog
        open={Boolean(confirm)}
        busy={deleting}
        title={
          confirm?.kind === 'photo' ? 'Usunąć to zdjęcie?' : 'Usunąć to znamię?'
        }
        description={
          confirm?.kind === 'photo'
            ? 'Zdjęcie zostanie trwale usunięte z historii i z magazynu. Tej operacji nie można cofnąć.'
            : 'Znamię i cała historia jego zdjęć zostaną trwale usunięte (także pliki z magazynu). Ta operacja jest nieodwracalna.'
        }
        confirmLabel={
          confirm?.kind === 'photo' ? 'Tak, usuń zdjęcie' : 'Tak, usuń znamię'
        }
        onConfirm={() =>
          confirm?.kind === 'photo'
            ? runDeletePhoto(confirm.photo)
            : runDeleteLesion()
        }
        onCancel={() => {
          if (!deleting) setConfirm(null)
        }}
      />

      {/* Powiększenie zdjęcia z historii (lightbox, wygodne na telefonie). */}
      {enlarge ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Powiększone zdjęcie"
          onClick={() => setEnlarge(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <SignedImage
            path={enlarge.photo_url}
            alt={`Zdjęcie z ${formatDate(enlarge.taken_at)}`}
            className="max-h-[85dvh] max-w-full rounded-lg object-contain"
          />
          <button
            type="button"
            onClick={() => setEnlarge(null)}
            className="absolute right-4 top-4 min-h-[44px] rounded-lg bg-white/90 px-3 font-medium text-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300"
          >
            Zamknij
          </button>
        </div>
      ) : null}
    </div>
  )
}
