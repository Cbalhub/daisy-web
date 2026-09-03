#!/usr/bin/env bash
# MOVD PostgreSQL 일일 백업.
#   - /opt/backups/movd-YYYYMMDD-HHMM.sql.gz 로 덤프
#   - 14개(약 2주)만 보관, 오래된 것 삭제
#   - (선택) R2_BUCKET 등이 설정돼 있으면 Cloudflare R2 로도 업로드
#
# 설치: 이 파일을 VPS /opt/pg-backup.sh 로 두고 실행권한 부여, crontab 에:
#   20 3 * * * /opt/pg-backup.sh >> /var/log/movd-backup.log 2>&1   (03:20 UTC = 한국시간 12:20)
set -euo pipefail

DIR=/opt/backups
KEEP=14
DB=movd
TS="$(date +%Y%m%d-%H%M)"
FILE="$DIR/movd-$TS.sql.gz"

mkdir -p "$DIR"
# peer 인증 — 스크립트에 비밀번호를 두지 않습니다.
sudo -u postgres pg_dump "$DB" | gzip > "$FILE"
echo "$(date -Is) 백업 완료: $FILE ($(du -h "$FILE" | cut -f1))"

# 로테이션
ls -1t "$DIR"/movd-*.sql.gz 2>/dev/null | tail -n +$((KEEP + 1)) | xargs -r rm -f

# 원격 보관 (선택) — /opt/movd/.env 에 R2 설정이 있으면 rclone 으로 업로드.
# 준비: rclone 설치 후 `rclone config` 로 "r2" 리모트 생성(S3 호환, Cloudflare R2).
#   .env 에  R2_REMOTE="r2:movd-backups"  한 줄만 추가하면 아래가 동작합니다.
R2_REMOTE="$(grep -oE '^R2_REMOTE=.*' /opt/movd/.env 2>/dev/null | cut -d= -f2- | tr -d '"' || true)"
if [ -n "${R2_REMOTE:-}" ] && command -v rclone >/dev/null; then
  rclone copy "$FILE" "$R2_REMOTE" && echo "$(date -Is) R2 업로드: $R2_REMOTE"
fi
