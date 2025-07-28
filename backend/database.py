#!/usr/bin/env python3
"""
SQLite Database Setup for Calendar App
Simple, reliable, works everywhere
"""

import sqlite3
import os
from datetime import datetime

class Database:
    def __init__(self, db_path='calendar_app.db'):
        self.db_path = db_path
        self.init_database()
    
    def get_connection(self):
        """Get database connection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row  # Enable column access by name
        return conn
    
    def init_database(self):
        """Initialize database with tables"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'employee',
            is_active BOOLEAN DEFAULT 1,
            fcm_token TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        # Create events table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            start_datetime TEXT NOT NULL,
            end_datetime TEXT NOT NULL,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
        ''')
        
        # Create departments table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE
        )
        ''')
        # Insert default departments if table is empty
        cursor.execute('SELECT COUNT(*) FROM departments')
        count = cursor.fetchone()[0]
        if count == 0:
            default_departments = [
                'HR', 'IT', 'Marketing', 'Sales', 'Finance', 'Operations', 'Legal', 'R&D'
            ]
            cursor.executemany('INSERT INTO departments (name) VALUES (?)', [(d,) for d in default_departments])
            print("Inserted default departments:", default_departments)
        else:
            cursor.execute('SELECT name FROM departments')
            print("Departments already in DB:", [row[0] for row in cursor.fetchall()])
        
        # Create notifications table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            user_id INTEGER,
            notify_at TEXT NOT NULL,
            sent BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (event_id) REFERENCES events (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        ''')
        
        # Create department_feeds table
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS department_feeds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            department TEXT NOT NULL,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ SQLite database initialized successfully!")
    
    def reset_database(self):
        """Reset database (delete and recreate)"""
        if os.path.exists(self.db_path):
            os.remove(self.db_path)
            print(f"🗑️ Deleted existing database: {self.db_path}")
        
        self.init_database()
        print("🔄 Database reset complete!")

# Global database instance
db = Database()

if __name__ == "__main__":
    # Test the database
    print("🧪 Testing SQLite database...")
    test_db = Database('test_calendar.db')
    print("✅ Database test successful!")
    
    # Clean up test database
    if os.path.exists('test_calendar.db'):
        os.remove('test_calendar.db')
        print("🧹 Test database cleaned up!")
