from database import db
import bcrypt
from datetime import datetime
from bson import ObjectId

class User:
    def __init__(self):
        self.collection = db.get_collection('users')
    
    def hash_password(self, password):
        """Hash a password for storing"""
        salt = bcrypt.gensalt()
        return bcrypt.hashpw(password.encode('utf-8'), salt)
    
    def verify_password(self, password, hashed):
        """Verify a password against hash"""
        return bcrypt.checkpw(password.encode('utf-8'), hashed)
    
    def create_user(self, email, password, first_name, last_name, role='employee'):
        """Create a new user"""
        try:
            # Check if user already exists
            existing_user = self.collection.find_one({"email": email})
            if existing_user:
                return {"success": False, "error": "User with this email already exists"}
            
            # Validate role
            if role not in ['employee', 'admin']:
                return {"success": False, "error": "Role must be either 'employee' or 'admin'"}
            
            # Create user document
            user_data = {
                "email": email.lower().strip(),
                "password_hash": self.hash_password(password),
                "first_name": first_name.strip(),
                "last_name": last_name.strip(),
                "role": role,
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            
            # Insert user
            result = self.collection.insert_one(user_data)
            
            if result.inserted_id:
                return {
                    "success": True, 
                    "message": "User created successfully",
                    "user_id": str(result.inserted_id)
                }
            else:
                return {"success": False, "error": "Failed to create user"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def authenticate_user(self, email, password):
        """Authenticate a user"""
        try:
            user = self.collection.find_one({"email": email.lower().strip()})
            if not user:
                return {"success": False, "error": "Invalid email or password"}
            
            if not user.get('is_active', True):
                return {"success": False, "error": "Account is deactivated"}
            
            if self.verify_password(password, user['password_hash']):
                # Remove sensitive data
                user_data = {
                    "id": str(user['_id']),
                    "email": user['email'],
                    "first_name": user['first_name'],
                    "last_name": user['last_name'],
                    "role": user['role'],
                    "is_active": user['is_active']
                }
                return {"success": True, "user": user_data}
            else:
                return {"success": False, "error": "Invalid email or password"}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_user_by_id(self, user_id):
        """Get user by ID"""
        try:
            user = self.collection.find_one({"_id": ObjectId(user_id)})
            if user:
                return {
                    "id": str(user['_id']),
                    "email": user['email'],
                    "first_name": user['first_name'],
                    "last_name": user['last_name'],
                    "role": user['role'],
                    "is_active": user['is_active']
                }
            return None
        except Exception as e:
            print(f"Error getting user: {str(e)}")
            return None
    
    def get_all_users(self):
        """Get all users (admin only)"""
        try:
            users = self.collection.find({}, {"password_hash": 0})  # Exclude password hash
            return [{
                "id": str(user['_id']),
                "email": user['email'],
                "first_name": user['first_name'],
                "last_name": user['last_name'],
                "role": user['role'],
                "is_active": user['is_active'],
                "created_at": user.get('created_at')
            } for user in users]
        except Exception as e:
            print(f"Error getting users: {str(e)}")
            return []

# Global user model instance
user_model = User()
