import { expect, test } from '@playwright/test'
import { mockSupabase } from './support/mock-supabase.js'
import {
  loginAsDemo,
  makeInstallable,
  openReminders,
  openPerson,
  useWideFont,
} from './support/app.js'

// Budżet miejsca na małym telefonie (iPhone SE: 375x667).
//
// To celowo NIE zrzut ekranu, a pomiar — zrzuty zależą od czcionek i
// antyaliasingu, więc baseline z Windowsa nie zgadza się z tym, co renderuje
// CI na Linuksie (czerwone testy bez powodu).
//
// Liczymy dwie rzeczy:
//  1. WYSOKOŚĆ nagłówka — musi się mieścić w rozsądnym procencie ekranu.
//  2. STRUKTURĘ — wiersz górny i nawigacja muszą być jednoliniowe. To jest
//     odporniejsze na czcionki niż sam pikselaż: wysokość wiersza zależy od
//     wysokości przycisków (44 px), a nie od szerokości tekstu.
//
// Historia: nagłówek miał 286 px, bo przy szerszej czcionce (DejaVu Sans na
// Linuksie) i wiersz górny, i nawigacja zawijały się na dwie linie.
const VIEWPORT = { width: 375, height: 667 }

// Jeden wiersz paska = py-3 (24) + przycisk 44 = 68 px. Zawinięcie daje ~104.
const MAX_TOP_ROW_HEIGHT = 80
// Jedna linia nawigacji = min-h-44 (44) + pb-2 (8) = 52 px. Zawinięcie daje 104.
const MAX_NAV_HEIGHT = 60
// 68 + 52 = 120 px zmierzone; zapas na drobne różnice.
const MAX_HEADER_HEIGHT = 150

test.use({ viewport: VIEWPORT })

async function heights(page) {
  return page.evaluate(() => {
    const header = document.querySelector('header')
    const topRow = header?.querySelector('div')
    const nav = header?.querySelector('nav')
    const px = (el) => (el ? Math.round(el.getBoundingClientRect().height) : null)
    return { header: px(header), topRow: px(topRow), nav: px(nav) }
  })
}

async function assertHeaderBudget(page, where) {
  const h = await heights(page)
  expect(h.topRow, `wiersz górny (${where}) — nie może się zawijać`).toBeLessThanOrEqual(
    MAX_TOP_ROW_HEIGHT
  )
  if (h.nav !== null) {
    expect(h.nav, `nawigacja (${where}) — nie może się zawijać`).toBeLessThanOrEqual(
      MAX_NAV_HEIGHT
    )
  }
  expect(h.header, `nagłówek (${where})`).toBeLessThanOrEqual(MAX_HEADER_HEIGHT)
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
  // Stan „gotowe do instalacji” to ten, w którym nagłówek puchł najbardziej:
  // przycisk „Zainstaluj” dopychał wiersz, a pod nawigacją siadał baner.
  test('nagłówek mieści się w budżecie także z banerem instalacji', async ({
    page,
  }) => {
    await mockSupabase(page)
    await loginAsDemo(page)

    await assertHeaderBudget(page, 'wybór osoby')

    await openPerson(page, 'Ja')
    await assertHeaderBudget(page, 'mapa ciała')

    await makeInstallable(page)
    await expect(page.getByRole('button', { name: 'Nie teraz' })).toBeVisible()
    await assertHeaderBudget(page, 'mapa ciała + instalacja')

    // „Lista znamion” została wchłonięta przez Kontrole (ticket 14), więc
    // nagłówek sprawdzamy na dwóch pozostałych ekranach.
    await openReminders(page)
    await assertHeaderBudget(page, 'Kontrole + instalacja')
  })

  test('nagłówek wytrzymuje szeroką czcionkę (jak w CI na Linuksie)', async ({
    page,
  }) => {
    await mockSupabase(page)
    await loginAsDemo(page)
    await openPerson(page, 'Ja')
    await makeInstallable(page)

    // DejaVu Sans jest szersza niż system-ui z Windows — to ten przypadek
    // przewracał test w CI.
    await useWideFont(page)
    await assertHeaderBudget(page, 'szeroka czcionka')

    await openReminders(page)
    await assertHeaderBudget(page, 'szeroka czcionka + Kontrole')
  })

  test('pierwszy wiersz Kontrol jest widoczny bez przewijania', async ({
    page,
  }) => {
    await mockSupabase(page)
    await loginAsDemo(page)
    await openPerson(page, 'Ja')
    await makeInstallable(page)
    await openReminders(page)

    // Wiersz ZACZYNA się nad linią zgięcia. Cały wiersz (przy pasku instalacji
    // w nagłówku) kończy się ~705 px, czyli 38 px poniżej — Kontrole mają nad
    // listą liczniki i wyszukiwanie. Gwarancja: bez przewijania widać, że lista
    // jest. Że widać licznik zaległości, pilnuje osobny test niżej.
    const pierwszy = page.getByRole('listitem').first()
    await expect(pierwszy).toBeVisible()
    const box = await pierwszy.boundingBox()
    expect(box, 'pierwszy wiersz Kontrol musi być widoczny').not.toBeNull()
    expect(Math.round(box.y)).toBeLessThan(VIEWPORT.height)
  })

  test('na Kontrolach widać licznik zaległości bez przewijania', async ({
    page,
  }) => {
    await mockSupabase(page)
    await loginAsDemo(page)
    await openPerson(page, 'Ja')
    await makeInstallable(page)
    await page.getByRole('link', { name: /^Kontrole/ }).click()

    await assertAboveFold(page, page.getByText('Zaległe:'), 'licznik zaległości')
    // Zwinięty panel powiadomień to przycisk (cała linia jest klikalna).
    await assertAboveFold(
      page,
      page.getByRole('button', { name: /Powiadomienia w tle/ }),
      'zwinięty panel powiadomień'
    )
  })
})
