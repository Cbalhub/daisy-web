// tistory-mcp 패치 — 리눅스 서버(키링 없음)에서 돌리려고,
// storageState 를 keytar 대신 TISTORY_STATE_FILE(JSON 파일)에서 읽게 만듭니다.
// npm install 후, 그리고 배포 스크립트에서 한 번 실행하세요. 이미 패치돼 있으면 넘어갑니다.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const target = join(here, "node_modules", "tistory-mcp", "dist", "tistory", "browser.js");

let src = readFileSync(target, "utf8");
const MARK = "/*MOVD_STATE_FILE_PATCH*/";
if (src.includes(MARK)) {
  console.log("이미 패치됨:", target);
  process.exit(0);
}

const needle = "const json = await getChunked(account);";
if (!src.includes(needle)) {
  console.error("패치 지점을 찾지 못했습니다. tistory-mcp 버전이 바뀌었을 수 있습니다:", target);
  process.exit(1);
}

// 1) 최상단에 fs import 추가 (ESM)
src = 'import { readFileSync as __movdReadFile } from "node:fs";\n' + src;

// 2) keytar 대신 파일에서 읽기
const replacement =
  MARK +
  " const json = process.env.TISTORY_STATE_FILE " +
  '? __movdReadFile(process.env.TISTORY_STATE_FILE, "utf8") ' +
  ": await getChunked(account);";
src = src.replace(needle, replacement);

writeFileSync(target, src);
console.log("패치 완료:", target);
