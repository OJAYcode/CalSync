#!/usr/bin/env python3
"""
Restore User Access Script
Helps restore access to user accounts after JWT secret key changes
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

def show_all_users():
    """Show all users in the database"""
    try:
        conn = sqlite3.connect('calendar_app.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, email, first_name, last_name, role, is_active, created_at 
            FROM users ORDER BY id
        ''')
        
        users = cursor.fetchall()
        conn.close()
        
        print("👥 All Users in Database:")
        print("-" * 80)
        print(f"{'ID':<3} {'Email':<30} {'Name':<20} {'Role':<10} {'Status':<8}")
        print("-" * 80)
        
        for user in users:
            user_id, email, first_name, last_name, role, is_active, created_at = user
            full_name = f"{first_name} {last_name}" if first_name and last_name else "N/A"
            status = "Active" if is_active else "Inactive"
            print(f"{user_id:<3} {email:<30} {full_name:<20} {role:<10} {status:<8}")
        
        return users
        
    except Exception as e:
        print(f"❌ Error showing users: {e}")
        return []

def reset_user_password(email, new_password):
    """Reset a user's password"""
    try:
        conn = sqlite3.connect('calendar_app.db')
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute('SELECT id, email, first_name, last_name FROM users WHERE email = ?', (email,))
        user = cursor.fetchone()
        
        if not user:
            print(f"❌ User with email {email} not found")
            return False
        
        user_id, user_email, first_name, last_name = user
        
        # Hash the new password
        new_hash = hash_password_with_salt(new_password)
        
        # Update the password
        cursor.execute('UPDATE users SET password_hash = ? WHERE id = ?', (new_hash, user_id))
        conn.commit()
        conn.close()
        
        print(f"✅ Password reset successfully for {user_email}")
        print(f"   Name: {first_name} {last_name}")
        print(f"   New password: {new_password}")
        return True
        
    except Exception as e:
        print(f"❌ Error resetting password: {e}")
        return False

def create_admin_user():
    """Create a new admin user"""
    try:
        conn = sqlite3.connect('calendar_app.db')
        cursor = conn.cursor()
        
        # Check if admin already exists
        cursor.execute('SELECT id FROM users WHERE email = ?', ('admin@calsync.com',))
        if cursor.fetchone():
            print("⚠️ Admin user already exists")
            return False
        
        # Create admin user
        admin_password = "admin123"
        password_hash = hash_password_with_salt(admin_password)
        
        cursor.execute('''
            INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', ('admin@calsync.com', password_hash, 'Admin', 'User', 'admin', 1, datetime.now()))
        
        conn.commit()
        conn.close()
        
        print("✅ Admin user created successfully")
        print(f"   Email: admin@calsync.com")
        print(f"   Password: {admin_password}")
        return True
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        return False

def main():
    """Main function"""
    print("🔧 Restore User Access")
    print("=" * 50)
    
    # Show all users
    users = show_all_users()
    
    if not users:
        print("❌ No users found in database")
        return
    
    print("\n🔧 Options:")
    print("1. Reset password for existing user")
    print("2. Create new admin user")
    print("3. Exit")
    
    while True:
        choice = input("\nEnter your choice (1-3): ").strip()
        
        if choice == "1":
            email = input("Enter user email: ").strip()
            new_password = input("Enter new password: ").strip()
            
            if email and new_password:
                reset_user_password(email, new_password)
            else:
                print("❌ Email and password are required")
        
        elif choice == "2":
            create_admin_user()
        
        elif choice == "3":
            print("👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid choice. Please enter 1, 2, or 3.")

if __name__ == "__main__":
    main() 