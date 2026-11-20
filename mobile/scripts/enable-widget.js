// One-time: turns on the iOS home-screen widget (docs/WIDGET.md). Run from mobile/:  npm run widget:enable
// 1) installs @bacons/apple-targets  2) copies widget-template/widget → targets/widget  3) swaps src/widget.js for the
// real bridge  4) adds the plugin, the App Group entitlement and appleTeamId to app.json.
const { execSync } = require('child_process'); const fs = require('fs'); const path = require('path');
const root = path.join(__dirname, '..'); const team = process.argv[2] || process.env.APPLE_TEAM_ID;
if (!team || !/^[A-Z0-9]{10}$/.test(team)) { console.error('Usage: npm run widget:enable -- YOUR_APPLE_TEAM_ID   (10 characters, developer.apple.com → Membership)'); process.exit(1); }
execSync('npm install @bacons/apple-targets --save', { cwd: root, stdio: 'inherit' });
fs.mkdirSync(path.join(root, 'targets', 'widget'), { recursive: true });
for (const f of ['Widget.swift', 'expo-target.config.js']) fs.copyFileSync(path.join(root, 'widget-template', 'widget', f), path.join(root, 'targets', 'widget', f));
fs.copyFileSync(path.join(root, 'widget-template', 'widget.real.js'), path.join(root, 'src', 'widget.js'));
const p = path.join(root, 'app.json'), j = JSON.parse(fs.readFileSync(p, 'utf8')), e = j.expo;
e.ios = e.ios || {}; e.ios.appleTeamId = team;
e.ios.entitlements = Object.assign({}, e.ios.entitlements, { 'com.apple.security.application-groups': ['group.space.kinzhal.hanzipath'] });
if (!e.plugins.includes('@bacons/apple-targets')) e.plugins.push('@bacons/apple-targets');
fs.writeFileSync(p, JSON.stringify(j, null, 2) + '\n');
console.log('Widget enabled. Next: npm run check:store, then the EAS build (docs/BUILD_IOS.md).');
