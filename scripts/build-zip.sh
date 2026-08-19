#!/usr/bin/env bash
# Crée une archive ZIP propre de l'extension pour Firefox Add-ons.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="${ROOT_DIR}/dist"
TMP_DIR="$(mktemp -d)"
ZIP_FILE="${BUILD_DIR}/readingcomfortext-firefox.zip"

mkdir -p "${BUILD_DIR}"
rm -f "${ZIP_FILE}"

# Copie les fichiers nécessaires dans un répertoire temporaire.
mkdir -p "${TMP_DIR}/readingcomfortext"
cp -r "${ROOT_DIR}/background" "${TMP_DIR}/readingcomfortext/"
cp -r "${ROOT_DIR}/popup" "${TMP_DIR}/readingcomfortext/"
cp -r "${ROOT_DIR}/content" "${TMP_DIR}/readingcomfortext/"
cp -r "${ROOT_DIR}/shared" "${TMP_DIR}/readingcomfortext/"
cp -r "${ROOT_DIR}/fonts" "${TMP_DIR}/readingcomfortext/"
cp -r "${ROOT_DIR}/icons" "${TMP_DIR}/readingcomfortext/"
cp -r "${ROOT_DIR}/docs" "${TMP_DIR}/readingcomfortext/"
cp "${ROOT_DIR}/README.md" "${TMP_DIR}/readingcomfortext/"
cp "${ROOT_DIR}/LICENSE" "${TMP_DIR}/readingcomfortext/"

# Utilise le manifest dédié Firefox.
cp "${ROOT_DIR}/manifest.firefox.json" "${TMP_DIR}/readingcomfortext/manifest.json"

# Nettoie les fichiers inutiles ou internes.
find "${TMP_DIR}/readingcomfortext" -name '.DS_Store' -delete
find "${TMP_DIR}/readingcomfortext/fonts" -name '*.md' -delete

# Crée l'archive depuis le répertoire temporaire (fichiers à la racine, pas de dossier parent).
cd "${TMP_DIR}/readingcomfortext"
zip -r "${ZIP_FILE}" . \
  -x "*/.git*" \
  -x "*/node_modules*" \

rm -rf "${TMP_DIR}"

echo "Archive créée : ${ZIP_FILE}"
unzip -l "${ZIP_FILE}"
