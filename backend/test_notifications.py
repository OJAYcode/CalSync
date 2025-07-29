#!/usr/bin/env python3
"""
Test script for the new notification system
"""

from notification_service import notification_service
from database import db
import json

def test_notification_system():
    """Test the notification system"""
    print("🧪 Testing Notification System")
    print("=" * 50)
    
    # Test 1: Create a test notification
    print("\n1️⃣ Testing notification creation...")
    notification_id = notification_service.create_notification(
        user_id=1,  # Assuming user ID 1 exists
        title="Test Notification",
        message="This is a test notification from the new system",
        notification_type="test"
    )
    
    if notification_id:
        print(f"✅ Test notification created with ID: {notification_id}")
    else:
        print("❌ Failed to create test notification")
    
    # Test 2: Check notifications in database
    print("\n2️⃣ Checking notifications in database...")
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, user_id, title, message, notification_type, is_read, is_sent, created_at
            FROM notifications ORDER BY created_at DESC LIMIT 5
        ''')
        
        notifications = cursor.fetchall()
        conn.close()
        
        print(f"📊 Found {len(notifications)} notifications in database:")
        for notif in notifications:
            print(f"   ID: {notif['id']}, User: {notif['user_id']}, Title: {notif['title']}, Type: {notif['notification_type']}")
            
    except Exception as e:
        print(f"❌ Error checking notifications: {e}")
    
    # Test 3: Test system notification (without sending)
    print("\n3️⃣ Testing system notification creation...")
    try:
        # Get all users
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id, email, first_name, last_name FROM users WHERE is_active = 1')
        users = cursor.fetchall()
        conn.close()
        
        print(f"👥 Found {len(users)} active users:")
        for user in users:
            print(f"   {user['first_name']} {user['last_name']} ({user['email']})")
        
        # Create system notification for each user
        for user in users:
            notification_id = notification_service.create_notification(
                user_id=user['id'],
                title="System Test",
                message="This is a test system notification",
                notification_type="system"
            )
            if notification_id:
                print(f"✅ Created system notification for {user['first_name']}")
        
    except Exception as e:
        print(f"❌ Error testing system notifications: {e}")
    
    # Test 4: Check notification counts
    print("\n4️⃣ Checking notification statistics...")
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Total notifications
        cursor.execute('SELECT COUNT(*) as total FROM notifications')
        total = cursor.fetchone()['total']
        
        # Unread notifications
        cursor.execute('SELECT COUNT(*) as unread FROM notifications WHERE is_read = 0')
        unread = cursor.fetchone()['unread']
        
        # Sent notifications
        cursor.execute('SELECT COUNT(*) as sent FROM notifications WHERE is_sent = 1')
        sent = cursor.fetchone()['sent']
        
        conn.close()
        
        print(f"📊 Notification Statistics:")
        print(f"   Total: {total}")
        print(f"   Unread: {unread}")
        print(f"   Sent: {sent}")
        
    except Exception as e:
        print(f"❌ Error checking statistics: {e}")
    
    print("\n✅ Notification system test completed!")
    print("\n📝 Next steps:")
    print("   1. Configure email settings in config.env")
    print("   2. Configure Firebase for push notifications")
    print("   3. Test with real event reminders")

if __name__ == "__main__":
    test_notification_system() 