#!/usr/bin/env python3
"""
Test script for automatic event cleanup
Creates events with past end times to test cleanup functionality
"""

import sqlite3
from datetime import datetime, timezone, timedelta
from database import db
from auto_cleanup_events import auto_cleanup

def create_test_events():
    """Create test events with past end times"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Get current time
        now = datetime.now(timezone.utc)
        
        # Create events that ended in the past
        test_events = [
            {
                'title': 'Test Event 1 - Past',
                'description': 'This event ended 1 hour ago',
                'start_datetime': (now - timedelta(hours=2)).isoformat(),
                'end_datetime': (now - timedelta(hours=1)).isoformat(),
                'created_by': 1,
                'timezone': 'UTC'
            },
            {
                'title': 'Test Event 2 - Past',
                'description': 'This event ended 30 minutes ago',
                'start_datetime': (now - timedelta(hours=1)).isoformat(),
                'end_datetime': (now - timedelta(minutes=30)).isoformat(),
                'created_by': 1,
                'timezone': 'UTC'
            },
            {
                'title': 'Test Event 3 - Future',
                'description': 'This event will end in 1 hour',
                'start_datetime': now.isoformat(),
                'end_datetime': (now + timedelta(hours=1)).isoformat(),
                'created_by': 1,
                'timezone': 'UTC'
            }
        ]
        
        print("📝 Creating test events...")
        
        for event in test_events:
            cursor.execute('''
                INSERT INTO events (title, description, start_datetime, end_datetime, created_by, timezone, created_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ''', (
                event['title'],
                event['description'],
                event['start_datetime'],
                event['end_datetime'],
                event['created_by'],
                event['timezone']
            ))
            print(f"✅ Created: {event['title']} (Ends: {event['end_datetime']})")
        
        conn.commit()
        conn.close()
        
        print(f"🎉 Created {len(test_events)} test events")
        
    except Exception as e:
        print(f"❌ Error creating test events: {e}")

def check_events():
    """Check all events in database"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, title, end_datetime, created_at
            FROM events 
            ORDER BY end_datetime ASC
        ''')
        
        events = cursor.fetchall()
        conn.close()
        
        print(f"\n📊 Total events in database: {len(events)}")
        for event in events:
            print(f"  - {event['title']} (ID: {event['id']}, Ends: {event['end_datetime']})")
        
        return events
        
    except Exception as e:
        print(f"❌ Error checking events: {e}")
        return []

def main():
    """Main test function"""
    print("🧪 Testing Automatic Event Cleanup System")
    print("=" * 50)
    
    # Check current events
    print("\n📋 Current events:")
    current_events = check_events()
    
    # Check expired events
    expired_count = auto_cleanup.get_expired_events_count()
    print(f"\n📊 Expired events: {expired_count}")
    
    if expired_count > 0:
        expired_events = auto_cleanup.list_expired_events()
        for event in expired_events:
            print(f"  - {event['title']} (ID: {event['id']}, Ended: {event['end_datetime']})")
    
    print("\n🔧 Test Options:")
    print("1. Create test events (2 past, 1 future)")
    print("2. Clean up expired events")
    print("3. Check all events")
    print("4. Exit")
    
    while True:
        choice = input("\nEnter your choice (1-4): ").strip()
        
        if choice == "1":
            create_test_events()
            print("\n📋 Updated events:")
            check_events()
        
        elif choice == "2":
            auto_cleanup.cleanup_all_expired_events_now()
            print("\n📋 Remaining events:")
            check_events()
        
        elif choice == "3":
            print("\n📋 Current events:")
            check_events()
        
        elif choice == "4":
            print("👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid choice. Please enter 1-4.")

if __name__ == "__main__":
    main() 