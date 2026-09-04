// PC 의 keytar 에 저장된 티스토리 세션(storageState)을 JSON 파일로 뽑아냅니다.
// 이 파일을 리눅스 서버로 옮기고 .env 의 TISTORY_STATE_FILE 로 지정하면,
// 서버 퍼블리셔가 keytar 없이 그 쿠키로 발행합니다.
//
//   node export-tistory-state.mjs [host] [outFile]
//   기본: movd.tistory.com  ->  movd-tistory-state.json

import { writeFileSync } from "node:fs";
import keytar from "keytar";

const SERVICE = "tistory-mcp";
const host = process.argv[2] || "movd.tistory.com";
const out = process.argv[3] || "movd-tistory-state.json";

async function getChunked(account) {
  const head = await keytar.getPassword(SERVICE, account);
  if (!head) return null;
  let manifest = null;
  try {
    const v = JSON.parse(head);
    if (v && v.v === 1 && typeof v.chunks === "number") manifest = v;
  } catch {}
  if (!manifest) return head; // 구버전 raw
  const parts = [];
  for (let i = 0; i < manifest.chunks; i++) {
    const p = await keytar.getPassword(SERVICE, `${account}#${i}`);
    if (p == null) throw new Error(`청크 ${i} 손실`);
    parts.push(p);
  }
  return parts.join("");
}

for (const account of [host, "default"]) {
  const json = await getChunked(account);
  if (json) {
    JSON.parse(json); // 유효성 확인
    writeFileSync(out, json);
    console.log(`저장: ${out}  (account="${account}", ${json.length} bytes)`);
    process.exit(0);
  }
}
console.error(`keytar 에 "${host}" / "default" 세션이 없습니다. 먼저 tistory-login.bat 을 실행하세요.`);
process.exit(1);
