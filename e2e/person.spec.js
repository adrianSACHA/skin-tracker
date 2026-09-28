import { expect, test } from '@playwright/test'
import { makeData, mockSupabase } from './support/mock-supabase.js'
import { loginAsDemo, openPerson } from './support/app.js'

test.describe('Osoby', () => {
  test('lista osób z backendu i wejście w osobę', async ({ page }) => {
    await mockSupabase(page)
    await loginAsDemo(page)

    await expect(page.getByText('Ja', { exact: true })).toBeVisible()
    await expect(page.getByText('Syn', { exact: true })).toBeVisible()

    await openPerson(page, 'Syn')

    // HashRouter: adres trzyma id osoby, więc odświeżenie nie gubi kontekstu.
    await expect(page).toHaveURL(/#\/person\/person-2$/)
    await expect(page.getByText('Osoba:')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Mapa ciała' })).toBeVisible()
  })

  test('dodanie osoby pojawia się na liście', async ({ page }) => {
    const data = makeData()
    data.persons = [] // pusta „baza” - ćwiczymy stan początkowy
    await mockSupabase(page, { data })
    await loginAsDemo(page)

    await expect(page.getByText('Brak osób', { exact: false })).toBeVisible()

    await page.locator('#new-person').fill('Mama')
    await page.getByRole('button', { name: 'Dodaj' }).click()

    await expect(page.getByText('Mama', { exact: true })).toBeVisible()
    await expect(page.getByText('Brak osób', { exact: false })).toHaveCount(0)
  })

  test('zmiana nazwy osoby z menu „⋯”', async ({ page }) => {
    await mockSupabase(page)
    await loginAsDemo(page)

    await page.getByRole('button', { name: 'Akcje osoby Ja' }).click()
    await page.getByRole('menuitem', { name: 'Zmień nazwę' }).click()

    await page.locator('#rename-person').fill('Ja (moje znamiona)')
    await page.getByRole('button', { name: 'Zapisz' }).click()

    await expect(page.getByText('Nazwa zmieniona')).toBeVisible()
    await expect(
      page.getByText('Ja (moje znamiona)', { exact: true })
    ).toBeVisible()
  })

  test('usunięcie osoby wymaga potwierdzenia i usuwa ją z listy', async ({
    page,
  }) => {
    await mockSupabase(page)
    await loginAsDemo(page)

    await page.getByRole('button', { name: 'Akcje osoby Syn' }).click()
    await page.getByRole('menuitem', { name: 'Usuń osobę' }).click()

    // Najpierw dialog - bez potwierdzenia nic się nie dzieje.
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('Usunięte zostaną też wszystkie znamiona')

    await page.getByRole('button', { name: 'Tak, usuń osobę' }).click()

    await expect(page.getByText('Osoba usunięta')).toBeVisible()
    await expect(page.getByText('Syn', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Ja', { exact: true })).toBeVisible()
  })
})
