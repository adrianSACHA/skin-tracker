import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { uploadLesionPhoto } from '../lib/uploadPhoto'
import { todayYMD } from '../lib/date'

// MediaPipe jest duży - ładujemy go leniwie, dopiero gdy otworzysz pomiar z obrysu.
const LesionSegmenter = lazy(() => import('./LesionSegmenter'))

// Formularz nowego zdjęcia: kompresja przed wysłaniem (browser-image-compression),
// opcjonalny rozmiar w mm + krótki formularz ABCDE wypełniany świadomie.
export default function PhotoUploadForm({
  lesion,
  personId,
  onUploaded,
  onCancel,
}) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [takenAt, setTakenAt] = useState(todayYMD())
  const [sizeMm, setSizeMm] = useState('')
  const [notes, setNotes] = useState('')
  const [asymmetry, setAsymmetry] = useState(false)
  const [borderIrregular, setBorderIrregular] = useState(false)
  const [colorDescription, setColorDescription] = useState('')
  const [evolutionNotes, setEvolutionNotes] = useState('')
  const [hasScaleReference, setHasScaleReference] = useState(false)
  const [showSegmenter, setShowSegmenter] = useState(false)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const inputRef = useRef(null)

  const inputClass =
    'min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500'

  const checkboxClass =
    'h-5 w-5 rounded border-slate-300 text-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-600 dark:bg-slate-800'

  // Sprzątanie podglądu (object URL).
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleFile = (e) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
    setInfo(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Wybierz zdjęcie.')
      return
    }

    setError(null)
    setInfo(null)
    setBusy(true)

    try {
      const { path, compressed } = await uploadLesionPhoto({
        file,
        personId,
        lesionId: lesion.id,
      })

      const { error: insertError } = await supabase
        .from('lesion_photos')
        .insert({
          lesion_id: lesion.id,
          photo_url: path,
          taken_at: takenAt,
          size_mm: sizeMm === '' ? null : Number(sizeMm),
          notes: notes.trim() || null,
          asymmetry,
          border_irregular: borderIrregular,
          color_description: colorDescription.trim() || null,
          evolution_notes: evolutionNotes.trim() || null,
        })

      if (insertError) throw insertError

      const kb = Math.round((compressed?.size || 0) / 1024)
      toast.success('Zdjęcie zapisane')
      setInfo(`Zapisano zdjęcie (skompresowane do ~${kb} kB).`)
      onUploaded?.()
    } catch (err) {
      setError(err.message || 'Nie udało się zapisać zdjęcia.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
        Nowe zdjęcie
      </h3>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}
      {info ? (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
          {info}
        </div>
      ) : null}

      {/* Zdjęcie */}
      <div className="space-y-2">
        <label
          htmlFor="lesion-photo"
          className="block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          Zdjęcie
        </label>
        <input
          id="lesion-photo"
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="block w-full text-sm text-slate-600 file:mr-3 file:min-h-[44px] file:rounded-lg file:border-0 file:bg-teal-700 file:px-4 file:font-medium file:text-white hover:file:bg-teal-800 dark:text-slate-300 dark:file:bg-teal-600 dark:hover:file:bg-teal-500"
        />
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Podgląd zdjęcia"
            className="max-h-72 w-auto rounded-lg border border-slate-200 dark:border-slate-700"
          />
        ) : null}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Zdjęcie zostanie automatycznie skompresowane (max ~0.4 MB, webp,
          orientacja EXIF).
        </p>
      </div>

      {/* Skala referencyjna */}
      <label className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          checked={hasScaleReference}
          onChange={(e) => setHasScaleReference(e.target.checked)}
          className={`mt-0.5 ${checkboxClass}`}
        />
        <span>
          W kadrze znajduje się skala referencyjna (moneta / linijka) — ułatwia
          późniejsze przeliczenie rozmiaru w&nbsp;mm.
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="taken-at"
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Data zdjęcia
          </label>
          <input
            id="taken-at"
            type="date"
            value={takenAt}
            onChange={(e) => setTakenAt(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label
            htmlFor="size-mm"
            className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            Rozmiar (mm, opcjonalnie)
          </label>
          <input
            id="size-mm"
            type="number"
            inputMode="decimal"
            step="0.1"
            min="0"
            value={sizeMm}
            onChange={(e) => setSizeMm(e.target.value)}
            placeholder="np. 6.5"
            className={inputClass}
          />
        </div>
      </div>

      {/* Pomiar z obrysu (opcjonalny, MediaPipe - geometria, nie diagnoza) */}
      {previewUrl ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowSegmenter((v) => !v)}
            className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            {showSegmenter
              ? 'Zamknij pomiar z obrysu'
              : 'Pomiar z obrysu (opcjonalnie)'}
          </button>

          {showSegmenter ? (
            <Suspense
              fallback={
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Wczytywanie modułu pomiaru…
                </p>
              }
            >
              <LesionSegmenter
                imageUrl={previewUrl}
                onApply={({ sizeMm }) => {
                  setSizeMm(String(sizeMm))
                  setShowSegmenter(false)
                }}
                onCancel={() => setShowSegmenter(false)}
              />
            </Suspense>
          ) : null}
        </div>
      ) : null}

      {/* ABCDE */}
      <fieldset className="space-y-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
        <legend className="px-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          Notatki ABCDE (wypełniasz świadomie — aplikacja nic nie ocenia)
        </legend>

        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={asymmetry}
            onChange={(e) => setAsymmetry(e.target.checked)}
            className={checkboxClass}
          />
          Asymetria (A)
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            checked={borderIrregular}
            onChange={(e) => setBorderIrregular(e.target.checked)}
            className={checkboxClass}
          />
          Nieregularna granica (B)
        </label>

        <div>
          <label
            htmlFor="color-description"
            className="mb-1 block text-sm text-slate-700 dark:text-slate-200"
          >
            Kolor / opis barwy (C)
          </label>
          <input
            id="color-description"
            type="text"
            value={colorDescription}
            onChange={(e) => setColorDescription(e.target.value)}
            placeholder="np. jednolity brąz, ciemniejszy w środku"
            className={inputClass}
          />
        </div>

        <div>
          <label
            htmlFor="evolution-notes"
            className="mb-1 block text-sm text-slate-700 dark:text-slate-200"
          >
            Ewolucja / zmiany od ostatniego zdjęcia (E)
          </label>
          <textarea
            id="evolution-notes"
            value={evolutionNotes}
            onChange={(e) => setEvolutionNotes(e.target.value)}
            rows={2}
            placeholder="np. bez zmian / powiększyło się / zmiana koloru"
            className={`${inputClass} min-h-0 leading-relaxed`}
          />
        </div>
      </fieldset>

      <div>
        <label
          htmlFor="photo-notes"
          className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200"
        >
          Dodatkowe notatki
        </label>
        <textarea
          id="photo-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className={`${inputClass} min-h-0 leading-relaxed`}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="min-h-[44px] rounded-lg bg-teal-700 px-4 font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:bg-teal-600 dark:hover:bg-teal-500 dark:disabled:bg-slate-700"
        >
          {busy ? 'Przetwarzanie…' : 'Zapisz zdjęcie'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          Anuluj
        </button>
      </div>
    </form>
  )
}
