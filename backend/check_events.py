#!/usr/bin/env python3
"""
Check events in database
"""

import sqlite3

print("🔍 Checking events in database...")

try:
    conn = sqlite3.connect('calendar_app.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Check if events table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='events'")
    if not cursor.fetchone():
        print("❌ Events table not found")
        conn.close()
        exit()
    
    # Get all events
    cursor.execute('SELECT * FROM events ORDER BY start_datetime')
    events = cursor.fetchall()
    
    print(f"📊 Found {len(events)} events in database:")
    
    if len(events) == 0:
        print("✅ No events found - that's why you don't see delete buttons!")
    else:
        for event in events:
            print(f"  - ID: {event['id']}")
            print(f"    Title: {event['title']}")
            print(f"    Start: {event['start_datetime']}")
            print(f"    End: {event['end_datetime']}")
            print(f"    Created by: {event['created_by']}")
            print(f"    Description: {event['description'][:50]}...")
            print("    ---")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}") 