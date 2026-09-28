import { useId } from 'react'

// Znak aplikacji: monogram „ST" (Skin Tracker) w zaokrąglonym kwadracie.
// Dekoracyjny (aria-hidden) — zawsze towarzyszy mu tekst/nazwa.
export default function Logo({ size = 32, className = '' }) {
  const gid = 'st-logo-' + useId().replace(/[^a-zA-Z0-9]/g, '')

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="46" height="46" rx="12" fill={'url(#' + gid + ')'} />
      <text
        x="24"
        y="31"
        textAnchor="middle"
        fontFamily="system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
        fontSize="20"
        fontWeight="700"
        fill="#ffffff"
      >
        ST
      </text>
    </svg>
  )
}
