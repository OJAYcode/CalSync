#!/usr/bin/env python3
"""
Persistent User Backup System for CalSync
This script ensures user data persists across deployments and updates
"""

import sqlite3
import os
import json
import hashlib
import secrets
from datetime import datetime
import shutil

class PersistentUserBackup:
    def __init__(self, db_path='calendar_app.db'):
        self.db_path = db_path
        self.backup_dir = 'user_backups'
        self.backup_file = os.path.join(self.backup_dir, 'users_backup.json')
        
        # Create backup directory if it doesn't exist
        if not os.path.exists(self.backup_dir):
            os.makedirs(self.backup_dir)
    
    def backup_users(self):
        """Backup all users to JSON file"""
        try:
            if not os.path.exists(self.db_path):
                print("❌ Database not found. Cannot backup users.")
                return False
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get all users
            cursor.execute('''
                SELECT id, email, password_hash, first_name, last_name, role, 
                       is_active, fcm_token, created_at, updated_at
                FROM users
            ''')
            users = cursor.fetchall()
            
            # Convert to list of dictionaries
            user_data = []
            for user in users:
                user_data.append({
                    'id': user[0],
                    'email': user[1],
                    'password_hash': user[2],
                    'first_name': user[3],
                    'last_name': user[4],
                    'role': user[5],
                    'is_active': user[6],
                    'fcm_token': user[7],
                    'created_at': user[8],
                    'updated_at': user[9]
                })
            
            # Save to JSON file
            with open(self.backup_file, 'w') as f:
                json.dump(user_data, f, indent=2)
            
            conn.close()
            
            print(f"✅ Backed up {len(users)} users to {self.backup_file}")
            return True
            
        except Exception as e:
            print(f"❌ Backup failed: {str(e)}")
            return False
    
    def restore_users(self):
        """Restore users from backup file"""
        try:
            if not os.path.exists(self.backup_file):
                print("❌ Backup file not found. Cannot restore users.")
                return False
            
            # Read backup data
            with open(self.backup_file, 'r') as f:
                user_data = json.load(f)
            
            if not user_data:
                print("❌ No user data found in backup file.")
                return False
            
            # Ensure database exists
            if not os.path.exists(self.db_path):
                print("❌ Database not found. Cannot restore users.")
                return False
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Ensure users table exists
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
            
            # Check existing users
            cursor.execute('SELECT email FROM users')
            existing_emails = [row[0] for row in cursor.fetchall()]
            
            restored_count = 0
            for user in user_data:
                email = user['email']
                
                # Skip if user already exists
                if email in existing_emails:
                    continue
                
                # Insert user
                cursor.execute('''
                    INSERT INTO users (
                        email, password_hash, first_name, last_name, role,
                        is_active, fcm_token, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    user['email'],
                    user['password_hash'],
                    user['first_name'],
                    user['last_name'],
                    user['role'],
                    user['is_active'],
                    user['fcm_token'],
                    user['created_at'],
                    user['updated_at']
                ))
                
                restored_count += 1
                print(f"   ✅ Restored user: {email}")
            
            conn.commit()
            conn.close()
            
            print(f"✅ Restored {restored_count} users from backup")
            return True
            
        except Exception as e:
            print(f"❌ Restore failed: {str(e)}")
            return False
    
    def create_default_users(self):
        """Create default users if no users exist"""
        try:
            if not os.path.exists(self.db_path):
                print("❌ Database not found. Cannot create default users.")
                return False
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Check if any users exist
            cursor.execute('SELECT COUNT(*) FROM users')
            user_count = cursor.fetchone()[0]
            
            if user_count > 0:
                print(f"✅ {user_count} users already exist. No need to create defaults.")
                conn.close()
                return True
            
            # Create default users
            default_users = [
                {
                    'email': 'admin@company.com',
                    'password': 'admin123',
                    'first_name': 'System',
                    'last_name': 'Administrator',
                    'role': 'admin'
                },
                {
                    'email': 'john.doe@company.com',
                    'password': 'password123',
                    'first_name': 'John',
                    'last_name': 'Doe',
                    'role': 'employee'
                },
                {
                    'email': 'jane.smith@company.com',
                    'password': 'password123',
                    'first_name': 'Jane',
                    'last_name': 'Smith',
                    'role': 'employee'
                }
            ]
            
            for user_data in default_users:
                # Hash password
                password_hash = hashlib.sha256(user_data['password'].encode()).hexdigest()
                
                cursor.execute('''
                    INSERT INTO users (
                        email, password_hash, first_name, last_name, role,
                        created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ''', (
                    user_data['email'],
                    password_hash,
                    user_data['first_name'],
                    user_data['last_name'],
                    user_data['role'],
                    datetime.utcnow().isoformat(),
                    datetime.utcnow().isoformat()
                ))
                
                print(f"   ➕ Created user: {user_data['email']} / {user_data['password']}")
            
            conn.commit()
            conn.close()
            
            print("✅ Default users created successfully")
            return True
            
        except Exception as e:
            print(f"❌ Failed to create default users: {str(e)}")
            return False
    
    def preserve_user_passwords(self):
        """Preserve user passwords by ensuring they're not overwritten"""
        try:
            if not os.path.exists(self.db_path):
                print("❌ Database not found. Cannot preserve passwords.")
                return False
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get all users
            cursor.execute('SELECT id, email, password_hash, first_name, last_name, role FROM users')
            users = cursor.fetchall()
            
            if not users:
                print("❌ No users found to preserve passwords.")
                conn.close()
                return False
            
            print(f"🔒 Preserving passwords for {len(users)} users...")
            
            # Check if any users have empty or invalid password hashes
            users_needing_password = []
            for user in users:
                user_id, email, password_hash, first_name, last_name, role = user
                
                # If password hash is empty or too short, mark for password assignment
                if not password_hash or len(password_hash) < 10:
                    users_needing_password.append(user)
            
            if users_needing_password:
                print(f"⚠️ Found {len(users_needing_password)} users with missing passwords")
                
                # Define password mapping based on role for users with missing passwords
                password_mapping = {
                    'admin': 'admin123',
                    'employee': 'password123'
                }
                
                for user in users_needing_password:
                    user_id, email, password_hash, first_name, last_name, role = user
                    
                    # Determine password based on role
                    password = password_mapping.get(role, 'password123')
                    
                    # Hash the password
                    new_password_hash = hashlib.sha256(password.encode()).hexdigest()
                    
                    # Update the user's password
                    cursor.execute('''
                        UPDATE users 
                        SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
                        WHERE id = ?
                    ''', (new_password_hash, user_id))
                    
                    print(f"   🔑 {email} - Assigned password: {password}")
            else:
                print("✅ All users have valid passwords - no changes needed")
            
            conn.commit()
            conn.close()
            
            return True
            
        except Exception as e:
            print(f"❌ Failed to preserve passwords: {str(e)}")
            return False
    
    def backup_database(self):
        """Create a complete database backup"""
        try:
            if not os.path.exists(self.db_path):
                print("❌ Database not found. Cannot create backup.")
                return False
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_path = f"{self.db_path}.backup_{timestamp}"
            
            shutil.copy2(self.db_path, backup_path)
            print(f"✅ Database backed up to: {backup_path}")
            return True
            
        except Exception as e:
            print(f"❌ Database backup failed: {str(e)}")
            return False

def main():
    """Main function to run backup/restore operations"""
    backup_system = PersistentUserBackup()
    
    print("🔄 Persistent User Backup System")
    print("=" * 40)
    
    # Always backup current users first
    print("\n1️⃣ Backing up current users...")
    backup_system.backup_users()
    
    # Create database backup
    print("\n2️⃣ Creating database backup...")
    backup_system.backup_database()
    
    # Restore users from backup
    print("\n3️⃣ Restoring users from backup...")
    backup_system.restore_users()
    
    # Create default users if none exist
    print("\n4️⃣ Ensuring default users exist...")
    backup_system.create_default_users()
    
    # Preserve user passwords (only fix missing ones)
    print("\n5️⃣ Preserving user passwords...")
    backup_system.preserve_user_passwords()
    
    print("\n✅ Persistent user backup system completed!")
    print("\n📋 User Password Status:")
    print("   ✅ Original signup passwords are preserved")
    print("   ✅ Users can log in with their original credentials")
    print("   ✅ Only users with missing passwords get default passwords")

if __name__ == '__main__':
    main() 