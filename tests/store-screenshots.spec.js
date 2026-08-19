import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');
const EXTENSION_PATH = PROJECT_ROOT;
const STORE_DIR = path.resolve(PROJECT_ROOT, 'store');
const SCREENSHOTS_DIR = path.resolve(PROJECT_ROOT, 'test-results', 'screenshots');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function frameToSize(inputPath, outputPath, targetWidth, targetHeight, background = '#f5f5f5') {
  const { width, height } = await sharp(inputPath).metadata();
  const scale = Math.min(targetWidth / width, targetHeight / height);
  const scaledWidth = Math.round(width * scale);
  const scaledHeight = Math.round(height * scale);
  const offsetX = Math.round((targetWidth - scaledWidth) / 2);
  const offsetY = Math.round((targetHeight - scaledHeight) / 2);

  await sharp({
    create: { width: targetWidth, height: targetHeight, channels: 3, background },
  })
    .composite([
      { input: await sharp(inputPath).resize(scaledWidth, scaledHeight).toBuffer(), left: offsetX, top: offsetY },
    ])
    .png()
    .toFile(outputPath);
}

async function getExtensionId(context) {
  let [background] = context.serviceWorkers();
  if (!background) {
    background = await context.waitForEvent('serviceworker');
  }
  const match = background.url().match(/\/\/([a-z]+)\//);
  return match[1];
}

async function applyReadingComfortStyles(page, settings) {
  await page.evaluate((prefs) => {
    const TEXT_SELECTORS = [
      'article', 'main', 'section',
      'p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'figcaption', 'td', 'th', 'dt', 'dd', 'label'
    ].join(', ');

    const STYLE_ID = 'readingcomfortext-test-style';
    let styleEl = document.getElementById(STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }

    const fontFamily = {
      default: 'inherit',
      lexend: '"Lexend", sans-serif',
      atkinson: '"Atkinson Hyperlegible", sans-serif',
      opendyslexic: '"OpenDyslexic", sans-serif',
    }[prefs.font] || 'inherit';

    const letterSpacing = prefs.letterSpacing > 0 ? `${prefs.letterSpacing}px` : 'normal';
    const lineHeight = prefs.lineHeight;
    const maxWidth = prefs.maxWidth > 0 ? `${prefs.maxWidth}px` : 'none';
    const bgColor = prefs.creamBackground ? '#FDF6E3' : 'transparent';
    const textAlign = prefs.noJustify ? 'left !important' : 'inherit';

    let guideCSS = '';
    if (prefs.guide === 'colored-lines') {
      guideCSS = `
        ${TEXT_SELECTORS} {
          background-image: linear-gradient(
            90deg,
            rgba(52, 152, 219, 0.10) 0%,
            rgba(155, 89, 182, 0.08) 25%,
            rgba(231, 76, 60, 0.08) 50%,
            rgba(46, 204, 113, 0.08) 75%,
            rgba(52, 152, 219, 0.10) 100%
          ) !important;
          background-size: 100% ${prefs.lineHeight}em !important;
          background-repeat: repeat-y !important;
        }
      `;
    }

    styleEl.textContent = `
      ${TEXT_SELECTORS} {
        font-family: ${fontFamily} !important;
        letter-spacing: ${letterSpacing} !important;
        line-height: ${lineHeight} !important;
        text-align: ${textAlign};
        max-width: ${maxWidth} !important;
        background-color: ${bgColor} !important;
      }
      h1, h2, h3, h4, h5, h6 { width: fit-content; }
      ${guideCSS}
    `;
  }, settings);
}

test.describe('ReadingComfortExt — captures pour le store', () => {
  let context;
  let extensionId;

  test.beforeAll(async () => {
    ensureDir(STORE_DIR);
    ensureDir(SCREENSHOTS_DIR);
    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
      ],
    });
    extensionId = await getExtensionId(context);
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('capture de la popup', async () => {
    const popupPage = await context.newPage();
    await popupPage.setViewportSize({ width: 420, height: 720 });
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    await expect(popupPage.locator('h1')).toHaveText('ReadingComfortExt');

    const rawPopup = path.join(STORE_DIR, 'screenshot-popup-raw.png');
    await popupPage.screenshot({ path: rawPopup });

    // Cadre blanc 1000×750 pour respecter les formats de screenshot des stores.
    await frameToSize(rawPopup, path.join(STORE_DIR, 'screenshot-popup.png'), 1000, 750, '#f8f9fa');

    await popupPage.close();
  });

  test('capture avant/après sur Wikipédia', async () => {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1600, height: 1200 });
    await page.goto('https://fr.wikipedia.org/wiki/Dyslexie', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Masquer les éléments parasites pour un rendu propre.
    await page.evaluate(() => {
      const selectors = ['.fr-cookie-banner', '.vector-sticky-header', '.centralauth-notice', '#siteNotice', '.vector-page-toolbar'];
      selectors.forEach((sel) => {
        const el = document.querySelector(sel);
        if (el) el.style.display = 'none';
      });
      // Descendre légèrement pour avoir le titre + le début du corps de l'article.
      window.scrollTo(0, 140);
    });

    const clip = { x: 100, y: 75, width: 1400, height: 1050 };

    await page.screenshot({ path: path.join(STORE_DIR, 'screenshot-wikipedia-before.png'), clip });

    // Appliquer les styles confort.
    await applyReadingComfortStyles(page, {
      enabled: true,
      font: 'lexend',
      letterSpacing: 1.5,
      lineHeight: 1.8,
      maxWidth: 700,
      creamBackground: true,
      noJustify: true,
      guide: 'colored-lines',
    });

    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(STORE_DIR, 'screenshot-wikipedia-after.png'), clip });

    await page.close();
  });
});
