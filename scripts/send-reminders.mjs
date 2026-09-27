// Wysyłka przypomnień Web Push — uruchamiane przez GitHub Actions (cron).
// Łączy się z Supabase kluczem service_role, liczy terminy i wysyła powiadomienia
// do zapisanych subskrypcji. Bez własnego serwera i bez płatnych funkcji.
//
// Wymagane zmienne środowiskowe (GitHub Secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (opcjonalnie)
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import {
  addDaysYMD,
  addWeeksYMD,
  daysBetween,
  todayYMD,
} from '../src/lib/date.js'

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
} = process.env
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error(
    'Brak wymaganych sekretów: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY.'
  )
  process.exit(1)
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const today = todayYMD()

function lastPhotoDate(photos) {
  if (!photos || photos.length === 0) return null
  return photos.reduce(
    (max, p) => (max && max > p.taken_at ? max : p.taken_at),
    null
  )
}

// Termin kontroli: ręczny `next_check_at` ma pierwszeństwo; inaczej ostatnie
// zdjęcie + interwał osoby (albo dziś + interwał, gdy brak zdjęć).
function dueForLesion(lesion, intervalWeeks, leadDays) {
  const last = lastPhotoDate(lesion.lesion_photos)
  const next = lesion.next_check_at || addWeeksYMD(last || today, intervalWeeks)
  const remindOn = addDaysYMD(next, -leadDays)
  const overdue = daysBetween(today, next) < 0
  const lastReminded = lesion.last_reminded_at
  const due = today >= remindOn && (!lastReminded || lastReminded < remindOn)
  return { next, remindOn, overdue, due }
}

const { data: persons, error: personsError } = await supabase
  .from('monitored_persons')
  .select('id, owner_user_id, display_name, reminder_lead_days, interval_weeks')

if (personsError) {
  console.error('Błąd pobierania osób:', personsError.message)
  process.exit(1)
}

let sent = 0

for (const person of persons || []) {
  const leadDays = Number.isFinite(person.reminder_lead_days)
    ? person.reminder_lead_days
    : 7
  const intervalWeeks = person.interval_weeks || 6

  const { data: lesions, error: lesionsError } = await supabase
    .from('lesions')
    .select('*, lesion_photos(taken_at)')
    .eq('person_id', person.id)

  if (lesionsError) {
    console.error(`Błąd pobierania znamion (${person.id}):`, lesionsError.message)
    continue
  }

  const due = (lesions || [])
    .map((lesion) => ({ lesion, ...dueForLesion(lesion, intervalWeeks, leadDays) }))
    .filter((r) => r.due)

  if (due.length === 0) continue

  const { data: subs, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('owner_user_id', person.owner_user_id)

  if (subsError) {
    console.error('Błąd pobierania subskrypcji:', subsError.message)
    continue
  }
  if (!subs || subs.length === 0) continue

  const overdue = due.filter((r) => r.overdue).length
  const body =
    due.length === 1
      ? `Kontrola znamienia „${due[0].lesion.label}" (termin ${due[0].next}).`
      : `${due.length} kontroli do wykonania${overdue ? ` — ${overdue} zaległych` : ''}.`

  const payload = JSON.stringify({
    title: `Skin Tracker${person.display_name ? ` — ${person.display_name}` : ''}`,
    body,
    tag: 'skin-tracker-due',
    url: './',
  })

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      )
      sent += 1
    } catch (err) {
      const code = err?.statusCode
      if (code === 404 || code === 410) {
        // Subskrypcja wygasła/odrzucona — sprzątamy.
        await supabase.from('push_subscriptions').delete().eq('id', sub.id)
      } else {
        console.error(`Push error (${code || '??'}):`, err?.body || err?.message)
      }
    }
  }

  await supabase
    .from('lesions')
    .update({ last_reminded_at: today })
    .in(
      'id',
      due.map((r) => r.lesion.id)
    )
}

console.log(`Gotowe. Wysłano powiadomień: ${sent}.`)
