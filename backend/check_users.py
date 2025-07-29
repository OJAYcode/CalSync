#!/usr/bin/env python3
"""
Simple script to check all users in the database
"""

import sqlite3
from database import db

def check_users():
    """Check all users in the database"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id, email, first_name, last_name, role, created_at FROM users ORDER BY id')
        users = cursor.fetchall()
        
        print(f"📊 Total users in database: {len(users)}")
        print("\n👤 All users:")
        print("-" * 80)
        print(f"{'ID':<3} {'Email':<30} {'Name':<20} {'Role':<10} {'Created'}")
        print("-" * 80)
        
        for user in users:
            user_id, email, first_name, last_name, role, created_at = user
            full_name = f"{first_name} {last_name}"
            print(f"{user_id:<3} {email:<30} {full_name:<20} {role:<10} {created_at}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error checking users: {e}")

if __name__ == "__main__":
    check_users() 