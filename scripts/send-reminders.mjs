// Wysyłka przypomnień Web Push — uruchamiane przez GitHub Actions (cron).
// Łączy się z Supabase kluczem service_role, liczy terminy i wysyła powiadomienia
// do zapisanych subskrypcji. Bez własnego serwera i bez płatnych funkcji.
//
// Logika terminów mieszka w `src/lib/reminders.js` (czyste funkcje, testowane
// w `src/lib/reminders.test.js`) — tutaj jest tylko I/O: baza, wysyłka, raport.
//
// Wymagane zmienne środowiskowe (GitHub Secrets):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (opcjonalnie)
// Opcjonalnie:
//   FORCE=true  — tryb próbny: wysyła powiadomienie niezależnie od terminów
//                 i NIE zapisuje `last_reminded_at` (nie zużywa cyklu).
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { appendFile } from 'node:fs/promises'
import { todayYMD } from '../src/lib/date.js'
import { DEFAULT_INTERVAL_WEEKS } from '../src/lib/settings.js'
import {
  buildNotification,
  buildTestNotification,
  collectDue,
  renderRunSummary,
  DEFAULT_LEAD_DAYS,
} from '../src/lib/reminders.js'

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY,
} = process.env

const FORCE = String(process.env.FORCE || '').toLowerCase() === 'true'

// web-push wymaga, by "subject" był URL-em (mailto: albo https://). Bierzemy go
// z sekretu VAPID_SUBJECT, ale nie wywalamy wysyłki, gdy format jest zły.
function resolveVapidSubject() {
  const raw = (process.env.VAPID_SUBJECT || '').trim()
  if (/^mailto:.+@.+/.test(raw) || /^https?:\/\/.+/.test(raw)) return raw
  if (raw.includes('@')) return `mailto:${raw}` // sam e-mail -> dokładamy mailto:
  return 'https://example.com'
}
const VAPID_SUBJECT = resolveVapidSubject()

if (
  !SUPABASE_URL ||
  !SUPABASE_SERVICE_ROLE_KEY ||
  !VAPID_PUBLIC_KEY ||
  !VAPID_PRIVATE_KEY
) {
  console.error(
    'Brak wymaganych sekretów: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY.'
  )
  process.exit(1)
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const today = todayYMD()
if (FORCE) console.log('Tryb próbny (FORCE): terminy zignorowane, cykl nie zostanie zużyty.')

const { data: persons, error: personsError } = await supabase
  .from('monitored_persons')
  .select('id, owner_user_id, display_name, reminder_lead_days, interval_weeks')

if (personsError) {
  console.error('Błąd pobierania osób:', personsError.message)
  process.exit(1)
}

const results = []
let sent = 0
let failed = 0

for (const person of persons || []) {
  const leadDays = Number.isFinite(person.reminder_lead_days)
    ? person.reminder_lead_days
    : DEFAULT_LEAD_DAYS
  const intervalWeeks = person.interval_weeks || DEFAULT_INTERVAL_WEEKS

  const { data: lesions, error: lesionsError } = await supabase
    .from('lesions')
    .select('*, lesion_photos(taken_at)')
    .eq('person_id', person.id)

  if (lesionsError) {
    console.error(`Błąd pobierania znamion (${person.id}):`, lesionsError.message)
    continue
  }

  const { due, skipped } = collectDue(lesions || [], {
    intervalWeeks,
    leadDays,
    today,
  })

  const { data: subs, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('owner_user_id', person.owner_user_id)

  if (subsError) {
    console.error(`Błąd pobierania subskrypcji (${person.id}):`, subsError.message)
    continue
  }

  const subscriptions = subs || []
  const result = {
    personName: person.display_name || '(bez nazwy)',
    due: due.length,
    sent: 0,
    failed: 0,
    subscriptions: subscriptions.length,
    skipped,
  }

  // W trybie próbnym wysyłamy niezależnie od terminów — po to istnieje.
  if ((FORCE || due.length > 0) && subscriptions.length > 0) {
    const payload = JSON.stringify(
      FORCE
        ? buildTestNotification({ displayName: person.display_name })
        : buildNotification({ displayName: person.display_name, due })
    )

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload
        )
        result.sent += 1
      } catch (err) {
        result.failed += 1
        const code = err?.statusCode
        if (code === 404 || code === 410) {
          // Subskrypcja wygasła/odrzucona — sprzątamy.
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error(`Push error (${code || '??'}):`, err?.body || err?.message)
        }
      }
    }
  }

  // `last_reminded_at` zapisujemy TYLKO gdy coś faktycznie wyszło i TYLKO w
  // normalnym trybie. Wcześniej zapisywało się nawet przy kompletnym niepowodzeniu
  // wysyłki — wtedy przypomnienie na ten cykl przepadało bez śladu.
  // W trybie próbnym nie ruszamy niczego: próba nie może zużyć prawdziwego cyklu.
  if (!FORCE && due.length > 0 && result.sent > 0) {
    await supabase
      .from('lesions')
      .update({ last_reminded_at: today })
      .in(
        'id',
        due.map((row) => row.lesion.id)
      )
  }

  sent += result.sent
  failed += result.failed
  results.push(result)
}

// Podsumowanie ląduje w kroku (step summary), więc po przebiegu widać na stronie
// runu, ile wysłano i dlaczego nic nie poszło — bez szukania w logu.
const summary = renderRunSummary({ force: FORCE, results })
console.log(summary)
if (process.env.GITHUB_STEP_SUMMARY) {
  await appendFile(process.env.GITHUB_STEP_SUMMARY, summary)
}

console.log(
  `Gotowe. Wysłano powiadomień: ${sent}${failed ? `, nieudanych: ${failed}` : ''}.`
)
