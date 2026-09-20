// Generator plików .ics (RFC 5545) - bez zależności zewnętrznych.
// Tworzy CYKLICZNE przypomnienie o kontroli (co N tygodni) z alarmem
// X dni wcześniej - tak, aby po jednej akcji kalendarz sam przypominał.
//
// Format czasu: UTC (YYYYMMDDTHHMMSSZ). Godzinę lokalną (domyślnie 09:00)
// przeliczamy na UTC przez Date, więc zmiana czasu (DST) jest obsłużona.

const PRODID = '-//Skin Tracker//Dokumentacja znamion//PL'

function pad(n) {
  return String(n).padStart(2, '0')
}

// 'YYYY-MM-DD' + godzina lokalna -> znacznik UTC YYYYMMDDTHHMMSSZ
export function utcStamp(ymd, hour = 9, minute = 0) {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(y, m - 1, d, hour, minute, 0)
  return (
    `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}` +
    `T${pad(dt.getUTCHours())}${pad(dt.getUTCMinutes())}00Z`
  )
}

function nowStamp() {
  return new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '')
}

// Escapowanie tekstu wg RFC 5545.
function escapeText(value) {
  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

// Składanie linii do 75 oktetów (RFC 5545, sekcja 3.1).
function foldLine(line) {
  if (line.length <= 75) return line
  let out = ''
  let rest = line
  while (rest.length > 75) {
    out += `${rest.slice(0, 75)}\r\n `
    rest = rest.slice(75)
  }
  return out + rest
}

// Buduje treść pliku .ics dla jednego znamienia (jeden cykliczny VEVENT).
export function buildCheckupIcs({
  uid,
  title,
  description,
  startYMD,
  intervalWeeks = 6,
  leadDays = 7,
  startHour = 9,
  durationMinutes = 30,
}) {
  const dtStart = utcStamp(startYMD, startHour, 0)
  const dtEnd = utcStamp(startYMD, startHour, durationMinutes)
  // Dwa alarmy: X dni wcześniej (jeśli > 0) oraz w dniu kontroli.
  const alarmTriggers = leadDays > 0 ? [`-P${leadDays}D`, 'PT0S'] : ['PT0S']

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowStamp()}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `RRULE:FREQ=WEEKLY;INTERVAL=${intervalWeeks}`,
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(description)}`,
    'TRANSP:TRANSPARENT',
    'SEQUENCE:0',
    ...alarmTriggers.flatMap((trigger) => [
      'BEGIN:VALARM',
      `TRIGGER:${trigger}`,
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeText(title)}`,
      'END:VALARM',
    ]),
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return `${lines.map(foldLine).join('\r\n')}\r\n`
}

// Pobranie pliku .ics w przeglądarce.
export function downloadIcs(filename, content) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Deep-link: Google Calendar (obsługuje powtarzanie przez parametr recur).
export function googleCalendarUrl({
  title,
  description,
  startYMD,
  intervalWeeks = 6,
  startHour = 9,
  durationMinutes = 30,
}) {
  const dates = `${utcStamp(startYMD, startHour, 0)}/${utcStamp(
    startYMD,
    startHour,
    durationMinutes
  )}`
  const recur =
    intervalWeeks > 1
      ? `&recur=${encodeURIComponent(`RRULE:FREQ=WEEKLY;INTERVAL=${intervalWeeks}`)}`
      : ''
  return (
    'https://calendar.google.com/calendar/render?action=TEMPLATE' +
    `&text=${encodeURIComponent(title)}` +
    `&details=${encodeURIComponent(description)}` +
    `&dates=${dates}` +
    recur
  )
}

// Deep-link: Outlook (pojedyncze wydarzenie - Outlook nie przyjmuje RRULE w linku).
export function outlookCalendarUrl({
  title,
  description,
  startYMD,
  startHour = 9,
  durationMinutes = 30,
}) {
  const so = new Date(
    `${startYMD}T00:00:00`
  )
  so.setHours(startHour, 0, 0, 0)
  const eo = new Date(so.getTime() + durationMinutes * 60000)
  const isoNoMs = (d) => d.toISOString().replace(/\.\d{3}Z$/, 'Z')
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title,
    body: description,
    startdt: isoNoMs(so),
    enddt: isoNoMs(eo),
    allday: 'false',
  })
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

// Opis wydarzenia (wspólny dla .ics i deep-linków).
export function checkupDescription({
  label,
  lastDate,
  intervalWeeks,
  leadDays,
  formatDate,
}) {
  const parts = [
    `Zaplanowana kontrola znamienia „${label}”.`,
    lastDate ? `Ostatnia sesja zdjęciowa: ${formatDate(lastDate)}.` : null,
    `Powtarza się co ${intervalWeeks} tyg.${
      leadDays > 0
        ? ` (przypomnienie ${leadDays} dni przed i w dniu kontroli)`
        : ' (przypomnienie w dniu kontroli)'
    }.`,
    'Zrób nowe zdjęcie w tej samej pozycji i przy podobnym oświetleniu co poprzednie.',
    'To przypomnienie o dokumentacji — aplikacja nie diagnozuje zmian.',
  ]
  return parts.filter(Boolean).join(' ')
}
