// Copies the built web app (../cp/dist/cipher-path.html) into assets/web/ so Metro bundles it.
// Runs before start, before check:store, and on EAS after npm install (eas-build-post-install).
const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../../cp/dist/cipher-path.html');
const dir = path.resolve(__dirname, '../assets/web');
const dst = path.join(dir, 'cipher-path.html');

if (!fs.existsSync(src)) {
  console.error(`sync-web: ${src} not found. Build the web app first: bash scripts/build.sh`);
  process.exit(1);
}
// The web build is a page body (the web host adds the document shell). Inside the iPhone app there is no host,
// so add the shell here: UTF-8, a phone viewport that reaches under the notch, and the same small reset.
const SHELL_HEAD = `<!doctype html>
<html lang="en" dir="auto">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<meta name="format-detection" content="telephone=no">
<style>
:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0;font:14px -apple-system,system-ui,sans-serif;-webkit-text-size-adjust:100%;-webkit-tap-highlight-color:transparent}
img{max-width:100%}
[hidden]{display:none!important}
</style>
</head>
<body>
`;
const body = fs.readFileSync(src, 'utf8');
if (/^\s*<!doctype/i.test(body)) { console.error('sync-web: source already has a document shell'); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(dst, SHELL_HEAD + body + '\n</body>\n</html>\n');
const kb = Math.round(fs.statSync(dst).size / 1024);
console.log(`sync-web: copied cipher-path.html (${kb} KB)`);
