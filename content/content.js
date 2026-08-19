/**
 * Content script ReadingComfortExt.
 * Applique les styles de confort de lecture sur la page courante.
 */

const STYLE_ID = 'readingcomfortext-style';
const FONTS_ID = 'readingcomfortext-fonts';
const GUIDE_ID = 'readingcomfortext-guide';

// Sélecteurs ciblant les zones de texte, sans casser les interfaces fonctionnelles.
const TEXT_SELECTORS = [
  'article', 'main', 'section',
  'p', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'figcaption', 'td', 'th', 'dt', 'dd', 'label'
].join(', ');

// Valeurs par défaut.
const DEFAULT_PREFS = {
  enabled: true,
  font: 'default',
  letterSpacing: 0,
  lineHeight: 1.5,
  maxWidth: 0,
  creamBackground: false,
  noJustify: false,
  guide: 'none',
};

/**
 * Récupère les préférences depuis le stockage sync.
 * @returns {Promise<object>}
 */
async function loadPrefs() {
  const stored = await chrome.storage.sync.get(DEFAULT_PREFS);
  return { ...DEFAULT_PREFS, ...stored };
}

/**
 * Génère la règle @font-face ou charge les polices externes.
 */
function ensureFonts() {
  if (document.getElementById(FONTS_ID)) return;

  const link = document.createElement('link');
  link.id = FONTS_ID;
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=swap';
  document.head.appendChild(link);

  // OpenDyslexic : fichiers locaux sous SIL-OFL.
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-family: 'OpenDyslexic';
      src: url('${chrome.runtime.getURL('fonts/OpenDyslexic/OpenDyslexic-Regular.woff')}') format('woff');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'OpenDyslexic';
      src: url('${chrome.runtime.getURL('fonts/OpenDyslexic/OpenDyslexic-Bold.woff')}') format('woff');
      font-weight: bold;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'OpenDyslexic';
      src: url('${chrome.runtime.getURL('fonts/OpenDyslexic/OpenDyslexic-Italic.woff')}') format('woff');
      font-weight: normal;
      font-style: italic;
      font-display: swap;
    }
    @font-face {
      font-family: 'OpenDyslexic';
      src: url('${chrome.runtime.getURL('fonts/OpenDyslexic/OpenDyslexic-BoldItalic.woff')}') format('woff');
      font-weight: bold;
      font-style: italic;
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Construit la feuille de styles CSS à injecter.
 * @param {object} prefs
 * @returns {string}
 */
function buildCSS(prefs) {
  if (!prefs.enabled) {
    return '';
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

  return `
    ${TEXT_SELECTORS} {
      font-family: ${fontFamily} !important;
      letter-spacing: ${letterSpacing} !important;
      line-height: ${lineHeight} !important;
      text-align: ${textAlign};
      max-width: ${maxWidth} !important;
      background-color: ${bgColor} !important;
      transition: background-color 0.2s ease, letter-spacing 0.2s ease, line-height 0.2s ease;
    }

    /* Éviter que les titres prennent toute la largeur quand max-width est réduit */
    h1, h2, h3, h4, h5, h6 {
      width: fit-content;
    }
  `;
}

/**
 * Injecte ou met à jour la feuille de styles.
 * @param {object} prefs
 */
function applyStyles(prefs) {
  ensureFonts();

  let styleEl = document.getElementById(STYLE_ID);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = STYLE_ID;
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = buildCSS(prefs);

  applyGuide(prefs);
}

/**
 * Applique le guide visuel sélectionné.
 * @param {object} prefs
 */
function applyGuide(prefs) {
  let guideEl = document.getElementById(GUIDE_ID);

  if (!prefs.enabled || prefs.guide !== 'colored-lines') {
    if (guideEl) guideEl.remove();
    document.querySelectorAll('.readingcomfortext-guide-line').forEach((el) => el.remove());
    return;
  }

  if (!guideEl) {
    guideEl = document.createElement('style');
    guideEl.id = GUIDE_ID;
    document.head.appendChild(guideEl);
  }

  guideEl.textContent = `
    ${TEXT_SELECTORS} {
      background-image: repeating-linear-gradient(
        90deg,
        rgba(231, 76, 60, 0.08) 0px,
        rgba(231, 76, 60, 0.08) 80px,
        rgba(52, 152, 219, 0.08) 80px,
        rgba(52, 152, 219, 0.08) 160px,
        rgba(46, 204, 113, 0.08) 160px,
        rgba(46, 204, 113, 0.08) 240px,
        rgba(155, 89, 182, 0.08) 240px,
        rgba(155, 89, 182, 0.08) 320px
      ) !important;
      background-size: 320px 100% !important;
    }
  `;
}

/**
 * Lit la sélection ou le texte de la page à voix haute.
 */
function playTTS() {
  stopTTS();

  const selection = window.getSelection()?.toString()?.trim();
  const text = selection || document.body.innerText?.substring(0, 5000) || '';

  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = document.documentElement.lang || 'fr-FR';
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

/**
 * Arrête la lecture audio.
 */
function stopTTS() {
  window.speechSynthesis.cancel();
}

/**
 * Réagit aux messages envoyés par le popup.
 */
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'apply') {
    applyStyles(request.prefs || DEFAULT_PREFS);
    sendResponse({ ok: true });
  } else if (request.action === 'tts-play') {
    playTTS();
    sendResponse({ ok: true });
  } else if (request.action === 'tts-stop') {
    stopTTS();
    sendResponse({ ok: true });
  }
  return true;
});

/**
 * Observer les changements du DOM pour les SPA (avec throttle).
 */
function observeDOM() {
  let timeout;
  const observer = new MutationObserver(() => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      const prefs = await loadPrefs();
      applyStyles(prefs);
    }, 300);
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

/**
 * Initialisation au chargement de la page.
 */
async function init() {
  const prefs = await loadPrefs();
  applyStyles(prefs);

  if (document.body) {
    observeDOM();
  } else {
    window.addEventListener('DOMContentLoaded', observeDOM);
  }
}

init();
