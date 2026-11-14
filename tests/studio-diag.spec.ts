import { test, expect } from '@playwright/test';

test('studio boots after vite restart', async ({ page }) => {
  page.on('console', (m) => {
    const t = m.text();
    if (!t.includes('[vite]')) console.log('C', t.slice(0, 160));
  });
  page.on('pageerror', (e) => console.log('PE', e.message));
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForFunction(
    () => (document.getElementById('root')?.innerHTML.length ?? 0) > 0 || !location.href.includes(':5173'),
    { timeout: 20000 },
  );
  const st = await page.evaluate(() => ({
    href: location.href,
    text: (document.getElementById('root')?.innerText || '').replace(/\s+/g, ' ').slice(0, 240),
    rootLen: document.getElementById('root')?.innerHTML.length ?? -1,
    brand: getComputedStyle(document.documentElement).getPropertyValue('--brand-500').trim(),
  }));
  console.log('STATE', JSON.stringify(st));
  expect(st.rootLen).toBeGreaterThan(0);
});
