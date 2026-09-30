import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { makeData, mockSupabase } from './support/mock-supabase.js'
import { loginAsDemo, openPerson, openReminders } from './support/app.js'

// Audyt dostępności (ticket 05) — część automatyczna.
//
// `axe-core` wyłapuje rzeczy, których nie widać w przeglądaniu: brakujące
// etykiety, błędne role, kontrast, kolejność nagłówków, elementy nieosiągalne
// klawiaturą. Tego, czy da się przejść aplikację Tabem i czy menu „⋯" zamyka
// się Escape, automat nie sprawdzi — to zostaje do przejścia ręcznego (część B
// ticketu, patrz `## Zostało`).
//
// Uruchamiane razem z `npm run e2e`, więc dostępność pilnowana jest przy każdej
// zmianie, a nie raz na rok.
const TAGI = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

function photo(id, taken, size) {
  return {
    id,
    lesion_id: 'lesion-1',
    photo_url: `user-e2e-1/person-1/lesion-1/${id}.webp`,
    taken_at: taken,
    size_mm: size,
    notes: null,
    asymmetry: false,
    border_irregular: false,
    color_description: null,
    evolution_notes: null,
  }
}

async function sprawdzDostepnosc(page, gdzie) {
  // Zatrzymujemy animacje i przejścia: axe bada styl OBLICZONY w danej
  // chwili, więc kolor w trakcie przejścia (np. zakładka zmieniająca tło
  // z aktywnego na nieaktywne) dawał fałszywe trafienia na kontrast.
  await page.addStyleTag({
    content:
      '*, *::before, *::after { transition: none !important; animation: none !important; }',
  })
  const wynik = await new AxeBuilder({ page }).withTags(TAGI).analyze()
  const opis = wynik.violations.map((v) => ({
    id: v.id,
    waga: v.impact,
    opis: v.help,
    wezly: v.nodes.map((n) => {
      const cel = n.target.join(' ')
      const podsumowanie = (n.failureSummary || '').split('\n').slice(0, 2).join(' ')
      return `${cel} — ${podsumowanie}`
    }),
  }))

  expect(
    wynik.violations,
    `Naruszenia WCAG na ekranie „${gdzie}”:\n${JSON.stringify(opis, null, 2)}`
  ).toEqual([])
}

test.describe('Dostępność (axe-core)', () => {
  test('ekran logowania', async ({ page }) => {
    await mockSupabase(page)
    await page.goto('/skin-tracker/')
    await expect(
      page.getByRole('heading', { name: 'Zaloguj się' })
    ).toBeVisible()
    await sprawdzDostepnosc(page, 'logowanie')
  })

  test('wybór osoby', async ({ page }) => {
    await mockSupabase(page)
    await loginAsDemo(page)
    await sprawdzDostepnosc(page, 'wybór osoby')
  })

  test('Kontrole (z filtrami)', async ({ page }) => {
    const data = makeData()
    data.photos = [photo('ph1', '2026-01-05', 5.0)]
    await mockSupabase(page, { data })
    await loginAsDemo(page)
    await openPerson(page, 'Ja')
    await openReminders(page)
    await sprawdzDostepnosc(page, 'Kontrole')

    await page.getByRole('button', { name: 'Filtry' }).click()
    await sprawdzDostepnosc(page, 'Kontrole + filtry')
  })

  test('mapa ciała i panel pinu', async ({ page }) => {
    await mockSupabase(page)
    await loginAsDemo(page)
    await openPerson(page, 'Ja')
    await sprawdzDostepnosc(page, 'mapa ciała')

    await page.getByRole('button', { name: /Tył-1/ }).click()
    await sprawdzDostepnosc(page, 'panel pinu')
  })

  test('karta znamienia (zakładki i menu)', async ({ page }) => {
    const data = makeData()
    data.photos = [
      photo('ph1', '2026-01-05', 5.0),
      photo('ph2', '2026-03-02', 5.4),
      photo('ph3', '2026-05-20', 6.1),
    ]
    await mockSupabase(page, { data })
    await loginAsDemo(page)
    await page.goto('/skin-tracker/#/person/person-1/lesion/lesion-1')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

    await sprawdzDostepnosc(page, 'karta znamienia — Przegląd')

    await page.getByRole('tab', { name: 'Zdjęcia' }).click()
    await sprawdzDostepnosc(page, 'karta znamienia — Zdjęcia')

    await page.getByRole('tab', { name: 'Trend' }).click()
    await sprawdzDostepnosc(page, 'karta znamienia — Trend')

    await page.getByRole('button', { name: 'Akcje znamienia' }).click()
    await sprawdzDostepnosc(page, 'karta znamienia — menu „⋯”')
  })

  test('tryb ciemny', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' })
    await mockSupabase(page)
    await loginAsDemo(page)
    await openPerson(page, 'Ja')
    await sprawdzDostepnosc(page, 'mapa ciała — tryb ciemny')

    await openReminders(page)
    await sprawdzDostepnosc(page, 'Kontrole — tryb ciemny')
  })
})
