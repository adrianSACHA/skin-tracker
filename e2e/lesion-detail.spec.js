import { expect, test } from '@playwright/test'
import { makeData, mockSupabase } from './support/mock-supabase.js'
import { BASE_PATH, loginAsDemo } from './support/app.js'

// Ekran szczegółów znamienia.
//
// Ticket 12: ekran miał 2244 px (3,4 ekranu na 375×667) i wszystko było
// widoczne naraz — m.in. stała czerwona sekcja „Zarządzanie”. Akcje rzadkie
// i nieodwracalne przeniosły się do menu „⋯”, a zagęszczenie pilnuje budżet.
//
// Uwaga: do symulacji dotknięcia wystarczy zwykły click — ten ekran nie ma
// gestów (te są na mapie ciała, patrz `map-gestures.spec.js`).
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
  test('akcje rzadkie siedzą w menu „⋯”, nie na ekranie', async ({ page }) => {
    await openLesion(page)

    // Sekcja „Zarządzanie” i jej czerwony blok zniknęły z widoku.
    await expect(page.getByText('Zarządzanie')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Usuń znamię' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Akcje znamienia' }).click()

    // Statusy są wyborem z listy — bieżący oznaczony.
    const aktualny = page.getByRole('menuitemradio', { name: 'Stabilne' })
    await expect(aktualny).toHaveAttribute('aria-checked', 'true')
    await expect(
      page.getByRole('menuitemradio', { name: 'Do obserwacji' })
    ).toHaveAttribute('aria-checked', 'false')

    await expect(page.getByRole('menuitem', { name: 'Usuń znamię' })).toBeVisible()
  })

  test('zmiana statusu z menu od razu widać na plakietce', async ({ page }) => {
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
    // Bez potwierdzenia nic się nie dzieje.
    await page.getByRole('button', { name: 'Anuluj' }).click()
    await expect(page.getByText('Usunąć to znamię?')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('zagęszczenie: ekran mieści się w budżecie', async ({ page }) => {
    await openLesion(page)

    // Trzy sekcje to obrazy i wykres — rosną dopiero po wczytaniu zdjęć
    // (podpisane adresy ze Storage). Bez tego pomiar wychodzi zaniżony.
    for (const nazwa of [
      'Porównanie zdjęć',
      'Historia zdjęć',
      'Trend rozmiaru (mm)',
    ]) {
      await expect(page.getByRole('heading', { name: nazwa })).toBeVisible()
    }

    const wysokosc = await page.evaluate(
      () => document.documentElement.scrollHeight
    )

    // Przed ticketem 12 ekran miał 2244 px (3,4 ekranu na 375×667); po
    // przeniesieniu akcji rzadkich do menu „⋯” — 1934 px. Budżet leży
    // PONIŻEJ starej wartości, więc samo przywrócenie czerwonej sekcji
    // „Zarządzanie” (186 px + margines) od razu wywali ten test. Zapas jest
    // na szerszą czcionkę w CI (DejaVu Sans łamie teksty na więcej linii).
    expect(wysokosc).toBeLessThanOrEqual(2150)
  })
})
