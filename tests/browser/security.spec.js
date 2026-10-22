import { test, expect } from '@playwright/test';

const ROUTES = [
  '/',
  '/tienda',
  '/catalogos',
  '/producto/1',
  '/contacto',
  '/nosotros',
  '/legal/terminos',
  '/legal/privacidad',
  '/legal/devoluciones',
  '/reclamaciones',
  '/favoritos',
  '/admin',
];

test('ninguna página incumple la política de seguridad de contenido', async ({ page }) => {
  const problems = [];
  page.on('console', (message) => {
    if (/content security policy|refused to/i.test(message.text())) problems.push(message.text());
  });
  page.on('pageerror', (error) => problems.push(error.message));
  for (const route of ROUTES) {
    await page.goto(route, { waitUntil: 'load' });
    await page.waitForTimeout(500);
  }
  expect(problems).toEqual([]);
});

test('las páginas llevan cabeceras de seguridad y no permiten scripts en línea', async ({
  page,
}) => {
  const response = await page.goto('/');
  const headers = response.headers();
  expect(headers['content-security-policy']).toContain("script-src 'self'");
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['x-content-type-options']).toBe('nosniff');
  const inline = await page.evaluate(
    () => [...document.scripts].filter((s) => !s.src && s.type !== 'application/ld+json').length,
  );
  expect(inline).toBe(0);
});

test('el teléfono con espacios es válido en los formularios', async ({ page }) => {
  await page.goto('/reclamaciones');
  const phone = page.locator('#claimForm input[name=phone]');
  await phone.fill('937 473 120');
  expect(await phone.evaluate((el) => el.validity.patternMismatch)).toBe(false);
  await phone.fill('abc');
  expect(await phone.evaluate((el) => el.validity.patternMismatch)).toBe(true);
});
