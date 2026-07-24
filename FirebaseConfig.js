import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDoY-hoyLop6gmhrUOwh0w0jhUt-uqsJF0",
  authDomain: "channuoiheovs6.firebaseapp.com",
  projectId: "channuoiheovs6",
  storageBucket: "channuoiheovs6.firebasestorage.app",
  messagingSenderId: "340478697796",
  appId: "1:340478697796:web:f5666e604f81b33b4bb711",
  measurementId: "G-MZ68B8L813"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
