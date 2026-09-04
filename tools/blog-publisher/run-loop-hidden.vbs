' MOVD 블로그 퍼블리셔 — 콘솔 창 없이 백그라운드로 폴링 루프 실행.
' 로그인 시 자동 시작하려면 이 파일의 바로가기를 shell:startup 에 둡니다.
Dim sh, dir
Set sh = CreateObject("WScript.Shell")
dir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
sh.CurrentDirectory = dir
sh.Environment("PROCESS")("PATH") = sh.ExpandEnvironmentStrings("%USERPROFILE%\.local\bin;%PATH%")
sh.Run "node index.mjs", 0, False
