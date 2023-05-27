import { expect, type Page, test } from '@playwright/test'

let page: Page

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage()
  await page.goto('')
})

test.afterAll(async () => {
  await page.close()
})

test.describe('Marker data', () => {
  test('should display warning when type is incorrect', async () => {
    await page.locator('.view-lines').hover({ position: { x: 30, y: 10 } })
    const warn = page.locator('.marker.hover-contents > span:nth-child(1)')
    await expect(warn).toHaveText('Incorrect type. Expected "number".')
  })

  test('should underline warning when type is incorrect', async () => {
    await expect(page.locator('.cdr.squiggly-warning')).toHaveCount(2)
  })
})
