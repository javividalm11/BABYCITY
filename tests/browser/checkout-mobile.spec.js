import { test, expect } from '@playwright/test';

test('mobile checkout and confirmation preserve delivery, totals and order submission', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('bc-cart-v2', JSON.stringify([{ id: 2, quantity: 1 }])),
  );
  let submitted;
  await page.route('**/api/orders', async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      json: {
        id: 'BC-MOBILE-TEST',
        customer: submitted,
        delivery: submitted.delivery,
        notes: submitted.notes,
        subtotal: 279,
        shipping: 0,
        total: 279,
        items: [{ quantity: 1, name: 'Coche maleta Rudi', price: 279 }],
      },
    });
  });
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await page.getByRole('button', { name: 'Abrir carrito' }).click();
    await page.getByRole('button', { name: 'Continuar con mi pedido' }).click();
    const dialog = page.locator('.purchase-page');
    await expect(page).toHaveURL(/\/compra$/);
    await expect(page.locator('#cartDialog')).not.toBeVisible();
    const form = page.locator('#checkoutForm');
    await expect(form).toBeVisible();
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await form.getByLabel('¿Cómo prefieres recibirlo?').selectOption('province');
    await expect(form.locator('[name=address]')).toBeVisible();
    await expect(form.locator('[name=address]')).toHaveAttribute('required', '');
    await form.getByLabel('¿Cómo prefieres recibirlo?').selectOption('pickup');
    await expect(form.locator('[name=address]')).not.toBeVisible();
    await form.getByLabel('Tu nombre completo').fill('María Prueba');
    await form.getByLabel('Celular', { exact: true }).fill('987654321');
    await form.getByLabel('Correo (opcional)').fill('prueba@example.com');
    await form.locator('[name=consent]').check();
    await form.getByRole('button', { name: 'Registrar mi solicitud' }).click();
    await expect(dialog.locator('.checkout-success')).toBeVisible();
    await expect(dialog.locator('.checkout-confirmation strong')).toHaveText('BC-MOBILE-TEST');
    expect(submitted.items).toEqual([{ id: 2, quantity: 1 }]);
    expect(submitted.consent).toBe(true);
    await expect(
      dialog.getByRole('link', { name: 'Enviar mi pedido por WhatsApp' }),
    ).toHaveAttribute('href', /https:\/\/wa.me\/51937473120\?text=.*BC-MOBILE-TEST/);
    expect(await dialog.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await dialog.getByRole('link', { name: 'Seguir explorando' }).click();
    await expect(page).toHaveURL(/\/tienda$/);
    await expect(page.locator('#cartCount')).toHaveText('0');
  }
});

test('failed checkout retains entered information and the cart', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('bc-cart-v2', JSON.stringify([{ id: 2, quantity: 1 }])),
  );
  await page.route('**/api/orders', (route) =>
    route.fulfill({ status: 503, json: { error: 'Intenta nuevamente.' } }),
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir carrito' }).click();
  await page.getByRole('button', { name: 'Continuar con mi pedido' }).click();
  await page.locator('#checkoutForm [name=name]').fill('María Prueba');
  await page.locator('#checkoutForm [name=phone]').fill('987654321');
  await page.locator('#checkoutForm [name=consent]').check();
  await page.getByRole('button', { name: 'Registrar mi solicitud' }).click();
  await expect(page.locator('#checkoutForm .form-status')).toHaveClass(/error/);
  await expect(page.locator('#checkoutForm [name=name]')).toHaveValue('María Prueba');
  await expect(page.getByRole('button', { name: 'Registrar mi solicitud' })).toBeEnabled();
  await expect(page.locator('#cartCount')).toHaveText('1');
});
