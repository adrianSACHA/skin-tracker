import { expect, test } from '@playwright/test'
import { mockSupabase } from './support/mock-supabase.js'
import { loginAsDemo, openPerson } from './support/app.js'

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

    // Znacznik w nagłówku liczy się od nowa przy wejściu do aplikacji.
    await page.reload()
    await expect(
      page.getByRole('link', { name: 'Kontrole', exact: true })
    ).toBeVisible()

    // Karta osoby: bez plakietki „zaległe”, z nowym najbliższym terminem
    // (2026-12-01 z ręcznej daty drugiego znamienia).
    await page.getByRole('link', { name: 'Skin Tracker' }).click()
    await expect(
      page.getByRole('heading', { name: 'Wybierz osobę' })
    ).toBeVisible()

    await expect(page.getByText('zaległe')).toHaveCount(0)
    await expect(page.getByText('kontrola 01.12.2026')).toBeVisible()
    // Liczniki nadal opisują całą dokumentację (znamiona nie zniknęły).
    await expect(page.getByText('2 znamiona · 1 zdjęcie')).toBeVisible()
  })

  test('„Usunięte” zostają na liście znamion (filtr statusu działa)', async ({
    page,
  }) => {
    await mockSupabase(page)
    await loginAsDemo(page)
    await openPerson(page, 'Ja')

    await page.getByRole('button', { name: 'Tył-1 — Stabilne' }).click()
    await page.locator('#quick-status').selectOption('removed')
    await expect(page.getByText('Zmiany zapisane')).toBeVisible()

    await page.getByRole('link', { name: 'Lista znamion' }).click()
    await expect(
      page.getByRole('heading', { name: 'Lista znamion' })
    ).toBeVisible()

    // Nadal widoczne (lista pokazuje całą dokumentację)...
    await expect(page.getByText('Tył-1')).toBeVisible()

    // ...i da się je wyfiltrować po statusie „Usunięte”.
    await page.getByRole('button', { name: 'Filtry' }).click()
    await page.getByRole('checkbox', { name: 'Usunięte' }).click()
    await expect(page).toHaveURL(/status=removed/)
    await expect(page.getByText('Tył-1')).toBeVisible()
    // Drugie znamię ma inny status, więc wypada z filtra.
    await expect(page.getByText('Kark — znamię przy włosach')).toHaveCount(0)
  })
})
