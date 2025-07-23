#!/usr/bin/env python3
"""
Database initialization script for Calendar Sync App
This script sets up the SQLite database with all required tables and initial data.
"""

import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from extensions import db
from models import User, Event, Notification, UserRole
from datetime import datetime, timezone

def init_database():
    """Initialize the database with tables and default data"""
    
    print("🗄️  Initializing SQLite database...")
    
    # Create the app instance
    app = create_app('development')
    
    with app.app_context():
        # Create all database tables
        print("📋 Creating database tables...")
        db.create_all()
        
        # Check if admin user already exists
        admin_user = User.query.filter_by(email='admin@company.com').first()
        
        if not admin_user:
            print("👤 Creating default admin user...")
            admin_user = User(
                email='admin@company.com',
                password='admin123',  # In production, use a stronger password
                first_name='System',
                last_name='Administrator',
                role=UserRole.ADMIN,
                can_create_events=True,
                department='IT'
            )
            db.session.add(admin_user)
            
        # Create some sample users for testing
        if not User.query.filter_by(email='john.doe@company.com').first():
            print("👥 Creating sample users...")
            
            # Event Creator
            event_creator = User(
                email='john.doe@company.com',
                password='password123',
                first_name='John',
                last_name='Doe',
                role=UserRole.EVENT_CREATOR,
                can_create_events=True,
                department='HR'
            )
            db.session.add(event_creator)
            
            # Regular Employee
            employee = User(
                email='jane.smith@company.com',
                password='password123',
                first_name='Jane',
                last_name='Smith',
                role=UserRole.EMPLOYEE,
                can_create_events=False,
                department='Marketing'
            )
            db.session.add(employee)
            
            # Another Employee
            employee2 = User(
                email='bob.wilson@company.com',
                password='password123',
                first_name='Bob',
                last_name='Wilson',
                role=UserRole.EMPLOYEE,
                can_create_events=False,
                department='Sales'
            )
            db.session.add(employee2)
        
        # Create some sample events
        if not Event.query.first():
            print("📅 Creating sample events...")
            
            # Get admin user for creating events
            admin = User.query.filter_by(email='admin@company.com').first()
            
            # Organization-wide event
            org_event = Event(
                title='Company All-Hands Meeting',
                description='Monthly company-wide meeting to discuss updates and goals.',
                start_datetime=datetime(2025, 7, 25, 10, 0, 0),
                end_datetime=datetime(2025, 7, 25, 11, 30, 0),
                location='Main Conference Room',
                is_all_day=False,
                is_organization_wide=True,
                created_by_id=admin.id
            )
            db.session.add(org_event)
            
            # Department-specific event
            hr_event = Event(
                title='HR Training Session',
                description='Training session for new HR policies and procedures.',
                start_datetime=datetime(2025, 7, 28, 14, 0, 0),
                end_datetime=datetime(2025, 7, 28, 16, 0, 0),
                location='HR Training Room',
                is_all_day=False,
                is_organization_wide=False,
                departments=['HR', 'Management'],
                created_by_id=admin.id
            )
            db.session.add(hr_event)
            
            # All-day event
            holiday_event = Event(
                title='Company Holiday - Independence Day',
                description='Office closed for Independence Day celebration.',
                start_datetime=datetime(2025, 7, 4, 0, 0, 0),
                end_datetime=datetime(2025, 7, 4, 23, 59, 59),
                location='',
                is_all_day=True,
                is_organization_wide=True,
                created_by_id=admin.id
            )
            db.session.add(holiday_event)
        
        # Commit all changes
        db.session.commit()
        
        print("✅ Database initialization completed successfully!")
        print("\n📊 Database Summary:")
        print(f"   • Users: {User.query.count()}")
        print(f"   • Events: {Event.query.count()}")
        print(f"   • Notifications: {Notification.query.count()}")
        
        print("\n🔑 Default Login Credentials:")
        print("   Admin: admin@company.com / admin123")
        print("   Event Creator: john.doe@company.com / password123") 
        print("   Employee: jane.smith@company.com / password123")
        print("   Employee: bob.wilson@company.com / password123")
        
        print(f"\n🗄️  Database Location: {app.config['SQLALCHEMY_DATABASE_URI']}")

if __name__ == '__main__':
    init_database()
