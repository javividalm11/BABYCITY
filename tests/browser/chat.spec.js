import { test, expect } from '@playwright/test';

async function openChat(page) {
  await page.goto('/nosotros', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Abrir asistente de BabyCity' }).click();
  await expect(page.locator('#chatDialog')).toBeVisible();
}

async function ask(page, text) {
  await page.locator('#chatInput').fill(text);
  await page.locator('#chatForm').getByRole('button', { name: 'Enviar consulta' }).click();
}

test('chat uses real catalog data, keeps conversation and hands off to the contact form', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openChat(page);
  const chat = page.locator('#chatDialog');
  await expect(page.locator('.contact-float')).toHaveAttribute('aria-expanded', 'true');
  await ask(page, 'Coche maleta Rudi');
  await expect(chat.locator('.chat-product h3').first()).toHaveText('Coche maleta Rudi');
  await expect(chat.locator('.chat-product')).toHaveCount(1);
  await chat
    .locator('.chat-product img')
    .evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
  await chat.screenshot({ path: 'test-results/chat-conversation.png', animations: 'disabled' });
  const data = await (await page.request.get('/api/products')).json();
  const product = data.find((item) => item.name === 'Coche maleta Rudi');
  const price = new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(
    product.price,
  );
  await expect(chat.locator('.chat-product > div > strong').first()).toHaveText(price);
  await chat
    .locator('.chat-product')
    .first()
    .getByRole('button', { name: 'Guardar en favoritos' })
    .click();
  await expect(chat.locator('.chat-product [data-wish]').first()).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await ask(page, 'Hacen envios a provincias?');
  await expect(chat.locator('.chat-message-assistant .chat-bubble').last()).toContainText(
    'costo final',
  );
  await ask(page, '<img src=x onerror=alert(1)>');
  await expect(chat.locator('.chat-message-user .chat-bubble').last()).toHaveText(
    '<img src=x onerror=alert(1)>',
  );
  await expect(chat.locator('.chat-message-user img')).toHaveCount(0);
  const count = await chat.locator('.chat-message').count();
  await page.keyboard.press('Escape');
  await expect(chat).not.toBeVisible();
  await expect(page.locator('.contact-float')).toBeFocused();
  await page.locator('.contact-float').click();
  await expect(chat.locator('.chat-message')).toHaveCount(count);
  await chat.locator('.chat-shortcuts').getByRole('button', { name: 'Hablar con asesor' }).click();
  await expect(chat).not.toBeVisible();
  await expect(page.locator('#contactDialog')).toBeVisible();
  expect(errors).toEqual([]);
});

test('chat links route to the existing catalogs and remains inside small viewports', async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await openChat(page);
    const chat = page.locator('#chatDialog');
    const bounds = await chat.boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(844);
    expect(await chat.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    await chat
      .locator('img')
      .evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
    if ([390, 1440].includes(width))
      await chat.screenshot({ path: `test-results/chat-${width}.png`, animations: 'disabled' });
    await chat.locator('.chat-shortcuts').getByRole('link', { name: 'Catálogos' }).click();
    await expect(page).toHaveURL(/\/catalogos$/);
    await expect(chat).not.toBeVisible();
    await expect(page.locator('.catalog-card')).toHaveCount(12);
  }
});

test('open chat fades with the launcher when the footer appears and returns on scroll up', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openChat(page);
  const chat = page.locator('#chatDialog');
  await page.evaluate(() =>
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
  );
  await expect(chat).toHaveClass(/is-footer-hidden/);
  await expect(chat).toHaveCSS('opacity', '0');
  expect(await chat.evaluate((element) => element.inert)).toBe(true);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(chat).not.toHaveClass(/is-footer-hidden/);
  await expect(chat).toHaveCSS('opacity', '1');
  await expect(page.locator('.contact-float')).toHaveAttribute('aria-expanded', 'true');
});
