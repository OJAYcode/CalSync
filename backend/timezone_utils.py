#!/usr/bin/env python3
"""
Timezone utilities for CalSync
Handles local time conversion and timezone detection
"""

import pytz
from datetime import datetime, timezone
import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('config.env')

class TimezoneUtils:
    def __init__(self):
        self.default_timezone = os.getenv('DEFAULT_TIMEZONE', 'UTC')
        self.ip_api_url = "http://ip-api.com/json/"
        
    def get_user_timezone(self, ip_address=None):
        """Get user's timezone based on IP address or use default"""
        try:
            if ip_address and ip_address != '127.0.0.1':
                # Use IP geolocation to determine timezone
                response = requests.get(f"{self.ip_api_url}{ip_address}")
                if response.status_code == 200:
                    data = response.json()
                    if data.get('status') == 'success':
                        timezone_name = data.get('timezone')
                        if timezone_name:
                            return timezone_name
            
            # Fallback to default timezone
            return self.default_timezone
            
        except Exception as e:
            print(f"⚠️ Error detecting timezone: {e}")
            return self.default_timezone
    
    def convert_to_local_time(self, utc_datetime, timezone_name=None):
        """Convert UTC datetime to local timezone"""
        try:
            if not timezone_name:
                timezone_name = self.default_timezone
            
            # Parse the datetime if it's a string
            if isinstance(utc_datetime, str):
                # Try to parse with timezone info first
                try:
                    dt = datetime.fromisoformat(utc_datetime.replace('Z', '+00:00'))
                except ValueError:
                    # If no timezone info, assume it's already in local time
                    dt = datetime.fromisoformat(utc_datetime)
            else:
                dt = utc_datetime
            
            # If datetime is naive (no timezone), assume it's in UTC
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            
            # Convert to target timezone
            target_tz = pytz.timezone(timezone_name)
            local_dt = dt.astimezone(target_tz)
            
            return local_dt
            
        except Exception as e:
            print(f"❌ Error converting to local time: {e}")
            return utc_datetime
    
    def convert_to_utc(self, local_datetime, timezone_name=None):
        """Convert local datetime to UTC"""
        try:
            if not timezone_name:
                timezone_name = self.default_timezone
            
            # Parse the datetime if it's a string
            if isinstance(local_datetime, str):
                dt = datetime.fromisoformat(local_datetime)
            else:
                dt = local_datetime
            
            # If datetime is naive, assume it's in the specified timezone
            if dt.tzinfo is None:
                local_tz = pytz.timezone(timezone_name)
                dt = local_tz.localize(dt)
            
            # Convert to UTC
            utc_dt = dt.astimezone(timezone.utc)
            
            return utc_dt
            
        except Exception as e:
            print(f"❌ Error converting to UTC: {e}")
            return local_datetime
    
    def format_local_time(self, datetime_obj, timezone_name=None, format_str="%Y-%m-%d %H:%M:%S"):
        """Format datetime in local timezone"""
        try:
            local_dt = self.convert_to_local_time(datetime_obj, timezone_name)
            return local_dt.strftime(format_str)
        except Exception as e:
            print(f"❌ Error formatting local time: {e}")
            return str(datetime_obj)
    
    def get_current_local_time(self, timezone_name=None):
        """Get current time in local timezone"""
        try:
            if not timezone_name:
                timezone_name = self.default_timezone
            
            utc_now = datetime.now(timezone.utc)
            return self.convert_to_local_time(utc_now, timezone_name)
            
        except Exception as e:
            print(f"❌ Error getting current local time: {e}")
            return datetime.now()
    
    def parse_event_datetime(self, datetime_str, timezone_name=None):
        """Parse event datetime string and convert to proper format"""
        try:
            if not timezone_name:
                timezone_name = self.default_timezone
            
            # Try to parse the datetime string
            try:
                # Check if it already has timezone info
                if 'Z' in datetime_str or '+' in datetime_str or '-' in datetime_str[-6:]:
                    # Has timezone info, parse as is
                    dt = datetime.fromisoformat(datetime_str.replace('Z', '+00:00'))
                else:
                    # No timezone info, assume it's in local timezone
                    dt = datetime.fromisoformat(datetime_str)
                    local_tz = pytz.timezone(timezone_name)
                    dt = local_tz.localize(dt)
                
                # Convert to UTC for storage
                utc_dt = self.convert_to_utc(dt, timezone_name)
                return utc_dt.isoformat()
                
            except ValueError as e:
                print(f"❌ Error parsing datetime string '{datetime_str}': {e}")
                return datetime_str
                
        except Exception as e:
            print(f"❌ Error parsing event datetime: {e}")
            return datetime_str
    
    def get_timezone_offset(self, timezone_name=None):
        """Get timezone offset from UTC in hours"""
        try:
            if not timezone_name:
                timezone_name = self.default_timezone
            
            tz = pytz.timezone(timezone_name)
            now = datetime.now(tz)
            offset = now.utcoffset().total_seconds() / 3600
            return offset
            
        except Exception as e:
            print(f"❌ Error getting timezone offset: {e}")
            return 0
    
    def get_available_timezones(self):
        """Get list of common timezones"""
        return [
            'UTC',
            'America/New_York',
            'America/Chicago',
            'America/Denver',
            'America/Los_Angeles',
            'Europe/London',
            'Europe/Paris',
            'Europe/Berlin',
            'Asia/Tokyo',
            'Asia/Shanghai',
            'Australia/Sydney',
            'Pacific/Auckland'
        ]

# Global timezone utils instance
timezone_utils = TimezoneUtils() 