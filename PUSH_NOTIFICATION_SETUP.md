# 📱 Push Notification Setup Guide

## 🎯 Overview
This guide sets up **push notifications to phones** as the primary notification system for CalSync.

## ✅ What You Get
- **Instant phone notifications** when events are due
- **Works even when app is closed**
- **No email setup required**
- **Professional notification experience**

---

## 🔧 Step 1: Configure Firebase (Required)

### 1.1 Get Firebase Configuration
1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: `calsync-95917`
3. **Go to Project Settings** (gear icon)
4. **Service Accounts** tab
5. **Click "Generate new private key"**
6. **Download the JSON file**

### 1.2 Extract Values from JSON
Open the downloaded JSON file and copy these values:

```json
{
  "type": "service_account",
  "project_id": "calsync-95917",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@calsync-95917.iam.gserviceaccount.com",
  "client_id": "123456789012345678901"
}
```

### 1.3 Add to Railway Environment Variables
In Railway dashboard, add these variables:

```
FIREBASE_PROJECT_ID=calsync-95917
FIREBASE_PRIVATE_KEY_ID=your_private_key_id_from_json
FIREBASE_PRIVATE_KEY=your_private_key_from_json
FIREBASE_CLIENT_EMAIL=your_client_email_from_json
FIREBASE_CLIENT_ID=your_client_id_from_json
```

**Important**: For `FIREBASE_PRIVATE_KEY`, copy the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`

---

## 🔧 Step 2: Test Push Notifications

### 2.1 Create Test Event
1. **Open your app**: https://cal-sync-pied.vercel.app
2. **Login to your account**
3. **Create a new event**:
   - Title: "Test Push Notification"
   - Date: Today
   - Time: 2-3 minutes from now
   - Reminder: 1 minute before

### 2.2 Allow Notifications
1. **When prompted**, click "Allow" for notifications
2. **Wait 1-2 minutes** for the notification to arrive
3. **Check your phone** for the push notification

### 2.3 Expected Result
✅ **Phone notification appears** with event details  
✅ **Notification shows** even if app is closed  
✅ **Tap notification** opens the app  

---

## 🔧 Step 3: Verify Setup

### 3.1 Check Railway Logs
1. **Go to Railway dashboard**
2. **Click on your service**
3. **Go to "Deployments" tab**
4. **Click on latest deployment**
5. **Check logs** for:
   ```
   ✅ Push notification sent to [User Name] for event: [Event Title]
   ```

### 3.2 Test Multiple Users
1. **Create another user account**
2. **Login on different device/browser**
3. **Create event with reminder**
4. **Verify both users get notifications**

---

## 🚨 Troubleshooting

### ❌ No Push Notifications
**Check these:**
1. **Firebase environment variables** are set correctly in Railway
2. **User allowed notifications** in browser
3. **FCM token is saved** (check browser console for "✅ FCM token sent to backend")
4. **Event reminder time** has passed

### ❌ "FCM token sent to backend" Error
**Solution:**
1. **Check Railway logs** for backend errors
2. **Verify Firebase credentials** are correct
3. **Redeploy backend** after fixing environment variables

### ❌ Notifications Don't Appear on Phone
**Check these:**
1. **Browser notification permissions** are allowed
2. **Phone is not in Do Not Disturb mode**
3. **App is not blocked** in phone settings
4. **Try refreshing the page** and allowing notifications again

---

## 🎉 Success Indicators

✅ **Firebase environment variables** configured in Railway  
✅ **"FCM token sent to backend"** appears in browser console  
✅ **Push notifications appear** on phone when events are due  
✅ **Notifications work** even when app is closed  
✅ **Railway logs show** "✅ Push notification sent" messages  

---

## 📱 How It Works

1. **User opens app** → Firebase generates FCM token
2. **Token sent to backend** → Stored in database
3. **User creates event** → Reminder scheduled
4. **Reminder time arrives** → Backend sends push notification
5. **Phone receives notification** → User sees event reminder

---

## 🔄 Optional: Email Fallback

If you want email notifications as backup:
1. **Set up Gmail SMTP** (see previous guide)
2. **Add Gmail credentials** to Railway
3. **Emails will be sent** only if push notifications fail

---

## 🎯 Next Steps

1. **Test with real events** and different reminder times
2. **Share with team members** to test multi-user notifications
3. **Monitor Railway logs** to ensure notifications are working
4. **Customize notification messages** if needed

Your push notification system is now ready! 🚀 