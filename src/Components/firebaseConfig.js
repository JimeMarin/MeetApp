
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from 'firebase/database';


const firebaseConfig = {
  apiKey: "AIzaSyD1pQojVUabbzMh3eaGGss0NI3DLPPka2g",
  databaseURL: "https://meetapp-7cc2e-default-rtdb.firebaseio.com/",
  authDomain: "meetapp-7cc2e.firebaseapp.com",
  projectId: "meetapp-7cc2e",
  storageBucket: "meetapp-7cc2e.appspot.com",
  messagingSenderId: "1087435563476",
  appId: "1:1087435563476:web:1ba2dd9e221b300dd37641"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);
export {auth, db, database, signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence};