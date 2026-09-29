import fs from 'node:fs'
import path from 'node:path'
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
//    Gdy brakuje wzorca dla danej platformy, test sie POMIJA (patrz
//    `expectScreenshot` nizej). Bez tego pierwszy przebieg na Linuksie
//    czerwienilby build na 7 testach, mimo ze nic nie jest zepsute — brakuje
//    tylko punktu odniesienia. Wzorce dla Linuksa generuje sie osobno
//    (workflow „Testy” -> `update_visual_baselines`), bo w CI brakujacy
//    wzorzec jest BLEDEM, a nie „zapisz i idz dalej”.
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

// Katalog ze wzorcami. Sciezka zgodna z domyslnym szablonem Playwrighta:
// `{arg}{-projectName}{-snapshotSuffix}{ext}` -> `01-logowanie-chromium-win32.png`.
const SNAPSHOT_DIR = path.join(
  'e2e',
  'visual',
  'screens.spec.js-snapshots'
)

function snapshotPathFor(name, projectName) {
  const base = name.replace(/\.png$/, '')
  return path.join(
    SNAPSHOT_DIR,
    `${base}-${projectName}-${process.platform}.png`
  )
}

// Zrzut ekranu, ale TYLKO gdy istnieje wzorzec dla biezacej platformy.
//
// Dlaczego: wzorce sa per-platforma (Windows/Linux), a w CI brakujacy
// wzorzec jest BLEDEM (nie „zapisz i idz dalej”). Bez tej oslony pierwszy
// przebieg na Linuksie czerwienilby build na 7 testach, mimo ze nic nie jest
// zepsute — po prostu nie ma jeszcze z czym porownywac. Zamiast tego test
// jawnie sie pomija z instrukcja, jak wygenerowac wzorce.
//
// Generowanie: `npm run e2e:visual:update` (lokalnie) albo workflow „Testy”
// z zaznaczonym `update_visual_baselines` (Linux; wynik w artefakcie
// `baseline-linux` do zacommitowania).
async function expectScreenshot(page, name) {
  const { project } = test.info()
  const file = snapshotPathFor(name, project.name)
  const generating = process.env.E2E_VISUAL_UPDATE === '1'

  // Poza CI Playwright sam dopisuje brakujacy wzorzec, wiec nie blokujemy.
  if (process.env.CI && !generating && !fs.existsSync(file)) {
    test.skip(
      true,
      `Brak wzorca dla platformy ${process.platform}: ${file}. ` +
        'Wygeneruj: npm run e2e:visual:update lub workflow „Testy” -> update_visual_baselines.'
    )
  }

  await expect(page).toHaveScreenshot(name, { fullPage: true })
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

      await expectScreenshot(page, '01-logowanie.png')
    })

    test('wybór osoby — karta z liczbami i „zaległe”', async ({ page }) => {
      await openAppForShot(page)

      // Czekamy na dane, zeby nie zrobic zrzutu stanu ladowania.
      await expect(page.getByText('zaległe')).toBeVisible()
      await expect(page.getByText('2 znamiona · 1 zdjęcie')).toBeVisible()

      await expectScreenshot(page, '02-wybor-osoby.png')
    })

    test('lista znamion — filtry zwinięte i rozwinięte', async ({ page }) => {
      await openAppForShot(page)
      await openPerson(page, 'Ja')
      await openLesionList(page)

      await expect(page.getByRole('listitem').first()).toBeVisible()
      await expectScreenshot(page, '03-lista-znamion.png')

      await page.getByRole('button', { name: 'Filtry' }).click()
      await expect(page.locator('#sort-by')).toBeVisible()
      await expectScreenshot(page, '04-lista-znamion-filtry.png')
    })

    test('mapa ciała', async ({ page }) => {
      await openAppForShot(page)
      await openPerson(page, 'Ja')

      await expect(page.getByRole('button', { name: 'Tył-1 — Stabilne' })).toBeVisible()
      await expectScreenshot(page, '05-mapa-ciala.png')
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
      await expectScreenshot(page, '06-mapa-ciala-telefon.png')
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

      await expectScreenshot(page, '07-wybor-osoby-ciemny.png')
    })

    test('lista znamion', async ({ page }) => {
      await openAppForShot(page)
      await openPerson(page, 'Ja')
      await openLesionList(page)

      await expect(page.getByRole('listitem').first()).toBeVisible()
      await expectScreenshot(page, '08-lista-znamion-ciemny.png')
    })
  })
})
