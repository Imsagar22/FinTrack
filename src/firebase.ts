/**
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp({
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId
});

// Initialize Firestore with specific database ID if provided
const db = firebaseConfigJson.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

const auth = getAuth(app);

export { app, db, auth };

/**
 * Creates a user profile in Firestore
 */
async function createUserProfile(user: User, additionalData: { role?: string } = {}) {
  const userRef = doc(db, 'users', user.uid);
  await setDoc(userRef, {
    uid: user.uid,
    email: user.email,
    role: additionalData.role || (user.email === 'sagarmailstop@gmail.com' ? 'admin' : 'user'),
    createdAt: serverTimestamp()
  }, { merge: true });
}

/**
 * Signs up a new user with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  await createUserProfile(userCredential.user);
  return userCredential.user;
}

/**
 * Signs in a user with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  // Ensure profile exists
  await createUserProfile(userCredential.user);
  return userCredential.user;
}

/**
 * Signs in a user using Google OAuth
 */
export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  });
  const userCredential = await signInWithPopup(auth, provider);
  await createUserProfile(userCredential.user);
  return userCredential.user;
}

/**
 * Signs out the current user
 */
export async function signOutUser() {
  await signOut(auth);
}

/**
 * Fetches all registered users (for admin dashboard)
 */
export async function getAllUsersForAdmin() {
  const usersCol = collection(db, 'users');
  const querySnapshot = await getDocs(usersCol);
  const usersList: any[] = [];
  querySnapshot.forEach((docSnap) => {
    usersList.push({ id: docSnap.id, ...docSnap.data() });
  });
  return usersList;
}

/**
 * Fetches all transactions in the entire database (for admin stats if needed)
 */
export async function getAllTransactionsForAdmin() {
  const txCol = collection(db, 'transactions');
  const querySnapshot = await getDocs(txCol);
  const txList: any[] = [];
  querySnapshot.forEach((docSnap) => {
    txList.push({ id: docSnap.id, ...docSnap.data() });
  });
  return txList;
}
