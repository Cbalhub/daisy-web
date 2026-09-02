# 배포 (VPS)

무중단 배포. 서버의 `/opt/deploy.sh` 가 이 파일이고, `/opt/movd` 는
`/opt/releases/<timestamp>/` 를 가리키는 심링크입니다.

## 배포 순서

```bash
# 로컬
git archive --format=tar.gz -o /tmp/movd-app.tar.gz redesign/movd-sage
scp /tmp/movd-app.tar.gz ubuntu@<서버>:/tmp/movd-app.tar.gz

# 서버 (연결 끊겨도 살아남게 transient unit 으로 — --no-block 필수, 없으면 호출이 빌드 내내 블록)
sudo systemctl reset-failed movd-deploy 2>/dev/null
sudo systemd-run --unit=movd-deploy --collect --no-block \
  -p Type=oneshot -p User=ubuntu -p TimeoutStartSec=1200 \
  bash /opt/deploy.sh /tmp/movd-app.tar.gz
# 진행상황
sudo journalctl -u movd-deploy -f
# 끝났는지: systemctl is-active movd-deploy  (inactive = 완료), systemctl show movd-deploy -p Result
```

deploy.sh 가 하는 일: 새 릴리스를 별도 디렉터리에 풀어 그 안에서 `npm ci` +
`prisma db push`(추가형 스키마만) + `next build` → 심링크 원자 교체 →
`systemctl restart movd` → 200 확인, 실패 시 이전 릴리스로 롤백. 최근 4개 릴리스 보관.

## 초기 셋업 (한 번)

Node 22, PostgreSQL 17, nginx, certbot, `/opt/movd` 심링크 구조, `movd.service`
(systemd, `KillMode=mixed`), crontab(daily-report·sweep-uploads), nginx
`cloudflare-realip.conf`. 자세한 건 project_deploy 메모리 참고.
