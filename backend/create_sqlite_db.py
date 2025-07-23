#!/usr/bin/env python3
"""
SQLite Database Setup - Simple and Reliable
No network issues, works immediately
"""

import sqlite3
import os
import hashlib
from datetime import datetime

def create_database():
    """Create SQLite database with users and events tables"""
    
    # Delete existing database to start fresh
    if os.path.exists('calendar_app.db'):
        os.remove('calendar_app.db')
        print("🗑️ Removed existing database")
    
    # Create new database
    conn = sqlite3.connect('calendar_app.db')
    cursor = conn.cursor()
    
    print("📊 Creating SQLite database...")
    
    # Create users table with signup functionality
    cursor.execute('''
    CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'employee',
        created_at TEXT NOT NULL,
        is_active BOOLEAN DEFAULT 1
    )
    ''')
    print("✅ Created users table")
    
    # Create events table
    cursor.execute('''
    CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        start_datetime TEXT NOT NULL,
        end_datetime TEXT NOT NULL,
        created_by INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (created_by) REFERENCES users (id)
    )
    ''')
    print("✅ Created events table")
    
    # Create a test admin user
    admin_password = hashlib.sha256("admin123".encode()).hexdigest()
    cursor.execute('''
    INSERT INTO users (email, password_hash, first_name, last_name, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        'admin@test.com',
        admin_password,
        'Admin',
        'User',
        'admin',
        datetime.utcnow().isoformat()
    ))
    
    # Create a test employee user  
    employee_password = hashlib.sha256("employee123".encode()).hexdigest()
    cursor.execute('''
    INSERT INTO users (email, password_hash, first_name, last_name, role, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ''', (
        'employee@test.com',
        employee_password,
        'John',
        'Employee',
        'employee',
        datetime.utcnow().isoformat()
    ))
    
    conn.commit()
    conn.close()
    
    print("\n✅ SQLite database created successfully!")
    print("👤 Test users created:")
    print("   Admin: admin@test.com / admin123")
    print("   Employee: employee@test.com / employee123")
    print("\n🚀 This will work immediately - no network issues!")
    return True

def test_database():
    """Test the database connection and operations"""
    try:
        conn = sqlite3.connect('calendar_app.db')
        cursor = conn.cursor()
        
        # Test users
        users = cursor.execute('SELECT email, first_name, last_name, role FROM users').fetchall()
        print(f"\n📋 Users in database: {len(users)}")
        for user in users:
            print(f"   {user[0]} - {user[1]} {user[2]} ({user[3]})")
        
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Database test failed: {e}")
        return False

if __name__ == "__main__":
    if create_database():
        test_database()
        print("\n✨ Ready to create Flask app with SQLite!")
        print("This is much more reliable than MongoDB Atlas for development.")
