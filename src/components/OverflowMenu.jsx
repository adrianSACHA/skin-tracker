import { useEffect, useRef, useState } from 'react'

// Menu „⋯" (akcje ukryte w rozwijanym menu). Własna implementacja (bez
// biblioteki): zamyka się na Escape i klik poza, fokus wraca do przycisku.
// Pozycja liczona w JS i przypięta do VIEWPORTU (fixed) — na wąskich ekranach
// przycisk bywa gdzieś na środku, więc menu „na sztywno" do niego (absolute
// right-0) wychodziło poza krawędź ekranu.
//
// Pion też musi być pilnowany: w Kontrolach menu ma kilkanaście pozycji
// („Przesuń o N tyg.”), więc przy przycisku nisko na ekranie dolne pozycje
// były nieosiągalne — pozycji `fixed` nie da się doscrollować stroną.
// Dlatego wybieramy stronę z większą ilością miejsca i ograniczamy wysokość
// do tego, co faktycznie się mieści.
//
// `items`: [{ key, label, onSelect, href?, checked?, danger? } | { key, separator: true }]
//
// `visibleLabel` pokazuje tekst obok ikony (gdy trigger ma nieść też podpis),
// a `icon` pozwala odróżnić menu globalne („≡") od akcji na obiekcie („⋯").
export default function OverflowMenu({
  label,
  items,
  buttonClassName = '',
  visibleLabel = '',
  icon = '⋯',
  trigger = null,
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const wrapRef = useRef(null)
  const btnRef = useRef(null)

  const MENU_WIDTH = 240
  const MIN_MENU_HEIGHT = 96

  const place = () => {
    const rect = btnRef.current?.getBoundingClientRect()
    if (!rect) return
    const margin = 8
    const gap = 4
    const width = Math.min(MENU_WIDTH, window.innerWidth - margin * 2)
    const left = Math.max(
      margin,
      Math.min(rect.right - width, window.innerWidth - width - margin)
    )

    // Miejsce pod i nad przyciskiem (bez marginesu od krawędzi ekranu).
    const below = window.innerHeight - rect.bottom - gap - margin
    const above = rect.top - gap - margin
    // Domyślnie w dół; do góry tylko gdy na dole jest ciasno, a wyżej luźniej.
    const openUp = below < 240 && above > below
    const room = openUp ? above : below

    setPos({
      left,
      width,
      maxHeight: Math.max(MIN_MENU_HEIGHT, room),
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap }),
    })
  }

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
    const onResize = () => place()
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
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
        onClick={() => {
          if (!open) place()
          setOpen((v) => !v)
        }}
        className={
          buttonClassName ||
          'flex h-11 w-11 items-center justify-center rounded-lg border border-slate-300 bg-white text-xl leading-none text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
        }
      >
        {trigger || (
          <>
            {visibleLabel ? (
              <span className="max-w-[6rem] truncate">{visibleLabel}</span>
            ) : null}
            {icon}
          </>
        )}
      </button>
      {open && pos ? (
        <div
          role="menu"
          style={{
            position: 'fixed',
            left: pos.left,
            width: pos.width,
            maxHeight: pos.maxHeight,
            ...(pos.bottom !== undefined
              ? { bottom: pos.bottom }
              : { top: pos.top }),
          }}
          className="menu-in z-20 overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
        >
          {items.map((item) => {
            if (item.separator) {
              return (
                <div
                  key={item.key}
                  role="separator"
                  className="my-1 h-px bg-slate-200 dark:bg-slate-700"
                />
              )
            }

            const itemClass = [
              'flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-300',
              item.danger
                ? 'text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40'
                : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700',
            ].join(' ')

            const content = (
              <>
                <span>{item.label}</span>
                {item.checked ? (
                  <span
                    aria-hidden="true"
                    className="text-teal-700 dark:text-teal-300"
                  >
                    ✓
                  </span>
                ) : null}
              </>
            )

            // Pozycja będąca odnośnikiem zostaje PRAWDZIWYM linkiem
            // (środkowy przycisk, „kopiuj adres”, otwarcie w nowej karcie).
            if (item.href) {
              return (
                <a
                  key={item.key}
                  role="menuitem"
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className={itemClass}
                >
                  {content}
                </a>
              )
            }

            return (
              <button
                key={item.key}
                type="button"
                // Pozycja z `checked` to wybór z listy (np. status) — wtedy
                // rola `menuitemradio` i widoczny znacznik.
                role={item.checked === undefined ? 'menuitem' : 'menuitemradio'}
                aria-checked={
                  item.checked === undefined ? undefined : Boolean(item.checked)
                }
                onClick={() => {
                  setOpen(false)
                  item.onSelect()
                }}
                className={itemClass}
              >
                {content}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
