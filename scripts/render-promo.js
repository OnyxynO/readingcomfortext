import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 560 } });

  await page.goto(`file://${path.join(PROJECT_ROOT, 'store', 'promo.html')}`);
  await page.waitForTimeout(500);

  await page.screenshot({
    path: path.join(PROJECT_ROOT, 'store', 'promo-image.png'),
    clip: { x: 0, y: 0, width: 1400, height: 560 },
  });

  await browser.close();
  console.log('Promo image générée : store/promo-image.png');
})();
