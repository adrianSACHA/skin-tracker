import { expect } from '@playwright/test'
import { BASE_PATH } from './constants.js'

export { BASE_PATH }

export const DEMO_EMAIL = 'demo@example.com'
export const DEMO_PASSWORD = 'tajne-haslo'

/** Otwiera aplikacje na ekranie startowym (HashRouter, podkatalog GH Pages). */
export async function openApp(page) {
  await page.goto(BASE_PATH)
}

/** Sprawdza, ze widac ekran logowania. */
export async function expectLoginScreen(page) {
  await expect(
    page.getByRole('heading', { name: 'Zaloguj się' })
  ).toBeVisible()
}

/** Wypelnia i wysyla formularz logowania (mock odpowiada od razu). */
export async function submitLogin(
  page,
  { email = DEMO_EMAIL, password = DEMO_PASSWORD } = {}
) {
  await page.locator('#login-email').fill(email)
  await page.locator('#login-password').fill(password)
  await page.getByRole('button', { name: 'Zaloguj' }).click()
}

/** Pelne wejscie do aplikacji: otwarcie + zalogowanie + ekran wyboru osoby. */
export async function loginAsDemo(page, credentials) {
  await openApp(page)
  await expectLoginScreen(page)
  await submitLogin(page, credentials)
  await expect(
    page.getByRole('heading', { name: 'Wybierz osobę' })
  ).toBeVisible()
}

/** Wchodzi w osobe o podanej nazwie (klik w karte na ekranie wyboru). */
/**
 * Udaje stan „aplikacja gotowa do instalacji” — czyli to, co na telefonie
 * wysyła przeglądarka jako `beforeinstallprompt`.
 *
 * W przeglądarce używanej przez testy to zdarzenie nie leci, a właśnie w tym
 * stanie nagłówek puchł do 285 px (przycisk „Zainstaluj” wypychał wiersz do
 * dwóch linii, a pod nawigacją pojawiał się baner instalacji).
 */
export async function makeInstallable(page) {
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt')
    event.prompt = async () => {}
    event.userChoice = Promise.resolve({ outcome: 'accepted' })
    window.dispatchEvent(event)
  })
}

export async function openPerson(page, displayName) {
  await page.getByText(displayName, { exact: true }).click()
  await expect(page.getByRole('link', { name: 'Lista znamion' })).toBeVisible()
}

/** Przechodzi do listy znamion wybranej osoby. */
export async function openLesionList(page) {
  await page.getByRole('link', { name: 'Lista znamion' }).click()
  await expect(
    page.getByRole('heading', { name: 'Lista znamion' })
  ).toBeVisible()
}
