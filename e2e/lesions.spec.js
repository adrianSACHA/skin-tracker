import { expect, test } from '@playwright/test'
import { mockSupabase } from './support/mock-supabase.js'
import { loginAsDemo, openLesionList, openPerson } from './support/app.js'

test.describe('Lista znamion', () => {
  test.beforeEach(async ({ page }) => {
    await mockSupabase(page)
    await loginAsDemo(page)
    await openPerson(page, 'Ja')
    await openLesionList(page)
  })

  test('pokazuje nazwy, kontekst okolicy i status', async ({ page }) => {
    // Auto-nazwa: okolica jest już w nazwie, więc nie dublujemy jej osobno.
    await expect(page.getByText('Tył-1')).toBeVisible()

    // Nazwa nadpisana ręcznie: obok niej pojawia się kontekst okolicy.
    await expect(
      page.getByText('Kark — znamię przy włosach')
    ).toBeVisible()
    await expect(page.getByText('Tył ·', { exact: true })).toBeVisible()

    await expect(page.getByText('Stabilne')).toBeVisible()
    await expect(page.getByText('Do obserwacji')).toBeVisible()
    await expect(page.getByText('Kontrola:').first()).toBeVisible()
    await expect(page.getByText('2 z 2')).toBeVisible()
  })

  test('wyszukiwanie zapisuje się w adresie i filtruje listę', async ({
    page,
  }) => {
    await page.getByRole('searchbox', { name: 'Szukaj znamion' }).fill('kark')

    // Stan w URL (HashRouter) - przetrwa odświeżenie i „wstecz”.
    await expect(page).toHaveURL(/q=kark/)
    await expect(page.getByText('1 z 2')).toBeVisible()
    await expect(
      page.getByText('Kark — znamię przy włosach')
    ).toBeVisible()
    await expect(page.getByText('Tył-1')).toHaveCount(0)
  })

  test('filtr po statusie też ląduje w adresie', async ({ page }) => {
    await page.getByRole('button', { name: 'Filtry' }).click()
    // Celowo click + asercja, a nie `.check()`: React Router aktualizuje
    // adres w startTransition, wiec DOM nie zmienia sie synchronicznie
    // i `.check()` zgłosiłoby „stan sie nie zmienil”.
    await page.getByRole('checkbox', { name: 'Stabilne' }).click()
    await expect(
      page.getByRole('checkbox', { name: 'Stabilne' })
    ).toBeChecked()

    await expect(page).toHaveURL(/status=stable/)
    await expect(page.getByText('1 z 2')).toBeVisible()
  })

  test('odświeżenie zachowuje filtr z adresu', async ({ page }) => {
    await page.getByRole('searchbox', { name: 'Szukaj znamion' }).fill('kark')
    await expect(page.getByText('1 z 2')).toBeVisible()

    await page.reload()

    await expect(page.getByText('1 z 2')).toBeVisible()
    await expect(
      page.getByRole('searchbox', { name: 'Szukaj znamion' })
    ).toHaveValue('kark')
  })
})
