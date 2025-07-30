#!/usr/bin/env python3
"""
Clear All Users from Database
Deletes all users from the database
"""

import sqlite3
import os

def clear_all_users():
    """Delete all users from the database"""
    try:
        print("🗑️ Clearing all users from database...")
        
        # Check if database file exists
        if not os.path.exists('calendar_app.db'):
            print("❌ Database file not found: calendar_app.db")
            return False
        
        print("📁 Database file found")
        
        # Connect to database
        conn = sqlite3.connect('calendar_app.db')
        cursor = conn.cursor()
        
        print("🔗 Connected to database")
        
        # Check if users table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            print("❌ Users table not found")
            conn.close()
            return False
        
        print("📋 Users table found")
        
        # Get count of users before deletion
        cursor.execute('SELECT COUNT(*) FROM users')
        user_count = cursor.fetchone()[0]
        
        print(f"📊 Found {user_count} users in database")
        
        if user_count == 0:
            print("✅ No users to delete")
            conn.close()
            return True
        
        # Delete all users
        cursor.execute('DELETE FROM users')
        deleted_count = cursor.rowcount
        
        print(f"🗑️ Deleted {deleted_count} users")
        
        # Reset auto-increment counter
        cursor.execute('DELETE FROM sqlite_sequence WHERE name="users"')
        print("🔄 Reset auto-increment counter")
        
        conn.commit()
        conn.close()
        
        print(f"✅ Successfully deleted {deleted_count} users")
        print("🗑️ Database is now empty")
        
        return True
        
    except Exception as e:
        print(f"❌ Error clearing users: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🚀 Starting user deletion process...")
    success = clear_all_users()
    if success:
        print("🎉 User deletion completed successfully!")
    else:
        print("💥 User deletion failed!") 