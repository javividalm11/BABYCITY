import { test, expect } from '@playwright/test';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  'base64',
);

async function checkout(page, method) {
  await page.addInitScript(() =>
    localStorage.setItem('bc-cart-v2', JSON.stringify([{ id: 2, quantity: 1 }])),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Abrir carrito' }).click();
  await page.getByRole('button', { name: 'Continuar con mi pedido' }).click();
  await expect(page.locator('#paymentReceipt')).toBeDisabled();
  await page.locator(`[name=paymentMethod][value=${method}]`).check();
  await page.locator('[name=receiptChannel][value=upload]').check();
  await page
    .locator('#paymentReceipt')
    .setInputFiles({ name: 'comprobante.png', mimeType: 'image/png', buffer: PNG });
  await page.locator('#checkoutForm [name=name]').fill('Cliente con captura');
  await page.locator('#checkoutForm [name=phone]').fill('987654321');
  await page.locator('#checkoutForm [name=consent]').check();
}

for (const [method, width] of [
  ['yape', 320],
  ['bcp', 1440],
]) {
  test(`${method}: adjuntar comprobante antes de confirmar y revisar desde administración`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await checkout(page, method);
    expect(
      await page.locator('.purchase-page').evaluate((el) => el.scrollWidth <= el.clientWidth),
    ).toBe(true);
    await page.locator('#paymentReceipt').scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('receipt-upload.png') });
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().endsWith('/api/orders') && response.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Registrar mi solicitud' }).click();
    const response = await responsePromise;
    expect(response.status()).toBe(201);
    const order = await response.json();
    expect(order.payment).toEqual({
      method,
      status: 'pending_verification',
      receipt: true,
      receiptChannel: 'upload',
    });
    await expect(page.locator('.receipt-confirmation')).toContainText('Comprobante recibido');
    expect((await page.request.get(`/api/admin/orders/${order.id}/receipt`)).status()).toBe(401);
    await page.goto('/admin');
    await page.getByLabel('Usuario', { exact: true }).fill('browser-test');
    await page.getByLabel('Contraseña', { exact: true }).fill('test-only-password-123');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await page.getByRole('button', { name: 'Pedidos', exact: true }).click();
    await page.getByLabel('Buscar pedidos').fill(order.id);
    const card = page.locator('.admin-record');
    await expect(card).toContainText('Pendiente de verificación');
    await expect(
      card.getByRole('img', { name: 'Comprobante de pago adjunto por el cliente' }),
    ).toBeVisible();
    const popupPromise = page.waitForEvent('popup');
    await card.getByRole('link', { name: 'Ver comprobante' }).click();
    const popup = await popupPromise;
    await popup.waitForLoadState();
    await expect(popup.locator('img')).toBeVisible();
    await popup.close();
    await card.getByRole('button', { name: 'Rechazar comprobante' }).click();
    await expect(card).toContainText('Comprobante rechazado');
    page.once('dialog', (dialog) => dialog.accept());
    await card.getByRole('button', { name: 'Validar abono' }).click();
    await expect(card).toContainText('Pago validado');
    await expect(card).toContainText('browser-test');
    await page.reload();
    await page.getByRole('button', { name: 'Pedidos', exact: true }).click();
    await page.getByLabel('Buscar pedidos').fill(order.id);
    await expect(card).toContainText('Pago validado');
    await page.screenshot({ path: testInfo.outputPath('receipt-review.png') });
    await card.getByRole('button', { name: 'Volver a pendiente' }).click();
    await expect(card).toContainText('Pendiente de verificación');
  });
}

test('un error conserva el archivo y los datos; cambiar a coordinar elimina el adjunto', async ({
  page,
}) => {
  await checkout(page, 'yape');
  await page.route('**/api/orders', (route) =>
    route.fulfill({ status: 503, json: { error: 'Intenta nuevamente.' } }),
  );
  await page.getByRole('button', { name: 'Registrar mi solicitud' }).click();
  await expect(page.locator('#checkoutForm .form-status')).toHaveText('Intenta nuevamente.');
  expect(await page.locator('#paymentReceipt').evaluate((input) => input.files[0].name)).toBe(
    'comprobante.png',
  );
  await expect(page.locator('#checkoutForm [name=name]')).toHaveValue('Cliente con captura');
  await page.locator('[name=paymentMethod][value=coordinate]').check();
  await expect(page.locator('#paymentReceipt')).toBeDisabled();
  expect(await page.locator('#paymentReceipt').evaluate((input) => input.files.length)).toBe(0);
});

test('la interfaz rechaza archivos de más de 1 MB antes de enviarlos', async ({ page }) => {
  await checkout(page, 'bcp');
  await page.locator('#paymentReceipt').setInputFiles({
    name: 'muy-grande.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(1_048_577),
  });
  let submitted = false;
  await page.route('**/api/orders', async (route) => {
    submitted = true;
    await route.abort();
  });
  await page.getByRole('button', { name: 'Registrar mi solicitud' }).click();
  await expect(page.locator('#checkoutForm .form-status')).toContainText('hasta 1 MB');
  expect(submitted).toBe(false);
  await expect(page.locator('#cartCount')).toHaveText('1');
});

test('WhatsApp oculta el archivo, guarda la elección y la muestra en el panel', async ({
  page,
}) => {
  await checkout(page, 'yape');
  await page.locator('[name=receiptChannel][value=whatsapp]').check();
  await expect(page.locator('#paymentReceipt')).toBeHidden();
  await expect(page.locator('#paymentReceipt')).toBeDisabled();
  const responsePromise = page.waitForResponse(
    (r) => r.url().endsWith('/api/orders') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Registrar mi solicitud' }).click();
  const response = await responsePromise;
  const order = await response.json();
  expect(order.payment.receiptChannel).toBe('whatsapp');
  expect(order.payment.receipt).toBeUndefined();
  expect(response.request().postDataJSON().receiptBase64).toBeUndefined();
  await expect(page.locator('.receipt-confirmation')).toContainText(
    'Elegiste enviar tu comprobante por WhatsApp',
  );
  await page.goto('/admin');
  await page.getByLabel('Usuario', { exact: true }).fill('browser-test');
  await page.getByLabel('Contraseña', { exact: true }).fill('test-only-password-123');
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.getByRole('button', { name: 'Pedidos', exact: true }).click();
  await page.getByLabel('Buscar pedidos').fill(order.id);
  const card = page.locator('.admin-record');
  await expect(card).toContainText('El cliente eligió enviar el comprobante por WhatsApp');
  await expect(card.locator('.admin-receipt-preview')).toHaveCount(0);
});
