// Cipher Path – ads (Google AdMob + mediation) for free users only.
// Order required by Google and Apple: 1) UMP consent form (GDPR/regional privacy) → 2) Apple ATT prompt →
// 3) initialize AdMob → 4) preload ads. Pro users never load or see ads.
import mobileAds, {
  AdsConsent, AdsConsentPrivacyOptionsRequirementStatus, InterstitialAd, RewardedAd,
  AdEventType, RewardedAdEventType, TestIds, MaxAdContentRating,
} from 'react-native-google-mobile-ads';
import { getTrackingPermissionsAsync, requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

export const ADMOB_APP_ID = 'ca-app-pub-5681105275743934~8491215486'; // Cipher Path AdMob app id (also in app.json)
const UNITS = {
  // Cipher Path ad units from the AdMob console (docs/ADS.md).
  interstitial: 'ca-app-pub-5681105275743934/8163912423',
  rewarded: 'ca-app-pub-5681105275743934/8607811739',
  // Created in AdMob but not used by the app (ads only at break points + opt-in rewards):
  // appOpen 'ca-app-pub-5681105275743934/2605957274', banner '…/1842046654', native '…/5981648395', rewardedInterstitial '…/5719205776'
};
// Google test ads in development builds – never click real ads while testing (it can suspend the account).
const unit = (k) => (__DEV__ ? { interstitial: TestIds.INTERSTITIAL, rewarded: TestIds.REWARDED }[k] : UNITS[k]);

let ready = false, canRequest = false, privacyRequired = false;
let inter = null, interLoaded = false, reward = null, rewardLoaded = false;
let isPro = () => false;

/** Run once at start-up, after the purchase status is known. Returns {canRequest, privacyRequired}. */
export async function initAds({ getPro }) {
  isPro = getPro || isPro;
  try {
    const info = await AdsConsent.gatherConsent();            // shows the UMP form only where the law requires it
    canRequest = !!info.canRequestAds;
    privacyRequired = info.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
  } catch { canRequest = true; }                              // consent service unreachable: Google still serves limited ads
  try {
    const { status } = await getTrackingPermissionsAsync();   // Apple ATT – asked once, after the consent form
    if (status === 'undetermined') await requestTrackingPermissionsAsync();
  } catch {}
  if (!canRequest) return { canRequest, privacyRequired };
  await mobileAds().setRequestConfiguration({
    maxAdContentRating: MaxAdContentRating.PG,                // learning app: family-friendly ads only
    tagForChildDirectedTreatment: false,
    tagForUnderAgeOfConsent: false,
  });
  await mobileAds().initialize();
  ready = true;
  preload();
  return { canRequest, privacyRequired };
}

function preload() {
  if (!ready || isPro()) return;
  if (!unit('interstitial') || !unit('rewarded')) return;   // ad units not configured yet: run without ads
  if (!inter) {
    inter = InterstitialAd.createForAdRequest(unit('interstitial'));
    inter.addAdEventListener(AdEventType.LOADED, () => { interLoaded = true; });
    inter.addAdEventListener(AdEventType.ERROR, () => { interLoaded = false; setTimeout(() => inter?.load(), 60000); });
  }
  if (!interLoaded) inter.load();
  if (!reward) {
    reward = RewardedAd.createForAdRequest(unit('rewarded'));
    reward.addAdEventListener(RewardedAdEventType.LOADED, () => { rewardLoaded = true; });
    reward.addAdEventListener(AdEventType.ERROR, () => { rewardLoaded = false; setTimeout(() => reward?.load(), 60000); });
  }
  if (!rewardLoaded) reward.load();
}

/** Break-point ad (after a lesson, game or chapter). Resolves when closed; never blocks if no ad is ready. */
export function showInterstitial() {
  return new Promise((resolve) => {
    if (!ready || isPro() || !inter || !interLoaded) { preload(); return resolve({ ok: true, shown: false }); }
    const off = inter.addAdEventListener(AdEventType.CLOSED, () => { off(); interLoaded = false; preload(); resolve({ ok: true, shown: true }); });
    inter.show().catch(() => { off(); interLoaded = false; preload(); resolve({ ok: true, shown: false }); });
  });
}

/** Optional ad the learner chooses (double coins, extra play). ok:true only if the reward was earned. */
export function showRewarded() {
  return new Promise((resolve) => {
    if (!ready || !reward || !rewardLoaded) { preload(); return resolve({ ok: false, unavailable: true }); }
    let earned = false;
    const offE = reward.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => { earned = true; });
    const offC = reward.addAdEventListener(AdEventType.CLOSED, () => { offE(); offC(); rewardLoaded = false; preload(); resolve({ ok: earned }); });
    reward.show().catch(() => { offE(); offC(); rewardLoaded = false; preload(); resolve({ ok: false }); });
  });
}

/** "Ad privacy choices" button in Settings (required by Google where the consent form applies). */
export async function showPrivacyOptions() {
  try { const info = await AdsConsent.showPrivacyOptionsForm(); canRequest = !!info.canRequestAds; return { ok: true }; }
  catch (e) { return { ok: false, error: String(e.message || e) }; }
}

export const adsPrivacyRequired = () => privacyRequired;
