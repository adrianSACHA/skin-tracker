import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FilesetResolver, InteractiveSegmenter } from '@mediapipe/tasks-vision'

// UWAGA (zweryfikowane empirycznie na @mediapipe/tasks-vision 1.0.1):
// - Nowe API `InteractiveSegmenter` + model `interactive_segmentation.task` (v2).
// - Model wymaga stroku z >= 2 punktów - pojedynczy klik zwraca PUSTĄ maskę,
//   dlatego każdy klik zamieniamy na mały okrągły stroke.
// - Punkty NEGATYWNE (brushMode=2) odwracają maskę w tym modelu, więc ich nie
//   wysyłamy; "usuwanie" fragmentu robimy lokalnie (gumka) przed zliczeniem.
//
// Wersja WASM musi zgadzać się z wersją npm `@mediapipe/tasks-vision`.
const TASKS_VISION_VERSION = '1.0.1'
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/interactive_segmenter_v2/magic_touch/int8/1/interactive_segmentation.task'

const THRESHOLD = 0.5 // próg pewności maski
const MAX_DISPLAY_WIDTH = 720
const STROKE_RADIUS = 0.006 // promień "kropki" kliknięcia (jedn. znormalizowane)
const STROKE_POINTS = 6
const ERASER_RADIUS = 0.03 // promień gumki (znormalizowany)

const BRUSH_POSITIVE = 1 // BrushMode.POSITIVE (enum nie jest eksportowany w runtime)

const COIN_PRESETS = [
  { mm: 15.5, label: '1 gr (15,5 mm)' },
  { mm: 16.5, label: '10 gr (16,5 mm)' },
  { mm: 17.5, label: '2 gr (17,5 mm)' },
  { mm: 18.5, label: '20 gr (18,5 mm)' },
  { mm: 19.5, label: '5 gr (19,5 mm)' },
  { mm: 20.5, label: '50 gr (20,5 mm)' },
  { mm: 21.5, label: '2 zł (21,5 mm)' },
  { mm: 23.0, label: '1 zł (23,0 mm)' },
  { mm: 24.0, label: '5 zł (24,0 mm)' },
]

const BTN_PRIMARY =
  'min-h-[44px] rounded-lg bg-teal-700 px-4 font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:bg-teal-600 dark:hover:bg-teal-500 dark:disabled:bg-slate-700'
const BTN_SECONDARY =
  'min-h-[44px] rounded-lg border border-slate-300 bg-white px-4 font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'

// Klik -> mały okrągły stroke (model v2 nie przyjmuje stroku 1-punktowego).
function circleStroke(x, y, brushMode = BRUSH_POSITIVE) {
  const pts = []
  for (let i = 0; i < STROKE_POINTS; i += 1) {
    const a = (i / STROKE_POINTS) * Math.PI * 2
    pts.push({ x: x + Math.cos(a) * STROKE_RADIUS, y: y + Math.sin(a) * STROKE_RADIUS })
  }
  return { brushMode, point: pts, isCompleted: true }
}

// Czy dany punkt (znormalizowany) wypada w obszarze "gumki".
function isErased(x, y, erasers) {
  for (let i = 0; i < erasers.length; i += 1) {
    const dx = x - erasers[i].x
    const dy = y - erasers[i].y
    if (dx * dx + dy * dy < ERASER_RADIUS * ERASER_RADIUS) return true
  }
  return false
}

// Zlicza piksele maski > progu, pomijając obszary wygumowane.
function countMask(mask, erasers) {
  let count = 0
  const { data, width, height } = mask
  for (let y = 0; y < height; y += 1) {
    const ny = y / height
    for (let x = 0; x < width; x += 1) {
      if (data[y * width + x] > THRESHOLD && !isErased(x / width, ny, erasers)) {
        count += 1
      }
    }
  }
  return count
}

// Pole wielokąta (wzór shoelace) dla punktów w pikselach obrazu.
function shoelaceAreaPx2(points) {
  if (points.length < 3) return 0
  let sum = 0
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    sum += a.x * b.y - b.x * a.y
  }
  return Math.abs(sum) / 2
}

export default function LesionSegmenter({ imageUrl, onApply, onCancel }) {
  const canvasRef = useRef(null)
  const maskCanvasRef = useRef(null)
  const imgRef = useRef(null)
  const segmenterRef = useRef(null)

  const [modelState, setModelState] = useState('loading') // loading | ready | error
  const [modelError, setModelError] = useState(null)

  const [mode, setMode] = useState('calibrate') // calibrate | segment | manual
  const [coinPoints, setCoinPoints] = useState([])
  const [coinMm, setCoinMm] = useState(23.0)
  const [brush, setBrush] = useState('positive') // positive | negative(gumka)
  const [positives, setPositives] = useState([]) // [{x,y}]
  const [erasers, setErasers] = useState([]) // [{x,y}]
  const [mask, setMask] = useState(null) // { data: Float32Array, width, height }
  const [manualPoints, setManualPoints] = useState([])

  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const [img, setImg] = useState({ nw: 0, nh: 0, dw: 0, dh: 0 })

  // --- Wczytanie zdjęcia ---
  useEffect(() => {
    const el = new Image()
    el.onload = () => {
      imgRef.current = el
      const dw = Math.min(MAX_DISPLAY_WIDTH, el.naturalWidth)
      const dh = Math.round((el.naturalHeight / el.naturalWidth) * dw)
      setImg({ nw: el.naturalWidth, nh: el.naturalHeight, dw, dh })
    }
    el.onerror = () => setError('Nie udało się wczytać zdjęcia.')
    el.src = imageUrl
    return () => {
      el.onload = null
      el.onerror = null
    }
  }, [imageUrl])

  // --- Wczytanie modelu (raz) ---
  useEffect(() => {
    let active = true
    async function create() {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL)
        let seg
        try {
          seg = await InteractiveSegmenter.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          })
        } catch {
          seg = await InteractiveSegmenter.createFromOptions(vision, {
            baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
          })
        }
        if (!active) {
          seg.close?.()
          return
        }
        segmenterRef.current = seg
        setModelState('ready')
      } catch (err) {
        if (!active) return
        setModelError(err?.message || 'Nie udało się wczytać modelu.')
        setModelState('error')
        setMode('manual')
      }
    }
    create()
    return () => {
      active = false
      segmenterRef.current?.close?.()
      segmenterRef.current = null
    }
  }, [])

  // --- Przekaż obraz do modelu, gdy i model, i zdjęcie gotowe ---
  useEffect(() => {
    if (modelState !== 'ready' || !img.dw || !segmenterRef.current) return
    try {
      segmenterRef.current.setImage(imgRef.current)
    } catch (err) {
      setError(err?.message || 'Nie udało się przygotować obrazu.')
    }
  }, [modelState, img.dw])

  // --- Kalibracja: px na mm ---
  const pxPerMm = useMemo(() => {
    if (coinPoints.length !== 2 || !img.nw || !img.nh || !coinMm) return null
    const a = coinPoints[0]
    const b = coinPoints[1]
    const distPx = Math.hypot((b.x - a.x) * img.nw, (b.y - a.y) * img.nh)
    if (distPx < 1) return null
    return distPx / coinMm
  }, [coinPoints, coinMm, img.nw, img.nh])

  // --- Pole z maski (po uwzględnieniu gumki) ---
  const maskArea = useMemo(() => {
    if (!mask || !pxPerMm || !img.nw || !img.nh) return null
    const count = countMask(mask, erasers)
    if (count === 0) return 0
    const fraction = count / (mask.width * mask.height)
    const areaPx2 = fraction * img.nw * img.nh
    return areaPx2 / (pxPerMm * pxPerMm)
  }, [mask, erasers, pxPerMm, img.nw, img.nh])

  // --- Pole z wielokąta ręcznego ---
  const manualArea = useMemo(() => {
    if (manualPoints.length < 3 || !pxPerMm || !img.nw || !img.nh) return null
    const pts = manualPoints.map((p) => ({ x: p.x * img.nw, y: p.y * img.nh }))
    return shoelaceAreaPx2(pts) / (pxPerMm * pxPerMm)
  }, [manualPoints, pxPerMm, img.nw, img.nh])

  // --- Rysowanie ---
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const image = imgRef.current
    if (!canvas || !image || !image.complete || !img.dw) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height
    ctx.clearRect(0, 0, W, H)
    ctx.drawImage(image, 0, 0, W, H)

    // Overlay maski (z uwzględnieniem gumki)
    if (mask && mode !== 'calibrate') {
      const id = new ImageData(mask.width, mask.height)
      const px = id.data
      for (let y = 0; y < mask.height; y += 1) {
        const ny = y / mask.height
        for (let x = 0; x < mask.width; x += 1) {
          const i = y * mask.width + x
          if (mask.data[i] > THRESHOLD && !isErased(x / mask.width, ny, erasers)) {
            const o = i * 4
            px[o] = 13
            px[o + 1] = 148
            px[o + 2] = 136
            px[o + 3] = 120
          }
        }
      }
      if (!maskCanvasRef.current) {
        maskCanvasRef.current = document.createElement('canvas')
      }
      const mc = maskCanvasRef.current
      mc.width = mask.width
      mc.height = mask.height
      mc.getContext('2d').putImageData(id, 0, 0)
      ctx.drawImage(mc, 0, 0, W, H)
    }

    // Linia kalibracyjna
    if (coinPoints.length >= 1) {
      ctx.lineWidth = 2
      ctx.strokeStyle = '#f59e0b'
      ctx.fillStyle = '#f59e0b'
      if (coinPoints.length === 2) {
        ctx.beginPath()
        ctx.moveTo(coinPoints[0].x * W, coinPoints[0].y * H)
        ctx.lineTo(coinPoints[1].x * W, coinPoints[1].y * H)
        ctx.stroke()
      }
      coinPoints.forEach((p) => {
        ctx.beginPath()
        ctx.arc(p.x * W, p.y * H, 5, 0, Math.PI * 2)
        ctx.fill()
      })
    }

    // Punkty dodatnie (sterują modelem)
    positives.forEach((p) => {
      ctx.beginPath()
      ctx.fillStyle = '#2563eb'
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.arc(p.x * W, p.y * H, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    })

    // Gumka (punkty ujemne - tylko lokalnie)
    erasers.forEach((p) => {
      ctx.beginPath()
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2
      ctx.arc(p.x * W, p.y * H, ERASER_RADIUS * W, 0, Math.PI * 2)
      ctx.stroke()
    })

    // Wielokąt ręczny
    if (manualPoints.length >= 1) {
      ctx.lineWidth = 2
      ctx.strokeStyle = '#0ea5e9'
      ctx.fillStyle = 'rgba(14,165,233,0.18)'
      ctx.beginPath()
      manualPoints.forEach((p, i) => {
        const x = p.x * W
        const y = p.y * H
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      if (manualPoints.length >= 3) {
        ctx.closePath()
        ctx.fill()
      }
      ctx.stroke()
      manualPoints.forEach((p) => {
        ctx.beginPath()
        ctx.fillStyle = '#0ea5e9'
        ctx.arc(p.x * W, p.y * H, 4, 0, Math.PI * 2)
        ctx.fill()
      })
    }
  }, [img.dw, mask, mode, coinPoints, positives, erasers, manualPoints])

  useEffect(() => {
    draw()
  }, [draw, img.dw, img.dh])

  // --- Segmentacja (tylko punkty dodatnie) ---
  const runSegment = useCallback((allPositives) => {
    const seg = segmenterRef.current
    if (!seg) return
    setBusy(true)
    setError(null)
    try {
      if (allPositives.length === 0) {
        setMask(null)
        return
      }
      const strokes = allPositives.map((p) => circleStroke(p.x, p.y))
      const m = seg.segment(strokes)
      setMask({ data: m.getAsFloat32Array(), width: m.width, height: m.height })
    } catch (err) {
      setError(err?.message || 'Segmentacja nie powiodła się.')
    } finally {
      setBusy(false)
    }
  }, [])

  const handleCanvasClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    setResult(null)

    if (mode === 'calibrate') {
      setCoinPoints((prev) =>
        prev.length >= 2 ? [{ x, y }] : [...prev, { x, y }]
      )
      return
    }
    if (mode === 'manual') {
      setManualPoints((prev) => [...prev, { x, y }])
      return
    }

    if (modelState !== 'ready') return
    if (brush === 'negative') {
      // Gumka: tylko lokalnie, bez wywołania modelu.
      setErasers((prev) => [...prev, { x, y }])
      return
    }
    const next = [...positives, { x, y }]
    setPositives(next)
    runSegment(next)
  }

  const resetSegment = () => {
    setPositives([])
    setErasers([])
    setMask(null)
    setResult(null)
  }

  const confirmOutline = () => {
    const areaMm2 = mode === 'manual' ? manualArea : maskArea
    if (!pxPerMm) {
      setError('Najpierw ustaw skalę (krok 1): kliknij 2 końce średnicy monety.')
      return
    }
    if (areaMm2 === null) {
      setError(
        mode === 'manual'
          ? 'Zaznacz co najmniej 3 punkty obrysu.'
          : 'Najpierw kliknij w środek znamienia.'
      )
      return
    }
    if (areaMm2 === 0) {
      setError('Obrys jest pusty — dodaj punkt na znamieniu.')
      return
    }
    setError(null)
    const sizeMm = 2 * Math.sqrt(areaMm2 / Math.PI)
    setResult({ areaMm2, sizeMm })
  }

  const haveScale = Boolean(pxPerMm)

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">
          Pomiar z obrysu (opcjonalny)
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Narzędzie liczy tylko geometrię (pole powierzchni) ze zdjęcia. Nie
          ocenia charakteru zmiany — to wpisujesz osobno w ABCDE. Obliczenia
          dzieją się w Twojej przeglądarce; zdjęcie nie jest nigdzie wysyłane.
        </p>
      </div>

      {modelState === 'loading' ? (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-teal-700 dark:border-slate-600 dark:border-t-teal-400" />
          Wczytywanie modelu segmentacji (pierwsze ładowanie potrwa kilka
          sekund)…
        </div>
      ) : null}

      {modelState === 'error' ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
        >
          Nie udało się wczytać modelu AI ({modelError}). Użyj trybu ręcznego.
        </div>
      ) : null}

      {/* Kroki */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'calibrate', label: '1. Skala (moneta)' },
          { key: 'segment', label: '2. Zaznacz znamię' },
          { key: 'manual', label: 'Ręcznie (obrys)' },
        ].map((s) => (
          <button
            key={s.key}
            type="button"
            disabled={s.key === 'segment' && modelState !== 'ready'}
            onClick={() => {
              setMode(s.key)
              setResult(null)
              setError(null)
            }}
            className={[
              'min-h-[40px] rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 disabled:opacity-50',
              mode === s.key
                ? 'bg-teal-700 text-white dark:bg-teal-600'
                : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800',
            ].join(' ')}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </div>
      ) : null}

      {/* Panel: kalibracja */}
      {mode === 'calibrate' ? (
        <div className="space-y-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
          <p className="text-slate-600 dark:text-slate-300">
            Kliknij <strong>dwa końce średnicy monety</strong> na zdjęciu (moneta
            musi być w tym samym kadrze co znamię).
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="coin-mm" className="text-slate-700 dark:text-slate-200">
              Średnica monety (mm)
            </label>
            <input
              id="coin-mm"
              type="number"
              list="coin-presets"
              step="0.1"
              min="1"
              value={coinMm}
              onChange={(e) => setCoinMm(Number(e.target.value) || 0)}
              className="min-h-[40px] w-28 rounded-lg border border-slate-300 bg-white px-2 py-1 text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <datalist id="coin-presets">
              {COIN_PRESETS.map((c) => (
                <option key={c.mm} value={c.mm}>
                  {c.label}
                </option>
              ))}
            </datalist>
            <button
              type="button"
              onClick={() => setCoinPoints([])}
              className={BTN_SECONDARY}
            >
              Wyczyść punkty
            </button>
            <span
              className={
                haveScale
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-slate-500 dark:text-slate-400'
              }
            >
              {coinPoints.length}/2 pkt{haveScale ? ' · skala ustawiona' : ''}
            </span>
          </div>
        </div>
      ) : null}

      {/* Panel: segmentacja */}
      {mode === 'segment' ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
          <span className="text-slate-600 dark:text-slate-300">
            Kliknij na znamię, potem doprecyzuj:
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setBrush('positive')}
              className={[
                'min-h-[40px] rounded-lg px-3 text-sm font-medium',
                brush === 'positive'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700',
              ].join(' ')}
            >
              + dodaj do obrysu
            </button>
            <button
              type="button"
              onClick={() => setBrush('negative')}
              className={[
                'min-h-[40px] rounded-lg px-3 text-sm font-medium',
                brush === 'negative'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-300 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700',
              ].join(' ')}
            >
              − usuń z obrysu (gumka)
            </button>
          </div>
          <button
            type="button"
            onClick={resetSegment}
            disabled={positives.length === 0 && erasers.length === 0}
            className={BTN_SECONDARY}
          >
            Wyczyść i zaznacz od nowa
          </button>
          {busy ? (
            <span className="text-slate-500 dark:text-slate-400">
              Przeliczanie…
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Panel: ręcznie */}
      {mode === 'manual' ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800/50">
          <span className="text-slate-600 dark:text-slate-300">
            Klikaj kolejne wierzchołki obrysu (min. 3). Ostatni punkt łączy się z
            pierwszym.
          </span>
          <button
            type="button"
            onClick={() => {
              setManualPoints([])
              setResult(null)
            }}
            disabled={manualPoints.length === 0}
            className={BTN_SECONDARY}
          >
            Wyczyść obrys
          </button>
          <span className="text-slate-500 dark:text-slate-400">
            {manualPoints.length} pkt
          </span>
        </div>
      ) : null}

      {/* Kanwa */}
      <canvas
        ref={canvasRef}
        width={img.dw || MAX_DISPLAY_WIDTH}
        height={img.dh || MAX_DISPLAY_WIDTH}
        onClick={handleCanvasClick}
        className="w-full max-w-full cursor-crosshair rounded-lg border border-slate-200 bg-black/5 dark:border-slate-700 dark:bg-black/40"
        style={{ maxWidth: '100%', height: 'auto', touchAction: 'manipulation' }}
      />

      {/* Wynik */}
      {result ? (
        <div className="space-y-2 rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm dark:border-teal-800 dark:bg-teal-950/30">
          <p className="text-teal-900 dark:text-teal-100">
            Pole powierzchni: <strong>{result.areaMm2.toFixed(1)} mm²</strong> ·
            równoważna średnica:{' '}
            <strong>{result.sizeMm.toFixed(1)} mm</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onApply({ sizeMm: Number(result.sizeMm.toFixed(1)) })}
              className={BTN_PRIMARY}
            >
              Zastosuj rozmiar ({result.sizeMm.toFixed(1)} mm)
            </button>
            <button
              type="button"
              onClick={() => setResult(null)}
              className={BTN_SECONDARY}
            >
              Wróć do edycji
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={confirmOutline}
            disabled={busy}
            className={BTN_PRIMARY}
          >
            Zatwierdź obrys
          </button>
          <button type="button" onClick={onCancel} className={BTN_SECONDARY}>
            Anuluj pomiar
          </button>
        </div>
      )}

      {!haveScale ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Uwaga: bez skali (krok 1) nie obliczę mm²/mm. Bez monety w kadrze możesz
          wpisać rozmiar ręcznie w formularzu.
        </p>
      ) : null}
    </div>
  )
}
