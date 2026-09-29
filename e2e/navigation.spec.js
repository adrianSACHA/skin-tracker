import { expect, test } from '@playwright/test'
import { mockSupabase } from './support/mock-supabase.js'
import { BASE_PATH, loginAsDemo, openPerson } from './support/app.js'

test.describe('Nawigacja i mapa ciała', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
    await loginAsDemo(page)
    await openPerson(page, 'Ja')
  })

  test('mapa ciała pokazuje piny znamion', async ({ page }) => {
    // Widok „Tył” ma tło, więc widać jego piny (każdy pin ma nazwę
    // i status w etykiecie, więc da się je odczytać bez patrzenia na ekran).
    await expect(
      page.getByRole('heading', { name: 'Mapa ciała — Ja' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Tył-1 — Stabilne' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', {
        name: 'Kark — znamię przy włosach — Do obserwacji',
      })
    ).toBeVisible()
    await expect(page.getByRole('button', { name: '+ Dodaj znamię' })).toBeVisible()
    await expect(page.getByRole('button', { name: '+ Dodaj widok' })).toBeVisible()
  })

  test('zakładki przełączają widoki i trzymają adres', async ({ page }) => {
    await page.getByRole('link', { name: 'Lista znamion' }).click()
    await expect(page).toHaveURL(/#\/person\/person-1\/list$/)
    await expect(
      page.getByRole('heading', { name: 'Lista znamion' })
    ).toBeVisible()

    await page.getByRole('link', { name: /^Kontrole/ }).click()
    await expect(page).toHaveURL(/#\/person\/person-1\/reminders$/)
    // UWAGA: React Router zmienia adres w `startTransition`, więc URL zmienia
    // się ZANIM wyrenderuje się nowy ekran. Czekamy na ekran, nie na adres —
    // inaczej przez chwilę w DOM są oba widoki (i np. dwa linki „Mapa ciała”:
    // ten z nawigacji i breadcrumb listy znamion).
    await expect(
      page.getByRole('heading', { name: /^Kontrole/ })
    ).toBeVisible()

    await page.getByRole('link', { name: 'Mapa ciała', exact: true }).click()
    await expect(page).toHaveURL(/#\/person\/person-1$/)
  })

  test('nieznany adres nie wywala aplikacji', async ({ page }) => {
    // Sesja jest zapisana lokalnie, więc pełne wejście zachowuje zalogowanie.
    await page.goto(`${BASE_PATH}#/person/person-1/nie-ma-takiej-strony`)

    // Brak trasy -> ekran wyboru osoby (celowo bez przekierowania).
    await expect(
      page.getByRole('heading', { name: 'Wybierz osobę' })
    ).toBeVisible()
  })
})
