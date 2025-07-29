#!/usr/bin/env python3
"""
Create department_feeds table if it doesn't exist
"""

from database import db

def create_department_feeds_table():
    """Create the department_feeds table if it doesn't exist"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='department_feeds'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
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
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating department_feeds table: {e}")
        return False

if __name__ == "__main__":
    create_department_feeds_table() 