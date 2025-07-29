#!/usr/bin/env python3
"""
Fix JWT Token Issues
Generate a proper secret key and update configuration
"""

import secrets
import os
from dotenv import load_dotenv

def generate_secret_key():
    """Generate a secure secret key"""
    return secrets.token_hex(32)

def update_config_file():
    """Update the config.env file with a proper secret key"""
    config_file = 'config.env'
    
    # Load current config
    load_dotenv(config_file)
    
    # Generate new secret key
    new_secret_key = generate_secret_key()
    
    # Read current config file
    try:
        with open(config_file, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ Config file {config_file} not found")
        return False
    
    # Replace the SECRET_KEY line
    lines = content.split('\n')
    updated_lines = []
    
    for line in lines:
        if line.startswith('SECRET_KEY='):
            updated_lines.append(f'SECRET_KEY={new_secret_key}')
        else:
            updated_lines.append(line)
    
    # Write updated config
    try:
        with open(config_file, 'w') as f:
            f.write('\n'.join(updated_lines))
        
        print(f"✅ Updated {config_file} with new secret key")
        print(f"🔑 New secret key: {new_secret_key}")
        return True
        
    except Exception as e:
        print(f"❌ Error updating config file: {e}")
        return False

def test_jwt_functionality():
    """Test JWT functionality with the new secret key"""
    try:
        from flask import Flask
        from flask_jwt_extended import JWTManager, create_access_token, decode_token
        from datetime import timedelta
        import os
        from dotenv import load_dotenv
        
        # Load updated config
        load_dotenv('config.env')
        
        # Create test Flask app
        app = Flask(__name__)
        app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY')
        app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)
        jwt = JWTManager(app)
        
        # Test token creation and decoding within app context
        with app.app_context():
            test_user_id = "123"
            token = create_access_token(identity=test_user_id)
            
            # Decode token to verify it works
            decoded = decode_token(token)
            
            if decoded['sub'] == test_user_id:
                print("✅ JWT token creation and decoding works correctly")
                return True
            else:
                print("❌ JWT token decoding failed")
                return False
            
    except Exception as e:
        print(f"❌ Error testing JWT functionality: {e}")
        return False

def main():
    """Main function to fix JWT token issues"""
    print("🔧 Fixing JWT Token Issues")
    print("=" * 40)
    
    # Step 1: Update config file
    print("\n1️⃣ Updating config file...")
    if update_config_file():
        print("✅ Config file updated successfully")
    else:
        print("❌ Failed to update config file")
        return
    
    # Step 2: Test JWT functionality
    print("\n2️⃣ Testing JWT functionality...")
    if test_jwt_functionality():
        print("✅ JWT functionality verified")
    else:
        print("❌ JWT functionality test failed")
        return
    
    print("\n🎉 JWT token issues fixed successfully!")
    print("\n📝 Next steps:")
    print("   1. Restart your backend server")
    print("   2. Log in again to get a new token")
    print("   3. Try creating an event with the new token")

if __name__ == "__main__":
    main() 