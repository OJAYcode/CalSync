#!/usr/bin/env python3
"""
Automatic Event Cleanup System
Deletes events after their end time has passed
"""

import sqlite3
from datetime import datetime, timezone
import time
import threading
from database import db

class AutoEventCleanup:
    def __init__(self):
        self.running = False
        self.cleanup_thread = None
        self.check_interval = 300  # Check every 5 minutes (300 seconds)
    
    def start_cleanup_service(self):
        """Start the automatic cleanup service"""
        if self.running:
            print("⚠️ Cleanup service already running")
            return
        
        self.running = True
        self.cleanup_thread = threading.Thread(target=self._cleanup_loop, daemon=True)
        self.cleanup_thread.start()
        print("✅ Automatic event cleanup service started")
        print(f"🕐 Will check for expired events every {self.check_interval} seconds")
    
    def stop_cleanup_service(self):
        """Stop the automatic cleanup service"""
        self.running = False
        if self.cleanup_thread:
            self.cleanup_thread.join(timeout=5)
        print("🛑 Automatic event cleanup service stopped")
    
    def _cleanup_loop(self):
        """Main cleanup loop"""
        while self.running:
            try:
                self.cleanup_expired_events()
                time.sleep(self.check_interval)
            except Exception as e:
                print(f"❌ Error in cleanup loop: {e}")
                time.sleep(60)  # Wait 1 minute before retrying
    
    def cleanup_expired_events(self):
        """Delete events that have passed their end time"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            # Get current UTC time
            current_time = datetime.now(timezone.utc)
            
            # Find events that have ended
            cursor.execute('''
                SELECT id, title, end_datetime, created_by
                FROM events 
                WHERE end_datetime < ?
                ORDER BY end_datetime ASC
            ''', (current_time.isoformat(),))
            
            expired_events = cursor.fetchall()
            
            if expired_events:
                print(f"🗑️ Found {len(expired_events)} expired events to delete")
                
                for event in expired_events:
                    event_id = event['id']
                    event_title = event['title']
                    end_time = event['end_datetime']
                    
                    # Delete the event
                    cursor.execute('DELETE FROM events WHERE id = ?', (event_id,))
                    
                    print(f"✅ Deleted expired event: {event_title} (ID: {event_id}, Ended: {end_time})")
                
                conn.commit()
                print(f"🎉 Successfully deleted {len(expired_events)} expired events")
            else:
                print("✅ No expired events found")
            
            conn.close()
            
        except Exception as e:
            print(f"❌ Error cleaning up expired events: {e}")
    
    def cleanup_all_expired_events_now(self):
        """Manually trigger cleanup of all expired events"""
        print("🔄 Manually cleaning up all expired events...")
        self.cleanup_expired_events()
        print("✅ Manual cleanup completed")
    
    def get_expired_events_count(self):
        """Get count of expired events without deleting them"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            current_time = datetime.now(timezone.utc)
            
            cursor.execute('''
                SELECT COUNT(*) as count
                FROM events 
                WHERE end_datetime < ?
            ''', (current_time.isoformat(),))
            
            result = cursor.fetchone()
            count = result['count'] if result else 0
            
            conn.close()
            return count
            
        except Exception as e:
            print(f"❌ Error counting expired events: {e}")
            return 0
    
    def list_expired_events(self):
        """List all expired events without deleting them"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            current_time = datetime.now(timezone.utc)
            
            cursor.execute('''
                SELECT id, title, description, start_datetime, end_datetime, created_by, created_at
                FROM events 
                WHERE end_datetime < ?
                ORDER BY end_datetime ASC
            ''', (current_time.isoformat(),))
            
            expired_events = cursor.fetchall()
            conn.close()
            
            return expired_events
            
        except Exception as e:
            print(f"❌ Error listing expired events: {e}")
            return []

# Global cleanup service instance
auto_cleanup = AutoEventCleanup()

def start_auto_cleanup():
    """Start the automatic cleanup service"""
    auto_cleanup.start_cleanup_service()

def stop_auto_cleanup():
    """Stop the automatic cleanup service"""
    auto_cleanup.stop_cleanup_service()

def cleanup_expired_events():
    """Manually trigger cleanup"""
    auto_cleanup.cleanup_all_expired_events_now()

def main():
    """Main function for manual testing"""
    print("🗑️ Automatic Event Cleanup System")
    print("=" * 50)
    
    # Check current expired events
    expired_count = auto_cleanup.get_expired_events_count()
    print(f"📊 Currently {expired_count} expired events in database")
    
    if expired_count > 0:
        print("\n📋 Expired events:")
        expired_events = auto_cleanup.list_expired_events()
        for event in expired_events:
            print(f"  - {event['title']} (ID: {event['id']}, Ended: {event['end_datetime']})")
    
    print("\n🔧 Options:")
    print("1. Clean up all expired events now")
    print("2. Start automatic cleanup service")
    print("3. Stop automatic cleanup service")
    print("4. Show expired events count")
    print("5. Exit")
    
    while True:
        choice = input("\nEnter your choice (1-5): ").strip()
        
        if choice == "1":
            auto_cleanup.cleanup_all_expired_events_now()
        
        elif choice == "2":
            auto_cleanup.start_cleanup_service()
        
        elif choice == "3":
            auto_cleanup.stop_cleanup_service()
        
        elif choice == "4":
            count = auto_cleanup.get_expired_events_count()
            print(f"📊 {count} expired events found")
        
        elif choice == "5":
            auto_cleanup.stop_cleanup_service()
            print("👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid choice. Please enter 1-5.")

if __name__ == "__main__":
    main() 