import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyAOUlWN7sV3islyCnOwlg6Vs0vP40OXKBc",
  authDomain: "lawfirm-management-851e5.firebaseapp.com",
  projectId: "lawfirm-management-851e5",
  storageBucket: "lawfirm-management-851e5.firebasestorage.app",
  messagingSenderId: "728398405294",
  appId: "1:728398405294:web:17749b631835d3c03e973f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.log('The current browser doesn\'t support offline persistence');
  }
});

export const auth = getAuth(app);
