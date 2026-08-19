# Politique de confidentialité — ReadingComfortExt

Dernière mise à jour : 2026-08-19

## Données collectées

**ReadingComfortExt ne collecte aucune donnée personnelle.**

L'extension fonctionne entièrement dans votre navigateur. Vos préférences de confort de lecture (police, espacement, fond, etc.) sont stockées localement par le navigateur via `chrome.storage.sync`. Ces données :

- ne quittent jamais votre appareil ;
- ne sont transmises à aucun serveur ;
- ne sont utilisées à aucune fin publicitaire ou analytique.

## Permissions demandées

L'extension demande les permissions suivantes pour fonctionner :

- **`storage`** : pour mémoriser vos préférences localement.
- **`activeTab`** : pour appliquer les styles sur l'onglet actuellement consulté.
- **`scripting`** : pour injecter les styles CSS dans les pages web.
- **`<all_urls>`** : pour que vous puissiez activer le confort de lecture sur n'importe quel site.

Aucune de ces permissions n'est utilisée pour lire le contenu de vos pages à des fins tierces.

## Services tiers

La police **OpenDyslexic** est embarquée localement dans l'extension.

Les polices **Lexend** et **Atkinson Hyperlegible** sont chargées depuis **Google Fonts** lorsque vous les sélectionnez. Ce chargement est effectué directement par votre navigateur : l'extension elle-même n'envoie aucune donnée à Google, mais le navigateur peut transmettre l'URL de la page consultée (referer) et votre adresse IP à Google Fonts, comme pour tout chargement de ressource externe. Si vous souhaitez éviter cela, choisissez la police « Police du site (défaut) » ou « OpenDyslexic ».

À part ce chargement de polices, l'extension n'utilise aucun autre service externe et ne collecte aucune donnée.

## Modifications

Cette politique peut être mise à jour si de nouvelles fonctionnalités nécessitent un traitement différent. Toute modification sera reflétée dans cette page et dans l'extension.

## Contact

Pour toute question relative à cette politique, ouvrez une issue sur le dépôt public : https://github.com/OnyxynO/readingcomfortext/issues
