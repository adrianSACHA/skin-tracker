import { useEffect, useRef, useState } from 'react'

// Menu „⋯" (akcje ukryte w rozwijanym menu). Własna implementacja (bez
// biblioteki): zamyka się na Escape i klik poza, fokus wraca do przycisku.
// Pozycja liczona w JS i przypięta do VIEWPORTU (fixed) — na wąskich ekranach
// przycisk bywa gdzieś na środku, więc menu „na sztywno" do niego (absolute
// right-0) wychodziło poza krawędź ekranu.
//
// `items`: [{ key, label, onSelect, danger? } | { key, separator: true }]
export default function OverflowMenu({ label, items, buttonClassName = '' }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const wrapRef = useRef(null)
  const btnRef = useRef(null)

  const MENU_WIDTH = 240

  const place = () => {
    const rect = btnRef.current?.getBoundingClientRect()
    if (!rect) return
    const margin = 8
    const width = Math.min(MENU_WIDTH, window.innerWidth - margin * 2)
    const left = Math.max(
      margin,
      Math.min(rect.right - width, window.innerWidth - width - margin)
    )
    setPos({ left, top: rect.bottom + 4, width })
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
        ⋯
      </button>
      {open && pos ? (
        <div
          role="menu"
          style={{
            position: 'fixed',
            left: pos.left,
            top: pos.top,
            width: pos.width,
          }}
          className="z-20 max-h-[70vh] overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800"
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
