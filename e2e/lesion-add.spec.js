import { expect, test } from '@playwright/test'
import { mockSupabase } from './support/mock-supabase.js'
import { loginAsDemo, openPerson } from './support/app.js'

// Ticket 14, ustalenie 4 — flow dodawania znamienia.
//
// Wcześniej: „+ Dodaj znamię” → dotknij mapy → nazwij → zapisz → **koniec**.
// Panel akcji się nie otwierał, więc żeby cokolwiek wpisać, trzeba było samemu
// znaleźć nowy pin na mapie i zgadnąć, że dane są „gdzieś indziej”.
//
// Teraz: po zapisaniu otwiera się panel nowego znamienia, a jego główną akcją
// jest **„Dodaj pierwsze zdjęcie”** — bo znamię bez zdjęcia nie ma ani rozmiaru,
// ani porównania. Prowadzi do karty znamienia z JUŻ OTWARTYM formularzem.
async function dodajPin(page) {
  await page.getByRole('button', { name: '+ Dodaj znamię' }).click()

  const mapa = page.locator('.react-transform-component').first()
  await mapa.waitFor({ state: 'visible' })
  await mapa.click({ position: { x: 40, y: 40 } })

  const poleNazwy = page.locator('#new-lesion-label')
  await expect(poleNazwy).toBeVisible()
  const nazwa = await poleNazwy.inputValue()

  await page.getByRole('button', { name: 'Zapisz znamię' }).click()
  await expect(page.getByText('Znamię dodane')).toBeVisible()
  return nazwa
}

test.describe('Dodawanie znamienia z mapy', () => {
  test('nowe znamię od razu proponuje pierwsze zdjęcie', async ({ page }) => {
    await mockSupabase(page)
    await loginAsDemo(page)
    await openPerson(page, 'Ja')

    const nazwa = await dodajPin(page)
    expect(nazwa, 'auto-nazwa z prefiksu okolicy').toMatch(/^Tył-/)

    // Panel nowego znamienia — główna akcja to pierwsze zdjęcie.
    const pierwszeZdjecie = page.getByRole('button', {
      name: 'Dodaj pierwsze zdjęcie',
    })
    await expect(pierwszeZdjecie).toBeVisible()
    await pierwszeZdjecie.click()

    // Jesteśmy na karcie znamienia, a formularz zdjęcia jest już otwarty.
    await expect(page).toHaveURL(/#\/person\/person-1\/lesion\//)
    await expect(page.locator('input[type="file"]').first()).toBeAttached()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('po zamknięciu panelu znamię zachowuje się jak każde inne', async ({
    page,
  }) => {
    await mockSupabase(page)
    await loginAsDemo(page)
    await openPerson(page, 'Ja')

    const nazwa = await dodajPin(page)
    await expect(
      page.getByRole('button', { name: 'Dodaj pierwsze zdjęcie' })
    ).toBeVisible()

    // Zamykamy panel i wracamy w ten sam pin — „nowość” już nie obowiązuje.
    await page.getByRole('button', { name: 'Zamknij', exact: true }).click()
    await page.getByRole('button', { name: new RegExp(nazwa) }).click()

    await expect(
      page.getByRole('button', { name: 'Zobacz pełną historię' })
    ).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Dodaj pierwsze zdjęcie' })
    ).toHaveCount(0)
  })
})
