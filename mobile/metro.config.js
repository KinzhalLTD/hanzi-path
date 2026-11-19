// Bundle the single-file web app (assets/web/hanzi-path.html) as an asset, not as code.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('html');
// Studio voice packs (assets/voice/*.bin, see src/voicePacks.js) are bundled assets too.
config.resolver.assetExts.push('bin');

module.exports = config;
