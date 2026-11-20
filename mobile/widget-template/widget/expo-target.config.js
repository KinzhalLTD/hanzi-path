/** iOS home-screen widget for Cipher Path (built by @bacons/apple-targets during prebuild / EAS build). */
module.exports = () => ({
  type: 'widget',
  name: 'CipherWidget',
  deploymentTarget: '17.0',
  entitlements: { 'com.apple.security.application-groups': ['group.space.kinzhal.cipherpath'] },
});
