/**
 * Service worker ReadingComfortExt.
 * Actuellement utilisé pour l'enregistrement de l'extension ; peut servir de relais de messages plus tard.
 */

chrome.runtime.onInstalled.addListener(() => {
  console.log('[ReadingComfortExt] Extension installée.');
});
