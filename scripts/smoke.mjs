/**
 * Navigation, RTL and overflow smoke test.
 * Requires a running dev server and a headless Chromium (CHROME_PATH).
 */
import puppeteer from 'puppeteer-core';

const base = process.env.BASE_URL || 'http://127.0.0.1:5173';
const executablePath = process.env.CHROME_PATH || '/tmp/chromium';

const browser = await puppeteer.launch({
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--use-gl=angle', '--use-angle=swiftshader'],
  executablePath,
  headless: 'shell',
  env: { ...process.env, LD_LIBRARY_PATH: '/tmp/sp:/tmp/sp/lib' },
});
const page = await browser.newPage();
const failures = [];
const runtimeErrors = [];

// The Vite HMR client throws when the preview proxy rewrites the socket; that
// is a dev-server artefact, not an application error.
page.on('pageerror', (e) => {
  if (!/WebSocket|websocket/i.test(e.message)) runtimeErrors.push(e.message);
});
page.on('console', (m) => {
  const text = m.text();
  if (m.type() === 'error' && !/WebSocket|ERR_CONNECTION|\[vite\]|Failed to load resource/i.test(text)) {
    runtimeErrors.push(text);
  }
});

const routes = [
  '/', '/login', '/app', '/app/garage', '/app/garage/veh-elantra-2018',
  '/app/carproof', '/app/documents', '/app/ai-mechanic', '/app/maintenance',
  '/app/notifications', '/app/settings',
];

async function checkOverflow(label) {
  const overflow = await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth;
    const scroll = document.documentElement.scrollWidth;
    const offenders = [...document.querySelectorAll('body *')]
      .filter((el) => el.getBoundingClientRect().right > docWidth + 2)
      .slice(0, 3)
      .map((el) => `${el.tagName.toLowerCase()}.${(el.className || '').toString().split(' ')[0]}`);
    return { scroll, docWidth, offenders };
  });
  if (overflow.scroll > overflow.docWidth + 2) {
    failures.push(`${label}: horizontal overflow (${overflow.scroll} > ${overflow.docWidth}) ${overflow.offenders.join(', ')}`);
  }
}

// desktop pass
await page.setViewport({ width: 1440, height: 900 });
for (const route of routes) {
  const res = await page.goto(base + route, { waitUntil: 'networkidle2', timeout: 30000 });
  if (!res || res.status() >= 400) failures.push(`${route}: HTTP ${res?.status()}`);
  const heading = await page.$eval('h1', (el) => el.textContent?.trim() ?? '').catch(() => '');
  if (!heading) failures.push(`${route}: no <h1> rendered`);
  const links = await page.$$eval('a[href]', (els) => els.length);
  if (links === 0) failures.push(`${route}: no links found`);
  await checkOverflow(`desktop ${route}`);
}

// mobile pass
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
for (const route of routes) {
  await page.goto(base + route, { waitUntil: 'networkidle2', timeout: 30000 });
  await checkOverflow(`mobile ${route}`);
  const nav = await page.$('nav[aria-label]');
  if (!nav) failures.push(`mobile ${route}: navigation landmark missing`);
}

// arabic pass
for (const route of routes) {
  await page.goto(base + route, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('caros.language', 'ar');
    const raw = localStorage.getItem('caros.demo.settings');
    const settings = raw ? JSON.parse(raw) : {};
    localStorage.setItem('caros.demo.settings', JSON.stringify({ ...settings, language: 'ar' }));
  });
  await page.goto(base + route, { waitUntil: 'networkidle2' });
  const state = await page.evaluate(() => ({
    dir: document.documentElement.dir,
    lang: document.documentElement.lang,
    heading: document.querySelector('h1')?.textContent?.trim() ?? '',
  }));
  if (state.dir !== 'rtl') failures.push(`arabic ${route}: dir=${state.dir}`);
  if (state.lang !== 'ar') failures.push(`arabic ${route}: lang=${state.lang}`);
  if (!/[\u0600-\u06FF]/.test(state.heading)) failures.push(`arabic ${route}: heading not Arabic (${state.heading})`);
  await checkOverflow(`arabic ${route}`);
}

// interaction: switch language from the UI, then add a vehicle
await page.setViewport({ width: 1440, height: 900 });
await page.evaluate(() => {
  localStorage.clear();
});
await page.goto(base + '/app/garage', { waitUntil: 'networkidle2' });
const beforeCount = await page.$$eval('article', (els) => els.length);
await page.evaluate(() => {
  const buttons = [...document.querySelectorAll('button')];
  const add = buttons.find((b) => /Add vehicle/i.test(b.textContent ?? ''));
  add?.click();
});
await new Promise((r) => setTimeout(r, 400));
const modalOpen = await page.$('[role="dialog"]');
if (!modalOpen) failures.push('garage: add-vehicle dialog did not open');
await page.evaluate(() => {
  const inputs = document.querySelectorAll('[role="dialog"] input');
  const setValue = (el, value) => {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  setValue(inputs[0], 'Nissan');
  setValue(inputs[1], 'Sunny');
  setValue(inputs[4], 'ن ص 7788');
  setValue(inputs[7], '12000');
});
await page.evaluate(() => {
  const submit = document.querySelector('[role="dialog"] form');
  submit?.requestSubmit();
});
await new Promise((r) => setTimeout(r, 1200));
const afterCount = await page.$$eval('article', (els) => els.length);
if (afterCount !== beforeCount + 1) failures.push(`garage: vehicle add failed (${beforeCount} -> ${afterCount})`);

// AI demo reply
await page.goto(base + '/app/ai-mechanic', { waitUntil: 'networkidle2' });
await page.type('#ai-input', 'There is a squeal when I brake');
await page.keyboard.press('Enter');
await new Promise((r) => setTimeout(r, 2000));
const bubbles = await page.$$eval('[role="status"], .rounded-2xl', (els) => els.length);
if (bubbles === 0) failures.push('ai: no conversation rendered');

// notification mark-all-read
await page.goto(base + '/app/notifications', { waitUntil: 'networkidle2' });
const unreadBefore = await page.evaluate(() =>
  [...document.querySelectorAll('button')].some((b) => /Mark all as read/i.test(b.textContent ?? '') && !b.disabled));
if (!unreadBefore) failures.push('notifications: mark-all-read button was not enabled');

console.log('\n=== SMOKE TEST RESULT ===');
console.log('routes checked:', routes.length, '(desktop, mobile, arabic)');
console.log('failures:', failures.length);
failures.forEach((f) => console.log('  ✗', f));
console.log('runtime errors:', runtimeErrors.length);
[...new Set(runtimeErrors)].slice(0, 8).forEach((e) => console.log('  !', e.slice(0, 220)));
await browser.close();
process.exit(failures.length > 0 || runtimeErrors.length > 0 ? 1 : 0);
