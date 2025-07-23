#!/usr/bin/env python3
"""
Simple script to clear all events and notifications from the database
"""

import sys
import os

# Add the backend directory to the Python path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from app import create_app
from extensions import db
from models import Event, Notification

def clear_all_events():
    """Clear all events and notifications from the database."""
    app = create_app()
    
    with app.app_context():
        try:
            # Delete all notifications first (foreign key constraint)
            notifications_count = db.session.query(Notification).count()
            db.session.query(Notification).delete()
            
            # Delete all events
            events_count = db.session.query(Event).count()
            db.session.query(Event).delete()
            
            # Commit the changes
            db.session.commit()
            
            print(f"Successfully deleted {events_count} events and {notifications_count} notifications")
            print("Database is now clean - ready for your own events!")
            
        except Exception as e:
            db.session.rollback()
            print(f"Error: {str(e)}")

if __name__ == "__main__":
    clear_all_events()
