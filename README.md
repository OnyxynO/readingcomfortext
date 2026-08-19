# ReadingComfortExt

Extension navigateur open source de confort de lecture pour tout le web — polices adaptées, espacement, fond crème, TTS et badge scientifique.

🔗 **Chrome Web Store** : *en cours de soumission*  
🔗 **Firefox Add-ons** : *en cours de soumission*  
🐙 **Code source** : https://github.com/OnyxynO/readingcomfortext

## Fonctionnalités

- **Polices adaptées** : Lexend, Atkinson Hyperlegible, OpenDyslexic
- **Espacement réglable** : espacement des lettres, hauteur de ligne, largeur max du texte
- **Fond crème** et **texte non justifié**
- **Guide visuel** : lignes colorées
- **Lecture audio** (TTS) via la Web Speech API native
- **Badge scientifique** : chaque option indique si elle est **Sci ✓** (soutenue par la recherche) ou **Pref** (préférence subjective)
- **Aucune donnée personnelle collectée** : les préférences restent dans votre navigateur. OpenDyslexic est embarquée localement. Lexend et Atkinson Hyperlegible sont chargées depuis Google Fonts uniquement si vous les choisissez.

## Stack

- JavaScript vanilla
- Manifest V3 (cible : Firefox ; compatible Chrome/Edge en mode développeur)
- Web Speech API native
- `chrome.storage.sync` pour la persistance des préférences
- Polices : Lexend, Atkinson Hyperlegible (Google Fonts), OpenDyslexic (embarquée, SIL-OFL)

## Installation en mode développeur

1. Télécharger ou cloner ce dépôt.
2. Ouvrir Chrome → `chrome://extensions/`.
3. Activer le **mode développeur**.
4. Cliquer sur **"Charger l'extension non empaquetée"**.
5. Sélectionner le dossier `readingcomfortext/`.

## Tests

```bash
# Installer les dépendances
bun install

# Installer Chromium pour Playwright
bunx playwright install chromium

# Lancer les tests E2E visuels
bun test:e2e

# Ouvrir le rapport HTML
bun test:e2e:report
```

Les captures d'écran générées se trouvent dans `test-results/screenshots/`.

## Packaging pour Firefox Add-ons

```bash
bun run build:firefox
```

L'archive `dist/readingcomfortext-firefox.zip` est prête à être soumise à Firefox Add-ons. Elle utilise `manifest.firefox.json`, qui ne contient pas `background.service_worker` et retire la permission `scripting` non utilisée.

## Publication

### Firefox Add-ons

1. Se connecter sur https://addons.mozilla.org/developers/.
2. Soumettre `dist/readingcomfortext-firefox.zip` via le Developer Hub.
3. Renseigner :
   - Privacy policy : `docs/privacy.html` (ou l'URL hébergée une fois publiée)
   - Description, captures d'écran, icône promotionnelle
4. Soumettre pour validation.

## Licences

- Code de l'extension : voir le fichier `LICENSE` du dépôt.
- Police OpenDyslexic : [SIL Open Font License 1.1](https://opendyslexic.org/)
- Polices Lexend et Atkinson Hyperlegible : libres via Google Fonts

## Confidentialité

ReadingComfortExt ne collecte aucune donnée personnelle. Voir [docs/privacy.md](docs/privacy.md).

## Historique

- 2026-08-19 : projet créé et intégré au workspace ouroboros, repo public OnyxynO/readingcomfortext
- 2026-08-19 : MVP — popup, content script, stockage sync, TTS, guide visuel et badges Sci ✓ / Pref
