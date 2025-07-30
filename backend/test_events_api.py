#!/usr/bin/env python3
"""
Test Events API
"""

import requests
import json

API_URL = "http://localhost:5000"

def test_events_api():
    """Test the events API endpoint"""
    print("🧪 Testing Events API")
    print("=" * 50)
    
    # Test 1: Get events without auth
    print("\n1️⃣ Testing events endpoint without authentication...")
    try:
        response = requests.get(f"{API_URL}/events")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Events found: {len(data) if isinstance(data, list) else 'Unknown format'}")
            print(f"Response: {json.dumps(data, indent=2)[:200]}...")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 2: Get events with invalid token
    print("\n2️⃣ Testing events endpoint with invalid token...")
    try:
        headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(f"{API_URL}/events", headers=headers)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:100]}...")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Check if server is running
    print("\n3️⃣ Testing server health...")
    try:
        response = requests.get(f"{API_URL}/health")
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Server: {data.get('status', 'Unknown')}")
            print(f"Database: {data.get('database', 'Unknown')}")
        else:
            print(f"Error: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_events_api() 