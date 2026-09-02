#!/usr/bin/env bash
# MOVD 무중단 배포.
#   - 새 릴리스를 /opt/releases/<ts>/ 에 풀어 그 안에서 npm ci + build (구버전은 그대로 서빙)
#   - 끝나면 /opt/movd 심링크만 원자적으로 교체하고 restart (systemd 재시작 ~0.1s)
#   - 새 버전이 200 을 안 주면 이전 릴리스로 자동 롤백
# 사용: bash /opt/deploy.sh [/tmp/movd-app.tar.gz]
set -euo pipefail

TARBALL="${1:-/tmp/movd-app.tar.gz}"
RELEASES=/opt/releases
CURRENT=/opt/movd
TS="$(date +%Y%m%d-%H%M%S)"
NEW="$RELEASES/$TS"
PREV="$(readlink -f "$CURRENT" || true)"

[ -f "$TARBALL" ] || { echo "!! tarball 없음: $TARBALL"; exit 1; }

echo "==> 새 릴리스 $NEW"
mkdir -p "$NEW"
tar xzf "$TARBALL" -C "$NEW"
cp "$CURRENT/.env" "$NEW/.env"
chmod 600 "$NEW/.env"   # 시크릿 — 릴리스 디렉터리마다 소유자만 읽기

cd "$NEW"
echo "==> npm ci"
npm ci --no-audit --no-fund
echo "==> prisma generate + db push (추가형 스키마만)"
npx prisma generate
npx prisma db push
echo "==> next build"
NODE_OPTIONS="--max-old-space-size=3072" npm run build

echo "==> 심링크 교체 + restart"
sudo ln -sfn "$NEW" "$CURRENT"   # /opt 는 root 소유
sudo systemctl restart movd
sleep 4

if curl -sf -o /dev/null http://127.0.0.1:3000/; then
  echo "==> OK — $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/)"
else
  echo "!! 새 릴리스 응답 없음 — 롤백: $PREV"
  sudo ln -sfn "$PREV" "$CURRENT"
  sudo systemctl restart movd
  exit 1
fi

# 최근 4개만 보관
ls -1dt "$RELEASES"/*/ 2>/dev/null | tail -n +5 | xargs -r rm -rf
echo "==> 배포 완료: $TS"
