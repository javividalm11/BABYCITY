import { test, expect } from '@playwright/test';

test('navbar has one cart icon and each click adds exactly one product', async ({ page }) => {
  const errors = [],
    modules = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (/\/js\/main\.js(?:\?|$)/.test(r.url())) modules.push(r.url());
  });
  await page.goto('/');
  await expect(page.locator('.showcase-card')).toHaveCount(4);
  await expect(page.locator('#cartButton > svg')).toHaveCount(1);
  await expect(page.locator('#cartCount')).toHaveCount(1);
  expect(modules).toHaveLength(1);
  await page.locator('[data-add]').first().click();
  await expect(page.locator('#cartCount')).toHaveText('1');
  await page.reload();
  await expect(page.locator('#cartCount')).toHaveText('1');
  await expect(page.locator('#cartButton > svg')).toHaveCount(1);
  await page.locator('#cartButton').click();
  await expect(page.locator('#cartDialog')).toBeVisible();
  await expect(page.locator('.cart-item')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('desktop mega menu opens by hover or keyboard and routes to real categories', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1610, height: 900 });
  await page.goto('/');
  const panel = page.locator('#shopMegaMenu');
  const trigger = page.locator('#megaMenuButton');
  await expect(panel).toBeHidden();
  await page.locator('.site-shop > a').hover();
  await expect(panel).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await expect(panel.locator('.mega-card')).toHaveCount(4);
  await panel
    .locator('img')
    .evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
  await page.screenshot({ path: 'test-results/navbar-mega-desktop.png' });
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await expect(trigger).toBeFocused();
  await trigger.press('ArrowDown');
  await expect(panel.locator('a').first()).toBeFocused();
  await panel
    .locator('.mega-sidebar')
    .getByRole('link', { name: 'Cunas y colechos', exact: true })
    .click();
  await expect(page).toHaveURL(/categoria=Cunas/);
  await expect(panel).toBeHidden();
  await expect(page.locator('.filter-list .active')).toHaveText('Cunas y colechos');
  await trigger.click();
  await expect(panel).toBeVisible();
  await page.mouse.click(8, 700);
  await expect(panel).toBeHidden();
});

test('navbar hides down and reappears up at full size on desktop and mobile', async ({ page }) => {
  for (const width of [1610, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await expect(page.locator('.showcase-card').first()).toBeVisible();
    const header = page.locator('.site-header');
    const size = await header.evaluate((el) => ({
      height: el.offsetHeight,
      width: el.offsetWidth,
    }));
    await page.locator('#main').focus();
    for (const [top, hidden] of [
      [700, true],
      [500, false],
      [850, true],
      [0, false],
    ]) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top);
      if (hidden) await expect(header).toHaveClass(/is-scroll-hidden/);
      else {
        await expect(header).not.toHaveClass(/is-scroll-hidden/);
        await expect.poll(() => header.evaluate((el) => el.getBoundingClientRect().top)).toBe(0);
      }
      expect(await header.evaluate((el) => el.inert)).toBe(hidden);
      expect(
        await header.evaluate((el) => ({ height: el.offsetHeight, width: el.offsetWidth })),
      ).toEqual(size);
      expect(
        await header.evaluate((el) => el.offsetWidth === document.documentElement.clientWidth),
      ).toBe(true);
    }
    const trigger = page.locator(width >= 1200 ? '#megaMenuButton' : '#menuButton');
    await trigger.click();
    await expect(page.locator(width >= 1200 ? '#shopMegaMenu' : '#mobileMenu')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
  }
});

test('mobile menu, search and categories remain usable from 320 pixels', async ({ page }) => {
  for (const width of [320, 390, 768, 1199]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const button = page.locator('#menuButton');
    const menu = page.locator('#mobileMenu');
    await button.click();
    await expect(menu).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(button).toBeFocused();
    await button.click();
    if (width === 390) await page.screenshot({ path: 'test-results/navbar-menu-mobile.png' });
    await menu.getByRole('link', { name: 'Coches', exact: true }).click();
    await expect(page).toHaveURL(/categoria=Coches/);
    await expect(menu).toBeHidden();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#searchButton').click();
  await expect(page.locator('#searchDialog')).toBeVisible();
  await page.locator('#searchForm input').fill('Rudi');
  await page.locator('#searchForm').getByRole('button', { name: 'Buscar productos' }).click();
  await expect(page.locator('.product-card')).toHaveCount(1);
});
