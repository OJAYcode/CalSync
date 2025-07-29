#!/usr/bin/env python3
"""
Database Migration Script for CalSync
This script ensures user credentials persist across deployments and updates
password hashing to be consistent.
"""

import sqlite3
import os
import hashlib
import secrets
from datetime import datetime

def hash_password_with_salt(password):
    """Hash password using SHA256 with salt (new method)"""
    salt = secrets.token_hex(32)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${password_hash}"

def hash_password_old(password):
    """Hash password using simple SHA256 (old method)"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hashed_password):
    """Verify password against hash (supports both old and new methods)"""
    try:
        # Check if it's the new salted format
        if '$' in hashed_password:
            salt, stored_hash = hashed_password.split('$')
            password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
            return password_hash == stored_hash
        else:
            # Old format - simple SHA256
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            return password_hash == hashed_password
    except:
        return False

def migrate_database():
    """Migrate the database to ensure user credentials persist"""
    
    db_path = 'calendar_app.db'
    
    # Check if database exists
    if not os.path.exists(db_path):
        print("❌ Database not found. Please run the app first to create the database.")
        return False
    
    print("🔄 Starting database migration...")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if users table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
        if not cursor.fetchone():
            print("❌ Users table not found. Database may be corrupted.")
            return False
        
        # Get all existing users
        cursor.execute('SELECT id, email, password_hash, first_name, last_name, role, is_active FROM users')
        users = cursor.fetchall()
        
        print(f"📊 Found {len(users)} existing users")
        
        # Check if we need to migrate passwords
        migration_needed = False
        for user in users:
            user_id, email, password_hash, first_name, last_name, role, is_active = user
            if '$' not in password_hash:
                migration_needed = True
                break
        
        if not migration_needed:
            print("✅ Database is already up to date. No migration needed.")
            return True
        
        print("🔄 Migrating password hashes to new salted format...")
        
        # Create a backup of the database
        backup_path = f"{db_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        import shutil
        shutil.copy2(db_path, backup_path)
        print(f"💾 Database backed up to: {backup_path}")
        
        # Update password hashes for existing users
        updated_count = 0
        for user in users:
            user_id, email, password_hash, first_name, last_name, role, is_active = user
            
            # Skip if already using new format
            if '$' in password_hash:
                continue
            
            # For existing users, we can't recover the original password
            # So we'll set a default password that they can change later
            # We'll use a combination of their email and a default password
            default_password = "ChangeMe123!"
            new_hash = hash_password_with_salt(default_password)
            
            cursor.execute('''
                UPDATE users 
                SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            ''', (new_hash, user_id))
            
            updated_count += 1
            print(f"   🔄 Updated user: {email} (default password: {default_password})")
        
        # Ensure we have default admin and test users if they don't exist
        cursor.execute('SELECT email FROM users WHERE email IN (?, ?)', 
                      ('admin@test.com', 'employee@test.com'))
        existing_emails = [row[0] for row in cursor.fetchall()]
        
        # Add default admin if not exists
        if 'admin@test.com' not in existing_emails:
            admin_hash = hash_password_with_salt('admin123')
            cursor.execute('''
                INSERT INTO users (email, password_hash, first_name, last_name, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                'admin@test.com',
                admin_hash,
                'Admin',
                'User',
                'admin',
                datetime.utcnow().isoformat()
            ))
            print("   ➕ Added default admin: admin@test.com / admin123")
        
        # Add default employee if not exists
        if 'employee@test.com' not in existing_emails:
            employee_hash = hash_password_with_salt('employee123')
            cursor.execute('''
                INSERT INTO users (email, password_hash, first_name, last_name, role, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                'employee@test.com',
                employee_hash,
                'John',
                'Employee',
                'employee',
                datetime.utcnow().isoformat()
            ))
            print("   ➕ Added default employee: employee@test.com / employee123")
        
        # Ensure all required tables exist
        ensure_tables_exist(cursor)
        
        conn.commit()
        conn.close()
        
        print(f"✅ Migration completed successfully!")
        print(f"   🔄 Updated {updated_count} user passwords")
        print(f"   💾 Database backed up to: {backup_path}")
        print("\n📋 Default login credentials:")
        print("   Admin: admin@test.com / admin123")
        print("   Employee: employee@test.com / employee123")
        print("\n⚠️  IMPORTANT: Users with migrated passwords need to reset their password!")
        print("   They can use the 'Forgot Password' feature or contact an admin.")
        
        return True
        
    except Exception as e:
        print(f"❌ Migration failed: {str(e)}")
        return False

def ensure_tables_exist(cursor):
    """Ensure all required tables exist with proper structure"""
    
    # Users table
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
    
    # Events table
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
    
    # Departments table
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
        print("   ➕ Added default departments")
    
    # Notifications table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id INTEGER NOT NULL,
        user_id INTEGER,
        notify_at TEXT NOT NULL,
        sent BOOLEAN DEFAULT 0,
        read BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events (id),
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Department feeds table
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

def show_database_info():
    """Show current database information"""
    db_path = 'calendar_app.db'
    
    if not os.path.exists(db_path):
        print("❌ Database not found")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get user count
        cursor.execute('SELECT COUNT(*) FROM users')
        user_count = cursor.fetchone()[0]
        
        # Get users with their password hash format
        cursor.execute('SELECT email, password_hash FROM users')
        users = cursor.fetchall()
        
        print(f"📊 Database Information:")
        print(f"   📁 Database file: {db_path}")
        print(f"   👥 Total users: {user_count}")
        print(f"   📅 Last modified: {datetime.fromtimestamp(os.path.getmtime(db_path))}")
        
        print(f"\n👤 Users in database:")
        for email, password_hash in users:
            hash_type = "Salted" if '$' in password_hash else "Legacy"
            print(f"   {email} ({hash_type})")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ Error reading database: {str(e)}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "migrate":
            migrate_database()
        elif command == "info":
            show_database_info()
        elif command == "backup":
            db_path = 'calendar_app.db'
            if os.path.exists(db_path):
                backup_path = f"{db_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                import shutil
                shutil.copy2(db_path, backup_path)
                print(f"✅ Database backed up to: {backup_path}")
            else:
                print("❌ Database not found")
        else:
            print("Usage: python migrate_database.py [migrate|info|backup]")
    else:
        print("🔄 Running database migration...")
        migrate_database() 