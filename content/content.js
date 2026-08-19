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
  'blockquote', 'figcaption', 'td', 'th', 'dt', 'dd'
].join(', ');

/**
 * Récupère et normalise les préférences depuis le stockage sync.
 * @returns {Promise<object>}
 */
async function loadPrefs() {
  const stored = await chrome.storage.sync.get(DEFAULT_PREFS);
  return normalizePrefs({ ...DEFAULT_PREFS, ...stored });
}

/**
 * Charge les polices externes si elles ne le sont pas déjà.
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

    /* Les titres ne doivent pas s'étirer artificiellement quand max-width est actif */
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
  if (!prefs.enabled) {
    removeStyles();
    return;
  }

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
 * Supprime les styles et le guide visuel de la page.
 */
function removeStyles() {
  [STYLE_ID, GUIDE_ID].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
}

/**
 * Applique le guide visuel sélectionné.
 * @param {object} prefs
 */
function applyGuide(prefs) {
  let guideEl = document.getElementById(GUIDE_ID);

  if (!prefs.enabled || prefs.guide !== 'colored-lines') {
    if (guideEl) guideEl.remove();
    return;
  }

  if (!guideEl) {
    guideEl = document.createElement('style');
    guideEl.id = GUIDE_ID;
    document.head.appendChild(guideEl);
  }

  // Gradient horizontal doux répété verticalement tous les `line-height` em.
  // Cela crée un repère visuel par ligne de texte, approximant le principe
  // du gradient cosinus de Korben sans modifier le DOM.
  const lineHeight = prefs.lineHeight || 1.5;
  guideEl.textContent = `
    ${TEXT_SELECTORS} {
      background-image: linear-gradient(
        90deg,
        rgba(52, 152, 219, 0.10) 0%,
        rgba(155, 89, 182, 0.08) 25%,
        rgba(231, 76, 60, 0.08) 50%,
        rgba(46, 204, 113, 0.08) 75%,
        rgba(52, 152, 219, 0.10) 100%
      ) !important;
      background-size: 100% ${lineHeight}em !important;
      background-repeat: repeat-y !important;
      background-position: left top !important;
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
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Vérifie que le message provient bien de cette extension.
  if (sender.id && sender.id !== chrome.runtime.id) {
    return false;
  }

  if (request.action === 'apply') {
    applyStyles(normalizePrefs(request.prefs || DEFAULT_PREFS));
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
 * Surveille aussi le <head> au cas où une SPA le recrée.
 */
function observeDOM() {
  let timeout;
  const observer = new MutationObserver(() => {
    clearTimeout(timeout);
    timeout = setTimeout(async () => {
      const prefs = await loadPrefs();
      applyStyles(prefs);
    }, 500);
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  }
  if (document.head) {
    observer.observe(document.head, { childList: true });
  }
}

/**
 * Initialisation au chargement de la page.
 */
async function init() {
  const prefs = await loadPrefs();
  applyStyles(prefs);

  if (document.body && document.head) {
    observeDOM();
  } else {
    window.addEventListener('DOMContentLoaded', observeDOM);
  }
}

init();
