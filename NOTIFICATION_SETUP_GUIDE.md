# 🔔 Complete Notification System Setup Guide

Your CalSync app now has a **complete notification system** with push notifications, email notifications, and in-app notifications! Here's how to set it up:

## **📱 What's New**

✅ **Push Notifications**: Real-time browser/mobile notifications  
✅ **Email Notifications**: Beautiful HTML emails via SendGrid  
✅ **FCM Token Management**: Automatic token storage and updates  
✅ **Enhanced Scheduler**: Processes notifications every minute  
✅ **Multiple Channels**: Push + Email + In-App notifications  

---

## **🔧 Setup Instructions**

### **Step 1: Firebase Configuration (Push Notifications)**

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project**: `calsync-95917`
3. **Go to Project Settings** → **Service Accounts**
4. **Click "Generate new private key"**
5. **Download the JSON file**
6. **Add to Railway Environment Variables**:
   ```
   FIREBASE_PROJECT_ID=calsync-95917
   FIREBASE_PRIVATE_KEY_ID=from_json_file
   FIREBASE_PRIVATE_KEY=from_json_file
   FIREBASE_CLIENT_EMAIL=from_json_file
   FIREBASE_CLIENT_ID=from_json_file
   ```

### **Step 2: SendGrid Configuration (Email Notifications)**

1. **Sign up for SendGrid**: https://sendgrid.com (Free tier: 100 emails/day)
2. **Go to Settings** → **API Keys**
3. **Create API Key** (Full Access or Restricted Access with Mail Send)
4. **Add to Railway Environment Variables**:
   ```
   SENDGRID_API_KEY=your_api_key_here
   FROM_EMAIL=noreply@calsync.com
   ```

### **Step 3: Deploy Updated Backend**

1. **Commit and push changes**:
   ```bash
   cd backend
   git add .
   git commit -m "Add complete notification system"
   git push
   ```

2. **Railway will automatically redeploy** with the new dependencies

---

## **🧪 Testing Your Notification System**

### **Test 1: Create Event with Reminders**

1. **Go to your app** → **Calendar** → **Create Event**
2. **Set up the event**:
   - **Title**: "Test Notification Event"
   - **Date**: Today
   - **Time**: 2-3 minutes from now
   - **Reminders**: Select "5 minutes before" and "15 minutes before"
3. **Create the event**

### **Test 2: Check Notifications**

1. **Wait 1-2 minutes** (scheduler runs every minute)
2. **Check Railway logs** for notification processing
3. **Check your email** for notification emails
4. **Check browser** for push notifications
5. **Go to Notifications page** in your app

### **Test 3: Verify FCM Token Storage**

1. **Open browser console** when logged in
2. **Look for**: "✅ FCM token sent to backend successfully"
3. **Check database** (if you have access) to see stored tokens

---

## **🔍 What Happens When You Create an Event**

### **1. Event Creation**
```
User creates event → Backend creates notification records → Scheduler checks every minute
```

### **2. Notification Processing**
```
Scheduler finds due notifications → Sends push notifications → Sends email notifications → Marks as sent
```

### **3. User Receives Notifications**
```
Push notification appears on device → Email arrives in inbox → In-app notification shows
```

---

## **📊 Notification Channels**

### **Push Notifications**
- **When**: Real-time when app is open or in background
- **Where**: Browser notification center
- **Content**: Event title, time, and action buttons

### **Email Notifications**
- **When**: Same time as push notifications
- **Where**: User's email inbox
- **Content**: Beautiful HTML email with event details

### **In-App Notifications**
- **When**: User visits notifications page
- **Where**: App's notification center
- **Content**: List of all unread notifications

---

## **⚙️ Configuration Options**

### **Environment Variables**
```bash
# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY=your_private_key
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id

# SendGrid (Email Notifications)
SENDGRID_API_KEY=your_api_key
FROM_EMAIL=noreply@yourdomain.com
```

### **Scheduler Settings**
- **Frequency**: Every 1 minute
- **Processing**: All due notifications
- **Channels**: Push + Email + In-App

---

## **🚨 Troubleshooting**

### **Push Notifications Not Working**
1. **Check Firebase configuration** in Railway environment variables
2. **Verify FCM token** is being sent to backend (check console logs)
3. **Check browser permissions** for notifications
4. **Look at Railway logs** for Firebase errors

### **Email Notifications Not Working**
1. **Check SendGrid API key** in Railway environment variables
2. **Verify FROM_EMAIL** is set correctly
3. **Check SendGrid dashboard** for delivery status
4. **Look at Railway logs** for email errors

### **General Issues**
1. **Check Railway logs** for any errors
2. **Verify all environment variables** are set
3. **Test with a simple event** first
4. **Check database** for notification records

---

## **🎉 Success Indicators**

✅ **Console shows**: "✅ FCM token sent to backend successfully"  
✅ **Railway logs show**: "✅ Processed X notifications"  
✅ **Push notifications appear** on your device  
✅ **Emails arrive** in your inbox  
✅ **In-app notifications** show in the app  

---

## **📈 Next Steps**

1. **Set up Firebase and SendGrid** (follow steps above)
2. **Deploy the updated backend**
3. **Test with a simple event**
4. **Monitor Railway logs** for any issues
5. **Enjoy your complete notification system!**

Your notification system is now **production-ready** and will provide a great user experience! 🚀 