#!/usr/bin/env python3
"""
User Model for SQLite Calendar App
Handles user signup, login, and authentication
"""

import hashlib
import secrets
from database import db
from datetime import datetime

class User:
    def __init__(self):
        pass
    
    @staticmethod
    def hash_password(password):
        """Hash password using SHA256 with salt"""
        salt = secrets.token_hex(32)
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        return f"{salt}${password_hash}"
    
    @staticmethod
    def verify_password(password, hashed_password):
        """Verify password against hash"""
        try:
            salt, stored_hash = hashed_password.split('$')
            password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
            return password_hash == stored_hash
        except:
            return False
    
    def create_user(self, email, password, first_name, last_name, role='employee'):
        """Create a new user"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            # Check if user already exists
            cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
            if cursor.fetchone():
                return {"success": False, "error": "User with this email already exists"}
            
            # Hash password
            password_hash = self.hash_password(password)
            
            # Validate role
            if role not in ['employee', 'admin']:
                role = 'employee'
            
            # Insert new user
            cursor.execute('''
                INSERT INTO users (email, password_hash, first_name, last_name, role)
                VALUES (?, ?, ?, ?, ?)
            ''', (email.lower().strip(), password_hash, first_name.strip(), last_name.strip(), role))
            
            user_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return {
                "success": True,
                "message": "User created successfully",
                "user_id": user_id
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def login_user(self, email, password):
        """Login user and return user data"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, email, password_hash, first_name, last_name, role, is_active
                FROM users WHERE email = ?
            ''', (email.lower().strip(),))
            
            user = cursor.fetchone()
            conn.close()
            
            if not user:
                return {"success": False, "error": "Invalid email or password"}
            
            if not user['is_active']:
                return {"success": False, "error": "Account is inactive"}
            
            # Verify password
            if not self.verify_password(password, user['password_hash']):
                return {"success": False, "error": "Invalid email or password"}
            
            return {
                "success": True,
                "user": {
                    "id": user['id'],
                    "email": user['email'],
                    "first_name": user['first_name'],
                    "last_name": user['last_name'],
                    "role": user['role'],
                    "is_admin": user['role'] == 'admin',
                    "full_name": f"{user['first_name']} {user['last_name']}"
                }
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_user_by_id(self, user_id):
        """Get user by ID"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, email, first_name, last_name, role, is_active, created_at
                FROM users WHERE id = ?
            ''', (user_id,))
            
            user = cursor.fetchone()
            conn.close()
            
            if user:
                return {
                    "id": user['id'],
                    "email": user['email'],
                    "first_name": user['first_name'],
                    "last_name": user['last_name'],
                    "role": user['role'],
                    "is_admin": user['role'] == 'admin',
                    "is_active": user['is_active'],
                    "created_at": user['created_at'],
                    "full_name": f"{user['first_name']} {user['last_name']}"
                }
            return None
            
        except Exception as e:
            print(f"Error getting user: {str(e)}")
            return None
    
    def get_all_users(self):
        """Get all users (admin only)"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT id, email, first_name, last_name, role, is_active, created_at
                FROM users ORDER BY created_at DESC
            ''')
            
            users = cursor.fetchall()
            conn.close()
            
            return [{
                "id": user['id'],
                "email": user['email'],
                "first_name": user['first_name'],
                "last_name": user['last_name'],
                "role": user['role'],
                "is_active": user['is_active'],
                "created_at": user['created_at'],
                "full_name": f"{user['first_name']} {user['last_name']}"
            } for user in users]
            
        except Exception as e:
            print(f"Error getting users: {str(e)}")
            return []

    def update_user(self, user_id, update_data):
        """Update user profile fields"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            fields = []
            values = []
            for k, v in update_data.items():
                if k in ['first_name', 'last_name', 'department', 'email']:
                    fields.append(f"{k} = ?")
                    values.append(v.strip() if isinstance(v, str) else v)
            if not fields:
                return {"success": False, "error": "No valid fields to update"}
            values.append(user_id)
            sql = f"UPDATE users SET {', '.join(fields)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
            cursor.execute(sql, values)
            conn.commit()
            conn.close()
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

    def change_password(self, user_id, old_password, new_password):
        """Change user password after verifying old password"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT password_hash FROM users WHERE id = ?', (user_id,))
            row = cursor.fetchone()
            if not row:
                conn.close()
                return {"success": False, "error": "User not found"}
            if not self.verify_password(old_password, row['password_hash']):
                conn.close()
                return {"success": False, "error": "Old password is incorrect"}
            new_hash = self.hash_password(new_password)
            cursor.execute('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', (new_hash, user_id))
            conn.commit()
            conn.close()
            return {"success": True}
        except Exception as e:
            return {"success": False, "error": str(e)}

# Global user model instance
user_model = User()
