#!/usr/bin/env python3
"""
Event Model for SQLite Calendar App
Handles event creation, retrieval, and management
"""

from database import db
from datetime import datetime

class Event:
    def __init__(self):
        pass
    
    def create_event(self, title, description, start_datetime, end_datetime, created_by):
        """Create a new event"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO events (title, description, start_datetime, end_datetime, created_by)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                title.strip(),
                description.strip() if description else "",
                start_datetime,
                end_datetime,
                created_by
            ))
            
            event_id = cursor.lastrowid
            conn.commit()
            conn.close()
            
            return {
                "success": True,
                "message": "Event created successfully",
                "event_id": event_id
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_all_events(self):
        """Get all events with creator information"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT 
                    e.id, e.title, e.description, e.start_datetime, e.end_datetime,
                    e.created_by, e.created_at,
                    u.first_name, u.last_name, u.email
                FROM events e
                LEFT JOIN users u ON e.created_by = u.id
                ORDER BY e.start_datetime ASC
            ''')
            
            events = cursor.fetchall()
            conn.close()
            
            return [{
                "id": event['id'],
                "title": event['title'],
                "description": event['description'],
                "start_datetime": event['start_datetime'],
                "end_datetime": event['end_datetime'],
                "created_by": event['created_by'],
                "created_at": event['created_at'],
                "creator_name": f"{event['first_name']} {event['last_name']}" if event['first_name'] else None,
                "creator_email": event['email']
            } for event in events]
            
        except Exception as e:
            print(f"Error getting events: {str(e)}")
            return []
    
    def get_event_by_id(self, event_id):
        """Get event by ID"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT 
                    e.id, e.title, e.description, e.start_datetime, e.end_datetime,
                    e.created_by, e.created_at,
                    u.first_name, u.last_name, u.email
                FROM events e
                LEFT JOIN users u ON e.created_by = u.id
                WHERE e.id = ?
            ''', (event_id,))
            
            event = cursor.fetchone()
            conn.close()
            
            if event:
                return {
                    "id": event['id'],
                    "title": event['title'],
                    "description": event['description'],
                    "start_datetime": event['start_datetime'],
                    "end_datetime": event['end_datetime'],
                    "created_by": event['created_by'],
                    "created_at": event['created_at'],
                    "creator_name": f"{event['first_name']} {event['last_name']}" if event['first_name'] else None,
                    "creator_email": event['email']
                }
            return None
            
        except Exception as e:
            print(f"Error getting event: {str(e)}")
            return None
    
    def get_events_count(self):
        """Get total number of events"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT COUNT(*) as count FROM events')
            result = cursor.fetchone()
            conn.close()
            return result['count'] if result else 0
            
        except Exception as e:
            print(f"Error counting events: {str(e)}")
            return 0

    def get_today_events_count(self):
        """Get count of events starting today (local time)"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            today = datetime.now().date()
            cursor.execute('''
                SELECT COUNT(*) as count FROM events
                WHERE DATE(start_datetime) = ?
            ''', (today.isoformat(),))
            result = cursor.fetchone()
            conn.close()
            return result['count'] if result else 0
        except Exception as e:
            print(f"Error counting today's events: {str(e)}")
            return 0

    def delete_event(self, event_id):
        """Delete an event by ID, including related notifications"""
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            # Delete notifications for this event
            cursor.execute('DELETE FROM notifications WHERE event_id = ?', (event_id,))
            # Now delete the event
            cursor.execute('DELETE FROM events WHERE id = ?', (event_id,))
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error deleting event: {str(e)}")
            return False

# Global event model instance
event_model = Event()
