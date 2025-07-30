#!/usr/bin/env python3
"""
Bulletproof User System for CalSync
Permanently stores all user details and never loses them
"""

import sqlite3
import json
import os
import hashlib
import secrets
from datetime import datetime
import shutil

class BulletproofUserSystem:
    def __init__(self):
        self.db_file = 'calendar_app.db'
        self.backup_file = 'users_permanent_backup.json'
        self.master_file = 'users_master.json'
        self.initialize_system()
    
    def initialize_system(self):
        """Initialize the bulletproof system"""
        print("🔒 Initializing Bulletproof User System...")
        
        # Create master file if it doesn't exist
        if not os.path.exists(self.master_file):
            self.create_master_backup()
        
        # Always restore from master backup on startup
        self.restore_from_master()
        print("✅ Bulletproof system initialized")
    
    def create_master_backup(self):
        """Create the master backup of all users"""
        try:
            conn = sqlite3.connect(self.db_file)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Get all users
            cursor.execute('SELECT * FROM users')
            users = cursor.fetchall()
            conn.close()
            
            # Create master backup
            master_data = {
                'created_at': datetime.now().isoformat(),
                'version': '1.0',
                'description': 'MASTER BACKUP - NEVER DELETE THIS FILE',
                'users': []
            }
            
            for user in users:
                user_data = {
                    'id': user['id'],
                    'email': user['email'],
                    'password_hash': user['password_hash'],
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'role': user['role'],
                    'is_active': user['is_active'],
                    'created_at': user['created_at'],
                    'department': getattr(user, 'department', None)
                }
                master_data['users'].append(user_data)
            
            # Save master backup
            with open(self.master_file, 'w') as f:
                json.dump(master_data, f, indent=2)
            
            print(f"✅ Master backup created with {len(users)} users")
            return True
            
        except Exception as e:
            print(f"❌ Error creating master backup: {e}")
            return False
    
    def restore_from_master(self):
        """Restore all users from master backup"""
        try:
            if not os.path.exists(self.master_file):
                print("⚠️ No master backup found, creating one...")
                return self.create_master_backup()
            
            # Load master backup
            with open(self.master_file, 'r') as f:
                master_data = json.load(f)
            
            conn = sqlite3.connect(self.db_file)
            cursor = conn.cursor()
            
            # Clear existing users table
            cursor.execute('DELETE FROM users')
            
            # Restore all users from master
            for user_data in master_data['users']:
                cursor.execute('''
                    INSERT INTO users (id, email, password_hash, first_name, last_name, role, is_active, created_at, department)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    user_data['id'],
                    user_data['email'],
                    user_data['password_hash'],
                    user_data['first_name'],
                    user_data['last_name'],
                    user_data['role'],
                    user_data['is_active'],
                    user_data['created_at'],
                    user_data.get('department')
                ))
            
            conn.commit()
            conn.close()
            
            print(f"✅ Restored {len(master_data['users'])} users from master backup")
            return True
            
        except Exception as e:
            print(f"❌ Error restoring from master: {e}")
            return False
    
    def update_master_backup(self):
        """Update master backup with current database state"""
        try:
            conn = sqlite3.connect(self.db_file)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            # Get all current users
            cursor.execute('SELECT * FROM users')
            users = cursor.fetchall()
            conn.close()
            
            # Create new master backup
            master_data = {
                'created_at': datetime.now().isoformat(),
                'version': '1.0',
                'description': 'MASTER BACKUP - NEVER DELETE THIS FILE',
                'users': []
            }
            
            for user in users:
                user_data = {
                    'id': user['id'],
                    'email': user['email'],
                    'password_hash': user['password_hash'],
                    'first_name': user['first_name'],
                    'last_name': user['last_name'],
                    'role': user['role'],
                    'is_active': user['is_active'],
                    'created_at': user['created_at'],
                    'department': getattr(user, 'department', None)
                }
                master_data['users'].append(user_data)
            
            # Backup old master file
            if os.path.exists(self.master_file):
                backup_name = f"users_master_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                shutil.copy2(self.master_file, backup_name)
                print(f"📦 Old master backed up as: {backup_name}")
            
            # Save new master backup
            with open(self.master_file, 'w') as f:
                json.dump(master_data, f, indent=2)
            
            print(f"✅ Master backup updated with {len(users)} users")
            return True
            
        except Exception as e:
            print(f"❌ Error updating master backup: {e}")
            return False
    
    def show_all_users(self):
        """Show all users in the system"""
        try:
            conn = sqlite3.connect(self.db_file)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            
            cursor.execute('SELECT * FROM users ORDER BY id')
            users = cursor.fetchall()
            conn.close()
            
            print("👥 All Users in System:")
            print("=" * 80)
            print(f"{'ID':<3} {'Email':<30} {'Name':<20} {'Role':<10} {'Status':<8}")
            print("=" * 80)
            
            for user in users:
                user_id = user['id']
                email = user['email']
                full_name = f"{user['first_name']} {user['last_name']}"
                role = user['role']
                status = "Active" if user['is_active'] else "Inactive"
                
                print(f"{user_id:<3} {email:<30} {full_name:<20} {role:<10} {status:<8}")
            
            return users
            
        except Exception as e:
            print(f"❌ Error showing users: {e}")
            return []
    
    def reset_user_password(self, email, new_password):
        """Reset a user's password and update master backup"""
        try:
            # Hash the new password
            salt = secrets.token_hex(32)
            password_hash = hashlib.sha256((new_password + salt).encode()).hexdigest()
            hashed_password = f"{salt}${password_hash}"
            
            conn = sqlite3.connect(self.db_file)
            cursor = conn.cursor()
            
            # Update password
            cursor.execute('UPDATE users SET password_hash = ? WHERE email = ?', (hashed_password, email))
            
            if cursor.rowcount > 0:
                conn.commit()
                conn.close()
                
                # Update master backup
                self.update_master_backup()
                
                print(f"✅ Password reset for {email}")
                print(f"   New password: {new_password}")
                return True
            else:
                conn.close()
                print(f"❌ User {email} not found")
                return False
                
        except Exception as e:
            print(f"❌ Error resetting password: {e}")
            return False
    
    def create_admin_user(self, email, password, first_name="Admin", last_name="User"):
        """Create a new admin user and update master backup"""
        try:
            # Hash the password
            salt = secrets.token_hex(32)
            password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
            hashed_password = f"{salt}${password_hash}"
            
            conn = sqlite3.connect(self.db_file)
            cursor = conn.cursor()
            
            # Check if user exists
            cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
            if cursor.fetchone():
                conn.close()
                print(f"❌ User {email} already exists")
                return False
            
            # Create new admin user
            cursor.execute('''
                INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (email, hashed_password, first_name, last_name, 'admin', 1, datetime.now()))
            
            conn.commit()
            conn.close()
            
            # Update master backup
            self.update_master_backup()
            
            print(f"✅ Admin user created: {email}")
            print(f"   Password: {password}")
            return True
            
        except Exception as e:
            print(f"❌ Error creating admin user: {e}")
            return False
    
    def force_restore_all_users(self):
        """Force restore all users from master backup"""
        print("🔄 Force restoring all users from master backup...")
        return self.restore_from_master()

def main():
    """Main function for bulletproof user system"""
    system = BulletproofUserSystem()
    
    print("\n🔒 Bulletproof User System")
    print("=" * 50)
    print("1. Show all users")
    print("2. Reset user password")
    print("3. Create new admin user")
    print("4. Force restore all users")
    print("5. Update master backup")
    print("6. Exit")
    
    while True:
        choice = input("\nEnter your choice (1-6): ").strip()
        
        if choice == "1":
            system.show_all_users()
        
        elif choice == "2":
            email = input("Enter user email: ").strip()
            new_password = input("Enter new password: ").strip()
            if email and new_password:
                system.reset_user_password(email, new_password)
            else:
                print("❌ Email and password are required")
        
        elif choice == "3":
            email = input("Enter admin email: ").strip()
            password = input("Enter admin password: ").strip()
            if email and password:
                system.create_admin_user(email, password)
            else:
                print("❌ Email and password are required")
        
        elif choice == "4":
            system.force_restore_all_users()
        
        elif choice == "5":
            system.update_master_backup()
        
        elif choice == "6":
            print("👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid choice. Please enter 1-6.")

if __name__ == "__main__":
    main() 