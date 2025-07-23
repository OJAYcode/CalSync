importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCCbY5zHBLtygafIDMu6Ds3hMhNC8Z3XQI",
  authDomain: "calsync-95917.firebaseapp.com",
  projectId: "calsync-95917",
  storageBucket: "calsync-95917.firebasestorage.app",
  messagingSenderId: "800968405305",
  appId: "1:800968405305:web:cacb008e66fde77249f8e8"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: '/icon.png'
  });
}); 