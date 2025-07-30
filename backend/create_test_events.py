#!/usr/bin/env python3
"""
Create test events with past end times to test automatic cleanup
"""

import sqlite3
from datetime import datetime, timezone, timedelta
from database import db

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
                INSERT INTO events (title, description, start_datetime, end_datetime, created_by, created_at)
                VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ''', (
                event['title'],
                event['description'],
                event['start_datetime'],
                event['end_datetime'],
                event['created_by']
            ))
            print(f"✅ Created: {event['title']} (Ends: {event['end_datetime']})")
        
        conn.commit()
        conn.close()
        
        print(f"🎉 Created {len(test_events)} test events")
        
    except Exception as e:
        print(f"❌ Error creating test events: {e}")

if __name__ == "__main__":
    create_test_events() 