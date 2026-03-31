import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence } from 'firebase/auth';
// @ts-ignore
import { getReactNativePersistence } from '@firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDI4J_7MuOkcWm_LT-pyHjdS4Z4KOHs1WU",
    authDomain: "billsplitter-app-c197c.firebaseapp.com",
    projectId: "billsplitter-app-c197c",
    storageBucket: "billsplitter-app-c197c.firebasestorage.app",
    messagingSenderId: "747124533370",
    appId: "1:747124533370:web:a41bc2f7b52d81dde1b3c3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence based on platform
export const auth = Platform.OS === 'web'
    ? initializeAuth(app, { persistence: browserLocalPersistence })
    : initializeAuth(app, { persistence: getReactNativePersistence(ReactNativeAsyncStorage) });

export const db = getFirestore(app);
