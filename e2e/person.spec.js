import { expect, test } from '@playwright/test'
import { makeData, mockSupabase } from './support/mock-supabase.js'
import { loginAsDemo, openPerson } from './support/app.js'

test.describe('Osoby', () => {
  test('lista osób z backendu i wejście w osobę', async ({ page }) => {
    await mockSupabase(page)
    await loginAsDemo(page)

    await expect(page.getByText('Ja', { exact: true })).toBeVisible()
    await expect(page.getByText('Syn', { exact: true })).toBeVisible()

    // Karta pokazuje liczby i najbliższy termin, liczone tą samą logiką co
    // Kontrole (2 znamiona, 1 zdjęcie; 2025-11-10 + 6 tyg. = 22.12.2025).
    await expect(page.getByText('2 znamiona · 1 zdjęcie')).toBeVisible()
    await expect(page.getByText('kontrola 22.12.2025')).toBeVisible()
    await expect(page.getByText('zaległe')).toBeVisible()

    // Osoba bez znamion zamiast liczb dostaje wprost informację.
    await expect(page.getByText('Brak znamion')).toBeVisible()

    await openPerson(page, 'Syn')

    // HashRouter: adres trzyma id osoby, więc odświeżenie nie gubi kontekstu.
    await expect(page).toHaveURL(/#\/person\/person-2$/)
    // W nagłówku widać, w czyjej dokumentacji jesteś — klikalne (zmiana osoby).
    await expect(
      page.getByRole('link', { name: /^Osoba: Syn/ })
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Mapa ciała' })).toBeVisible()

    // Wskaźnik prowadzi do zmiany osoby (świadome przełączanie).
    await page.getByRole('link', { name: /^Osoba: Syn/ }).click()
    await expect(page.getByRole('heading', { name: 'Wybierz osobę' })).toBeVisible()

    // Ticket 14, ustalenie 2: nawigacja jest związana z KONKRETNĄ osobą, więc
    // na ekranie wyboru osoby jej nie ma. Wcześniej była widoczna i prowadziła
    // do poprzednio wybranej osoby — na telefonie bez informacji, której.
    await expect(page.locator('header nav')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /^Osoba:/ })).toHaveCount(0)
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
    // Świeża osoba nie ma jeszcze znamion.
    await expect(page.getByText('Brak znamion')).toBeVisible()
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
