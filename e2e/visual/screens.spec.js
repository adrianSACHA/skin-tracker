import { expect, test } from '@playwright/test'
import { mockSupabase } from '../support/mock-supabase.js'
import {
  BASE_PATH,
  loginAsDemo,
  openLesionList,
  openPerson,
} from '../support/app.js'

// Zrzuty ekranu — regresje WYGLADU, ktorych pomiar nie zlapie: element
// nachodzi na siebie, karta sie rozjezdza, kolor traci kontrast.
//
// Dlaczego to nie jest "flaky" (patrz ticket 04):
//
// 1. BASELINE JEST PER-PLATFORMA. Playwright domyslnie dokleja do nazwy pliku
//    `process.platform`, wiec Windows porownuje z `*-win32.png`, a CI (Linux)
//    z `*-linux.png`. Dlatego zestaw jest zielony i lokalnie, i w CI, mimo ze
//    czcionki i antyaliasing roznia sie miedzy systemami.
//    Brakujacy baseline dla danej platformy Playwright po prostu ZAPISUJE
//    (domyslne `updateSnapshots: 'missing'`) — dlatego pierwszy przebieg w CI
//    jest zielony i tworzy artefakt do zacommitowania.
//    Instrukcja: README, sekcja „Testy" -> „Zrzuty ekranu".
//
// 2. CZAS JEST ZAMROZONY. Czesc ekranow pokazuje terminy liczone od „dzisiaj"
//    (np. „Kontrola: 22.12.2025" + plakietka „zaległe"). Bez zamrozenia
//    reczna data `2026-12-01` z danych mocka z dnia na dzien zamienialaby sie
//    w zaleglosc i baseline psulby sie sam po kilku miesiacach.
//    Data jest z PRZESZLOSCI wzgledem realnego „teraz", zeby sesja z mocka
//    (wygasa po godzinie) pozostawala wazna.
//
// 3. RESZTA WARUNKOW JEST STALA: viewport, `deviceScaleFactor: 1`,
//    `reducedMotion: 'reduce'` (logo ma `motion-safe:animate-pulse`),
//    animacje wylaczone (domyslne w `toHaveScreenshot`).

const FIXED_NOW = new Date('2026-06-15T10:00:00Z')

const DETERMINISTIC = {
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
}

// Otwiera aplikacje z zamrozonym czasem i zalogowana sesja.
async function openAppForShot(page) {
  await mockSupabase(page)
  await page.clock.setFixedTime(FIXED_NOW)
  await loginAsDemo(page)
}

test.describe('Zrzuty ekranu', () => {
  test.describe('pulpit 1280×900', () => {
    test.use({
      ...DETERMINISTIC,
      viewport: { width: 1280, height: 900 },
      colorScheme: 'light',
    })

    test('zamrożony czas faktycznie działa', async ({ page }) => {
      // Zabezpieczenie samego mechanizmu: gdyby `page.clock` przestał działać,
      // baseline'y zaczęłyby się psuć dopiero po miesiącach — a ten test
      // zapali się od razu.
      await mockSupabase(page)
      await page.clock.setFixedTime(FIXED_NOW)
      await page.goto(BASE_PATH)

      const now = await page.evaluate(() => new Date().toISOString())
      expect(now).toBe('2026-06-15T10:00:00.000Z')
    })

    test('ekran logowania', async ({ page }) => {
      await mockSupabase(page)
      await page.clock.setFixedTime(FIXED_NOW)
      await page.goto(BASE_PATH)

      await expect(
        page.getByRole('heading', { name: 'Zaloguj się' })
      ).toBeVisible()

      await expect(page).toHaveScreenshot('01-logowanie.png', {
        fullPage: true,
      })
    })

    test('wybór osoby — karta z liczbami i „zaległe”', async ({ page }) => {
      await openAppForShot(page)

      // Czekamy na dane, zeby nie zrobic zrzutu stanu ladowania.
      await expect(page.getByText('zaległe')).toBeVisible()
      await expect(page.getByText('2 znamiona · 1 zdjęcie')).toBeVisible()

      await expect(page).toHaveScreenshot('02-wybor-osoby.png', {
        fullPage: true,
      })
    })

    test('lista znamion — filtry zwinięte i rozwinięte', async ({ page }) => {
      await openAppForShot(page)
      await openPerson(page, 'Ja')
      await openLesionList(page)

      await expect(page.getByRole('listitem').first()).toBeVisible()
      await expect(page).toHaveScreenshot('03-lista-znamion.png', {
        fullPage: true,
      })

      await page.getByRole('button', { name: 'Filtry' }).click()
      await expect(page.locator('#sort-by')).toBeVisible()
      await expect(page).toHaveScreenshot('04-lista-znamion-filtry.png', {
        fullPage: true,
      })
    })

    test('mapa ciała', async ({ page }) => {
      await openAppForShot(page)
      await openPerson(page, 'Ja')

      await expect(page.getByRole('button', { name: 'Tył-1 — Stabilne' })).toBeVisible()
      await expect(page).toHaveScreenshot('05-mapa-ciala.png', {
        fullPage: true,
      })
    })
  })

  test.describe('telefon 375×667', () => {
    test.use({
      ...DETERMINISTIC,
      viewport: { width: 375, height: 667 },
      hasTouch: true,
      colorScheme: 'light',
    })

    test('mapa ciała na telefonie', async ({ page }) => {
      await openAppForShot(page)
      await openPerson(page, 'Ja')

      await expect(page.getByRole('button', { name: 'Tył-1 — Stabilne' })).toBeVisible()
      await expect(page).toHaveScreenshot('06-mapa-ciala-telefon.png', {
        fullPage: true,
      })
    })
  })

  test.describe('tryb ciemny', () => {
    // Druga polowa stylow — dzis nic jej nie pilnuje.
    test.use({
      ...DETERMINISTIC,
      viewport: { width: 1280, height: 900 },
      colorScheme: 'dark',
    })

    test('wybór osoby', async ({ page }) => {
      await openAppForShot(page)

      await expect(page.locator('html')).toHaveClass(/dark/)
      await expect(page.getByText('zaległe')).toBeVisible()

      await expect(page).toHaveScreenshot('07-wybor-osoby-ciemny.png', {
        fullPage: true,
      })
    })

    test('lista znamion', async ({ page }) => {
      await openAppForShot(page)
      await openPerson(page, 'Ja')
      await openLesionList(page)

      await expect(page.getByRole('listitem').first()).toBeVisible()
      await expect(page).toHaveScreenshot('08-lista-znamion-ciemny.png', {
        fullPage: true,
      })
    })
  })
})
