/** iOS home-screen widget for Hanzi Path (built by @bacons/apple-targets during prebuild / EAS build). */
module.exports = () => ({
  type: 'widget',
  name: 'HanziWidget',
  deploymentTarget: '17.0',
  entitlements: { 'com.apple.security.application-groups': ['group.space.kinzhal.hanzipath'] },
});
