// Full-flow screenshot driver: idle → spin/pool → assign → ready → result
// Usage: node /tmp/shoot-all.mjs <url> <outPrefix> <mobile|desktop>
import puppeteer from 'puppeteer-core';

const [, , url = 'http://localhost:3300', prefix = '/tmp/50-0-before', mode = 'mobile'] = process.argv;

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: 'shell',
});
const page = await browser.newPage();
if (mode === 'mobile') {
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
} else {
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const shot = async name => {
  await page.screenshot({ path: `${prefix}-${mode}-${name}.png` });
  console.log(`shot: ${name}`);
};

await page.goto(url, { waitUntil: 'networkidle0' });
await sleep(900);
await shot('1-idle');

// one full spin → pool
const doSpin = async () => {
  await page.click('.spin-btn');
  await sleep(3400); // reel animation
};
await doSpin();
await shot('2-pool');

// open assign modal
await page.click('.pool-card');
await sleep(500);
await shot('3-assign');

// assign first available trait
const pickTrait = async () => {
  await page.evaluate(() => {
    const btns = [...document.querySelectorAll('.assign-opt')];
    const open = btns.find(b => !b.disabled);
    if (open) open.click();
  });
  await sleep(400);
};
await pickTrait();

// complete remaining 6 picks
for (let i = 0; i < 6; i++) {
  await doSpin();
  await page.click('.pool-card:not(.used)');
  await sleep(350);
  await pickTrait();
}
await shot('4-ready');

// run the fight, skip animation by clicking overlay
await page.click('.fight-btn');
await sleep(1200);
await shot('5-sim');
await page.click('.overlay');
await sleep(1600);
await shot('6-result');
await page.evaluate(() => {
  const card = document.querySelector('.result-card');
  if (card) card.scrollTop = card.scrollHeight;
  window.scrollTo(0, document.body.scrollHeight);
});
await sleep(300);
await shot('7-result-bottom');

await browser.close();
console.log('done');
