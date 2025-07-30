#!/usr/bin/env python3
"""
Check and delete all users
"""

import sqlite3

print("🔍 Checking database for users...")

try:
    conn = sqlite3.connect('calendar_app.db')
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    # Show all users first
    cursor.execute('SELECT * FROM users')
    users = cursor.fetchall()
    
    print(f"📊 Found {len(users)} users in database:")
    for user in users:
        print(f"  - ID: {user['id']}, Email: {user['email']}, Role: {user['role']}")
    
    if len(users) > 0:
        print("\n🗑️ Deleting all users...")
        
        # Delete all users
        cursor.execute('DELETE FROM users')
        deleted_count = cursor.rowcount
        
        # Reset auto-increment
        cursor.execute('DELETE FROM sqlite_sequence WHERE name="users"')
        
        conn.commit()
        print(f"✅ Deleted {deleted_count} users")
    else:
        print("✅ No users to delete")
    
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc() 