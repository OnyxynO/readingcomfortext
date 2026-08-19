/**
 * Préférences par défaut et validateurs partagés entre popup et content script.
 */

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

const FONT_OPTIONS = ['default', 'lexend', 'atkinson', 'opendyslexic'];
const GUIDE_OPTIONS = ['none', 'colored-lines'];

/**
 * Valide et normalise les préférences utilisateur.
 * @param {object} prefs
 * @returns {object}
 */
function normalizePrefs(prefs) {
  return {
    enabled: Boolean(prefs?.enabled ?? DEFAULT_PREFS.enabled),
    font: FONT_OPTIONS.includes(prefs?.font) ? prefs.font : DEFAULT_PREFS.font,
    letterSpacing: clampNumber(prefs?.letterSpacing, 0, 6, DEFAULT_PREFS.letterSpacing),
    lineHeight: clampNumber(prefs?.lineHeight, 1, 2.5, DEFAULT_PREFS.lineHeight),
    maxWidth: clampInteger(prefs?.maxWidth, 0, 900, DEFAULT_PREFS.maxWidth),
    creamBackground: Boolean(prefs?.creamBackground ?? DEFAULT_PREFS.creamBackground),
    noJustify: Boolean(prefs?.noJustify ?? DEFAULT_PREFS.noJustify),
    guide: GUIDE_OPTIONS.includes(prefs?.guide) ? prefs.guide : DEFAULT_PREFS.guide,
  };
}

function clampNumber(value, min, max, fallback) {
  const n = parseFloat(value);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

function clampInteger(value, min, max, fallback) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}

// Expose pour les environnements module et script classique.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_PREFS, FONT_OPTIONS, GUIDE_OPTIONS, normalizePrefs };
}
