// navigator.clipboard는 "보안 컨텍스트"(HTTPS 또는 localhost)에서만 존재합니다.
// LAN IP(예: 192.168.x.x)로 접속하면 일반 HTTP라 navigator.clipboard 자체가
// undefined라서 클릭해도 조용히 아무 일도 일어나지 않습니다. 그 경우 임시
// textarea + execCommand("copy")로 폴백합니다.
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fall through to legacy fallback
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}
