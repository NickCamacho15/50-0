// Mobile screenshot helper: true device emulation via installed Chrome.
// Usage: node scripts/shot.mjs <url> <outPrefix> [interact]
import puppeteer from 'puppeteer-core';

const [, , url = 'http://localhost:3000', prefix = '/tmp/50-0-m', interact = ''] = process.argv;

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'shell',
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(url, { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 800));
await page.screenshot({ path: `${prefix}-top.png` });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise(r => setTimeout(r, 400));
await page.screenshot({ path: `${prefix}-bottom.png` });

if (interact === 'spin') {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('.spin-btn');
  await new Promise(r => setTimeout(r, 3500)); // wait out reel animation
  await page.screenshot({ path: `${prefix}-pool.png` });
}
await browser.close();
console.log('done');
