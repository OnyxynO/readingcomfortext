/**
 * Logique du popup ReadingComfortExt.
 * Charge les préférences, les sauvegarde et les applique à l'onglet actif.
 */

/**
 * Récupère l'onglet actif.
 * @returns {Promise<chrome.tabs.Tab>}
 */
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/**
 * Vérifie si l'onglet permet l'injection de content script.
 * @param {chrome.tabs.Tab} tab
 * @returns {boolean}
 */
function canInjectIntoTab(tab) {
  if (!tab?.url) return false;
  const blocked = ['chrome://', 'edge://', 'about:', 'file://', 'https://chrome.google.com/webstore', 'https://addons.mozilla.org'];
  return !blocked.some((prefix) => tab.url.startsWith(prefix));
}

/**
 * Affiche un message temporaire dans le popup.
 * @param {string} message
 * @param {'error' | 'info'} type
 */
function showPopupMessage(message, type = 'info') {
  const banner = document.getElementById('message-banner');
  if (!banner) return;
  banner.textContent = message;
  banner.className = `message-banner ${type}`;
  banner.classList.remove('hidden');
  setTimeout(() => banner.classList.add('hidden'), 4000);
}

/**
 * Envoie un message au content script de l'onglet actif.
 * @param {object} message
 */
async function sendToContent(message) {
  try {
    const tab = await getActiveTab();
    if (!tab?.id) return;
    if (!canInjectIntoTab(tab)) {
      showPopupMessage('Cette page ne permet pas l\'injection de styles (page système, fichier local, etc.).', 'error');
      return;
    }
    await chrome.tabs.sendMessage(tab.id, message);
  } catch (error) {
    showPopupMessage('Impossible d\'appliquer les styles sur cette page.', 'error');
    console.warn('[ReadingComfortExt] Impossible de contacter le content script :', error.message);
  }
}

/**
 * Charge les préférences depuis le stockage sync.
 * @returns {Promise<object>}
 */
async function loadPrefs() {
  const stored = await chrome.storage.sync.get(DEFAULT_PREFS);
  return normalizePrefs({ ...DEFAULT_PREFS, ...stored });
}

/**
 * Sauvegarde une préfération et notifie le content script.
 * @param {string} key
 * @param {any} value
 */
async function savePref(key, value) {
  try {
    await chrome.storage.sync.set({ [key]: value });
    await sendToContent({ action: 'apply', prefs: await loadPrefs() });
  } catch (error) {
    showPopupMessage('Erreur de sauvegarde des préférences.', 'error');
    console.warn('[ReadingComfortExt] Erreur storage :', error.message);
  }
}

/**
 * Met à jour l'interface avec les préférences chargées.
 * @param {object} prefs
 */
function updateUI(prefs) {
  const enabledInput = document.getElementById('enabled');
  enabledInput.checked = prefs.enabled;
  enabledInput.setAttribute('aria-checked', prefs.enabled ? 'true' : 'false');

  const fontInput = document.querySelector(`input[name="font"][value="${prefs.font}"]`);
  if (fontInput) fontInput.checked = true;

  document.getElementById('letter-spacing').value = prefs.letterSpacing;
  document.getElementById('letter-spacing-value').textContent = `${prefs.letterSpacing} px`;

  document.getElementById('line-height').value = prefs.lineHeight;
  document.getElementById('line-height-value').textContent = prefs.lineHeight;

  document.getElementById('max-width').value = prefs.maxWidth;
  document.getElementById('max-width-value').textContent = prefs.maxWidth === 0 ? 'auto' : `${prefs.maxWidth} px`;

  document.getElementById('cream-background').checked = prefs.creamBackground;
  document.getElementById('no-justify').checked = prefs.noJustify;

  const guideInput = document.querySelector(`input[name="guide"][value="${prefs.guide}"]`);
  if (guideInput) guideInput.checked = true;
}

/**
 * Attache les écouteurs d'événements de l'interface.
 */
function bindEvents() {
  document.getElementById('enabled').addEventListener('change', (e) => {
    e.target.setAttribute('aria-checked', e.target.checked ? 'true' : 'false');
    savePref('enabled', e.target.checked);
  });

  document.querySelectorAll('input[name="font"]').forEach((input) => {
    input.addEventListener('change', (e) => savePref('font', e.target.value));
  });

  document.getElementById('letter-spacing').addEventListener('input', (e) => {
    document.getElementById('letter-spacing-value').textContent = `${e.target.value} px`;
  });
  document.getElementById('letter-spacing').addEventListener('change', (e) => savePref('letterSpacing', parseFloat(e.target.value)));

  document.getElementById('line-height').addEventListener('input', (e) => {
    document.getElementById('line-height-value').textContent = e.target.value;
  });
  document.getElementById('line-height').addEventListener('change', (e) => savePref('lineHeight', parseFloat(e.target.value)));

  document.getElementById('max-width').addEventListener('input', (e) => {
    const value = parseInt(e.target.value, 10);
    document.getElementById('max-width-value').textContent = value === 0 ? 'auto' : `${value} px`;
  });
  document.getElementById('max-width').addEventListener('change', (e) => savePref('maxWidth', parseInt(e.target.value, 10)));

  document.getElementById('cream-background').addEventListener('change', (e) => savePref('creamBackground', e.target.checked));
  document.getElementById('no-justify').addEventListener('change', (e) => savePref('noJustify', e.target.checked));

  document.querySelectorAll('input[name="guide"]').forEach((input) => {
    input.addEventListener('change', (e) => savePref('guide', e.target.value));
  });

  document.getElementById('reset').addEventListener('click', async () => {
    try {
      await chrome.storage.sync.set(DEFAULT_PREFS);
      updateUI(DEFAULT_PREFS);
      await sendToContent({ action: 'apply', prefs: DEFAULT_PREFS });
    } catch (error) {
      showPopupMessage('Erreur lors de la réinitialisation.', 'error');
      console.warn('[ReadingComfortExt] Erreur reset :', error.message);
    }
  });

  document.getElementById('tts-play').addEventListener('click', async () => {
    await sendToContent({ action: 'tts-play' });
    document.getElementById('tts-play').classList.add('hidden');
    document.getElementById('tts-stop').classList.remove('hidden');
  });

  document.getElementById('tts-stop').addEventListener('click', async () => {
    await sendToContent({ action: 'tts-stop' });
    document.getElementById('tts-play').classList.remove('hidden');
    document.getElementById('tts-stop').classList.add('hidden');
  });

  document.getElementById('open-science').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('docs/science.html') });
  });

  document.getElementById('open-privacy').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('docs/privacy.html') });
  });
}

/**
 * Point d'entrée.
 */
async function init() {
  const prefs = await loadPrefs();
  updateUI(prefs);
  bindEvents();
}

document.addEventListener('DOMContentLoaded', init);
