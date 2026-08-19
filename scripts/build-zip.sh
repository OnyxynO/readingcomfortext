#!/usr/bin/env bash
# Crée un archive ZIP propre de l'extension pour les stores.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BUILD_DIR="${ROOT_DIR}/dist"
ZIP_FILE="${BUILD_DIR}/readingcomfortext.zip"

mkdir -p "${BUILD_DIR}"
rm -f "${ZIP_FILE}"

# Fichiers et dossiers à inclure dans l'archive.
zip -r "${ZIP_FILE}" \
  manifest.json \
  README.md \
  CLAUDE.md \
  background \
  popup \
  content \
  fonts \
  icons \
  docs \
  -x "*.DS_Store" \
  -x "*/.git*"

echo "Archive créée : ${ZIP_FILE}"
unzip -l "${ZIP_FILE}"
