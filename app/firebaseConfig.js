import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyBIVWPeybllKOHyF3g0GNZ58Nj9xrkNG-I",
  authDomain: "spk-saw-c377c.firebaseapp.com",
  projectId: "spk-saw-c377c",
  storageBucket: "spk-saw-c377c.firebasestorage.app",
  messagingSenderId: "960032471733",
  appId: "1:960032471733:web:0a1ff03008431838e1dcfc",
  measurementId: "G-KWK5BS9JW7"
};

const app = initializeApp(firebaseConfig);

// Web: gunakan getAuth biasa (browserLocalPersistence secara default)
// Native (Android/iOS): gunakan initializeAuth + AsyncStorage agar sesi tetap tersimpan
let authInstance;
if (Platform.OS === 'web') {
  authInstance = getAuth(app);
} else {
  // Lazy-require agar AsyncStorage tidak diimport saat berjalan di web
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
}

export const auth = authInstance;
export const db = getFirestore(app);
