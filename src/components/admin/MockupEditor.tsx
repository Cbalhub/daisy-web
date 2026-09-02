"use client";

import { useState } from "react";
import { AdminSelect } from "@/components/admin/ui/Select";
import {
  parseChatText,
  chatToText,
  type MockupConfig,
  type MockupPlatform,
  type MockupScene,
} from "@/lib/mockup";

const inputCls =
  "w-full rounded-lg border border-admin-border bg-admin-content px-3 py-2 text-sm outline-none focus:border-admin-blue";

type SceneDraft = { text: string; buttons: string; caption: string };

function toDrafts(cfg: MockupConfig | null) {
  if (!cfg) return null;
  return {
    platform: cfg.platform,
    name: cfg.name,
    scenes: cfg.scenes.map(
      (s): SceneDraft => ({
        text: cfg.platform === "program" ? (s.logs ?? []).join("\n") : chatToText(s.chat),
        buttons: (s.buttons ?? []).join(", "),
        caption: s.caption ?? "",
      })
    ),
  };
}

function toConfig(
  platform: MockupPlatform,
  name: string,
  scenes: SceneDraft[]
): MockupConfig | null {
  if (!name.trim()) return null;
  const built = scenes
    .map((s): MockupScene => {
      const scene: MockupScene = {};
      if (platform === "program") {
        const logs = s.text.split("\n").map((l) => l.trim()).filter(Boolean);
        if (logs.length) scene.logs = logs;
      } else {
        const chat = parseChatText(s.text);
        if (chat.length) scene.chat = chat;
      }
      if (platform === "telegram") {
        const btns = s.buttons.split(",").map((b) => b.trim()).filter(Boolean);
        if (btns.length) scene.buttons = btns;
      }
      if (s.caption.trim()) scene.caption = s.caption.trim();
      return scene;
    })
    .filter((s) => s.chat?.length || s.buttons?.length || s.logs?.length)
    .slice(0, 4);
  if (built.length === 0) return null;
  return { platform, name: name.trim(), scenes: built };
}

const EMPTY_SCENE: SceneDraft = { text: "", buttons: "", caption: "" };

export function MockupEditor({
  value,
  onChange,
}: {
  value: MockupConfig | null;
  onChange: (c: MockupConfig | null) => void;
}) {
  const init = () => toDrafts(value);
  const [on, setOn] = useState(Boolean(value));
  const [platform, setPlatform] = useState<MockupPlatform>(init()?.platform ?? "telegram");
  const [name, setName] = useState(init()?.name ?? "");
  const [scenes, setScenes] = useState<SceneDraft[]>(init()?.scenes ?? [EMPTY_SCENE]);

  function emit(next: {
    on?: boolean;
    platform?: MockupPlatform;
    name?: string;
    scenes?: SceneDraft[];
  }) {
    const nOn = next.on ?? on;
    const nP = next.platform ?? platform;
    const nN = next.name ?? name;
    const nS = next.scenes ?? scenes;
    onChange(nOn ? toConfig(nP, nN, nS) : null);
  }

  function setSceneField(i: number, field: keyof SceneDraft, v: string) {
    const nS = scenes.map((s, idx) => (idx === i ? { ...s, [field]: v } : s));
    setScenes(nS);
    emit({ scenes: nS });
  }

  const isProgram = platform === "program";
  const chatHint = "유저: /start\n봇: 안녕하세요, 인증을 시작합니다.\n유저: Steve_Kim\n봇: ✅ 인증 완료";
  const logHint = "09:00  네이버 스토어 주문 12건 수집\n09:00  구글시트 반영 · 재고 3건 부족 알림\n09:01  슬랙 #발주 채널로 요약 전송";

  return (
    <div className="rounded-lg border border-admin-border bg-admin-surface p-4">
      <label className="flex items-center gap-2 text-sm font-medium text-admin-text">
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => {
            setOn(e.target.checked);
            emit({ on: e.target.checked });
          }}
        />
        이 항목에 직접 만든 목업 화면 사용
      </label>
      <p className="mt-1 text-xs text-admin-muted">
        끄면 슬러그·기능 태그 기반 기본 목업이 나옵니다. 이미지를 올린 항목은 이미지가 우선입니다.
      </p>

      {on && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="text-xs font-medium text-admin-muted">
              플랫폼
              <AdminSelect
                name="mockupPlatform"
                defaultValue={platform}
                onChange={(v) => {
                  setPlatform(v as MockupPlatform);
                  emit({ platform: v as MockupPlatform });
                }}
                options={[
                  { value: "telegram", label: "텔레그램" },
                  { value: "discord", label: "디스코드" },
                  { value: "program", label: "프로그램" },
                ]}
              />
            </div>
            <label className="text-xs font-medium text-admin-muted">
              {isProgram ? "프로그램 제목" : "봇 이름 / 채널명"}
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  emit({ name: e.target.value });
                }}
                maxLength={50}
                placeholder={isProgram ? "예: 주문 자동 수집" : "예: 마크 인증봇"}
                className={`mt-1.5 ${inputCls}`}
              />
            </label>
          </div>

          {scenes.map((s, i) => (
            <div key={i} className="rounded-lg border border-admin-border/60 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-admin-text">화면 {i + 1}</span>
                {scenes.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const nS = scenes.filter((_, idx) => idx !== i);
                      setScenes(nS);
                      emit({ scenes: nS });
                    }}
                    className="text-xs text-admin-muted hover:text-admin-red"
                  >
                    삭제
                  </button>
                )}
              </div>
              <textarea
                value={s.text}
                onChange={(e) => setSceneField(i, "text", e.target.value)}
                rows={isProgram ? 4 : 5}
                placeholder={isProgram ? logHint : chatHint}
                className={`mt-2 ${inputCls} font-mono text-[12.5px] leading-relaxed`}
              />
              <p className="mt-1 text-[11px] text-admin-muted">
                {isProgram
                  ? "한 줄에 로그 하나. 맨 앞에 시각(09:00)을 쓰면 시각/내용이 나뉩니다."
                  : "‘유저:’ 로 시작하면 사용자 메시지, 나머지는 봇 메시지."}
              </p>
              {platform === "telegram" && (
                <input
                  value={s.buttons}
                  onChange={(e) => setSceneField(i, "buttons", e.target.value)}
                  placeholder="버튼 (쉼표로 구분): 인증하기, 취소"
                  maxLength={120}
                  className={`mt-2 ${inputCls} text-[12.5px]`}
                />
              )}
            </div>
          ))}

          {scenes.length < 4 && (
            <button
              type="button"
              onClick={() => {
                const nS = [...scenes, { ...EMPTY_SCENE }];
                setScenes(nS);
                emit({ scenes: nS });
              }}
              className="rounded-lg border border-dashed border-admin-border px-3 py-2 text-xs font-medium text-admin-muted hover:border-admin-blue hover:text-admin-blue"
            >
              + 화면 추가
            </button>
          )}
        </div>
      )}
    </div>
  );
}
