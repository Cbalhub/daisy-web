#!/usr/bin/env bash
# MOVD 일일 백업 — DB 덤프 + .env(암호화 키 등) 를 한 아카이브로.
#   - /opt/backups/movd-YYYYMMDD-HHMM.tar.gz(.gpg) 생성
#   - 14개(약 2주)만 보관
#   - (선택) .env 에 BACKUP_PASSPHRASE 가 있으면 gpg 대칭키로 암호화
#   - (선택) .env 에 R2_REMOTE 가 있으면 Cloudflare R2 로 업로드(오프사이트)
#
# 왜 .env 를 같이? DB 만 백업하면 FIELD_ENCRYPTION_KEY 가 없어 복구해도 고객
# 개인정보(AES-256-GCM)를 못 푼다. 키가 백업과 함께 이동해야 진짜 복구가 됩니다.
#
# 설치: 이 파일을 VPS /opt/pg-backup.sh 로, crontab:
#   20 3 * * * /opt/pg-backup.sh >> /var/log/movd-backup.log 2>&1   (03:20 UTC = KST 12:20)
#
# 복구: gpg -d movd-....tar.gz.gpg > x.tar.gz  (BACKUP_PASSPHRASE 필요, 1Password 등에 보관)
#       tar xzf x.tar.gz → dump.sql.gz 복원 + .env 배치
set -euo pipefail

DIR=/opt/backups
KEEP=14
DB=movd
ENV_FILE=/opt/movd/.env
TS="$(date +%Y%m%d-%H%M)"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

mkdir -p "$DIR"

# 1) DB 덤프 (peer 인증 — 스크립트에 비밀번호 없음)
sudo -u postgres pg_dump "$DB" | gzip > "$WORK/dump.sql.gz"

# 2) .env 동봉 (있으면)
[ -f "$ENV_FILE" ] && cp "$ENV_FILE" "$WORK/env"

# 3) 아카이브
ARCHIVE="$DIR/movd-$TS.tar.gz"
tar czf "$ARCHIVE" -C "$WORK" .
chmod 600 "$ARCHIVE"

# 4) 암호화 (BACKUP_PASSPHRASE 가 .env 에 있으면)
PASS="$(grep -oE '^BACKUP_PASSPHRASE=.*' "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' || true)"
if [ -n "${PASS:-}" ] && command -v gpg >/dev/null; then
  gpg --batch --yes --passphrase "$PASS" -c -o "$ARCHIVE.gpg" "$ARCHIVE"
  rm -f "$ARCHIVE"
  ARCHIVE="$ARCHIVE.gpg"
  chmod 600 "$ARCHIVE"
else
  echo "$(date -Is) 경고: BACKUP_PASSPHRASE 미설정 — 아카이브에 .env 가 평문으로 들어갑니다."
fi
echo "$(date -Is) 백업 완료: $ARCHIVE ($(du -h "$ARCHIVE" | cut -f1))"

# 5) 로테이션
ls -1t "$DIR"/movd-*.tar.gz "$DIR"/movd-*.tar.gz.gpg "$DIR"/movd-*.sql.gz 2>/dev/null \
  | tail -n +$((KEEP + 1)) | xargs -r rm -f

# 6) 오프사이트 (선택) — rclone 설치 + `rclone config` 로 리모트 생성 후
#    .env 에  R2_REMOTE="r2:movd-backups"  한 줄.
R2_REMOTE="$(grep -oE '^R2_REMOTE=.*' "$ENV_FILE" 2>/dev/null | cut -d= -f2- | tr -d '"' || true)"
if [ -n "${R2_REMOTE:-}" ] && command -v rclone >/dev/null; then
  rclone copy "$ARCHIVE" "$R2_REMOTE" && echo "$(date -Is) R2 업로드: $R2_REMOTE"
fi
