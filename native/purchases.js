// Hanzi Path – in-app purchases via RevenueCat (StoreKit on iOS).
// Pro is granted ONLY by the RevenueCat entitlement "pro", which RevenueCat verifies with Apple
// (purchases, renewals, cancellations, refunds, family sharing). Nothing on the device can fake it.
import Purchases, { LOG_LEVEL, PRODUCT_CATEGORY, INTRO_ELIGIBILITY_STATUS } from 'react-native-purchases';

// RevenueCat → Project → API keys → "App Store" public SDK key (starts with appl_). Safe to ship in the app.
export const RC_IOS_KEY = 'appl_PASTE_PUBLIC_SDK_KEY';
export const ENTITLEMENT = 'pro';

// Web sku → App Store Connect product ID (must match exactly).
export const SKU = {
  pro_monthly: 'space.kinzhal.hanzipath.pro.monthly',
  pro_yearly: 'space.kinzhal.hanzipath.pro.yearly',
  pro_lifetime: 'space.kinzhal.hanzipath.pro.lifetime',
  coins_c1: 'space.kinzhal.hanzipath.coins.600',
  coins_c2: 'space.kinzhal.hanzipath.coins.1500',
  coins_c3: 'space.kinzhal.hanzipath.coins.3500',
};
// Web price keys used by the paywall and shop.
const PRICE_KEY = { pro_monthly: 'monthly', pro_yearly: 'yearly', pro_lifetime: 'lifetime', coins_c1: 'c1', coins_c2: 'c2', coins_c3: 'c3' };

const products = {};     // App Store product id → StoreProduct
let configured = false;

export const isPro = (info) => !!info?.entitlements?.active?.[ENTITLEMENT];

/** Call once at app start. onPro(active) fires now and whenever the entitlement changes. */
export async function initPurchases({ onPro, onPrices }) {
  if (configured) return;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: RC_IOS_KEY });
  configured = true;
  Purchases.addCustomerInfoUpdateListener((info) => onPro(isPro(info)));
  try { onPro(isPro(await Purchases.getCustomerInfo())); } catch {}
  try { onPrices(await loadPrices()); } catch {}
}

async function loadPrices() {
  const subs = await Purchases.getProducts([SKU.pro_monthly, SKU.pro_yearly], PRODUCT_CATEGORY.SUBSCRIPTION);
  const other = await Purchases.getProducts([SKU.pro_lifetime, SKU.coins_c1, SKU.coins_c2, SKU.coins_c3], PRODUCT_CATEGORY.NON_SUBSCRIPTION);
  const prices = {};
  for (const p of [...subs, ...other]) {
    products[p.identifier] = p;
    const web = Object.keys(SKU).find((k) => SKU[k] === p.identifier);
    if (web) prices[PRICE_KEY[web]] = p.priceString;          // localized, e.g. "179.99 ر.س"
    if (p.identifier === SKU.pro_yearly && p.pricePerMonthString) prices.yearlyPm = p.pricePerMonthString;
  }
  // Free trial only for people who never had one (Apple rule) – the paywall hides the trial text otherwise.
  let trial = true;
  try {
    const el = await Purchases.checkTrialOrIntroductoryPriceEligibility([SKU.pro_yearly]);
    trial = el[SKU.pro_yearly]?.status !== INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_INELIGIBLE;
  } catch {}
  return { prices, trial };
}

/** sku is the web id, e.g. "pro_yearly" or "coins_c2". */
export async function buy(sku) {
  const id = SKU[sku];
  if (!id) return { ok: false, error: 'unknown_sku' };
  let product = products[id];
  if (!product) { try { await loadPrices(); product = products[id]; } catch {} }
  if (!product) return { ok: false, error: 'product_unavailable' };
  try {
    const { customerInfo } = await Purchases.purchaseStoreProduct(product);
    return { ok: true, active: isPro(customerInfo), sku };
  } catch (e) {
    if (e.userCancelled) return { ok: false, cancelled: true };
    return { ok: false, error: String(e.message || e), code: e.code };
  }
}

export async function restore() {
  try { const info = await Purchases.restorePurchases(); return { ok: true, active: isPro(info) }; }
  catch (e) { return { ok: false, error: String(e.message || e) }; }
}

/** Ties purchases to the Firebase account so Pro follows the learner to a new phone. */
export async function linkUser(uid) {
  if (!configured) return;
  try {
    if (uid) await Purchases.logIn(uid);
    else if (!(await Purchases.isAnonymous())) await Purchases.logOut();
  } catch {}
}
