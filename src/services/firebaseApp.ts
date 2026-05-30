import { getApp, getApps } from '@react-native-firebase/app';

type FirebaseAppType = ReturnType<typeof getApp>;

// Reuse existing initialized app (native Firebase bootstrap).
const firebaseApp: FirebaseAppType = getApps().length ? getApp() : getApp();

export const getFirebaseApp = () => firebaseApp;

export default getFirebaseApp;
