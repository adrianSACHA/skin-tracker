import { expect, test } from '@playwright/test'
import { makeData, mockSupabase } from './support/mock-supabase.js'
import { BASE_PATH, loginAsDemo } from './support/app.js'

// Ekran szczegółów znamienia.
//
// Ticket 12: ekran miał 2244 px (3,4 ekranu na 375×667) i wszystko było widoczne
// naraz. Dwie zmiany:
//   A) akcje rzadkie i nieodwracalne → menu „⋯”,
//   B) treść podzielona na zakładki (Przegląd / Zdjęcia / Trend), stan w adresie.
test.use({ viewport: { width: 375, height: 667 }, hasTouch: true })

const LESION_URL = `${BASE_PATH}#/person/person-1/lesion/lesion-1`

// Ekran znamienia ma sens tylko ze zdjęciami (porównanie, historia, trend).
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

async function openLesion(page) {
  const data = makeData()
  data.photos = [
    photo('ph1', '2026-01-05', 5.0),
    photo('ph2', '2026-03-02', 5.4),
    photo('ph3', '2026-05-20', 6.1),
  ]

  await mockSupabase(page, { data })
  await loginAsDemo(page)
  await page.goto(LESION_URL)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
}


test.describe('Ekran znamienia', () => {
  test('pokazuje jedną sekcję naraz, zakładka trafia do adresu', async ({
    page,
  }) => {
    await openLesion(page)

    // Domyślnie Przegląd i bez zaśmiecania adresu.
    await expect(page.getByRole('tab', { name: 'Przegląd' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(page).not.toHaveURL(/tab=/)

    await expect(
      page.getByRole('heading', { name: 'Porównanie zdjęć' })
    ).toBeVisible()
    // Reszta treści NIE jest renderowana naraz — dokładnie o to chodziło.
    await expect(
      page.getByRole('heading', { name: 'Historia zdjęć' })
    ).toHaveCount(0)
    await expect(
      page.getByRole('heading', { name: /^Trend rozmiaru/ })
    ).toHaveCount(0)

    await page.getByRole('tab', { name: 'Zdjęcia' }).click()
    await expect(page).toHaveURL(/tab=zdjecia/)
    await expect(
      page.getByRole('heading', { name: 'Historia zdjęć' })
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Porównanie zdjęć' })
    ).toHaveCount(0)

    await page.getByRole('tab', { name: 'Trend' }).click()
    await expect(page).toHaveURL(/tab=trend/)
    await expect(
      page.getByRole('heading', { name: /^Trend rozmiaru/ })
    ).toBeVisible()
  })

  test('zakładka przeżywa odświeżenie', async ({ page }) => {
    await openLesion(page)

    await page.getByRole('tab', { name: 'Zdjęcia' }).click()
    await expect(page).toHaveURL(/tab=zdjecia/)

    await page.reload()
    await expect(page.getByRole('tab', { name: 'Zdjęcia' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(
      page.getByRole('heading', { name: 'Historia zdjęć' })
    ).toBeVisible()
  })

  test('akcje rzadkie siedzą w menu „⋯”, nie na ekranie', async ({ page }) => {
    await openLesion(page)

    await expect(page.getByText('Zarządzanie')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Usuń znamię' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Akcje znamienia' }).click()

    await expect(
      page.getByRole('menuitemradio', { name: 'Stabilne' })
    ).toHaveAttribute('aria-checked', 'true')
    await expect(
      page.getByRole('menuitemradio', { name: 'Do obserwacji' })
    ).toHaveAttribute('aria-checked', 'false')
    await expect(
      page.getByRole('menuitem', { name: 'Usuń znamię' })
    ).toBeVisible()
  })

  test('zmiana statusu z menu działa', async ({ page }) => {
    await openLesion(page)

    await page.getByRole('button', { name: 'Akcje znamienia' }).click()
    await page.getByRole('menuitemradio', { name: 'Do obserwacji' }).click()

    await expect(page.getByText('Zmiany zapisane')).toBeVisible()
    await expect(page.getByRole('menuitemradio')).toHaveCount(0)
  })

  test('usunięcie znamienia wymaga potwierdzenia', async ({ page }) => {
    await openLesion(page)

    await page.getByRole('button', { name: 'Akcje znamienia' }).click()
    await page.getByRole('menuitem', { name: 'Usuń znamię' }).click()

    await expect(page.getByText('Usunąć to znamię?')).toBeVisible()
    await page.getByRole('button', { name: 'Anuluj' }).click()
    await expect(page.getByText('Usunąć to znamię?')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('zagęszczenie: zawartość zakładki mieści się w budżecie', async ({
    page,
  }) => {
    await openLesion(page)

    // Mierzymy ZAWARTOŚĆ zakładki, nie wysokość strony: poza nią jest jeszcze
    // stały chrom aplikacji (nagłówek i stopka Layoutu, powrót, tytuł, akcje,
    // pasek zakładek) — ok. 600 px, tyle samo na każdym ekranie. Budżet na
    // zawartość pilnuje tego, czym faktycznie sterują zakładki.
    const zawartosc = () =>
      page.evaluate(() => {
        const el = document.querySelector('[role="tabpanel"]')
        return el ? Math.round(el.getBoundingClientRect().height) : null
      })

    // Zdjęcia i wykres rosną dopiero po wczytaniu (podpisane adresy ze Storage).
    await expect(
      page.getByRole('heading', { name: 'Porównanie zdjęć' })
    ).toBeVisible()
    const przeglad = await zawartosc()

    await page.getByRole('tab', { name: 'Zdjęcia' }).click()
    await expect(
      page.getByRole('heading', { name: 'Historia zdjęć' })
    ).toBeVisible()
    const zdjecia = await zawartosc()

    await page.getByRole('tab', { name: 'Trend' }).click()
    await expect(
      page.getByRole('heading', { name: /^Trend rozmiaru/ })
    ).toBeVisible()
    const trend = await zawartosc()

    console.log(
      `POMIAR zawartosci: przeglad=${przeglad} zdjecia=${zdjecia} trend=${trend}`
    )

    for (const [nazwa, wartosc] of [
      ['Przegląd', przeglad],
      ['Zdjęcia', zdjecia],
      ['Trend', trend],
    ]) {
      expect(wartosc, `${nazwa}: zawartość nie może puchnąć`).toBeLessThanOrEqual(
        600
      )
    }
  })
})
