// Cipher Path – Firebase (Sign in with Apple / Google, cloud sync, analytics).
// Uses the same Firebase project as Hanzi Path (hanzi-path-64170): Apple and Google sign-in are already enabled there.
// Cipher Path is added to it as a second iOS app (bundle space.kinzhal.cipherpath) – see docs/ACCOUNTS.md.
// Progress lives in its own collection, cipher_users/{uid}, so it never mixes with Hanzi Path's users/{uid}.
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const firebaseConfig = {
  apiKey: 'AIzaSyD6UN6UNn-G_MUKvQwLY6wGUyTOkL7I5vc',
  authDomain: 'hanzi-path-64170.firebaseapp.com',
  projectId: 'hanzi-path-64170',
  storageBucket: 'hanzi-path-64170.firebasestorage.app',
  messagingSenderId: '745293456497',
  appId: '1:745293456497:web:b1c0fbefee991611b767d0', // Firebase JS SDK uses the web app id
  measurementId: undefined,
};
export const USERS = 'cipher_users';
// iOS client ID: from the GoogleService-Info.plist of the *Cipher Path* iOS app (CLIENT_ID). Each bundle ID gets its own.
export const GOOGLE_IOS_CLIENT_ID = 'PASTE_CIPHER_PATH_IOS_CLIENT_ID.apps.googleusercontent.com';
// Web client ID: the same for the whole Firebase project (Authentication → Google provider).
export const GOOGLE_WEB_CLIENT_ID = '745293456497-3ja0aq5hhv4qvqqtjhsgn2enj4djjcd4.apps.googleusercontent.com';

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
export const db = getFirestore(app);
export let analytics = null;
isSupported().then(ok => { if (ok) analytics = getAnalytics(app); }).catch(() => {});
