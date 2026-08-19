/**
 * Logique du popup ReadingComfortExt.
 * Charge les préférences, les sauvegarde et les applique à l'onglet actif.
 */

// Valeurs par défaut des préférences.
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
 * Récupère l'onglet actif.
 * @returns {Promise<chrome.tabs.Tab>}
 */
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/**
 * Envoie un message au content script de l'onglet actif.
 * @param {object} message
 */
async function sendToContent(message) {
  try {
    const tab = await getActiveTab();
    if (!tab?.id) return;
    await chrome.tabs.sendMessage(tab.id, message);
  } catch (error) {
    // Le content script n'est peut-être pas injecté sur cette page.
    console.warn('[ReadingComfortExt] Impossible de contacter le content script :', error.message);
  }
}

/**
 * Charge les préférences depuis le stockage sync.
 * @returns {Promise<object>}
 */
async function loadPrefs() {
  const stored = await chrome.storage.sync.get(DEFAULT_PREFS);
  return { ...DEFAULT_PREFS, ...stored };
}

/**
 * Sauvegarde une préfération et notifie le content script.
 * @param {string} key
 * @param {any} value
 */
async function savePref(key, value) {
  await chrome.storage.sync.set({ [key]: value });
  await sendToContent({ action: 'apply', prefs: await loadPrefs() });
}

/**
 * Met à jour l'interface avec les préférences chargées.
 * @param {object} prefs
 */
function updateUI(prefs) {
  document.getElementById('enabled').checked = prefs.enabled;

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
  document.getElementById('enabled').addEventListener('change', (e) => savePref('enabled', e.target.checked));

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
    await chrome.storage.sync.set(DEFAULT_PREFS);
    updateUI(DEFAULT_PREFS);
    await sendToContent({ action: 'apply', prefs: DEFAULT_PREFS });
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
