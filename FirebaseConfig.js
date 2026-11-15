import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
     import { getFunctions } from 'firebase/functions';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🟢 DỰ ÁN THẬT (khách hàng đang dùng) - bản build lên store luôn dùng cấu hình này
const cauHinhThat = {
  apiKey: "AIzaSyDoY-hoyLop6gmhrUOwh0w0jhUt-uqsJF0",
  authDomain: "channuoiheovs6.firebaseapp.com",
  projectId: "channuoiheovs6",
  storageBucket: "channuoiheovs6.firebasestorage.app",
  messagingSenderId: "340478697796",
  appId: "1:340478697796:web:f5666e604f81b33b4bb711",
  measurementId: "G-MZ68B8L813"
};

// 🧪 DỰ ÁN THỬ - dán cấu hình của dự án pigvn-test vào đây (lấy ở Project settings > Your apps)
const cauHinhThu = {
   apiKey: "AIzaSyArpw7T75-Np1snrvXS1YYj-N9zvteDYVU",
  authDomain: "channuoiheo-d8aea.firebaseapp.com",
  projectId: "channuoiheo-d8aea",
  storageBucket: "channuoiheo-d8aea.firebasestorage.app",
  messagingSenderId: "666120027334",
  appId: "1:666120027334:web:254239a578f3d46c132bc7",
  measurementId: "G-VY7TF1E98S"
};

// __DEV__ = true khi chạy "npx expo start"  -> dùng DỰ ÁN THỬ
// __DEV__ = false khi build lên App Store / Google Play -> dùng DỰ ÁN THẬT
export const LA_MOI_TRUONG_THU = false;
const firebaseConfig = LA_MOI_TRUONG_THU ? cauHinhThu : cauHinhThat;
console.log(LA_MOI_TRUONG_THU ? "🧪 ĐANG DÙNG DỰ ÁN THỬ:" : "🟢 ĐANG DÙNG DỰ ÁN THẬT:", firebaseConfig.projectId);

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// 🔐 BƯỚC 0: Lưu phiên đăng nhập Firebase vào máy (AsyncStorage)
// Tắt app mở lại vẫn còn đăng nhập thật với Firebase, không chỉ nhớ email.
// try/catch để tránh lỗi "already initialized" khi Expo hot reload.
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

export { auth };
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
     export const functions = getFunctions(app, 'asia-southeast1');
export default app;
