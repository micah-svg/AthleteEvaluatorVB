import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Web config is not a secret (it ships in client code). Access is protected by
// the Firestore security rules + Authentication authorized domains.
const firebaseConfig = {
  apiKey: 'AIzaSyBBbkwCqiETWUeVl_iwN7T8HfB-6lzdU0k',
  authDomain: 'barlowvball26.firebaseapp.com',
  projectId: 'barlowvball26',
  storageBucket: 'barlowvball26.firebasestorage.app',
  messagingSenderId: '148974919096',
  appId: '1:148974919096:web:b703ac63a79961f405c34d',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
