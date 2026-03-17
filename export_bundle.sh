# export_bundle.sh  (FEJLESZTŐI GÉPEN fut)
# Cél: yourapp_bundle/ alatt mindent összecsomagolni, amit a Linux gépre viszünk.

set -euo pipefail

BUNDLE_DIR="yourapp_bundle"
IMAGES_TAR="${BUNDLE_DIR}/images_bundle.tar.gz"

# 1) Biztosítsuk, hogy a három image helyben meglegyen
#    (a sajátok tipikusan már megvannak, a cloudflared-et lehúzzuk és digestre rögzítjük).
echo "[*] Pull cloudflared (pinelhető digesthez)..."
docker pull cloudflare/cloudflared:latest

# (Opcionális, de ajánlott) Szerezzünk digestet és rögzítsük digest-címmel is,
# hogy a compose fájlban image@sha256:... formában hivatkozhassunk rá.
CF_DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' cloudflare/cloudflared:latest || true)
if [ -n "${CF_DIGEST}" ]; then
  echo "[*] cloudflared digest: ${CF_DIGEST}"
  # Adjunk neki egy helyi (digestes) taget is, hogy a save-listában stabil néven szerepelhessen
  docker tag "${CF_DIGEST}" cloudflare/cloudflared:pin
  CF_REF="cloudflare/cloudflared:pin"
else
  echo "[!] Nem sikerült digestet kiolvasni, marad a :latest (még így is mentjük a képet)."
  CF_REF="cloudflare/cloudflared:latest"
fi

# A saját image-eket címkézzük production taggel (ha még nem így hivatkozol rájuk):
docker tag yourapp-web       yourapp-web:prod  >/dev/null 2>&1 || true
docker tag yourapp-backend   yourapp-backend:prod  >/dev/null 2>&1 || true

# 2) Csomagkönyvtár előkészítése
rm -rf "${BUNDLE_DIR}"
mkdir -p "${BUNDLE_DIR}"

# 3) Image-ek mentése EGY tar.gz-be (web, backend, cloudflared)
echo "[*] Mentés: ${IMAGES_TAR}"
docker save yourapp-web:prod yourapp-backend:prod "${CF_REF}" | gzip > "${IMAGES_TAR}"

# 4) Compose fájlok és bind-mountolt tartalmak másolása
echo "[*] Fájlok összegyűjtése..."
cp -v docker-compose.yml docker-compose.override.yml "${BUNDLE_DIR}/"

# A bind mountok: igazítsd a saját projektstruktúrádhoz
mkdir -p "${BUNDLE_DIR}/dist" \
         "${BUNDLE_DIR}/server/src/offline/assets" \
         "${BUNDLE_DIR}/gen-certs.ps1/certs"

rsync -a dist/                           "${BUNDLE_DIR}/dist/" || true
rsync -a server/src/offline/assets/      "${BUNDLE_DIR}/server/src/offline/assets/" || true
rsync -a gen-certs.ps1/certs/            "${BUNDLE_DIR}/gen-certs.ps1/certs/" || true

# 5) Opcionális: compose fájlban pinelheted a cloudflared image-et digestre.
#    Ha szeretnéd automatikusan átírni, itt megteheted (egyszerű in-place szövegcsere példa):
if [ -n "${CF_DIGEST}" ]; then
  echo "[*] cloudflared image pin a compose.override-ban (image@sha256...)"
  # Készítsünk másolatot és írjuk át benne a sort; feltételezzük, hogy 'image: cloudflare/cloudflared:latest' szerepel.
  sed -E "s|image:\s*cloudflare/cloudflared:.*|image: ${CF_DIGEST}|" docker-compose.override.yml > "${BUNDLE_DIR}/docker-compose.override.yml"
else
  cp -v docker-compose.override.yml "${BUNDLE_DIR}/"
fi

# 6) Bootstrap script a szerverre
cat > "${BUNDLE_DIR}/bootstrap.sh" << 'EOF'
#!/usr/bin/env bash
# bootstrap.sh  (LINUX SZERVEREN fut)
# Cél: a csomagból betölteni az image-eket és elindítani a Compose-t letöltés nélkül.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "[*] Image-ek betöltése..."
sudo docker load -i "${SCRIPT_DIR}/images_bundle.tar.gz"

echo "[*] Compose indítás (pull nélkül)..."
cd "${SCRIPT_DIR}"

# Ha a docker compose támogatja a pull policy-t, a fájlokban pinelt digest + helyi image miatt így sem fog húzni.
# Biztos, ami biztos: újabb compose-okon működik a --pull never. Ha a tied nem ismeri, a parancs nélküle is menni fog,
# mert a szükséges image-ek már helyben vannak betöltve.
if docker compose up --help | grep -q -- "--pull"; then
  sudo docker compose up -d --pull never
else
  sudo docker compose up -d
fi

echo "[*] Folyamatban. Konténerek állapota:"
sudo docker compose ps

echo "[*] Logok (CTRL+C a kilépéshez):"
sudo docker compose logs -f --tail=50
EOF

chmod +x "${BUNDLE_DIR}/bootstrap.sh"

echo
echo "[OK] Kész a telepíthető csomag: ${BUNDLE_DIR}"
echo "     Másold fel a Linux gépre (pl. /opt/yourapp), majd ott futtasd:  sudo bash bootstrap.sh"