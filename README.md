# ReadingComfortExt

Extension navigateur open source de confort de lecture pour tout le web — polices adaptées, espacement, fond crème, TTS et badge scientifique.

URL prod cible : Chrome Web Store + Firefox Add-ons (à venir)

## Stack

- JavaScript vanilla
- Manifest V3 (Chrome / Edge / Firefox)
- Web Speech API native
- `chrome.storage.sync` pour la persistance des préférences
- Polices : Lexend, Atkinson Hyperlegible (Google Fonts), OpenDyslexic (SIL-OFL)

## Objectifs

- Rendre n'importe quel site web plus lisible pour les personnes dyslexiques, malvoyantes ou en fatigue visuelle.
- Chaque option affiche un badge **Sci ✓** (soutenue par la recherche) ou **Pref** (préférence subjective documentée).
- Zéro service tiers, zéro tracking.

## Commandes

```bash
# Charger l'extension en mode développeur dans Chrome
# 1. Ouvrir chrome://extensions/
# 2. Activer le mode développeur
# 3. Cliquer sur "Charger l'extension non empaquetée"
# 4. Sélectionner ce dossier
```

## Historique

- 2026-08-19 : projet créé et intégré au workspace ouroboros, repo public OnyxynO/readingcomfortext
