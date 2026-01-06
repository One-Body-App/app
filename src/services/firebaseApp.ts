import { getApp, getApps, initializeApp } from '@react-native-firebase/app';

// Initialize once and reuse to avoid deprecated namespaced calls.
const firebaseApp = getApps().length ? getApp() : initializeApp();

export const getFirebaseApp = () => firebaseApp;

export default getFirebaseApp;
