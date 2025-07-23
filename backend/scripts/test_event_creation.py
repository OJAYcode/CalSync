#!/usr/bin/env python3
"""
Simple script to test event creation directly
"""

import sys
import os

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app import create_app
from extensions import db
from models import User, Event
from datetime import datetime, timedelta
from flask_jwt_extended import create_access_token

def test_event_creation():
    """Test event creation functionality"""
    app = create_app()
    
    with app.app_context():
        try:
            # Get admin user
            admin = User.query.filter_by(email='admin@company.com').first()
            if not admin:
                print("❌ Admin user not found!")
                return False
            
            print(f"✅ Found admin user: {admin.email}")
            
            # Create a test event
            test_event = Event(
                title='Test Event',
                description='This is a test event',
                start_datetime=datetime.now() + timedelta(hours=1),
                end_datetime=datetime.now() + timedelta(hours=2),
                location='Test Location',
                is_all_day=False,
                is_organization_wide=True,
                created_by_id=admin.id
            )
            
            db.session.add(test_event)
            db.session.commit()
            
            print(f"✅ Test event created successfully with ID: {test_event.id}")
            
            # Generate a test token
            token = create_access_token(identity=admin.id)
            print(f"✅ Generated test token for admin")
            print(f"Token preview: {token[:50]}...")
            
            return True
            
        except Exception as e:
            print(f"❌ Error testing event creation: {str(e)}")
            return False

if __name__ == "__main__":
    print("=" * 50)
    print("    TESTING EVENT CREATION")
    print("=" * 50)
    
    success = test_event_creation()
    if success:
        print("\n🚀 Event creation test passed!")
    else:
        print("\n❌ Event creation test failed!")
