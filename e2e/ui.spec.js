import { expect, test } from '@playwright/test'
import { mockSupabase } from './support/mock-supabase.js'
import { BASE_PATH, loginAsDemo, openMenu } from './support/app.js'

test.describe('Motyw', () => {
  test.use({ colorScheme: 'light' })

  test('ciemny motyw przeżywa odświeżenie', async ({ page }) => {
    await mockSupabase(page)
    await loginAsDemo(page)

    await expect(page.locator('html')).not.toHaveClass(/dark/)

    await openMenu(page)
    await page.getByRole('menuitem', { name: 'Motyw: ciemny' }).click()
    await expect(page.locator('html')).toHaveClass(/dark/)

    // Motyw trzymany w localStorage - reload nie może go zgubić.
    await page.reload()
    await expect(page.locator('html')).toHaveClass(/dark/)
    await expect(page.getByRole('heading', { name: 'Wybierz osobę' })).toBeVisible()
  })
})

test.describe('Telefon 375×667', () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true })

  test('menu „⋯” nie wychodzi za ekran', async ({ page }) => {
    await mockSupabase(page)
    await loginAsDemo(page)

    await page.getByRole('button', { name: 'Akcje osoby Ja' }).click()

    const menu = page.getByRole('menu')
    await expect(menu).toBeVisible()

    const box = await menu.boundingBox()
    expect(box).not.toBeNull()
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(375)
  })

  test('formularz logowania ma wygodne cele dotykowe (min. 44 px)', async ({
    page,
  }) => {
    await mockSupabase(page)
    await page.goto(BASE_PATH)

    for (const field of [
      page.locator('#login-email'),
      page.locator('#login-password'),
      page.getByRole('button', { name: 'Zaloguj' }),
    ]) {
      await expect(field).toBeVisible()
      const box = await field.boundingBox()
      expect(box.x).toBeGreaterThanOrEqual(0)
      expect(box.x + box.width).toBeLessThanOrEqual(375)
      // Zasada z projektu: wszystko klikalne ma min-h-[44px].
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
  })
})
