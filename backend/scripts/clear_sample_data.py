#!/usr/bin/env python3
"""
Clear Sample Data Script
This script removes all sample events and notifications while keeping user accounts.
"""

import sys
import os

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app import create_app
from extensions import db
from models import Event, Notification

def clear_sample_data():
    """Clear all sample events and notifications from the database."""
    app = create_app()
    
    with app.app_context():
        try:
            print("🧹 Clearing sample data...")
            
            # Delete all notifications first (foreign key constraint)
            notifications_deleted = db.session.query(Notification).delete()
            print(f"✅ Deleted {notifications_deleted} notifications")
            
            # Delete all events
            events_deleted = db.session.query(Event).delete()
            print(f"✅ Deleted {events_deleted} events")
            
            # Commit the changes
            db.session.commit()
            
            print("🎉 Sample data cleared successfully!")
            print("📋 User accounts have been preserved")
            print("💡 You can now create your own events from scratch")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error clearing sample data: {str(e)}")
            return False
            
        return True

if __name__ == "__main__":
    print("=" * 50)
    print("    CLEAR SAMPLE DATA")
    print("=" * 50)
    
    # Confirm action
    response = input("⚠️  This will remove ALL events and notifications. Continue? (y/N): ")
    
    if response.lower() in ['y', 'yes']:
        success = clear_sample_data()
        if success:
            print("\n🚀 Ready to use your clean calendar app!")
        else:
            print("\n❌ Failed to clear sample data. Check the error above.")
    else:
        print("❌ Operation cancelled.")
