#!/usr/bin/env python3
"""
Test script for notification system
Run this to check if notifications are working properly
"""

import sqlite3
from datetime import datetime, timedelta

def test_notifications():
    """Test the notification system"""
    print("🔔 Testing Notification System")
    print("=" * 40)
    
    # Connect to database
    conn = sqlite3.connect('calendar_app.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Check notifications table
    print("\n📊 Current Notifications:")
    cursor.execute('''
        SELECT n.id, n.event_id, n.user_id, n.notify_at, n.sent, n.read, e.title
        FROM notifications n
        JOIN events e ON n.event_id = e.id
        ORDER BY n.notify_at DESC
        LIMIT 10
    ''')
    
    notifications = cursor.fetchall()
    if notifications:
        for notif in notifications:
            status = "✅ Sent" if notif['sent'] else "⏳ Pending"
            read_status = "📖 Read" if notif['read'] else "📬 Unread"
            print(f"ID: {notif['id']} | Event: {notif['title']} | {status} | {read_status}")
            print(f"   Notify at: {notif['notify_at']}")
    else:
        print("❌ No notifications found")
    
    # Check events
    print("\n📅 Recent Events:")
    cursor.execute('''
        SELECT id, title, start_datetime, created_at
        FROM events
        ORDER BY created_at DESC
        LIMIT 5
    ''')
    
    events = cursor.fetchall()
    if events:
        for event in events:
            print(f"ID: {event['id']} | {event['title']}")
            print(f"   Start: {event['start_datetime']}")
    else:
        print("❌ No events found")
    
    # Check users
    print("\n👥 Users:")
    cursor.execute('SELECT id, email, first_name, last_name FROM users LIMIT 5')
    users = cursor.fetchall()
    if users:
        for user in users:
            print(f"ID: {user['id']} | {user['first_name']} {user['last_name']} ({user['email']})")
    else:
        print("❌ No users found")
    
    # Test notification creation
    print("\n🧪 Creating Test Notification:")
    try:
        # Get first user and event
        cursor.execute('SELECT id FROM users LIMIT 1')
        user = cursor.fetchone()
        cursor.execute('SELECT id, start_datetime FROM events LIMIT 1')
        event = cursor.fetchone()
        
        if user and event:
            # Create a test notification for 1 minute from now
            test_time = (datetime.utcnow() + timedelta(minutes=1)).isoformat()
            cursor.execute('''
                INSERT INTO notifications (event_id, user_id, notify_at, sent, read)
                VALUES (?, ?, ?, 0, 0)
            ''', (event['id'], user['id'], test_time))
            conn.commit()
            print(f"✅ Created test notification for user {user['id']}, event {event['id']}")
            print(f"   Will trigger at: {test_time}")
        else:
            print("❌ Need at least one user and event to create test notification")
    except Exception as e:
        print(f"❌ Error creating test notification: {e}")
    
    conn.close()
    print("\n" + "=" * 40)
    print("🎯 Next steps:")
    print("1. Wait 1-2 minutes for the scheduler to run")
    print("2. Check Railway logs for notification messages")
    print("3. Check your app's notification page")

if __name__ == "__main__":
    test_notifications() 