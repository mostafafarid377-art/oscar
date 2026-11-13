import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const executablePath = process.env.CHROME_PATH || '/tmp/chromium';
const browser = await puppeteer.launch({
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu','--use-gl=angle','--use-angle=swiftshader',
    '--single-process',
    '--no-zygote',
    '--font-render-hinting=none',
  ],
  defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 1 },
  executablePath,
  headless: 'shell',
  env: { ...process.env, LD_LIBRARY_PATH: '/tmp/sp:/tmp/sp/lib' },
});

const page = await browser.newPage();
const errors = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));

const base = 'http://127.0.0.1:5173';
const outDir = process.env.OUT_DIR || '/tmp/shots';
fs.mkdirSync(outDir, { recursive: true });

const desktopShots = [
  ['/', 'landing'],
  ['/login', 'login'],
  ['/app', 'dashboard'],
  ['/app/garage', 'garage'],
  ['/app/garage/veh-elantra-2018', 'vehicle-details'],
  ['/app/carproof', 'carproof'],
  ['/app/documents', 'documents'],
  ['/app/ai-mechanic', 'ai-mechanic'],
  ['/app/maintenance', 'maintenance'],
  ['/app/notifications', 'notifications'],
  ['/app/settings', 'settings'],
];

for (const [path, name] of desktopShots) {
  await page.setViewport({ width: 1440, height: 1000 });
  await page.goto(base + path, { waitUntil: 'networkidle2', timeout: 45000 });
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: `${outDir}/${name}.png` });
}

// mobile
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
for (const [path, name] of [['/app', 'mobile-dashboard'], ['/', 'mobile-landing']]) {
  await page.goto(base + path, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: `${outDir}/${name}.png` });
}

// arabic
await page.setViewport({ width: 1440, height: 1000 });
for (const [path, name] of [['/app', 'ar-dashboard'], ['/app/maintenance', 'ar-maintenance'], ['/', 'ar-landing']]) {
  await page.goto(base + path, { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('caros.language', 'ar');
    const raw = localStorage.getItem('caros.demo.settings');
    const settings = raw ? JSON.parse(raw) : {};
    localStorage.setItem('caros.demo.settings', JSON.stringify({ ...settings, language: 'ar' }));
  });
  await page.goto(base + path, { waitUntil: 'networkidle2' });
  await new Promise((r) => setTimeout(r, 800));
  await page.screenshot({ path: `${outDir}/${name}.png` });
  const dir = await page.evaluate(() => document.documentElement.dir);
  console.log(`dir for ${name}:`, dir);
}

console.log('CONSOLE ERRORS:', JSON.stringify(errors.slice(0, 20), null, 1));
await browser.close();
