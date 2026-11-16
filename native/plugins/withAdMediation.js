// Adds the AdMob mediation adapters to the iOS Podfile (Expo config plugin).
// Networks: AppLovin, Unity Ads, Liftoff Monetize (Vungle), Mintegral, Pangle, Meta Audience Network.
// Each network also needs its ad source added to a mediation group in the AdMob console (see docs/ADS.md).
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const PODS = [
  'GoogleMobileAdsMediationAppLovin',
  'GoogleMobileAdsMediationUnity',
  'GoogleMobileAdsMediationVungle',
  'GoogleMobileAdsMediationMintegral',
  'GoogleMobileAdsMediationPangle',
  'GoogleMobileAdsMediationFacebook',
];

module.exports = function withAdMediation(config) {
  return withDangerousMod(config, ['ios', async (cfg) => {
    const file = path.join(cfg.modRequest.platformProjectRoot, 'Podfile');
    let src = fs.readFileSync(file, 'utf8');
    if (!src.includes('GoogleMobileAdsMediation')) {
      const lines = PODS.map((p) => `  pod '${p}'`).join('\n');
      src = src.replace(/(use_expo_modules!\s*\n)/, `$1${lines}\n`);
      fs.writeFileSync(file, src);
    }
    return cfg;
  }]);
};
