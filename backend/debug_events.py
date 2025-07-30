#!/usr/bin/env python3
"""
Debug Events Issue
"""

import sqlite3

def debug_events():
    """Debug the events issue"""
    print("🔍 Debugging events issue...")
    
    try:
        conn = sqlite3.connect('calendar_app.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Test 1: Raw events query
        print("\n1️⃣ Raw events query:")
        cursor.execute('SELECT * FROM events')
        events = cursor.fetchall()
        print(f"Found {len(events)} events")
        
        for event in events:
            print(f"  - ID: {event['id']}, Title: {event['title']}, Created by: {event['created_by']}")
        
        # Test 2: Events with user JOIN
        print("\n2️⃣ Events with user JOIN:")
        cursor.execute('''
            SELECT 
                e.id, e.title, e.description, e.start_datetime, e.end_datetime,
                e.created_by, e.created_at, e.timezone,
                u.first_name, u.last_name, u.email
            FROM events e
            LEFT JOIN users u ON e.created_by = u.id
            ORDER BY e.start_datetime ASC
        ''')
        
        events_with_users = cursor.fetchall()
        print(f"Found {len(events_with_users)} events with user data")
        
        for event in events_with_users:
            print(f"  - ID: {event['id']}, Title: {event['title']}")
            print(f"    Created by: {event['created_by']}")
            print(f"    User: {event['first_name']} {event['last_name']} ({event['email']})")
            print(f"    Timezone: {event['timezone']}")
            print("    ---")
        
        # Test 3: Check timezone utils
        print("\n3️⃣ Testing timezone conversion:")
        try:
            from timezone_utils import timezone_utils
            
            for event in events_with_users:
                event_timezone = event.get('timezone', 'UTC')
                print(f"  Converting event {event['id']} from timezone: {event_timezone}")
                
                try:
                    start_local = timezone_utils.convert_to_local_time(event['start_datetime'], event_timezone)
                    end_local = timezone_utils.convert_to_local_time(event['end_datetime'], event_timezone)
                    print(f"    ✅ Success: {start_local} -> {end_local}")
                except Exception as e:
                    print(f"    ❌ Error: {e}")
                    
        except Exception as e:
            print(f"❌ Timezone utils error: {e}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_events() 