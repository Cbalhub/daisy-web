import { renderMarkIcon } from "@/lib/mark-icon";

export const runtime = "nodejs";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return renderMarkIcon(32);
}
