// 사용법: node docs/baseline/normalize.mjs <입력.html> <출력.html>
// <body> 내용만 남기고, script/template/주석을 제거한 뒤,
// CSS Modules 해시 클래스명을 로컬 이름으로 정규화한다.
import { readFileSync, writeFileSync } from 'node:fs';

// src/styles/Home.module.css + About.module.css의 로컬 이름 전부 + 전역 aboutPage.
// 긴 이름부터 매칭해야 'content'가 'contentWrapper'를 가로채지 않는다 (아래에서 정렬).
const localNames = [
  'container',
  'main',
  'footer',
  'title',
  'description',
  'code',
  'grid',
  'card',
  'logo',
  'typo1',
  'typo2',
  'typo3',
  'contentWrapper',
  'titlebar',
  'buttonWrapper',
  'inlineContent',
  'buttons',
  'close',
  'closebutton',
  'minimize',
  'minimizebutton',
  'zoom',
  'zoombutton',
  'content',
  'lastUpdatedAt',
  'infoTable',
  'experienceSection',
  'language',
  'aboutPage',
].sort((a, b) => b.length - a.length);

let html = readFileSync(process.argv[2], 'utf8');

const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
html = bodyMatch ? bodyMatch[1] : html;

html = html.replace(/<script[\s\S]*?<\/script>/g, '');
html = html.replace(/<template[\s\S]*?<\/template>/g, '');
html = html.replace(/<!--[\s\S]*?-->/g, '');

html = html.replace(/class="([^"]*)"/g, (_, value) => {
  const tokens = value
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      for (const name of localNames) {
        if (token.includes(name)) return name;
      }
      return token;
    });
  return `class="${tokens.join(' ')}"`;
});

html = html.replace(/></g, '>\n<').trim();

writeFileSync(process.argv[3], html + '\n');
