import 'add-to-calendar-button'
import { addWeeksYMD, formatDate, todayYMD } from '../lib/date'

// 100% client-side: web component <add-to-calendar-button> generuje
// wydarzenie dla Google/Apple/Outlook oraz uniwersalny plik .ics.
// Brak backendu, brak zmiany hostingu.
//
// Data wydarzenia = data ostatniej sesji + interwał (domyślnie 6 tygodni).
export default function CalendarReminderButton({
  label,
  lastDate,
  intervalWeeks = 6,
  notes,
  className = '',
}) {
  const baseDate = lastDate || todayYMD()
  const startDate = addWeeksYMD(baseDate, intervalWeeks)
  const timeZone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Warsaw'

  const description = [
    `Zaplanowana kontrola znamienia „${label}”.`,
    lastDate ? `Ostatnia sesja zdjęciowa: ${formatDate(lastDate)}.` : null,
    'Zrób nowe zdjęcie w tej samej pozycji i przy podobnym oświetleniu co poprzednie.',
    notes ? `Notatka: ${notes}` : null,
    'To tylko przypomnienie o dokumentacji — aplikacja nie diagnozuje zmian.',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={className}>
      <add-to-calendar-button
        name={`Kontrola znamienia: ${label}`}
        description={description}
        startDate={startDate}
        endDate={startDate}
        startTime="09:00"
        endTime="09:30"
        timeZone={timeZone}
        options="'Google','Apple','iCal','Outlook.com','Microsoft 365'"
        label="Dodaj przypomnienie do kalendarza"
        trigger="click"
        buttonStyle="date"
        lightMode="light"
        hideBranding="true"
      />
    </div>
  )
}
