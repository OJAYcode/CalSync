#!/usr/bin/env python3
"""
Startup script for CalSync with automatic database migration
This ensures user credentials persist across deployments
"""

import os
import sys
import subprocess
from pathlib import Path

def run_migration():
    """Run the database migration script"""
    print("🔄 Checking database migration...")
    
    try:
        # Run the migration script
        result = subprocess.run([
            sys.executable, 
            'scripts/migrate_database.py', 
            'migrate'
        ], capture_output=True, text=True, cwd=os.getcwd())
        
        if result.returncode == 0:
            print("✅ Database migration completed successfully")
            return True
        else:
            print(f"⚠️ Migration script output: {result.stdout}")
            if result.stderr:
                print(f"⚠️ Migration errors: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error running migration: {str(e)}")
        return False

def show_database_info():
    """Show current database information"""
    print("📊 Database Information:")
    
    try:
        result = subprocess.run([
            sys.executable, 
            'scripts/migrate_database.py', 
            'info'
        ], capture_output=True, text=True, cwd=os.getcwd())
        
        if result.returncode == 0:
            print(result.stdout)
        else:
            print("⚠️ Could not get database info")
            
    except Exception as e:
        print(f"❌ Error getting database info: {str(e)}")

def start_app():
    """Start the Flask application"""
    print("🚀 Starting CalSync application...")
    
    try:
        # Import and run the Flask app
        from app import app
        
        print("✅ Flask app imported successfully")
        print("🌐 Starting server on http://localhost:5000")
        print("📱 Frontend should be available at http://localhost:5173")
        print("\n" + "="*50)
        print("🎉 CalSync is now running!")
        print("="*50)
        
        # Start the Flask app
        app.run(host='0.0.0.0', port=5000, debug=True)
        
    except Exception as e:
        print(f"❌ Error starting Flask app: {str(e)}")
        print("💡 Make sure all dependencies are installed:")
        print("   pip install -r requirements.txt")

def main():
    """Main startup function"""
    print("🎯 CalSync Startup with Database Migration")
    print("="*50)
    
    # Check if we're in the right directory
    if not os.path.exists('app.py'):
        print("❌ Please run this script from the backend directory")
        print("   cd backend")
        print("   python start_with_migration.py")
        return
    
    # Run migration first
    migration_success = run_migration()
    
    if migration_success:
        print("\n📋 Migration Summary:")
        show_database_info()
        
        print("\n🚀 Starting application...")
        start_app()
    else:
        print("\n⚠️ Migration had issues, but continuing with app startup...")
        print("💡 You can manually run: python scripts/migrate_database.py migrate")
        start_app()

if __name__ == "__main__":
    main() 