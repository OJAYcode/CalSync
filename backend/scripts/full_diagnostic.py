#!/usr/bin/env python3
"""
Comprehensive diagnostic script for event creation issues
"""

import sys
import os
import requests
import json
from datetime import datetime, timedelta

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

def test_backend_connection():
    """Test if backend is running"""
    try:
        response = requests.get('http://localhost:5000/api/events/test', timeout=5)
        print(f"✅ Backend connection: {response.status_code}")
        print(f"   Response: {response.json()}")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ Backend not running on localhost:5000")
        return False
    except Exception as e:
        print(f"❌ Backend connection error: {e}")
        return False

def test_admin_login():
    """Test admin login and get token"""
    try:
        login_data = {
            "email": "admin@company.com",
            "password": "admin123"
        }
        
        response = requests.post(
            'http://localhost:5000/api/auth/login',
            json=login_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Admin login successful")
            print(f"   User: {data.get('user', {}).get('email', 'Unknown')}")
            print(f"   Role: {data.get('user', {}).get('role', 'Unknown')}")
            print(f"   Can create events: {data.get('user', {}).get('can_create_events', False)}")
            return data.get('access_token')
        else:
            print(f"❌ Admin login failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login error: {e}")
        return None

def test_event_creation_api(token):
    """Test event creation via API"""
    if not token:
        print("❌ No token available for testing")
        return False
    
    try:
        event_data = {
            "title": "Test Event via API",
            "description": "Testing event creation through API",
            "start_datetime": (datetime.now() + timedelta(hours=1)).isoformat(),
            "end_datetime": (datetime.now() + timedelta(hours=2)).isoformat(),
            "location": "API Test Location",
            "is_all_day": False,
            "is_organization_wide": True,
            "notification_minutes_before": [15, 60]
        }
        
        print("📤 Sending event creation request...")
        print(f"   Event data: {json.dumps(event_data, indent=2)}")
        
        response = requests.post(
            'http://localhost:5000/api/events',
            json=event_data,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}'
            },
            timeout=10
        )
        
        print(f"📥 Response status: {response.status_code}")
        print(f"   Response headers: {dict(response.headers)}")
        
        if response.status_code in [200, 201]:
            result = response.json()
            print("✅ Event created successfully via API!")
            print(f"   Event ID: {result.get('id')}")
            print(f"   Event title: {result.get('title')}")
            return True
        else:
            print("❌ Event creation failed:")
            print(f"   Status: {response.status_code}")
            print(f"   Response: {response.text}")
            
            # Try to parse error response
            try:
                error_data = response.json()
                print(f"   Error details: {json.dumps(error_data, indent=2)}")
            except:
                pass
            
            return False
            
    except Exception as e:
        print(f"❌ API request error: {e}")
        return False

def test_database_directly():
    """Test database connection and event creation directly"""
    try:
        from app import create_app
        from extensions import db
        from models import User, Event
        
        app = create_app()
        with app.app_context():
            # Check admin user
            admin = User.query.filter_by(email='admin@company.com').first()
            if not admin:
                print("❌ Admin user not found in database")
                return False
                
            print(f"✅ Admin user found: {admin.email}")
            print(f"   Role: {admin.role}")
            print(f"   Can create events: {admin.can_create_events}")
            
            # Try to create event directly
            test_event = Event(
                title='Direct DB Test Event',
                description='Testing direct database creation',
                start_datetime=datetime.now() + timedelta(hours=1),
                end_datetime=datetime.now() + timedelta(hours=2),
                location='DB Test Location',
                is_all_day=False,
                is_organization_wide=True,
                created_by_id=admin.id
            )
            
            db.session.add(test_event)
            db.session.commit()
            
            print(f"✅ Event created directly in database with ID: {test_event.id}")
            return True
            
    except Exception as e:
        print(f"❌ Database test error: {e}")
        return False

def main():
    print("=" * 60)
    print("    COMPREHENSIVE EVENT CREATION DIAGNOSTIC")
    print("=" * 60)
    
    # Test 1: Backend connection
    print("\n1️⃣ Testing backend connection...")
    backend_ok = test_backend_connection()
    
    if not backend_ok:
        print("\n❌ STOP: Backend is not running!")
        print("   Please start the backend first:")
        print("   cd backend && python app.py")
        return
    
    # Test 2: Admin login
    print("\n2️⃣ Testing admin login...")
    token = test_admin_login()
    
    # Test 3: Database direct access
    print("\n3️⃣ Testing database directly...")
    db_ok = test_database_directly()
    
    # Test 4: API event creation
    print("\n4️⃣ Testing event creation API...")
    api_ok = test_event_creation_api(token)
    
    # Summary
    print("\n" + "=" * 60)
    print("    DIAGNOSTIC SUMMARY")
    print("=" * 60)
    print(f"Backend Connection: {'✅' if backend_ok else '❌'}")
    print(f"Admin Login:        {'✅' if token else '❌'}")
    print(f"Database Access:    {'✅' if db_ok else '❌'}")
    print(f"API Event Creation: {'✅' if api_ok else '❌'}")
    
    if all([backend_ok, token, db_ok, api_ok]):
        print("\n🎉 All tests passed! Event creation should work.")
        print("   If frontend still has issues, check browser console.")
    else:
        print("\n🚨 Issues detected! Check the failures above.")

if __name__ == "__main__":
    main()
