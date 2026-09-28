import { expect, test } from '@playwright/test'
import { mockSupabase } from './support/mock-supabase.js'
import {
  expectLoginScreen,
  loginAsDemo,
  openApp,
  submitLogin,
} from './support/app.js'

// Dostep: bez sesji aplikacja nie pokazuje zadnych danych ani nawigacji.
test.describe('Dostęp do aplikacji', () => {
  test('bez sesji pokazuje logowanie i nie odsłania nawigacji', async ({
    page,
  }) => {
    await mockSupabase(page)
    await openApp(page)

    await expectLoginScreen(page)

    // Nawigacja i stopka należą do zalogowanej części aplikacji.
    await expect(page.getByRole('button', { name: 'Wyloguj' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Mapa ciała' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Kontrole' })).toHaveCount(0)
    // Stopka z zastrzeżeniem „nie diagnozuje” też jest tylko po zalogowaniu.
    await expect(page.getByText('Nie diagnozuje', { exact: false })).toHaveCount(0)
  })

  test('błędne dane: komunikat po polsku, bez wejścia do aplikacji', async ({
    page,
  }) => {
    await mockSupabase(page, { loginFails: true })
    await openApp(page)
    await expectLoginScreen(page)

    await submitLogin(page, { password: 'zle-haslo' })

    await expect(page.getByRole('alert')).toContainText(
      'Nieprawidłowy email lub hasło.'
    )
    await expect(
      page.getByRole('heading', { name: 'Wybierz osobę' })
    ).toHaveCount(0)
  })

  test('poprawne logowanie wpuszcza do wyboru osoby', async ({ page }) => {
    await mockSupabase(page)

    await loginAsDemo(page)

    await expect(page.getByText('Ja', { exact: true })).toBeVisible()
    await expect(page.getByText('Syn', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Wyloguj' })).toBeVisible()
  })

  test('wylogowanie wraca na ekran logowania', async ({ page }) => {
    await mockSupabase(page)
    await loginAsDemo(page)

    await page.getByRole('button', { name: 'Wyloguj' }).click()

    await expectLoginScreen(page)
    await expect(page.getByText('Ja', { exact: true })).toHaveCount(0)
  })
})
