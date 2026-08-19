# CLAUDE.md — readingcomfortext

@../../PRINCIPES.md

---

## Quoi

Extension navigateur (Chrome / Firefox / Edge) qui applique des options de confort de lecture sur n'importe quel site web : polices adaptées, espacement, fond crème, texte non justifié, guides visuels et TTS. Chaque option est badgée **Sci ✓** ou **Pref** pour transparence scientifique.

- **Stack** : JavaScript vanilla + Manifest V3 + Web Speech API + `chrome.storage.sync`
- **Phase actuelle** : MVP (popup + content script + stockage)
- **URL prod** : à publier sur Chrome Web Store / Firefox Add-ons
- **Repo** : `OnyxynO/readingcomfortext` (public)

Voir [[INDEX.md]] pour la position dans le workspace.

---

## Historique

- 2026-08-19 : intégration workspace (skill `/ouroboros-integration`) depuis `_ideas/ReadingComfortExt/`
- 2026-08-19 : MVP — popup, content script, stockage sync, badges Sci ✓ / Pref, TTS et guide visuel

---

## Structure

```
readingcomfortext/
├── manifest.json        # Manifest V3
├── README.md            # Présentation publique
├── CLAUDE.md            # Ce fichier
├── .gitignore
├── popup/
│   ├── popup.html       # Panneau de configuration
│   └── popup.js         # Logique popup
├── content/
│   └── content.js       # Injection CSS + TTS + MutationObserver
├── fonts/
│   └── OpenDyslexic/    # Police embarquée (SIL-OFL) — fichiers à ajouter
├── icons/
│   └── icon.svg         # Icône de l'extension
└── docs/
    ├── science.md       # Références bibliographiques (source)
    └── science.html     # Page affichable depuis le popup
```

---

## Commandes

```bash
# Test local dans Chrome
# 1. Ouvrir chrome://extensions/
# 2. Activer le mode développeur
# 3. "Charger l'extension non empaquetée" → sélectionner ce dossier

# Validation du manifest (à compléter quand un linter sera ajouté)
```

---

## Conventions

- **Langue** : français pour la doc et les commentaires ; l'extension elle-même peut être multilingue plus tard.
- **Simplicité** : pas de framework, pas de bundler tant que le Manifest V3 le permet.
- **Accessibilité d'abord** : le popup doit être navigable au clavier et compatible lecteurs d'écran.
- **Transparence scientifique** : chaque option badgée Sci ✓ doit pointer vers au moins une référence dans `docs/science.md`.
- **Vie privée** : aucune donnée utilisateur ne quitte le navigateur.

---

## Pièges connus

- **Scope CSS** : éviter `*` et `body` pour ne pas casser les interfaces fonctionnelles (boutons, formulaires, tableaux de bord). Cibler les zones de texte (articles, paragraphes).
- **Sites dynamiques (SPA)** : les styles peuvent disparaître après navigation. Prévoir un `MutationObserver` avec throttle/debounce, ou un mode d'activation manuelle.
- **Polices et licences** : OpenDyslexic est sous SIL-OFL. Les mentions de copyright doivent rester dans les fichiers de police. Lexend et Atkinson Hyperlegible sont libres via Google Fonts.
- **TTS** : la Web Speech API dépend des voix installées sur l'OS. La qualité varie énormément. Ne pas en faire la killer feature.
- **Permissions stores** : le Chrome Web Store demande une privacy policy dès qu'une extension interagit avec les pages web.
- **TTS et iframes** : la Web Speech API lit le texte depuis le contexte du content script. Le contenu dans les iframes cross-origin n'est pas accessible.
- **Guide visuel MVP** : la version actuelle utilise un `repeating-linear-gradient` horizontal. Ce n'est pas encore le gradient cosinus caractère par caractère de Korben, mais c'est un premier repère visuel.

---

## Roadmap

1. ✅ Manifest V3 minimal + popup + content script
2. ✅ Injection CSS : polices, espacement, fond crème, texte non justifié
3. ✅ Stockage des préférences avec `chrome.storage.sync`
4. ✅ Guides visuels (lignes colorées — MVP avec repeating-gradient)
5. ✅ TTS via Web Speech API
6. ✅ Page `docs/science.md` / `docs/science.html` et badges Sci ✓ / Pref
7. ⏳ Tests sur un panel de sites représentatifs
8. ⏳ Embarquer OpenDyslexic en local (supprimer le CDN jsDelivr)
9. ⏳ Ajouter une privacy policy pour les stores
10. ⏳ Publication Chrome Web Store + Firefox Add-ons

---

## Sources

- Proposition initiale : [[_ideas/ReadingComfortExt/PROPOSITION.md]]
- Étude de faisabilité : [[_ideas/ReadingComfortExt/ETUDE_FAISABILITE.md]]
- Inspiration : [Korben — confort de lecture et dyslexie](https://korben.info/accessibilite-confort-lecture-dyslexie.html)
- OpenDyslexic : [opendyslexic.org](https://opendyslexic.org) (SIL-OFL)
