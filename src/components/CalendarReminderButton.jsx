import { addWeeksYMD, formatDate, todayYMD } from '../lib/date'
import {
  buildCheckupIcs,
  checkupDescription,
  downloadIcs,
  googleCalendarUrl,
  outlookCalendarUrl,
} from '../lib/ics'

// Przypomnienie o kontroli - generowane lokalnie, bez zależności zewnętrznych.
// Tworzymy CYKLICZNE wydarzenie (co N tyg.) z alarmem X dni wcześniej, więc
// kalendarz sam przypomni o kolejnych kontrolach.
//
// Data pierwszego wydarzenia = data ostatniego zdjęcia + interwał (domyślnie 6 tyg.).
export default function CalendarReminderButton({
  label,
  lastDate,
  intervalWeeks = 6,
  leadDays = 7,
  startDate: startDateProp,
  className = '',
}) {
  const baseDate = lastDate || todayYMD()
  const startDate = startDateProp || addWeeksYMD(baseDate, intervalWeeks)

  const title = `Kontrola znamienia: ${label}`
  const description = checkupDescription({
    label,
    lastDate,
    intervalWeeks,
    leadDays,
    formatDate,
  })
  const uid = `skin-tracker-${encodeURIComponent(label)}-${startDate}@local`

  const handleDownload = () => {
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/gi, '-').slice(0, 40)
    downloadIcs(
      `kontrola-${slug}-${startDate}.ics`,
      buildCheckupIcs({
        uid,
        title,
        description,
        startYMD: startDate,
        intervalWeeks,
        leadDays,
      })
    )
  }

  const googleUrl = googleCalendarUrl({
    title,
    description,
    startYMD: startDate,
    intervalWeeks,
  })
  const outlookUrl = outlookCalendarUrl({
    title,
    description,
    startYMD: startDate,
  })

  const itemClass =
    'block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-300 dark:text-slate-200 dark:hover:bg-slate-800'

  return (
    <details className={`relative inline-block ${className}`}>
      <summary className="inline-flex min-h-[44px] cursor-pointer list-none items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
        Do kalendarza
        <span aria-hidden="true" className="text-xs text-slate-400">
          ▾
        </span>
      </summary>
      <div className="absolute z-20 mt-1 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <p className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">
          Cyklicznie co {intervalWeeks} tyg.,{' '}
          {leadDays > 0
            ? `alarm ${leadDays} dni przed i w dniu kontroli`
            : 'alarm w dniu kontroli'}
          .
        </p>
        <button type="button" onClick={handleDownload} className={itemClass}>
          Pobierz plik .ics
        </button>
        <a
          href={googleUrl}
          target="_blank"
          rel="noreferrer"
          className={itemClass}
        >
          Google Calendar
        </a>
        <a
          href={outlookUrl}
          target="_blank"
          rel="noreferrer"
          className={itemClass}
        >
          Outlook
        </a>
      </div>
    </details>
  )
}
