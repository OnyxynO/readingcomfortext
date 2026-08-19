import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const EXTENSION_PATH = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.resolve(__dirname, '..', 'test-results', 'screenshots');

// Sites représentatifs à tester.
const TEST_SITES = [
  { name: 'wikipedia', url: 'https://fr.wikipedia.org/wiki/Dyslexie' },
  { name: 'mdn', url: 'https://developer.mozilla.org/fr/docs/Web/CSS/letter-spacing' },
  { name: 'lemonde', url: 'https://www.lemonde.fr/' },
  { name: 'github-readme', url: 'https://github.com/antijingoist/opendyslexic' },
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function getExtensionId(context) {
  let [background] = context.serviceWorkers();
  if (!background) {
    background = await context.waitForEvent('serviceworker');
  }
  const match = background.url().match(/\/\/([a-z]+)\//);
  return match[1];
}

/**
 * Applique les styles ReadingComfortExt directement dans la page.
 * Cette fonction reproduit le comportement de content/content.js pour les tests visuels.
 */
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

test.describe('ReadingComfortExt — tests visuels', () => {
  let context;
  let extensionId;

  test.beforeAll(async () => {
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

  test('popup affiche les options et badges', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/popup.html`);

    await expect(popupPage.locator('h1')).toHaveText('ReadingComfortExt');
    await expect(popupPage.locator('text=Lexend')).toBeVisible();
    await expect(popupPage.locator('text=Sci ✓').first()).toBeVisible();
    await expect(popupPage.locator('text=Pref').first()).toBeVisible();

    await popupPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'popup.png') });
    await popupPage.close();
  });

  for (const site of TEST_SITES) {
    test(`rendu sur ${site.name}`, async () => {
      const page = await context.newPage();
      await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Laisser un peu de temps au réseau avant la capture, sans attendre networkidle (trop strict sur certains sites).
      await page.waitForTimeout(2000);

      // Capture avant.
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${site.name}-before.png`) });

      // Appliquer les styles.
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
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `${site.name}-after.png`), fullPage: true });

      await page.close();
    });
  }
});
