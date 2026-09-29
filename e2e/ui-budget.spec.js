import { expect, test } from '@playwright/test'
import { mockSupabase } from './support/mock-supabase.js'
import {
  loginAsDemo,
  makeInstallable,
  openLesionList,
  openPerson,
} from './support/app.js'

// Budżet miejsca na małym telefonie (iPhone SE: 375x667).
//
// To celowo NIE zrzut ekranu, a pomiar: zrzuty zależą od czcionek i
// antyaliasingu, więc baseline z Windowsa nie zgadza się z tym, co renderuje
// CI na Linuksie (czerwone testy bez powodu). Liczby są deterministyczne
// i wprost kodują to, o co chodzi: nagłówek nie może zjadać połowy ekranu,
// a pierwsza treść ma być widoczna bez przewijania.
const VIEWPORT = { width: 375, height: 667 }

// 130 px to ~19% wysokości ekranu. Po odchudzeniu nagłówka wychodzi ~121 px,
// więc limit zostawia zapas, ale wyłapuje powrót do 285 px.
const MAX_HEADER_HEIGHT = 130

test.use({ viewport: VIEWPORT })

async function headerHeight(page) {
  const box = await page.locator('header').boundingBox()
  expect(box, 'nagłówek musi istnieć').not.toBeNull()
  return Math.round(box.height)
}

async function assertHeaderBudget(page, where) {
  expect(
    await headerHeight(page),
    `nagłówek na ekranie: ${where}`
  ).toBeLessThanOrEqual(MAX_HEADER_HEIGHT)
}

async function assertAboveFold(page, locator, what) {
  const box = await locator.boundingBox()
  expect(box, `${what} musi być widoczne`).not.toBeNull()
  expect(
    Math.round(box.y + box.height),
    `${what} musi zmieścić się nad linią zgięcia`
  ).toBeLessThanOrEqual(VIEWPORT.height)
}

test.describe('Budżet miejsca na małym telefonie', () => {
  // Ten stan jest kluczowy: na telefonie PRZED instalacją przeglądarka wysyła
  // `beforeinstallprompt` i właśnie wtedy nagłówek rósł do 285 px.
  test('nagłówek mieści się w budżecie także z banerem instalacji', async ({
    page,
  }) => {
    await mockSupabase(page)
    await loginAsDemo(page)

    await assertHeaderBudget(page, 'wybór osoby')

    await openPerson(page, 'Ja')
    await assertHeaderBudget(page, 'mapa ciała')

    // Od tego miejsca udajemy telefon gotowy do instalacji.
    await makeInstallable(page)
    await expect(page.getByText('Zainstaluj aplikację', { exact: false })).toBeVisible()
    await assertHeaderBudget(page, 'mapa ciała + instalacja')

    await openLesionList(page)
    await assertHeaderBudget(page, 'lista znamion + instalacja')

    await page.getByRole('link', { name: /^Kontrole/ }).click()
    await assertHeaderBudget(page, 'Kontrole + instalacja')
  })

  test('pierwszy wiersz listy znamion jest widoczny bez przewijania', async ({
    page,
  }) => {
    await mockSupabase(page)
    await loginAsDemo(page)
    await openPerson(page, 'Ja')
    await makeInstallable(page)
    await openLesionList(page)

    await assertAboveFold(
      page,
      page.getByRole('listitem').first(),
      'pierwszy wiersz listy'
    )
  })

  test('na Kontrolach widać licznik zaległości bez przewijania', async ({
    page,
  }) => {
    await mockSupabase(page)
    await loginAsDemo(page)
    await openPerson(page, 'Ja')
    await makeInstallable(page)
    await page.getByRole('link', { name: /^Kontrole/ }).click()

    await assertAboveFold(
      page,
      page.getByText('Zaległe:'),
      'licznik zaległości'
    )
  })
})
