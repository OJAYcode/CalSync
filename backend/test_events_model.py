#!/usr/bin/env python3
"""
Test Events Model
"""

from events import Event

print("🧪 Testing Events Model...")

try:
    event_model = Event()
    
    print("📊 Testing get_all_events...")
    events = event_model.get_all_events()
    print(f"Found {len(events)} events")
    
    for event in events:
        print(f"  - {event['title']} (ID: {event['id']})")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc() 