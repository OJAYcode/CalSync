#!/usr/bin/env python3
"""
Test department feeds table creation
"""

import sqlite3

def test_department_feeds():
    """Test department feeds table"""
    try:
        # Connect to database
        conn = sqlite3.connect('calendar_app.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        print("🔍 Checking department_feeds table...")
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='department_feeds'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            print("📝 Creating department_feeds table...")
            
            # Create department_feeds table
            cursor.execute('''
                CREATE TABLE department_feeds (
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
            print("✅ Department feeds table created successfully")
        else:
            print("✅ Department feeds table already exists")
        
        # Show all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        print(f"📋 All tables: {[table['name'] for table in tables]}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_department_feeds() 