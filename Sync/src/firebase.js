import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCCbY5zHBLtygafIDMu6Ds3hMhNC8Z3XQI",
  authDomain: "calsync-95917.firebaseapp.com",
  projectId: "calsync-95917",
  storageBucket: "calsync-95917.firebasestorage.app",
  messagingSenderId: "800968405305",
  appId: "1:800968405305:web:cacb008e66fde77249f8e8"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging, getToken, onMessage }; 