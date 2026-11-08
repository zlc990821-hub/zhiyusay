#!/usr/bin/env bash
# Download open-source fonts (SIL OFL) from npm (@fontsource) into engine/fonts/.
# Only the weights we use are kept. Safe to re-run.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/engine/fonts"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$DEST"

fetch() { # pkg dir weights...
  local pkg="$1" dir="$2"; shift 2
  if [ -f "$DEST/$dir/.done" ]; then echo "✓ $dir"; return; fi
  echo "↓ $pkg"
  (cd "$TMP" && npm pack --silent "$pkg" >/dev/null)
  local tgz; tgz="$(ls "$TMP"/*.tgz | head -1)"
  mkdir -p "$TMP/x" && tar xzf "$tgz" -C "$TMP/x"
  rm -rf "$DEST/$dir"; mkdir -p "$DEST/$dir/files"
  for w in "$@"; do
    # w like 700 or 400-italic
    cp "$TMP/x/package/$w.css" "$DEST/$dir/$w.css"
    local style=normal wt="$w"
    if [[ "$w" == *-italic ]]; then style=italic; wt="${w%-italic}"; fi
    cp "$TMP/x/package/files/"*"-$wt-$style.woff2" "$DEST/$dir/files/"
    # keep only woff2 references
    sed -i -E 's#, url\([^)]*\.woff\) format\(.woff.\)##g' "$DEST/$dir/$w.css"
  done
  cp "$TMP/x/package/LICENSE" "$DEST/$dir/LICENSE" 2>/dev/null || true
  touch "$DEST/$dir/.done"
  rm -rf "$TMP/x" "$tgz"
}

fetch @fontsource/noto-sans-sc   noto-sans-sc   400 500 700 900
fetch @fontsource/noto-serif-sc  noto-serif-sc  500 700 900
fetch @fontsource/eb-garamond    eb-garamond    400 400-italic 500-italic
fetch @fontsource/lxgw-wenkai    lxgw-wenkai    500 700
du -sh "$DEST"
