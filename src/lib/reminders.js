// Logika przypomnień dla skryptu wysyłającego powiadomienia
// (`scripts/send-reminders.mjs`). Czyste funkcje — bez I/O i bez sieci — więc
// wreszcie da się je przetestować.
//
// Wcześniej ta logika żyła wyłącznie w skrypcie i była drugą kopią tego, co
// robi aplikacja (`buildRows`/`dueRows`). Teraz termin liczy ten sam kod co
// Kontrole w aplikacji, a tutaj dochodzi tylko część „kiedy przypomnieć”.
import { addDaysYMD, todayYMD } from './date.js'
import { dueRows } from './lesionView.js'
import { DEFAULT_INTERVAL_WEEKS } from './settings.js'

export const DEFAULT_LEAD_DAYS = 7

/**
 * Które znamiona są do przypomnienia i dlaczego reszta nie.
 *
 * Reguła: przypominamy raz na cykl kontroli. Wysyłamy, gdy dziś minęło
 * „przypomnij X dni przed terminem” ORAZ nie wysłaliśmy już dla TEGO terminu
 * (`last_reminded_at`). Dzięki temu jedno znamię nie generuje powiadomienia
 * codziennie, dopóki nie ruszy jego termin.
 *
 * Znamiona „Usunięte” są pomijane przez `dueRows` — nie ma czego pilnować.
 *
 * @param {Array} lesions znamiona jednej osoby
 * @param {{ intervalWeeks?: number, leadDays?: number, today?: string }} [options]
 */
export function collectDue(
  lesions,
  { intervalWeeks, leadDays = DEFAULT_LEAD_DAYS, today = todayYMD() } = {}
) {
  const all = lesions || []
  const rows = dueRows(all, {
    intervalWeeks: intervalWeeks || DEFAULT_INTERVAL_WEEKS,
    today,
  })

  const due = []
  let notYet = 0
  let alreadyReminded = 0

  for (const row of rows) {
    const remindOn = addDaysYMD(row.next, -leadDays)
    if (today < remindOn) {
      notYet += 1
      continue
    }
    const lastReminded = row.lesion.last_reminded_at
    if (lastReminded && lastReminded >= remindOn) {
      alreadyReminded += 1
      continue
    }
    due.push({
      lesion: row.lesion,
      next: row.next,
      remindOn,
      overdue: Boolean(row.overdue),
    })
  }

  return {
    due,
    skipped: {
      // Różnica między wszystkimi a wierszami = pominięte „Usunięte”.
      removed: all.length - rows.length,
      notYet,
      alreadyReminded,
    },
  }
}

/** Treść zwykłego przypomnienia o kontrolach danej osoby. */
export function buildNotification({ displayName, due }) {
  const overdue = (due || []).filter((row) => row.overdue).length
  const body =
    due.length === 1
      ? `Kontrola znamienia „${due[0].lesion.label}” (termin ${due[0].next}).`
      : `${due.length} kontroli do wykonania${overdue ? ` — ${overdue} zaległych` : ''}.`

  return {
    title: `Skin Tracker${displayName ? ` — ${displayName}` : ''}`,
    body,
    tag: 'skin-tracker-due',
    url: './',
  }
}

/** Treść powiadomienia próbnego (tryb `force`). */
export function buildTestNotification({ displayName }) {
  return {
    title: `Skin Tracker${displayName ? ` — ${displayName}` : ''}`,
    body: 'To jest próba powiadomienia. Jeśli je widzisz, powiadomienia w tle działają.',
    tag: 'skin-tracker-test',
    url: './',
  }
}

/**
 * Podsumowanie przebiegu do `$GITHUB_STEP_SUMMARY`.
 *
 * Sens: po przebiegu ma być widać na stronie runu, ile wysłano i **dlaczego
 * nic nie poszło** — bez schodzenia w log. Zielony ptaszek na liście przebiegów
 * nie mówi nic o tym, czy powiadomienie faktycznie poszło.
 *
 * @param {{ force?: boolean, results: Array<{ personName: string, due: number,
 *   sent: number, failed: number, subscriptions: number,
 *   skipped: { removed: number, notYet: number, alreadyReminded: number } }> }} input
 */
export function renderRunSummary({ force = false, results = [] } = {}) {
  const sum = results.reduce(
    (acc, r) => ({
      sent: acc.sent + r.sent,
      failed: acc.failed + r.failed,
      subscriptions: acc.subscriptions + r.subscriptions,
    }),
    { sent: 0, failed: 0, subscriptions: 0 }
  )

  const lines = []
  lines.push(
    force
      ? '## Powiadomienia — przebieg testowy (`force`)'
      : '## Powiadomienia — przebieg dzienny'
  )
  lines.push('')

  if (force) {
    lines.push(
      'Tryb próbny: terminy zignorowane, `last_reminded_at` **nie** zostało zmienione.',
      ''
    )
  }

  if (sum.sent === 0 && sum.failed === 0) {
    lines.push('**Nic do wysłania.**')
  } else {
    lines.push(`**Wysłano: ${sum.sent}**, nieudanych: ${sum.failed}.`)
  }
  lines.push('')

  if (results.length > 0) {
    lines.push('| Osoba | Subskrypcje | W terminie | Wysłano | Zbyt wcześnie | Już przypomniane | Usunięte |')
    lines.push('| --- | --- | --- | --- | --- | --- | --- |')
    for (const r of results) {
      lines.push(
        `| ${r.personName} | ${r.subscriptions} | ${r.due} | ${r.sent} | ${r.skipped.notYet} | ${r.skipped.alreadyReminded} | ${r.skipped.removed} |`
      )
    }
    lines.push('')
  }

  if (sum.failed > 0) {
    lines.push(
      '> Wysyłka nie powiodła się. Jeśli padły wszystkie próby, sprawdź, czy nie zmieniano pary kluczy VAPID — jej zmiana unieważnia wszystkie istniejące subskrypcje i trzeba włączyć „Powiadomienia w tle” na urządzeniu od nowa.'
    )
    lines.push('')
  }

  if (!force && sum.subscriptions === 0) {
    lines.push(
      '> Brak zapisanych subskrypcji — nie ma do czego wysyłać. Włącz „Powiadomienia w tle” w Kontrolach na telefonie.'
    )
    lines.push('')
  }

  return lines.join('\n') + '\n'
}
