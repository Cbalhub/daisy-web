// "문의하기" 등 사이트 곳곳의 버튼이 공유하는 채팅 진입점입니다.
// 작은 플로팅 위젯 대신, 전체 화면 채팅 페이지를 새 탭으로 엽니다.
//
// 두 번째 인자로 이름 있는 창 타겟을 지정하면, 이미 열려 있는 채팅 탭이 있을 때
// 매번 새 탭을 또 띄우는 대신 기존 탭을 그대로 포커스합니다("_blank"였다면 클릭할
// 때마다 새 탭이 계속 쌓였을 것입니다).
export function openChatWidget() {
  window.open("/chat", "overcook-chat", "noopener,noreferrer");
}
