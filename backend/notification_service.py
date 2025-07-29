#!/usr/bin/env python3
"""
New Notification Service for CalSync
Handles both push notifications and email notifications
"""

import smtplib
import requests
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from database import db
import os
from dotenv import load_dotenv
from timezone_utils import timezone_utils

# Load environment variables
load_dotenv('config.env')

class NotificationService:
    def __init__(self):
        self.email_enabled = os.getenv('EMAIL_ENABLED', 'false').lower() == 'true'
        self.push_enabled = os.getenv('PUSH_ENABLED', 'false').lower() == 'true'
        
        # Email configuration
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.email_username = os.getenv('EMAIL_USERNAME', '')
        self.email_password = os.getenv('EMAIL_PASSWORD', '')
        
        # Push notification configuration (Firebase)
        self.fcm_server_key = os.getenv('FCM_SERVER_KEY', '')
        self.fcm_url = 'https://fcm.googleapis.com/fcm/send'
        
        print(f"📧 Email notifications: {'✅ Enabled' if self.email_enabled else '❌ Disabled'}")
        print(f"📱 Push notifications: {'✅ Enabled' if self.push_enabled else '❌ Disabled'}")
    
    def create_notification(self, user_id, title, message, notification_type='event_reminder', event_id=None, scheduled_for=None):
        """Create a new notification in the database"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO notifications (user_id, event_id, title, message, notification_type, scheduled_for)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (user_id, event_id, title, message, notification_type, scheduled_for))
            
            notification_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            print(f"✅ Created notification {notification_id} for user {user_id}")
            return notification_id
            
        except Exception as e:
            print(f"❌ Error creating notification: {e}")
            return None
    
    def send_push_notification(self, device_tokens, title, message, data=None):
        """Send push notification to devices"""
        if not self.push_enabled or not self.fcm_server_key:
            print("⚠️ Push notifications disabled or FCM not configured")
            return False
        
        if not device_tokens:
            print("⚠️ No device tokens provided")
            return False
        
        try:
            headers = {
                'Authorization': f'key={self.fcm_server_key}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'registration_ids': device_tokens,
                'notification': {
                    'title': title,
                    'body': message,
                    'sound': 'default',
                    'badge': 1
                },
                'data': data or {},
                'priority': 'high'
            }
            
            response = requests.post(self.fcm_url, headers=headers, json=payload)
            
            if response.status_code == 200:
                result = response.json()
                success_count = result.get('success', 0)
                failure_count = result.get('failure', 0)
                
                print(f"✅ Push notification sent: {success_count} success, {failure_count} failed")
                return success_count > 0
            else:
                print(f"❌ Push notification failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Error sending push notification: {e}")
            return False
    
    def send_email_notification(self, email, subject, message, html_message=None):
        """Send email notification"""
        if not self.email_enabled or not self.email_username or not self.email_password:
            print("⚠️ Email notifications disabled or not configured")
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = self.email_username
            msg['To'] = email
            msg['Subject'] = subject
            
            # Add plain text version
            text_part = MIMEText(message, 'plain')
            msg.attach(text_part)
            
            # Add HTML version if provided
            if html_message:
                html_part = MIMEText(html_message, 'html')
                msg.attach(html_part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.email_username, self.email_password)
                server.send_message(msg)
            
            print(f"✅ Email notification sent to {email}")
            return True
            
        except Exception as e:
            print(f"❌ Error sending email notification: {e}")
            return False
    
    def send_event_reminder(self, event_id, reminder_minutes=15):
        """Send event reminder to all users"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            # Check if timezone column exists
            cursor.execute("PRAGMA table_info(events)")
            columns = [row[1] for row in cursor.fetchall()]
            
            if 'timezone' in columns:
                cursor.execute('''
                    SELECT title, description, start_datetime, end_datetime, created_by, timezone
                    FROM events WHERE id = ?
                ''', (event_id,))
            else:
                cursor.execute('''
                    SELECT title, description, start_datetime, end_datetime, created_by
                    FROM events WHERE id = ?
                ''', (event_id,))
            
            event = cursor.fetchone()
            if not event:
                print(f"❌ Event {event_id} not found")
                return False
            
            if 'timezone' in columns:
                event_title, event_description, start_datetime, end_datetime, created_by, event_timezone = event
            else:
                event_title, event_description, start_datetime, end_datetime, created_by = event
                event_timezone = 'UTC'
            
            # Get all users
            cursor.execute('''
                SELECT id, email, first_name, last_name, fcm_token
                FROM users WHERE is_active = 1
            ''')
            
            users = cursor.fetchall()
            conn.close()
            
            # Format event time in local timezone
            event_time = timezone_utils.convert_to_local_time(start_datetime, event_timezone)
            reminder_time = event_time - timedelta(minutes=reminder_minutes)
            
            # Create notification for each user
            device_tokens = []
            email_users = []
            
            for user in users:
                user_id, email, first_name, last_name, device_token = user
                
                # Skip if user created the event
                if user_id == created_by:
                    continue
                
                # Prepare notification content
                title = f"Event Reminder: {event_title}"
                message = f"Hi {first_name}, you have an event '{event_title}' starting in {reminder_minutes} minutes at {event_time.strftime('%I:%M %p')}."
                
                # Create notification in database
                notification_id = self.create_notification(
                    user_id=user_id,
                    title=title,
                    message=message,
                    notification_type='event_reminder',
                    event_id=event_id,
                    scheduled_for=reminder_time.isoformat()
                )
                
                if notification_id:
                    # Add to push notification list
                    if device_token:
                        device_tokens.append(device_token)
                    
                    # Add to email list
                    email_users.append({
                        'email': email,
                        'name': f"{first_name} {last_name}",
                        'notification_id': notification_id
                    })
            
            # Send push notifications
            if device_tokens:
                push_success = self.send_push_notification(
                    device_tokens=device_tokens,
                    title=title,
                    message=message,
                    data={'event_id': event_id, 'type': 'event_reminder'}
                )
            else:
                push_success = False
            
            # Send email notifications
            email_success_count = 0
            for user in email_users:
                html_message = f"""
                <html>
                <body>
                    <h2>Event Reminder</h2>
                    <p>Hi {user['name']},</p>
                    <p>You have an upcoming event:</p>
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                        <h3>{event_title}</h3>
                        <p><strong>Time:</strong> {event_time.strftime('%B %d, %Y at %I:%M %p')}</p>
                        <p><strong>Duration:</strong> {event_time.strftime('%I:%M %p')} - {datetime.fromisoformat(end_datetime).strftime('%I:%M %p')}</p>
                        {f'<p><strong>Description:</strong> {event_description}</p>' if event_description else ''}
                    </div>
                    <p>This reminder was sent {reminder_minutes} minutes before the event.</p>
                    <p>Best regards,<br>CalSync Team</p>
                </body>
                </html>
                """
                
                if self.send_email_notification(
                    email=user['email'],
                    subject=title,
                    message=message,
                    html_message=html_message
                ):
                    email_success_count += 1
                    
                    # Mark notification as sent
                    self.mark_notification_sent(user['notification_id'])
            
            print(f"✅ Event reminder sent: {len(users)} users notified")
            print(f"   📱 Push: {'✅' if push_success else '❌'}")
            print(f"   📧 Email: {email_success_count}/{len(email_users)} sent")
            
            return True
            
        except Exception as e:
            print(f"❌ Error sending event reminder: {e}")
            return False
    
    def mark_notification_sent(self, notification_id):
        """Mark a notification as sent"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE notifications SET is_sent = 1, sent_at = ? WHERE id = ?
            ''', (datetime.now().isoformat(), notification_id))
            conn.commit()
            conn.close()
        except Exception as e:
            print(f"❌ Error marking notification as sent: {e}")
    
    def send_system_notification(self, title, message, notification_type='system'):
        """Send system notification to all users"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            # Get all active users
            cursor.execute('''
                SELECT id, email, first_name, last_name, fcm_token
                FROM users WHERE is_active = 1
            ''')
            
            users = cursor.fetchall()
            conn.close()
            
            device_tokens = []
            email_users = []
            
            for user in users:
                user_id, email, first_name, last_name, device_token = user
                
                # Create notification in database
                notification_id = self.create_notification(
                    user_id=user_id,
                    title=title,
                    message=message,
                    notification_type=notification_type
                )
                
                if notification_id:
                    # Add to push notification list
                    if device_token:
                        device_tokens.append(device_token)
                    
                    # Add to email list
                    email_users.append({
                        'email': email,
                        'name': f"{first_name} {last_name}",
                        'notification_id': notification_id
                    })
            
            # Send push notifications
            if device_tokens:
                self.send_push_notification(
                    device_tokens=device_tokens,
                    title=title,
                    message=message,
                    data={'type': notification_type}
                )
            
            # Send email notifications
            for user in email_users:
                html_message = f"""
                <html>
                <body>
                    <h2>{title}</h2>
                    <p>Hi {user['name']},</p>
                    <p>{message}</p>
                    <p>Best regards,<br>CalSync Team</p>
                </body>
                </html>
                """
                
                if self.send_email_notification(
                    email=user['email'],
                    subject=title,
                    message=message,
                    html_message=html_message
                ):
                    self.mark_notification_sent(user['notification_id'])
            
            print(f"✅ System notification sent to {len(users)} users")
            return True
            
        except Exception as e:
            print(f"❌ Error sending system notification: {e}")
            return False

# Global notification service instance
notification_service = NotificationService() 