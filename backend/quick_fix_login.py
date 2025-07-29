#!/usr/bin/env python3
"""
Quick Fix Login Access
Reset passwords for existing users to restore access
"""

import sqlite3
import hashlib
import secrets
from datetime import datetime

def hash_password_with_salt(password):
    """Hash password using SHA256 with salt"""
    salt = secrets.token_hex(32)
    password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"{salt}${password_hash}"

def reset_all_user_passwords():
    """Reset passwords for all existing users"""
    try:
        conn = sqlite3.connect('calendar_app.db')
        cursor = conn.cursor()
        
        # Get all users
        cursor.execute('SELECT id, email, first_name, last_name, role FROM users')
        users = cursor.fetchall()
        
        print("🔧 Resetting passwords for all users...")
        print("=" * 60)
        
        for user in users:
            user_id, email, first_name, last_name, role = user
            
            # Set simple passwords based on role
            if role == 'admin':
                new_password = "admin123"
            else:
                new_password = "user123"
            
            # Hash the new password
            new_hash = hash_password_with_salt(new_password)
            
            # Update the password
            cursor.execute('UPDATE users SET password_hash = ? WHERE id = ?', (new_hash, user_id))
            
            print(f"✅ {email}")
            print(f"   Name: {first_name} {last_name}")
            print(f"   Role: {role}")
            print(f"   New Password: {new_password}")
            print()
        
        conn.commit()
        conn.close()
        
        print("🎉 All user passwords have been reset!")
        print("\n📋 Login Credentials:")
        print("=" * 60)
        
        for user in users:
            user_id, email, first_name, last_name, role = user
            password = "admin123" if role == 'admin' else "user123"
            print(f"Email: {email}")
            print(f"Password: {password}")
            print(f"Role: {role}")
            print("-" * 30)
        
        return True
        
    except Exception as e:
        print(f"❌ Error resetting passwords: {e}")
        return False

def create_backup_admin():
    """Create a backup admin user"""
    try:
        conn = sqlite3.connect('calendar_app.db')
        cursor = conn.cursor()
        
        # Check if backup admin exists
        cursor.execute('SELECT id FROM users WHERE email = ?', ('backup@calsync.com',))
        if cursor.fetchone():
            print("⚠️ Backup admin already exists")
            return False
        
        # Create backup admin
        password_hash = hash_password_with_salt("backup123")
        
        cursor.execute('''
            INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', ('backup@calsync.com', password_hash, 'Backup', 'Admin', 'admin', 1, datetime.now()))
        
        conn.commit()
        conn.close()
        
        print("✅ Backup admin created:")
        print("   Email: backup@calsync.com")
        print("   Password: backup123")
        return True
        
    except Exception as e:
        print(f"❌ Error creating backup admin: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Quick Fix Login Access")
    print("=" * 50)
    
    # Reset all user passwords
    if reset_all_user_passwords():
        print("\n🔧 Creating backup admin user...")
        create_backup_admin()
        
        print("\n🎯 Next Steps:")
        print("1. Restart your backend server")
        print("2. Use the login credentials above")
        print("3. Change passwords after logging in")
        
        print("\n💡 You can now log in with:")
        print("   - Admin users: admin123")
        print("   - Regular users: user123")
        print("   - Backup admin: backup@calsync.com / backup123")
    else:
        print("❌ Failed to reset passwords") 