import { initializeApp, getApps } from "firebase/app";
import {
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCTC6wHjIDHGDgAb0YPMX3piYdpGvVnQeY",
  authDomain: "warung-resoyudan.firebaseapp.com",
  projectId: "warung-resoyudan",
  storageBucket: "warung-resoyudan.firebasestorage.app",
  messagingSenderId: "383193039169",
  appId: "1:383193039169:web:267608b52dd26f8f5c21c0",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
  }),
});

export { db };
