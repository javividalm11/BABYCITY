import { test, expect } from '@playwright/test';
test('shopping, favorites, persistent cart and quote checkout', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /el mundo de tu bebe/ })).toBeVisible();
  await page.getByRole('link', { name: 'Compra aquí', exact: true }).click();
  await expect(page.locator('.product-card')).toHaveCount(12);
  await page.getByRole('button', { name: 'Guardar en favoritos' }).first().click();
  await page.getByRole('link', { name: 'Mis favoritos', exact: true }).first().click();
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.locator('[data-add]').first().click();
  await page.reload();
  await page.getByRole('button', { name: 'Abrir carrito' }).click();
  await expect(page.locator('.cart-item')).toHaveCount(1);
  await page.getByRole('button', { name: 'Continuar con mi pedido' }).click();
  await page.locator('#checkoutForm [name=name]').fill('Prueba de interfaz');
  await page.locator('#checkoutForm [name=phone]').fill('999123456');
  await page.locator('#checkoutForm [name=consent]').check();
  await page.getByRole('button', { name: 'Registrar mi solicitud' }).click();
  await expect(page.getByRole('heading', { name: 'Ya tenemos tu solicitud.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Enviar mi pedido por WhatsApp' })).toHaveAttribute(
    'href',
    /wa.me\/51937473120/,
  );
  expect(errors).toEqual([]);
});
test('catalog page flip, source product and mobile layout', async ({ page }) => {
  await page.goto('/catalogos');
  await expect(page.locator('.catalog-card')).toHaveCount(12);
  await page
    .locator('.catalog-card')
    .first()
    .getByRole('button', { name: /Ver catálogo/ })
    .click();
  await expect(page.locator('#bookDialog')).toBeVisible();
  await expect(
    page.locator('.reader-sheet[aria-hidden=false] .reader-page-image').first(),
  ).toHaveAttribute('alt', /página 1/);
  await page.keyboard.press('ArrowRight');
  await expect(
    page.locator('.reader-sheet[aria-hidden=false] .reader-page-image').first(),
  ).toHaveAttribute('alt', /página 3/);
  await page.screenshot({ path: 'test-results/catalog-reader.png', animations: 'disabled' });
  await page.keyboard.press('Escape');
  await page.goto('/producto/2');
  await expect(page.getByRole('heading', { name: 'Coche maleta Rudi', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Ver página 4/ }).click();
  await expect(
    page.locator('.reader-sheet[aria-hidden=false] .reader-page-image').last(),
  ).toHaveAttribute('alt', /página 4/);
  await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /el mundo de tu bebe/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: 'test-results/mobile-home.png',
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await page.screenshot({
    path: 'test-results/desktop-home.png',
    fullPage: true,
    animations: 'disabled',
  });
});
test('admin signs in, edits product stock and manages requests', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/admin');
  await page.getByLabel('Usuario', { exact: true }).fill('browser-test');
  await page.getByLabel('Contraseña', { exact: true }).fill('test-only-password-123');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('heading', { name: 'Hola, BabyCity.' })).toBeVisible();
  await page.locator('[data-edit="50"]').click();
  await page.getByLabel('Stock (vacío = por confirmar)', { exact: true }).fill('8');
  await page.getByLabel('Precio (S/)', { exact: true }).fill('435');
  await page.getByRole('button', { name: 'Guardar producto' }).click();
  await expect(page.locator('.admin-editor')).toHaveCount(0);
  await expect(page.locator('tr').filter({ has: page.locator('[data-edit="50"]') })).toContainText(
    '8',
  );
  await page.getByRole('button', { name: 'Pedidos', exact: true }).click();
  await expect(page.locator('.admin-record').first()).toBeVisible();
  await page.locator('[data-order]').first().selectOption('contactado');
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await expect(page.getByRole('heading', { name: 'Hola de nuevo.' })).toBeVisible();
  expect(errors).toEqual([]);
});
test('search, filters, legal content and admin login guard', async ({ page }) => {
  await page.goto('/tienda?q=Rudi');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await page.goto('/tienda?categoria=' + encodeURIComponent('Sillas de auto'));
  await expect(page.locator('.product-card')).toHaveCount(2);
  await page.goto('/legal/privacidad');
  await expect(
    page.getByRole('heading', { name: 'Política de privacidad', exact: true }),
  ).toBeVisible();
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Hola de nuevo.' })).toBeVisible();
});
