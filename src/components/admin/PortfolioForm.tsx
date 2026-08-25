"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AdminCard } from "@/components/admin/ui/Card";
import { useToast } from "@/components/ui/Toast";

type Initial = {
  id?: string;
  title: string;
  slug: string;
  category: string;
  summary: string;
  body: string;
  tags: string[];
  industry: string;
  features: string[];
  duration: string;
  cost: string;
  images: string[];
  published: boolean;
};

const EMPTY: Initial = {
  title: "",
  slug: "",
  category: "",
  summary: "",
  body: "",
  tags: [],
  industry: "",
  features: [],
  duration: "",
  cost: "",
  images: [],
  published: false,
};

const MAX_IMAGES = 8;

export function PortfolioForm({ initial }: { initial?: Initial }) {
  const router = useRouter();
  const toast = useToast();
  const data = initial ?? EMPTY;
  const isEdit = Boolean(data.id);

  const [images, setImages] = useState<string[]>(data.images);
  const [uploading, setUploading] = useState(false);
  const [imageError, setImageError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // 같은 파일을 다시 선택해도 change 이벤트가 발생하도록 초기화
    if (files.length === 0) return;

    if (images.length + files.length > MAX_IMAGES) {
      setImageError(`예시 사진은 최대 ${MAX_IMAGES}장까지 첨부할 수 있습니다.`);
      return;
    }

    setImageError("");
    setUploading(true);
    try {
      const form = new FormData();
      files.forEach((f) => form.append("files", f));
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error ?? "이미지 업로드에 실패했습니다.");
      }
      setImages((prev) => [...prev, ...body.urls]);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  // 목록/상세 페이지 썸네일은 항상 첫 번째 이미지를 사용하므로, 대표로 쓸 사진을
  // 클릭하면 배열 맨 앞으로 옮겨서 다시 업로드하지 않고도 대표 사진을 바꿀 수 있게 합니다.
  function makeCover(url: string) {
    setImages((prev) => [url, ...prev.filter((u) => u !== url)]);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get("title") ?? ""),
      slug: String(form.get("slug") ?? ""),
      category: String(form.get("category") ?? ""),
      summary: String(form.get("summary") ?? ""),
      body: String(form.get("body") ?? ""),
      tags: String(form.get("tags") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      industry: String(form.get("industry") ?? ""),
      features: String(form.get("features") ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      duration: String(form.get("duration") ?? ""),
      cost: String(form.get("cost") ?? ""),
      images,
      published: form.get("published") === "on",
    };

    try {
      const res = await fetch(
        isEdit ? `/api/admin/portfolio/${data.id}` : "/api/admin/portfolio",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b?.error ?? "저장에 실패했습니다.");
      }

      toast("저장됐어요", "success");
      router.push("/admin/portfolio");
    } catch (err) {
      toast(err instanceof Error ? err.message : "저장에 실패했습니다.", "error");
      setLoading(false);
    }
  }

  async function onDelete() {
    if (!data.id || !confirm("이 포트폴리오 항목을 삭제할까요?")) return;
    await fetch(`/api/admin/portfolio/${data.id}`, { method: "DELETE" });
    toast("삭제됐어요", "success");
    router.push("/admin/portfolio");
  }

  return (
    <AdminCard>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="제목" name="title" defaultValue={data.title} required />
          <Field
            label="슬러그 (URL, 한글/영문 소문자·숫자·하이픈)"
            name="slug"
            defaultValue={data.slug}
            required
          />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="카테고리" name="category" defaultValue={data.category} required />
          <Field label="태그 (쉼표로 구분)" name="tags" defaultValue={data.tags.join(", ")} />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="업종" name="industry" defaultValue={data.industry} placeholder="예: 이커머스" />
          <Field
            label="기능 (쉼표로 구분)"
            name="features"
            defaultValue={data.features.join(", ")}
            placeholder="예: 카카오 챗봇, 결제 연동"
          />
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="기간" name="duration" defaultValue={data.duration} placeholder="예: 3주" />
          <Field label="비용" name="cost" defaultValue={data.cost} placeholder="예: 300만원 · 비공개" />
        </div>
        <div>
          <label className="text-xs font-medium text-admin-muted">요약</label>
          <textarea
            name="summary"
            defaultValue={data.summary}
            required
            rows={2}
            className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3.5 py-2.5 text-sm outline-none focus:border-admin-blue"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-admin-muted">
            예시 사진 <span className="font-normal normal-case text-admin-muted/70">(선택, 최대 {MAX_IMAGES}장)</span>
          </label>
          <div className="mt-2 flex flex-wrap gap-3">
            {images.map((url, i) => (
              <div
                key={url}
                className="group relative h-20 w-20 overflow-hidden rounded-lg border border-admin-border"
              >
                <button
                  type="button"
                  onClick={() => makeCover(url)}
                  disabled={i === 0}
                  className="block h-full w-full"
                  aria-label={i === 0 ? "대표 사진" : "대표 사진으로 지정"}
                >
                  <Image src={url} alt="" fill sizes="80px" className="object-cover" />
                </button>
                {i === 0 && (
                  <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/60 px-1.5 py-0.5 text-[9px] font-medium text-white">
                    대표
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(url)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white transition-colors hover:bg-black/80"
                  aria-label="이미지 삭제"
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < MAX_IMAGES && (
              <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-admin-border text-admin-muted transition-colors hover:border-admin-blue hover:text-admin-blue">
                <span className="text-xl leading-none">+</span>
                <span className="text-[10px]">{uploading ? "업로드 중" : "사진 추가"}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={onFilesSelected}
                />
              </label>
            )}
          </div>
          {images.length > 1 && (
            <p className="mt-1.5 text-[11px] text-admin-muted">
              사진을 클릭하면 대표 사진(목록 썸네일)으로 지정돼요.
            </p>
          )}
          {imageError && <p className="mt-2 text-xs text-admin-red">{imageError}</p>}
        </div>
        <div>
          <label className="text-xs font-medium text-admin-muted">
            본문{" "}
            <span className="font-normal normal-case text-admin-muted/70">
              (줄 맨 앞에 &lsquo;## 소제목&rsquo;을 쓰면 그 줄이 큰 제목으로, &lsquo;- 항목&rsquo;은 목록으로 나와요.
              예: &lsquo;## 설계&rsquo; 다음 줄에 설명, &lsquo;## 작업 방식&rsquo;, &lsquo;## 품목&rsquo; 등)
            </span>
          </label>
          <textarea
            name="body"
            defaultValue={data.body}
            rows={10}
            placeholder={"## 설계\n어떤 구조로 설계했는지 설명해요.\n\n## 작업 방식\n어떻게 작업을 진행했는지 설명해요.\n\n## 품목\n- 첫 번째 품목\n- 두 번째 품목"}
            className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3.5 py-2.5 text-sm outline-none focus:border-admin-blue"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-admin-text">
          <input type="checkbox" name="published" defaultChecked={data.published} />
          공개 게시
        </label>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || uploading}
            className="rounded-lg bg-admin-blue px-5 py-2.5 text-sm font-medium text-white transition-[transform,opacity] duration-200 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "저장 중..." : uploading ? "이미지 업로드 중..." : "저장"}
          </button>
          {isEdit && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-admin-red hover:bg-admin-red-soft"
            >
              삭제
            </button>
          )}
        </div>
      </form>
    </AdminCard>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-admin-muted">
        {label} {required && <span className="text-admin-red">*</span>}
      </label>
      <input
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-admin-border bg-admin-content px-3.5 py-2.5 text-sm outline-none focus:border-admin-blue"
      />
    </div>
  );
}
