#!/usr/bin/env python3
"""
Simple script to delete all users
"""

import sqlite3

print("🗑️ Deleting all users...")

try:
    # Connect and delete
    conn = sqlite3.connect('calendar_app.db')
    cursor = conn.cursor()
    
    # Count users
    cursor.execute('SELECT COUNT(*) FROM users')
    count = cursor.fetchone()[0]
    print(f"Found {count} users")
    
    # Delete all users
    cursor.execute('DELETE FROM users')
    print(f"Deleted {cursor.rowcount} users")
    
    # Reset counter
    cursor.execute('DELETE FROM sqlite_sequence WHERE name="users"')
    
    conn.commit()
    conn.close()
    
    print("✅ All users deleted successfully!")
    
except Exception as e:
    print(f"Error: {e}") 