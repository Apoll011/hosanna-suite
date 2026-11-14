import { test, expect } from '@playwright/test';

test('studio boots at e10725e7', async ({ page }) => {
  page.on('console', (m) => {
    const t = m.text();
    if (!t.includes('[vite]')) console.log('C', t.slice(0, 140));
  });
  page.on('pageerror', (e) => console.log('PE', e.message));
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'commit', timeout: 20000 });
  await page.waitForFunction(
    () => (document.getElementById('root')?.innerHTML.length ?? 0) > 0 || !location.href.includes(':5173'),
    { timeout: 30000 },
  );
  const st = await page.evaluate(() => ({
    href: location.href,
    ready: document.readyState,
    text: (document.getElementById('root')?.innerText || '').replace(/\s+/g, ' ').slice(0, 240),
    rootLen: document.getElementById('root')?.innerHTML.length ?? -1,
  }));
  console.log('STATE', JSON.stringify(st));
  expect(st.rootLen).toBeGreaterThan(0);
});
