import { addWeeksYMD, formatDate, todayYMD } from './date'
import {
  buildCheckupIcs,
  checkupDescription,
  downloadIcs,
  googleCalendarUrl,
  outlookCalendarUrl,
} from './ics'

// Pozycje menu „⋯" do eksportu przypomnienia o kontroli.
//
// Ten sam materiał co `CalendarReminderButton`, ale jako zwykłe pozycje menu.
// Dzięki temu kalendarz może mieszkać w menu ekranu znamienia, zamiast być
// osobnym rozwijanym przyciskiem obok niego (ticket 14, ustalenie 3: menu
// nie zagnieżdżamy w menu).
//
// Zwraca pozycje w kształcie przyjmowanym przez `OverflowMenu`:
// `{ key, label, onSelect }` albo `{ key, label, href }`.
export function calendarActions({
  label,
  lastDate,
  intervalWeeks = 6,
  leadDays = 7,
  startDate: startDateProp,
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

  const download = () => {
    const slug = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, '-')
      .slice(0, 40)
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

  return [
    {
      key: 'ics',
      label: `Do kalendarza: plik .ics (co ${intervalWeeks} tyg.)`,
      onSelect: download,
    },
    {
      key: 'google',
      label: 'Google Calendar',
      href: googleCalendarUrl({
        title,
        description,
        startYMD: startDate,
        intervalWeeks,
      }),
    },
    {
      key: 'outlook',
      label: 'Outlook',
      href: outlookCalendarUrl({ title, description, startYMD: startDate }),
    },
  ]
}
