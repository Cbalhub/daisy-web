// MOVD 블로그 발행 퍼블리셔 (로컬 실행 전용)
//
// 흐름: movd.co.kr 의 발행 대기열(GET /api/publish/queue)을 폴링 → QUEUED 초안을
// 플랫폼별 MCP 서버로 게시 → 결과 URL 을 POST /api/publish/result 로 회신.
//
// 이 스크립트는 LLM 을 호출하지 않습니다. MCP 서버(Playwright 브라우저 자동화)를
// 프로그래밍 방식으로 직접 구동할 뿐이라 Claude/Gemini 사용량과 무관합니다.
//
// 네이버는 데이터센터 IP 로그인을 차단하므로 반드시 가정용 인터넷에 물린 PC 에서
// 돌려야 합니다. 티스토리는 서버에서도 대체로 동작합니다.

import "dotenv/config";
import { setTimeout as sleep } from "node:timers/promises";
import { appendFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const MOVD_API = (process.env.MOVD_API || "https://movd.co.kr").replace(/\/$/, "");
const SECRET = process.env.PUBLISHER_SECRET || "";
const POLL_MS = Number(process.env.POLL_INTERVAL_MS || 5 * 60 * 1000);
const ONCE = process.argv.includes("--once");

// MCP 실행 명령 — 공백으로 쪼개 argv 로. 예:
//   NAVER_MCP_CMD="uv --directory C:/dev/naver-blog-mcp run naver-blog-mcp"
//   TISTORY_MCP_CMD="npx -y kim-se-hee-tistory-mcp"
const NAVER_MCP_CMD = process.env.NAVER_MCP_CMD || "";
const TISTORY_MCP_CMD = process.env.TISTORY_MCP_CMD || "";

// 플랫폼별 "글 생성" 툴 이름 후보 — MCP 서버 버전에 따라 다를 수 있어 tools/list 로
// 실제 존재하는 것을 고릅니다. 필요하면 여기에 추가하세요.
const CREATE_TOOL_CANDIDATES = {
  NAVER: ["naver_blog_create_post", "create_post", "write_post"],
  TISTORY: ["tistory_publish_post", "tistory_write_post", "publish_post", "create_post"],
};

function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(" ")}`;
  console.log(line);
  try {
    appendFileSync(new URL("./run.log", import.meta.url), line + "\n");
  } catch {}
}

function requireEnv() {
  if (!SECRET) {
    log("ERROR: PUBLISHER_SECRET 가 .env 에 없습니다.");
    process.exit(1);
  }
}

async function fetchQueue() {
  const res = await fetch(`${MOVD_API}/api/publish/queue`, {
    headers: { authorization: `Bearer ${SECRET}` },
  });
  if (res.status === 404) {
    log("서버에서 퍼블리셔 기능이 꺼져 있습니다(PUBLISHER_SECRET 미설정). 대기.");
    return [];
  }
  if (!res.ok) {
    log(`queue 조회 실패: HTTP ${res.status}`);
    return [];
  }
  const body = await res.json();
  return Array.isArray(body.jobs) ? body.jobs : [];
}

async function reportResult(id, platform, ok, url, error) {
  try {
    const res = await fetch(`${MOVD_API}/api/publish/result`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${SECRET}` },
      body: JSON.stringify({ id, platform, ok, url, error }),
    });
    if (!res.ok) log(`result 회신 실패: HTTP ${res.status}`);
  } catch (e) {
    log(`result 회신 예외: ${e.message}`);
  }
}

function parseCmd(cmd) {
  const parts = cmd.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((s) => s.replace(/^"|"$/g, "")) ?? [];
  return { command: parts[0], args: parts.slice(1) };
}

async function withMcp(cmd, fn) {
  const { command, args } = parseCmd(cmd);
  const transport = new StdioClientTransport({ command, args, stderr: "inherit" });
  const client = new Client({ name: "movd-blog-publisher", version: "1.0.0" });
  await client.connect(transport);
  try {
    return await fn(client);
  } finally {
    await client.close().catch(() => {});
  }
}

function pickTool(toolList, candidates) {
  const names = new Set(toolList.map((t) => t.name));
  return candidates.find((c) => names.has(c)) ?? null;
}

// MCP 툴 응답에서 URL 을 최대한 뽑아냅니다.
function extractUrl(result) {
  const text = (result?.content ?? [])
    .map((c) => (typeof c.text === "string" ? c.text : ""))
    .join("\n");
  const m = text.match(/https?:\/\/[^\s"'<>）)]+/);
  if (m) return m[0];
  if (result?.structuredContent?.url) return String(result.structuredContent.url);
  return "";
}

async function publishJob(job) {
  const cmd = job.platform === "NAVER" ? NAVER_MCP_CMD : TISTORY_MCP_CMD;
  if (!cmd) {
    await reportResult(job.id, job.platform, false, undefined, `${job.platform} MCP 명령(.env)이 설정되지 않았습니다.`);
    return;
  }

  const isNaver = job.platform === "NAVER";
  const content = isNaver ? job.bodyPlain : job.bodyMarkdown;

  log(`발행 시작: [${job.platform}] ${job.title}`);
  try {
    const url = await withMcp(cmd, async (client) => {
      const { tools } = await client.listTools();
      const toolName = pickTool(tools, CREATE_TOOL_CANDIDATES[job.platform]);
      if (!toolName) {
        throw new Error(
          `글 생성 툴을 찾지 못했습니다. 사용 가능한 툴: ${tools.map((t) => t.name).join(", ")}`
        );
      }
      const result = await client.callTool({
        name: toolName,
        arguments: {
          title: job.title,
          content,
          tags: job.tags ?? [],
          publish: true,
          visibility: "public",
        },
      });
      if (result.isError) {
        throw new Error(extractText(result) || "MCP 툴이 오류를 반환했습니다.");
      }
      return extractUrl(result);
    });

    log(`발행 완료: [${job.platform}] ${url || "(URL 회수 실패 — 수동 확인 필요)"}`);
    await reportResult(job.id, job.platform, true, url || undefined, url ? undefined : "게시는 됐으나 URL 을 못 읽었습니다. 블로그에서 확인하세요.");
  } catch (e) {
    log(`발행 실패: [${job.platform}] ${e.message}`);
    await reportResult(job.id, job.platform, false, undefined, e.message.slice(0, 900));
  }
}

function extractText(result) {
  return (result?.content ?? []).map((c) => c.text ?? "").join("\n").trim();
}

async function runOnce() {
  const jobs = await fetchQueue();
  if (jobs.length === 0) return;
  log(`대기열 ${jobs.length}건`);
  for (const job of jobs) {
    await publishJob(job);
    // 봇 탐지 완화 — 항목 사이 30~60초.
    await sleep(30000 + Math.floor(Math.random() * 30000));
  }
}

async function main() {
  requireEnv();
  log(`퍼블리셔 시작 — API ${MOVD_API}, ${ONCE ? "1회 실행" : `폴링 ${POLL_MS / 1000}s`}`);
  if (ONCE) {
    await runOnce();
    return;
  }
  for (;;) {
    try {
      await runOnce();
    } catch (e) {
      log(`루프 예외: ${e.message}`);
    }
    await sleep(POLL_MS);
  }
}

main().catch((e) => {
  log(`치명적 오류: ${e.stack || e.message}`);
  process.exit(1);
});
