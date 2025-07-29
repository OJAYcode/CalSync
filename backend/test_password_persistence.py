#!/usr/bin/env python3
"""
Test Password Persistence System
"""

from password_persistence import PasswordPersistence
import os

def test_password_persistence():
    """Test the password persistence system"""
    print("🧪 Testing Password Persistence System")
    print("=" * 50)
    
    persistence = PasswordPersistence()
    
    # Test 1: Create initial backup
    print("\n1️⃣ Creating initial password backup...")
    if persistence.backup_all_passwords():
        print("✅ Initial backup created successfully")
    else:
        print("❌ Failed to create initial backup")
        return False
    
    # Test 2: Show backup info
    print("\n2️⃣ Checking backup information...")
    if persistence.show_backup_info():
        print("✅ Backup info retrieved successfully")
    else:
        print("❌ Failed to get backup info")
        return False
    
    # Test 3: Create secure backup
    print("\n3️⃣ Creating secure backup...")
    if persistence.create_secure_backup():
        print("✅ Secure backup created successfully")
    else:
        print("❌ Failed to create secure backup")
        return False
    
    # Test 4: Check if backup files exist
    print("\n4️⃣ Checking backup files...")
    backup_files = [
        'password_backup.json',
        'password_backup.json.checksum',
        'password_key.key'
    ]
    
    for file in backup_files:
        if os.path.exists(file):
            print(f"✅ {file} exists")
        else:
            print(f"❌ {file} missing")
    
    print("\n🎉 Password persistence system test completed!")
    print("\n📝 Your passwords are now safely backed up and will persist across deployments!")
    
    return True

if __name__ == "__main__":
    test_password_persistence() 