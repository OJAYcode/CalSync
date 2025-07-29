#!/usr/bin/env python3
"""
Test script for timezone functionality
"""

from timezone_utils import timezone_utils
from datetime import datetime
import json

def test_timezone_functionality():
    """Test timezone functionality"""
    print("🌍 Testing Timezone Functionality")
    print("=" * 50)
    
    # Test 1: Get current timezone
    print("\n1️⃣ Testing timezone detection...")
    current_timezone = timezone_utils.get_user_timezone()
    print(f"📍 Current timezone: {current_timezone}")
    
    # Test 2: Get current local time
    print("\n2️⃣ Testing current local time...")
    current_local_time = timezone_utils.get_current_local_time()
    print(f"🕐 Current local time: {current_local_time}")
    
    # Test 3: Test timezone conversion
    print("\n3️⃣ Testing timezone conversion...")
    
    # Test with a sample datetime
    sample_utc = "2025-07-29T15:00:00+00:00"
    local_time = timezone_utils.convert_to_local_time(sample_utc, "America/New_York")
    print(f"🕐 UTC: {sample_utc}")
    print(f"🕐 New York: {local_time}")
    
    # Test 4: Test event datetime parsing
    print("\n4️⃣ Testing event datetime parsing...")
    
    # Test local datetime string
    local_datetime_str = "2025-07-29T15:00:00"
    parsed_utc = timezone_utils.parse_event_datetime(local_datetime_str, "America/New_York")
    print(f"🕐 Local datetime: {local_datetime_str}")
    print(f"🕐 Parsed UTC: {parsed_utc}")
    
    # Test 5: Test timezone offset
    print("\n5️⃣ Testing timezone offset...")
    offset = timezone_utils.get_timezone_offset("America/New_York")
    print(f"📍 New York offset from UTC: {offset} hours")
    
    # Test 6: Test available timezones
    print("\n6️⃣ Testing available timezones...")
    timezones = timezone_utils.get_available_timezones()
    print(f"🌍 Available timezones: {len(timezones)}")
    for tz in timezones[:5]:  # Show first 5
        print(f"   - {tz}")
    
    # Test 7: Test different timezone conversions
    print("\n7️⃣ Testing different timezone conversions...")
    test_time = "2025-07-29T15:00:00+00:00"
    
    timezones_to_test = ["America/New_York", "Europe/London", "Asia/Tokyo", "Australia/Sydney"]
    for tz in timezones_to_test:
        local_time = timezone_utils.convert_to_local_time(test_time, tz)
        print(f"🕐 {tz}: {local_time}")
    
    print("\n✅ Timezone functionality test completed!")
    print("\n📝 Next steps:")
    print("   1. Test with real event creation")
    print("   2. Verify notifications use local time")
    print("   3. Check frontend displays correct times")

if __name__ == "__main__":
    test_timezone_functionality() 