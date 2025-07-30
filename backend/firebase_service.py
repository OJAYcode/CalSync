#!/usr/bin/env python3
"""
Firebase Cloud Messaging Service
Handles push notifications for the calendar app
"""

import firebase_admin
from firebase_admin import credentials, messaging
import os
from datetime import datetime

# Initialize Firebase Admin SDK
# Use service account key file for authentication
try:
    firebase_admin.get_app()
except ValueError:
    # Initialize the app with service account credentials
    service_account_path = os.path.join(os.path.dirname(__file__), 'firebase-service-account.json')
    if os.path.exists(service_account_path):
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred)
        print("✅ Firebase initialized with service account")
    else:
        # Fallback to default credentials
        firebase_admin.initialize_app()
        print("⚠️ Firebase initialized with default credentials (service account not found)")

def send_push_notification(token, title, body, data=None):
    """
    Send a push notification to a specific device
    
    Args:
        token (str): FCM token of the target device
        title (str): Notification title
        body (str): Notification body
        data (dict): Optional data payload
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        if not token:
            print(f"❌ No FCM token provided for notification: {title}")
            return False
            
        # Create the message
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            data=data or {},
            token=token
        )
        
        # Send the message
        response = messaging.send(message)
        print(f"✅ Push notification sent successfully: {response}")
        return True
        
    except Exception as e:
        print(f"❌ Error sending push notification: {e}")
        return False

def send_multicast_notification(tokens, title, body, data=None):
    """
    Send push notifications to multiple devices
    
    Args:
        tokens (list): List of FCM tokens
        title (str): Notification title
        body (str): Notification body
        data (dict): Optional data payload
    
    Returns:
        dict: Results with success/failure counts
    """
    try:
        if not tokens:
            print("❌ No FCM tokens provided for multicast notification")
            return {"success_count": 0, "failure_count": 0}
        
        # Filter out None/empty tokens
        valid_tokens = [token for token in tokens if token]
        
        if not valid_tokens:
            print("❌ No valid FCM tokens found")
            return {"success_count": 0, "failure_count": 0}
        
        # Create the message
        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body
            ),
            data=data or {},
            tokens=valid_tokens
        )
        
        # Send the message
        response = messaging.send_multicast(message)
        
        print(f"✅ Multicast notification sent:")
        print(f"   Success: {response.success_count}")
        print(f"   Failure: {response.failure_count}")
        
        return {
            "success_count": response.success_count,
            "failure_count": response.failure_count
        }
        
    except Exception as e:
        print(f"❌ Error sending multicast notification: {e}")
        return {"success_count": 0, "failure_count": len(tokens)}

def send_event_reminder_notification(user_tokens, event_title, event_time, event_id):
    """
    Send event reminder notifications
    
    Args:
        user_tokens (list): List of user FCM tokens
        event_title (str): Event title
        event_time (str): Event time
        event_id (int): Event ID
    
    Returns:
        dict: Results of the notification send
    """
    title = f"📅 Event Reminder: {event_title}"
    body = f"Your event starts at {event_time}"
    data = {
        "event_id": str(event_id),
        "type": "event_reminder",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    return send_multicast_notification(user_tokens, title, body, data) 