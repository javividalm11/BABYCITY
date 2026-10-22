import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://www.google.com/maps**', (route) => route.abort());
});

test('contact form records the selected category and offers WhatsApp as the next step', async ({
  page,
}) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/contacto', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Estamos cerquita de ti' })).toBeVisible();
  const form = page.locator('#contactPageForm');
  await form.getByLabel('Nombre completo').fill('Prueba de contacto');
  await form.getByRole('textbox', { name: 'WhatsApp', exact: true }).fill('999123456');
  await form.getByLabel(/buscando/).selectOption('Coches');
  await form.getByLabel('Mensaje', { exact: true }).fill('Quiero ayuda para elegir un coche.');
  await form.locator('[name=consent]').check();
  const responsePromise = page.waitForResponse(
    (response) => response.url().endsWith('/api/leads') && response.request().method() === 'POST',
  );
  await form.getByRole('button', { name: 'Quiero ayuda personalizada' }).click();
  const response = await responsePromise;
  expect(response.ok()).toBe(true);
  expect(response.request().postDataJSON().message).toBe(
    'Coches: Quiero ayuda para elegir un coche.',
  );
  await expect(form.getByRole('link', { name: /Abrir WhatsApp y enviar/ })).toHaveAttribute(
    'href',
    /https:\/\/wa.me\/51937473120\?text=/,
  );
  expect(errors).toEqual([]);
  await page
    .locator('.contact-store-actions')
    .getByRole('button', { name: 'Coordinar mi visita' })
    .click();
  await expect(page.locator('#contactDialog')).toBeVisible();
});

test('contact page fits small phones, tablets and desktop and uses the real store location', async ({
  page,
}) => {
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/contacto', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#contactPageForm select option')).not.toHaveCount(2);
    await page.locator('.contact-page img').evaluateAll((images) =>
      Promise.all(
        images.map((image) => {
          image.loading = 'eager';
          return image.decode();
        }),
      ),
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    for (const selector of [
      '.contact-hero-copy',
      '.contact-shortcuts',
      '.contact-store-card',
      '.contact-map',
      '#contactPageForm',
    ]) {
      const box = await page.locator(selector).boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width + 1);
    }
    await expect(page.locator('.contact-map-card')).toHaveAttribute(
      'href',
      /Antonio.*Raymondi.*512/,
    );
    await expect(page.locator('.contact-store-photo img')).toHaveAttribute(
      'src',
      '/assets/community/tiktok-tienda.webp',
    );
    if ([390, 1440].includes(width))
      await page.screenshot({
        path: `test-results/contact-${width}.png`,
        fullPage: true,
        animations: 'disabled',
      });
  }
});

test('FAQ disclosures work with keyboard and keep only one answer open', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/contacto', { waitUntil: 'domcontentloaded' });
  const faq = page.locator('.contact-faq');
  await faq.scrollIntoViewIfNeeded();
  await faq.locator('img').evaluate((image) => image.decode());
  const questions = faq.locator('details');
  await expect(questions).toHaveCount(5);
  await expect(faq.locator('details[open]')).toHaveCount(0);
  await questions.first().locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(questions.first()).toHaveAttribute('open', '');
  await expect(questions.first().locator('.faq-answer')).toBeVisible();
  await questions.nth(1).locator('summary').click();
  await expect(questions.first()).not.toHaveAttribute('open');
  await expect(faq.locator('details[open]')).toHaveCount(1);
  await questions.last().locator('summary').click();
  await expect(questions.last().locator('a')).toHaveAttribute(
    'href',
    'https://www.tiktok.com/@babycityperu',
  );
  await questions.last().locator('summary').click();
  await faq.screenshot({ path: 'test-results/faq-desktop.png', animations: 'disabled' });
  await page.setViewportSize({ width: 390, height: 844 });
  await faq.screenshot({ path: 'test-results/faq-mobile.png', animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
