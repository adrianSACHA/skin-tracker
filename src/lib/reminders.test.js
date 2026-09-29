import { describe, expect, it } from 'vitest'
import {
  buildNotification,
  buildTestNotification,
  collectDue,
  renderRunSummary,
} from './reminders'

const TODAY = '2026-06-01'

describe('collectDue', () => {
  it('pomija znamię, którego termin jest jeszcze za daleko', () => {
    // ostatnie zdjęcie 2026-05-25 + 6 tyg. = 2026-07-06; przypomnij 7 dni wcześniej = 2026-06-29
    const lesions = [
      {
        id: 'a',
        label: 'Tył-1',
        status: 'stable',
        lesion_photos: [{ taken_at: '2026-05-25' }],
      },
    ]

    const { due, skipped } = collectDue(lesions, {
      intervalWeeks: 6,
      leadDays: 7,
      today: TODAY,
    })

    expect(due).toEqual([])
    expect(skipped.notYet).toBe(1)
  })

  it('zwraca znamię, gdy minęło „przypomnij X dni przed”', () => {
    // ostatnie zdjęcie 2026-01-05 + 6 tyg. = 2026-02-16 (dawno), więc jest po terminie
    const lesions = [
      {
        id: 'a',
        label: 'Tył-1',
        status: 'stable',
        lesion_photos: [{ taken_at: '2026-01-05' }],
      },
    ]

    const { due } = collectDue(lesions, {
      intervalWeeks: 6,
      leadDays: 7,
      today: TODAY,
    })

    expect(due).toHaveLength(1)
    expect(due[0].next).toBe('2026-02-16')
    expect(due[0].remindOn).toBe('2026-02-09')
    expect(due[0].overdue).toBe(true)
  })

  it('nie przypomina drugi raz o tym samym terminie', () => {
    const lesions = [
      {
        id: 'a',
        label: 'Tył-1',
        status: 'stable',
        lesion_photos: [{ taken_at: '2026-01-05' }],
        // przypomniane już po dacie „przypomnij od” (2026-02-09)
        last_reminded_at: '2026-05-20',
      },
    ]

    const { due, skipped } = collectDue(lesions, {
      intervalWeeks: 6,
      leadDays: 7,
      today: TODAY,
    })

    expect(due).toEqual([])
    expect(skipped.alreadyReminded).toBe(1)
  })

  it('przypomni ponownie, gdy termin przesunie się dalej niż ostatnie przypomnienie', () => {
    const lesions = [
      {
        id: 'a',
        label: 'Tył-1',
        status: 'stable',
        // ręczny termin 2026-06-30, przypomnij od 2026-06-23
        next_check_at: '2026-06-30',
        lesion_photos: [],
        // ostatnie przypomnienie było dla POPRZEDNIEGO terminu
        last_reminded_at: '2026-01-10',
      },
    ]

    const { due } = collectDue(lesions, {
      intervalWeeks: 6,
      leadDays: 7,
      today: '2026-06-25',
    })

    expect(due).toHaveLength(1)
    expect(due[0].next).toBe('2026-06-30')
  })

  it('pomija znamiona „Usunięte” i liczy je w podsumowaniu', () => {
    const lesions = [
      {
        id: 'a',
        label: 'Tył-1',
        status: 'removed',
        lesion_photos: [{ taken_at: '2026-01-05' }],
      },
    ]

    const { due, skipped } = collectDue(lesions, {
      intervalWeeks: 6,
      leadDays: 7,
      today: TODAY,
    })

    expect(due).toEqual([])
    expect(skipped.removed).toBe(1)
  })

  it('bez danych nic nie wywala', () => {
    expect(collectDue(null, { today: TODAY }).due).toEqual([])
    expect(collectDue([], { today: TODAY }).due).toEqual([])
  })
})

describe('buildNotification', () => {
  it('jedno znamię — z nazwą i terminem', () => {
    const notification = buildNotification({
      displayName: 'Ja',
      due: [{ lesion: { label: 'Tył-1' }, next: '2026-06-10', overdue: false }],
    })

    expect(notification.title).toBe('Skin Tracker — Ja')
    expect(notification.body).toContain('Tył-1')
    expect(notification.body).toContain('2026-06-10')
  })

  it('kilka znamion — zbiorczo, z liczbą zaległych', () => {
    const notification = buildNotification({
      displayName: 'Ja',
      due: [
        { lesion: { label: 'a' }, next: '2026-06-10', overdue: true },
        { lesion: { label: 'b' }, next: '2026-06-11', overdue: false },
      ],
    })

    expect(notification.body).toContain('2 kontroli')
    expect(notification.body).toContain('1 zaległych')
  })

  it('bez nazwy osoby nie doklaja myślnika', () => {
    const notification = buildNotification({ displayName: '', due: [] })
    expect(notification.title).toBe('Skin Tracker')
  })
})

describe('buildTestNotification', () => {
  it('mówi wprost, że to próba', () => {
    const notification = buildTestNotification({ displayName: 'Ja' })
    expect(notification.body).toContain('próba')
    expect(notification.tag).toBe('skin-tracker-test')
  })
})

describe('renderRunSummary', () => {
  const base = {
    personName: 'Ja',
    due: 0,
    sent: 0,
    failed: 0,
    subscriptions: 1,
    skipped: { removed: 0, notYet: 2, alreadyReminded: 1 },
  }

  it('gdy nic nie wyszło, mówi to wprost', () => {
    const md = renderRunSummary({ results: [base] })
    expect(md).toContain('Nic do wysłania')
    expect(md).toContain('| Ja | 1 | 0 | 0 | 2 | 1 | 0 |')
  })

  it('gdy poszło, pokazuje liczbę', () => {
    const md = renderRunSummary({
      results: [{ ...base, due: 1, sent: 1 }],
    })
    expect(md).toContain('Wysłano: 1')
  })

  it('przy nieudanych wysyłkach podpowiada o kluczach VAPID', () => {
    const md = renderRunSummary({ results: [{ ...base, failed: 2 }] })
    expect(md).toContain('VAPID')
  })

  it('bez subskrypcji podpowiada, gdzie je włączyć', () => {
    const md = renderRunSummary({ results: [{ ...base, subscriptions: 0 }] })
    expect(md).toContain('Brak zapisanych subskrypcji')
  })

  it('w trybie próbnym zaznacza, że cykl nie został zużyty', () => {
    const md = renderRunSummary({ force: true, results: [{ ...base, sent: 1 }] })
    expect(md).toContain('przebieg testowy')
    expect(md).toContain('nie** zostało zmienione')
  })
})
