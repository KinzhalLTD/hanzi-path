// Hanzi Path – Firebase setup. Paste your values from the Firebase console here (see FIREBASE_SETUP.md).
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
  appId: '1:745293456497:web:b1c0fbefee991611b767d0', // Firebase JS SDK uses the web app id,
  measurementId: undefined, // fill after enabling Google Analytics (optional),
};
// From GoogleService-Info.plist (CLIENT_ID) and the Google provider page in Firebase (Web client ID)
export const GOOGLE_IOS_CLIENT_ID = '745293456497-coheqcrop5suk9p61f9kletsajdoouco.apps.googleusercontent.com';
export const GOOGLE_WEB_CLIENT_ID = '745293456497-3ja0aq5hhv4qvqqtjhsgn2enj4djjcd4.apps.googleusercontent.com';

export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
export const db = getFirestore(app);
export let analytics = null;
isSupported().then(ok => { if (ok) analytics = getAnalytics(app); }).catch(() => {});

// AI tutor Cloud Function (server/functions, docs/AI_TUTOR.md). Shared by both apps.
export const TUTOR_URL = 'https://us-central1-hanzi-path-64170.cloudfunctions.net/tutor';
