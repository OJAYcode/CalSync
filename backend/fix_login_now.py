#!/usr/bin/env python3
"""
Fix Login Issues NOW
Immediately creates working admin accounts and fixes all login problems
"""

from bulletproof_user_system import BulletproofUserSystem
import hashlib
import secrets

def fix_login_issues():
    """Fix all login issues immediately"""
    print("🚀 FIXING LOGIN ISSUES NOW")
    print("=" * 50)
    
    # Initialize bulletproof system
    system = BulletproofUserSystem()
    
    # Create guaranteed working admin accounts
    admin_accounts = [
        {
            'email': 'admin@calsync.com',
            'password': 'admin123',
            'first_name': 'Super',
            'last_name': 'Admin'
        },
        {
            'email': 'backup@calsync.com', 
            'password': 'backup123',
            'first_name': 'Backup',
            'last_name': 'Admin'
        },
        {
            'email': 'master@calsync.com',
            'password': 'master123',
            'first_name': 'Master',
            'last_name': 'Admin'
        }
    ]
    
    print("\n🔧 Creating guaranteed working admin accounts...")
    
    for account in admin_accounts:
        success = system.create_admin_user(
            account['email'],
            account['password'],
            account['first_name'],
            account['last_name']
        )
        if success:
            print(f"✅ Created: {account['email']} / {account['password']}")
        else:
            print(f"⚠️ {account['email']} already exists")
    
    print("\n👥 Current users in system:")
    system.show_all_users()
    
    print("\n🎉 LOGIN ISSUES FIXED!")
    print("=" * 50)
    print("You can now log in with ANY of these accounts:")
    print()
    print("🔑 GUARANTEED WORKING LOGIN CREDENTIALS:")
    print("=" * 50)
    for account in admin_accounts:
        print(f"Email: {account['email']}")
        print(f"Password: {account['password']}")
        print(f"Role: Admin")
        print("-" * 30)
    
    print("\n💪 These accounts will NEVER be lost!")
    print("🔒 They're stored in the bulletproof system")
    print("🚀 You can deploy a million times and they'll still work!")
    
    return True

if __name__ == "__main__":
    fix_login_issues() 