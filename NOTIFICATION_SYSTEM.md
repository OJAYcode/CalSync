# 🚀 New Notification System for CalSync

A complete notification system that sends both **push notifications to devices** and **email notifications to registered email addresses** for all users including admins.

## ✨ Features

### 📱 Push Notifications
- **Real-time notifications** to all user devices
- **Firebase Cloud Messaging (FCM)** integration
- **Cross-platform support** (Web, iOS, Android)
- **Rich notifications** with custom data payloads

### 📧 Email Notifications
- **SMTP email delivery** to registered email addresses
- **HTML email templates** with beautiful formatting
- **Event reminder emails** with event details
- **System notification emails** for important updates

### 🔔 Notification Types
- **Event Reminders**: Sent before events start
- **System Notifications**: Admin announcements to all users
- **Custom Notifications**: Any type of notification

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API    │    │  Notification   │
│   (React)       │◄──►│   (Flask)        │◄──►│   Service       │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   SQLite DB      │    │   Firebase FCM  │
                       │   (Notifications)│    │   (Push)        │
                       └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │   Email Service  │    │   Device Tokens │
                       │   (SMTP)         │    │   (FCM Tokens)  │
                       └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### 1. Configure Environment Variables

Edit `backend/config.env`:

```env
# Email Notification Settings
EMAIL_ENABLED=true
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Push Notification Settings (Firebase)
PUSH_ENABLED=true
FCM_SERVER_KEY=your-firebase-server-key

# JWT Secret Key
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
```

### 2. Start the Backend

```bash
cd backend
python app.py
```

### 3. Test the System

```bash
cd backend
python test_notifications.py
```

## 📋 API Endpoints

### Get Notifications
```http
GET /notifications
Authorization: Bearer <jwt_token>
```

**Response:**
```json
[
  {
    "id": 1,
    "event_id": 123,
    "title": "Event Reminder: Team Meeting",
    "message": "Hi John, you have an event 'Team Meeting' starting in 15 minutes.",
    "type": "event_reminder",
    "is_read": false,
    "is_sent": true,
    "created_at": "2025-07-29T14:30:00",
    "event_title": "Team Meeting",
    "event_start": "2025-07-29T15:00:00"
  }
]
```

### Mark Notification as Read
```http
POST /notifications/{notification_id}/read
Authorization: Bearer <jwt_token>
```

### Mark All Notifications as Read
```http
POST /notifications/mark-all-read
Authorization: Bearer <jwt_token>
```

### Get Unread Count
```http
GET /notifications/unread-count
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "unread_count": 5
}
```

### Send Event Reminder
```http
POST /notifications/send-event-reminder
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "event_id": 123,
  "reminder_minutes": 15
}
```

### Send System Notification (Admin Only)
```http
POST /notifications/send-system-notification
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "System Maintenance",
  "message": "The system will be down for maintenance tonight at 10 PM.",
  "type": "system"
}
```

### Update Device Token
```http
POST /users/device-token
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "device_token": "firebase-fcm-token-here"
}
```

## 🔧 Configuration

### Email Configuration (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Update config.env**:
   ```env
   EMAIL_USERNAME=your-gmail@gmail.com
   EMAIL_PASSWORD=your-16-digit-app-password
   ```

### Firebase Configuration (Push Notifications)

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create new project
   - Enable Cloud Messaging

2. **Get Server Key**:
   - Project Settings → Cloud Messaging
   - Copy Server Key

3. **Update config.env**:
   ```env
   FCM_SERVER_KEY=your-firebase-server-key
   ```

## 📊 Database Schema

### Notifications Table
```sql
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_id INTEGER,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'event_reminder',
    is_read BOOLEAN DEFAULT 0,
    is_sent BOOLEAN DEFAULT 0,
    scheduled_for TEXT,
    sent_at TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (event_id) REFERENCES events (id)
);
```

## 🎯 Usage Examples

### Frontend Integration

```javascript
// Get notifications
const response = await fetch('/notifications', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const notifications = await response.json();

// Mark as read
await fetch(`/notifications/${notificationId}/read`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Update device token (for push notifications)
await fetch('/users/device-token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    device_token: 'firebase-fcm-token'
  })
});
```

### Backend Integration

```python
from notification_service import notification_service

# Send event reminder
notification_service.send_event_reminder(event_id=123, reminder_minutes=15)

# Send system notification
notification_service.send_system_notification(
    title="Important Update",
    message="New features are now available!",
    notification_type="system"
)

# Create custom notification
notification_service.create_notification(
    user_id=1,
    title="Custom Notification",
    message="This is a custom notification",
    notification_type="custom"
)
```

## 🔔 Notification Types

| Type | Description | Usage |
|------|-------------|-------|
| `event_reminder` | Event reminders | Sent before events start |
| `system` | System notifications | Admin announcements |
| `custom` | Custom notifications | Any custom notification |

## 📱 Push Notification Setup

### Frontend (React)

1. **Install Firebase**:
   ```bash
   npm install firebase
   ```

2. **Initialize Firebase**:
   ```javascript
   import { initializeApp } from 'firebase/app';
   import { getMessaging, getToken } from 'firebase/messaging';

   const firebaseConfig = {
     // Your Firebase config
   };

   const app = initializeApp(firebaseConfig);
   const messaging = getMessaging(app);

   // Get FCM token
   getToken(messaging, { vapidKey: 'your-vapid-key' })
     .then((token) => {
       // Send token to backend
       updateDeviceToken(token);
     });
   ```

3. **Handle Notifications**:
   ```javascript
   import { onMessage } from 'firebase/messaging';

   onMessage(messaging, (payload) => {
     console.log('Message received:', payload);
     // Show notification to user
   });
   ```

## 📧 Email Templates

### Event Reminder Email
```html
<h2>Event Reminder</h2>
<p>Hi {user_name},</p>
<p>You have an upcoming event:</p>
<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
    <h3>{event_title}</h3>
    <p><strong>Time:</strong> {event_time}</p>
    <p><strong>Duration:</strong> {start_time} - {end_time}</p>
    <p><strong>Description:</strong> {event_description}</p>
</div>
<p>This reminder was sent {reminder_minutes} minutes before the event.</p>
```

## 🛠️ Troubleshooting

### Email Notifications Not Working
1. **Check SMTP settings** in `config.env`
2. **Verify Gmail App Password** is correct
3. **Check firewall** allows SMTP connections
4. **Test with simple email** first

### Push Notifications Not Working
1. **Verify Firebase configuration**
2. **Check FCM Server Key** is correct
3. **Ensure device tokens** are being saved
4. **Test with Firebase Console** first

### Database Issues
1. **Check database permissions**
2. **Verify table structure** with `test_notifications.py`
3. **Check for SQL errors** in logs

## 📈 Monitoring

### Check Notification Status
```bash
cd backend
python test_notifications.py
```

### View Database Statistics
```sql
-- Total notifications
SELECT COUNT(*) FROM notifications;

-- Unread notifications
SELECT COUNT(*) FROM notifications WHERE is_read = 0;

-- Notifications by type
SELECT notification_type, COUNT(*) FROM notifications GROUP BY notification_type;
```

## 🔒 Security

- **JWT Authentication** required for all endpoints
- **Admin-only** system notifications
- **User-specific** notification access
- **Encrypted** email passwords
- **Secure** Firebase configuration

## 🚀 Deployment

### Production Checklist
- [ ] Update `SECRET_KEY` with strong random key
- [ ] Configure production email settings
- [ ] Set up Firebase production project
- [ ] Enable HTTPS for all endpoints
- [ ] Set up monitoring and logging
- [ ] Test all notification types

### Environment Variables
```env
# Production settings
DEBUG=false
EMAIL_ENABLED=true
PUSH_ENABLED=true
SECRET_KEY=your-production-secret-key
```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Run `test_notifications.py` for diagnostics
3. Check server logs for error messages
4. Verify configuration settings

---

**🎉 Your CalSync notification system is now ready to keep all users informed with real-time updates!** 