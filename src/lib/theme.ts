// 인라인 스크립트와 런타임 로직이 같은 규칙을 두 번 표현한다. 갈라지면
// 첫 페인트와 이후 동작이 어긋나므로 한 파일에 둔다.

export type ThemeChoice = 'system' | 'light' | 'dark';

export const THEME_KEY = 'theme';

/** 선택과 시스템 상태로부터 다크 여부를 정한다. 유일한 판정 규칙. */
export function resolveDark(choice: ThemeChoice, systemDark: boolean): boolean {
  return choice === 'dark' || (choice === 'system' && systemDark);
}

/** 첫 페인트 전에 <html>에 .dark를 붙인다. resolveDark와 같은 규칙이다.
 *  localStorage 접근이 던질 수 있어(사파리 시크릿) try로 감싼다 — 던지면
 *  라이트로 떨어지는 것이 흰 화면보다 낫다. */
export const THEME_INIT_SCRIPT = `(function(){try{
var c=localStorage.getItem('${THEME_KEY}')||'system';
var s=matchMedia('(prefers-color-scheme: dark)').matches;
if(c==='dark'||(c==='system'&&s))document.documentElement.classList.add('dark');
}catch(e){}})()`;
