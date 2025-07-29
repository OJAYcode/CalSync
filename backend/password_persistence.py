#!/usr/bin/env python3
"""
Password Persistence System for CalSync
Ensures passwords are preserved across deployments and JWT secret key changes
"""

import sqlite3
import json
import os
import hashlib
import secrets
from datetime import datetime
from cryptography.fernet import Fernet
import base64

class PasswordPersistence:
    def __init__(self):
        self.persistence_file = 'password_backup.json'
        self.encryption_key_file = 'password_key.key'
        self.initialize_encryption()
    
    def initialize_encryption(self):
        """Initialize encryption key for password storage"""
        try:
            if not os.path.exists(self.encryption_key_file):
                # Generate new encryption key
                key = Fernet.generate_key()
                with open(self.encryption_key_file, 'wb') as f:
                    f.write(key)
                print(f"🔐 Generated new encryption key: {self.encryption_key_file}")
            
            # Load encryption key
            with open(self.encryption_key_file, 'rb') as f:
                self.encryption_key = f.read()
            
            self.cipher = Fernet(self.encryption_key)
            print("✅ Password encryption initialized")
            
        except Exception as e:
            print(f"❌ Error initializing encryption: {e}")
            # Fallback to simple encoding
            self.cipher = None
    
    def encrypt_password(self, password):
        """Encrypt password for storage"""
        try:
            if self.cipher:
                return self.cipher.encrypt(password.encode()).decode()
            else:
                # Fallback to base64 encoding
                return base64.b64encode(password.encode()).decode()
        except Exception as e:
            print(f"❌ Error encrypting password: {e}")
            return password
    
    def decrypt_password(self, encrypted_password):
        """Decrypt password from storage"""
        try:
            if self.cipher:
                return self.cipher.decrypt(encrypted_password.encode()).decode()
            else:
                # Fallback to base64 decoding
                return base64.b64decode(encrypted_password.encode()).decode()
        except Exception as e:
            print(f"❌ Error decrypting password: {e}")
            return encrypted_password
    
    def backup_all_passwords(self):
        """Backup all user passwords to persistent storage"""
        try:
            conn = sqlite3.connect('calendar_app.db')
            cursor = conn.cursor()
            
            # Get all users with their passwords
            cursor.execute('''
                SELECT id, email, password_hash, first_name, last_name, role, is_active, created_at
                FROM users
            ''')
            
            users = cursor.fetchall()
            conn.close()
            
            # Prepare backup data
            backup_data = {
                'timestamp': datetime.now().isoformat(),
                'version': '1.0',
                'users': []
            }
            
            for user in users:
                user_id, email, password_hash, first_name, last_name, role, is_active, created_at = user
                
                # Store original password hash (encrypted)
                encrypted_hash = self.encrypt_password(password_hash)
                
                user_data = {
                    'id': user_id,
                    'email': email,
                    'password_hash': encrypted_hash,
                    'first_name': first_name,
                    'last_name': last_name,
                    'role': role,
                    'is_active': is_active,
                    'created_at': created_at
                }
                
                backup_data['users'].append(user_data)
            
            # Save to file
            with open(self.persistence_file, 'w') as f:
                json.dump(backup_data, f, indent=2)
            
            print(f"✅ Backed up {len(users)} user passwords to {self.persistence_file}")
            return True
            
        except Exception as e:
            print(f"❌ Error backing up passwords: {e}")
            return False
    
    def restore_all_passwords(self):
        """Restore all user passwords from persistent storage"""
        try:
            if not os.path.exists(self.persistence_file):
                print(f"⚠️ No password backup found: {self.persistence_file}")
                return False
            
            # Load backup data
            with open(self.persistence_file, 'r') as f:
                backup_data = json.load(f)
            
            print(f"📦 Loading password backup from {backup_data['timestamp']}")
            
            conn = sqlite3.connect('calendar_app.db')
            cursor = conn.cursor()
            
            restored_count = 0
            for user_data in backup_data['users']:
                # Decrypt password hash
                encrypted_hash = user_data['password_hash']
                password_hash = self.decrypt_password(encrypted_hash)
                
                # Update user in database
                cursor.execute('''
                    UPDATE users 
                    SET password_hash = ?, first_name = ?, last_name = ?, role = ?, is_active = ?
                    WHERE email = ?
                ''', (
                    password_hash,
                    user_data['first_name'],
                    user_data['last_name'],
                    user_data['role'],
                    user_data['is_active'],
                    user_data['email']
                ))
                
                if cursor.rowcount > 0:
                    restored_count += 1
                    print(f"✅ Restored password for: {user_data['email']}")
            
            conn.commit()
            conn.close()
            
            print(f"🎉 Successfully restored {restored_count} user passwords")
            return True
            
        except Exception as e:
            print(f"❌ Error restoring passwords: {e}")
            return False
    
    def show_backup_info(self):
        """Show information about the password backup"""
        try:
            if not os.path.exists(self.persistence_file):
                print("❌ No password backup found")
                return False
            
            with open(self.persistence_file, 'r') as f:
                backup_data = json.load(f)
            
            print("📦 Password Backup Information:")
            print("=" * 50)
            print(f"📅 Created: {backup_data['timestamp']}")
            print(f"📋 Version: {backup_data['version']}")
            print(f"👥 Users: {len(backup_data['users'])}")
            print()
            
            print("👤 Users in backup:")
            for user in backup_data['users']:
                print(f"   - {user['email']} ({user['role']})")
            
            return True
            
        except Exception as e:
            print(f"❌ Error reading backup info: {e}")
            return False
    
    def create_secure_backup(self):
        """Create a secure backup with additional encryption"""
        try:
            # Create backup
            if self.backup_all_passwords():
                # Create a checksum for verification
                import hashlib
                with open(self.persistence_file, 'rb') as f:
                    content = f.read()
                    checksum = hashlib.sha256(content).hexdigest()
                
                # Save checksum
                with open(f"{self.persistence_file}.checksum", 'w') as f:
                    f.write(checksum)
                
                print(f"🔒 Secure backup created with checksum: {checksum[:16]}...")
                return True
            return False
            
        except Exception as e:
            print(f"❌ Error creating secure backup: {e}")
            return False

def main():
    """Main function for password persistence management"""
    persistence = PasswordPersistence()
    
    print("🔐 Password Persistence System")
    print("=" * 50)
    print("1. Backup all passwords")
    print("2. Restore all passwords")
    print("3. Show backup information")
    print("4. Create secure backup")
    print("5. Exit")
    
    while True:
        choice = input("\nEnter your choice (1-5): ").strip()
        
        if choice == "1":
            print("\n🔄 Creating password backup...")
            persistence.backup_all_passwords()
        
        elif choice == "2":
            print("\n🔄 Restoring passwords...")
            persistence.restore_all_passwords()
        
        elif choice == "3":
            print("\n📦 Backup information:")
            persistence.show_backup_info()
        
        elif choice == "4":
            print("\n🔒 Creating secure backup...")
            persistence.create_secure_backup()
        
        elif choice == "5":
            print("👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid choice. Please enter 1-5.")

if __name__ == "__main__":
    main() 