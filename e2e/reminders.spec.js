import { expect, test } from '@playwright/test'
import { mockSupabase } from './support/mock-supabase.js'
import {
  loginAsDemo,
  openPerson,
  openReminders,
} from './support/app.js'

// Ticket 02: znamię oznaczone jako „Usunięte” nie ma czego pilnować, więc
// nie może już: zawyżać znacznika przy „Kontrole”, trafiać na listę Kontroli
// ani robić z karty osoby czerwonej plakietki „zaległe”.
// Z listy znamion „Usunięte” NIE znikają - tam nadal mają być.
test.describe('Znamiona „Usunięte”', () => {
  test('przestają być zaległe: znacznik, Kontrole i karta osoby', async ({
    page,
  }) => {
    await mockSupabase(page)
    await loginAsDemo(page)
    await openPerson(page, 'Ja')

    // Punkt wyjścia: znamię „Tył-1” jest zaległe (dane mocka są z 2025 r.).
    await expect(page.getByRole('link', { name: /^Kontrole \d+$/ })).toBeVisible()

    // Oznaczamy je jako „Usunięte” z panelu pina na mapie ciała.
    await page.getByRole('button', { name: 'Tył-1 — Stabilne' }).click()
    await page.locator('#quick-status').selectOption('removed')
    await expect(page.getByText('Zmiany zapisane')).toBeVisible()

    // Kontrole: znika z listy, a licznik zaległych spada do zera.
    await page.getByRole('link', { name: /^Kontrole/ }).click()
    await expect(page.getByRole('heading', { name: /^Kontrole/ })).toBeVisible()
    await expect(page.getByText('Tył-1')).toHaveCount(0)
    await expect(
      page.getByText('Kark — znamię przy włosach')
    ).toBeVisible()
    await expect(page.getByText('Zaległe:')).toContainText('Zaległe: 0')

    // Znacznik w nagłówku przelicza się sam (ticket 07) — bez przeładowania.
    await expect(
      page.getByRole('link', { name: 'Kontrole', exact: true })
    ).toBeVisible()

    // Karta osoby: bez plakietki „zaległe”, z nowym najbliższym terminem
    // (2026-12-01 z ręcznej daty drugiego znamienia).
    // Zmiana osoby jest pierwszą pozycją menu konta (avatar „J" w nagłówku).
    await page.getByRole('button', { name: /^Konto: Ja/ }).click()
    await page.getByRole('menuitem', { name: /^Zmień osobę/ }).click()
    await expect(
      page.getByRole('heading', { name: 'Wybierz osobę' })
    ).toBeVisible()

    await expect(page.getByText('zaległe')).toHaveCount(0)
    await expect(page.getByText('kontrola 01.12.2026')).toBeVisible()
    // Liczniki nadal opisują całą dokumentację (znamiona nie zniknęły).
    await expect(page.getByText('2 znamiona · 1 zdjęcie')).toBeVisible()
  })

  test('„Usunięte” pokazuje przełącznik, a filtr statusu trafia do adresu', async ({
    page,
  }) => {
    await mockSupabase(page)
    await loginAsDemo(page)
    await openPerson(page, 'Ja')

    await page.getByRole('button', { name: 'Tył-1 — Stabilne' }).click()
    await page.locator('#quick-status').selectOption('removed')
    await expect(page.getByText('Zmiany zapisane')).toBeVisible()

    await openReminders(page)

    // Kontekst okolicy przy nadpisanej nazwie (przeniesione z dawnej listy).
    await expect(page.getByText('Tył · ')).toBeVisible()

    // Domyślnie „Usunięte” nie ma na liście — nie ma czego kontrolować.
    await expect(page.getByText('Tył-1')).toHaveCount(0)

    // Przełącznik w filtrach je pokazuje (to jedyne miejsce, gdzie zostały).
    await page.getByRole('button', { name: 'Filtry' }).click()
    await page.getByRole('checkbox', { name: /Pokaż znamiona/ }).click()
    await expect(page.getByText('Tył-1')).toBeVisible()
    await expect(page.getByText('usunięte — bez kontroli')).toBeVisible()

    // Filtr statusu „Usunięte” zapisuje się w adresie.
    await page.getByRole('checkbox', { name: 'Usunięte', exact: true }).click()
    await expect(page).toHaveURL(/status=removed/)
    await expect(page.getByText('Tył-1')).toBeVisible()
  })
})

test.describe('Znacznik przy „Kontrole”', () => {
  test('przelicza się po zmianie statusu, bez przeładowania', async ({
    page,
  }) => {
    await mockSupabase(page)
    await loginAsDemo(page)
    await openPerson(page, 'Ja')

    await expect(
      page.getByRole('link', { name: /^Kontrole \d+$/ })
    ).toBeVisible()

    // Zmiana statusu na mapie — zostajemy na tym samym ekranie.
    await page.getByRole('button', { name: 'Tył-1 — Stabilne' }).click()
    await page.locator('#quick-status').selectOption('removed')
    await expect(page.getByText('Zmiany zapisane')).toBeVisible()

    // Znacznik musi zniknąć SAM: bez nawigacji i bez reloadu.
    await expect(
      page.getByRole('link', { name: 'Kontrole', exact: true })
    ).toBeVisible()
  })

  test('przesunięcie terminu na Kontrolach od razu zdejmuje zaległość', async ({
    page,
  }) => {
    await mockSupabase(page)
    await loginAsDemo(page)
    await openPerson(page, 'Ja')

    await page.getByRole('link', { name: /^Kontrole/ }).click()
    await expect(page.getByText('Zaległe:')).toContainText('Zaległe: 1')

    // Przesunięcie o 12 tygodni wypada poza horyzont „wkrótce” (30 dni).
    // Dwa wiersze mają własne menu „⋯” — zawężamy do tego ze „Tył-1”.
    await page
      .getByRole('listitem')
      .filter({ hasText: 'Tył-1' })
      .getByLabel('Więcej akcji kontroli')
      .click()
    await page.getByRole('menuitem', { name: 'Przesuń o 12 tyg.' }).click()

    await expect(page.getByText('Zaległe:')).toContainText('Zaległe: 0')
    await expect(
      page.getByRole('link', { name: 'Kontrole', exact: true })
    ).toBeVisible()
  })
})

test.describe('Szukanie w Kontrolach', () => {
  test('zawęża listę i zapisuje się w adresie', async ({ page }) => {
    await mockSupabase(page)
    await loginAsDemo(page)
    await openPerson(page, 'Ja')
    await page.getByRole('link', { name: /^Kontrole/ }).click()

    await expect(page.getByText('Tył-1')).toBeVisible()
    await expect(page.getByText('2 z 2')).toBeVisible()

    await page.getByRole('searchbox', { name: 'Szukaj kontroli' }).fill('kark')

    // Stan w adresie — jak na liście znamion.
    await expect(page).toHaveURL(/q=kark/)
    await expect(page.getByText('1 z 2')).toBeVisible()
    await expect(page.getByText('Tył-1')).toHaveCount(0)
    await expect(
      page.getByText('Kark — znamię przy włosach')
    ).toBeVisible()

    // Odświeżenie zachowuje filtr.
    await page.reload()
    await expect(page.getByText('1 z 2')).toBeVisible()
    await expect(
      page.getByRole('searchbox', { name: 'Szukaj kontroli' })
    ).toHaveValue('kark')
  })

  test('brak trafień mówi o tym wprost', async ({ page }) => {
    await mockSupabase(page)
    await loginAsDemo(page)
    await openPerson(page, 'Ja')
    await page.getByRole('link', { name: /^Kontrole/ }).click()

    await page.getByRole('searchbox', { name: 'Szukaj kontroli' }).fill('nie-ma-takiego')

    await expect(page.getByText('Brak kontroli dla podanego szukania.')).toBeVisible()
    // Licznik pokazuje kontekst: nic z tego, co jest.
    await expect(page.getByText('0 z 2')).toBeVisible()
  })
})
