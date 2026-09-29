import { expect, test } from '@playwright/test'
import { mockSupabase } from './support/mock-supabase.js'
import { loginAsDemo, openPerson } from './support/app.js'

// Mapa ciała obsługuje zoom (1x–6x) i przesuwanie zdjęcia
// (`react-zoom-pan-pinch`). Pułapka: biblioteka przechwytuje gest, więc PRZED
// naprawą przy skali 1 nie dało się przewinąć strony zaczynając przesunięcie
// palcem od zdjęcia — mapa była „martwą strefą” na telefonie.
//
// Dlatego pan jest wyłączony przy skali 1 (i przy przesuwaniu pina), a włączony
// po przybliżeniu. Ten test pilnuje obu stron tej reguły.
//
// Uwaga: do symulacji przesunięcia palcem używamy CDP (`Input.dispatchTouchEvent`),
// bo Playwright nie ma API na „swipe” — testy i tak biegają tylko na Chromium.
test.use({ viewport: { width: 375, height: 667 }, hasTouch: true })

async function swipeUp(page, x, y, steps = 10) {
  const client = await page.context().newCDPSession(page)
  await client.send('Emulation.setTouchEmulationEnabled', {
    enabled: true,
    maxTouchPoints: 1,
  })
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x, y }],
  })
  for (let i = 1; i <= steps; i += 1) {
    await client.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y - i * 30 }],
    })
    await page.waitForTimeout(20)
  }
  await client.send('Input.dispatchTouchEvent', {
    type: 'touchEnd',
    touchPoints: [],
  })
  await page.waitForTimeout(600)
  await client.send('Emulation.setTouchEmulationEnabled', { enabled: false })
}

// Punkt na środku mapy, ale zawsze w obrębie ekranu (mapa bywa wyższa).
// Mierzymy kontener transformacji, a nie sam obrazek — obrazek wczytuje się
// asynchronicznie (signed URL), więc czekanie na niego bywa zawodne.
async function mapPoint(page) {
  await page.evaluate(() => window.scrollTo(0, 0))
  const map = page.locator('.react-transform-component').first()
  await map.waitFor({ state: 'visible' })
  const box = await map.boundingBox()
  expect(box, 'mapa musi być widoczna').not.toBeNull()
  return {
    x: Math.round(box.x + box.width / 2),
    y: Math.round(Math.min(box.y + box.height / 2, 600)),
  }
}

const scaleTransform = (page) =>
  page.evaluate(() => {
    const el = [...document.querySelectorAll('div')].find(
      (d) => d.style && d.style.transform && d.style.transform.includes('scale')
    )
    return el ? el.style.transform : null
  })

async function openMap(page) {
  await mockSupabase(page)
  await loginAsDemo(page)
  await openPerson(page, 'Ja')
}

test.describe('Mapa ciała a przewijanie strony', () => {
  test('bez przybliżenia przesunięcie palcem po zdjęciu przewija stronę', async ({
    page,
  }) => {
    await openMap(page)

    const point = await mapPoint(page)
    await swipeUp(page, point.x, point.y)

    const scrolled = await page.evaluate(() => Math.round(window.scrollY))
    expect(scrolled, 'strona powinna się przewinąć').toBeGreaterThan(100)
  })

  test('po przybliżeniu ten sam gest przesuwa zdjęcie, a nie stronę', async ({
    page,
  }) => {
    await openMap(page)

    await page.getByRole('button', { name: 'Przybliż' }).click()
    await page.getByRole('button', { name: 'Przybliż' }).click()
    await expect.poll(() => scaleTransform(page)).toContain('scale(1.5')

    const before = await scaleTransform(page)
    const point = await mapPoint(page)
    await swipeUp(page, point.x, point.y)
    const after = await scaleTransform(page)

    expect(after, 'zdjęcie powinno się przesunąć').not.toBe(before)
    const scrolled = await page.evaluate(() => Math.round(window.scrollY))
    expect(scrolled, 'strona nie powinna się przewijać').toBe(0)
  })
})
