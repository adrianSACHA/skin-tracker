import { statusMeta } from '../lib/status'

export default function StatusBadge({ status }) {
  const meta = statusMeta(status)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${meta.badge}`}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: meta.dot }}
        aria-hidden="true"
      />
      {meta.label}
    </span>
  )
}
