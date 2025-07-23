#!/usr/bin/env python3
"""
Database management script for Calendar Sync App
Provides utilities for database operations with SQLite
"""

import os
import sys
import argparse
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from extensions import db
from models import User, Event, Notification, UserRole
from datetime import datetime

def create_tables():
    """Create all database tables"""
    app = create_app('development')
    with app.app_context():
        print("📋 Creating database tables...")
        db.create_all()
        print("✅ Tables created successfully!")

def drop_tables():
    """Drop all database tables"""
    app = create_app('development')
    with app.app_context():
        print("🗑️  Dropping all database tables...")
        db.drop_all()
        print("✅ Tables dropped successfully!")

def reset_database():
    """Reset database (drop and recreate tables)"""
    app = create_app('development')
    with app.app_context():
        print("🔄 Resetting database...")
        db.drop_all()
        db.create_all()
        print("✅ Database reset successfully!")

def show_database_info():
    """Show database information"""
    app = create_app('development')
    with app.app_context():
        print("📊 Database Information:")
        print(f"   Database URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        
        # Check if tables exist
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        
        print(f"   Tables: {', '.join(tables) if tables else 'None'}")
        
        if tables:
            print("\n📈 Record Counts:")
            try:
                print(f"   • Users: {User.query.count()}")
                print(f"   • Events: {Event.query.count()}")
                print(f"   • Notifications: {Notification.query.count()}")
            except Exception as e:
                print(f"   Error querying tables: {e}")

def list_users():
    """List all users in the database"""
    app = create_app('development')
    with app.app_context():
        users = User.query.all()
        print(f"👥 Users ({len(users)} total):")
        print("-" * 80)
        print(f"{'ID':<4} {'Email':<25} {'Name':<20} {'Role':<15} {'Dept':<10} {'Can Create'}")
        print("-" * 80)
        
        for user in users:
            print(f"{user.id:<4} {user.email:<25} {user.first_name + ' ' + user.last_name:<20} {user.role.value:<15} {user.department or 'N/A':<10} {'Yes' if user.can_create_events else 'No'}")

def list_events():
    """List all events in the database"""
    app = create_app('development')
    with app.app_context():
        events = Event.query.all()
        print(f"📅 Events ({len(events)} total):")
        print("-" * 90)
        print(f"{'ID':<4} {'Title':<25} {'Start Date':<12} {'Location':<15} {'Org-Wide':<9} {'Creator'}")
        print("-" * 90)
        
        for event in events:
            creator_name = f"{event.created_by.first_name} {event.created_by.last_name}"
            start_date = event.start_datetime.strftime('%Y-%m-%d')
            location = (event.location[:12] + '...') if event.location and len(event.location) > 15 else (event.location or 'N/A')
            
            print(f"{event.id:<4} {event.title[:22]:<25} {start_date:<12} {location:<15} {'Yes' if event.is_organization_wide else 'No':<9} {creator_name}")

def create_admin_user():
    """Create admin user"""
    app = create_app('development')
    with app.app_context():
        # Check if admin already exists
        admin = User.query.filter_by(email='admin@company.com').first()
        if admin:
            print("⚠️  Admin user already exists!")
            return
        
        admin = User(
            email='admin@company.com',
            password='admin123',
            first_name='System',
            last_name='Administrator',
            role=UserRole.ADMIN,
            can_create_events=True,
            department='IT'
        )
        db.session.add(admin)
        db.session.commit()
        print("✅ Admin user created: admin@company.com / admin123")

def backup_database():
    """Create a backup of the SQLite database"""
    app = create_app('development')
    db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
    
    if os.path.exists(db_path):
        backup_path = f"{db_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        import shutil
        shutil.copy2(db_path, backup_path)
        print(f"💾 Database backed up to: {backup_path}")
    else:
        print("❌ Database file not found!")

def clear_sample_data():
    """Clear all sample events and notifications while keeping users"""
    app = create_app('development')
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

def main():
    parser = argparse.ArgumentParser(description='Database management for Calendar Sync App')
    parser.add_argument('command', choices=[
        'create', 'drop', 'reset', 'info', 'users', 'events', 'admin', 'backup', 'clear-data'
    ], help='Database operation to perform')
    
    args = parser.parse_args()
    
    if args.command == 'create':
        create_tables()
    elif args.command == 'drop':
        confirm = input("Are you sure you want to drop all tables? (yes/no): ")
        if confirm.lower() == 'yes':
            drop_tables()
        else:
            print("Operation cancelled.")
    elif args.command == 'reset':
        confirm = input("Are you sure you want to reset the database? (yes/no): ")
        if confirm.lower() == 'yes':
            reset_database()
        else:
            print("Operation cancelled.")
    elif args.command == 'info':
        show_database_info()
    elif args.command == 'users':
        list_users()
    elif args.command == 'events':
        list_events()
    elif args.command == 'admin':
        create_admin_user()
    elif args.command == 'backup':
        backup_database()
    elif args.command == 'clear-data':
        confirm = input("⚠️  This will remove ALL events and notifications. Continue? (y/N): ")
        if confirm.lower() in ['y', 'yes']:
            clear_sample_data()
        else:
            print("❌ Operation cancelled.")

if __name__ == '__main__':
    main()
