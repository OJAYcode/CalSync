#!/usr/bin/env python3
"""
CalSync Backend API
Calendar synchronization application backend
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import secrets
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Import models and database
from database import db
from users import User
from events import Event
from notification_service import notification_service
from timezone_utils import timezone_utils

# Import bulletproof user system
try:
    from bulletproof_user_system import BulletproofUserSystem
    bulletproof_system = BulletproofUserSystem()
    BULLETPROOF_SYSTEM_AVAILABLE = True
    print("✅ Bulletproof user system loaded")
except ImportError:
    print("⚠️ Bulletproof user system not available")
    BULLETPROOF_SYSTEM_AVAILABLE = False

# Import automatic event cleanup system
try:
    from auto_cleanup_events import start_auto_cleanup, cleanup_expired_events
    AUTO_CLEANUP_AVAILABLE = True
    print("✅ Automatic event cleanup system loaded")
except ImportError:
    print("⚠️ Automatic event cleanup system not available")
    AUTO_CLEANUP_AVAILABLE = False

# Import password persistence system (legacy)
try:
    from password_persistence import PasswordPersistence
    password_persistence = PasswordPersistence()
    PASSWORD_PERSISTENCE_AVAILABLE = True
    print("✅ Password persistence system loaded")
except ImportError:
    print("⚠️ Password persistence system not available")
    PASSWORD_PERSISTENCE_AVAILABLE = False

# Optional imports for notifications (backend will work without these)
try:
    from firebase_service import send_event_reminder_notification
    FIREBASE_AVAILABLE = True
except ImportError:
    print("⚠️ Firebase service not available - push notifications disabled")
    FIREBASE_AVAILABLE = False
    def send_event_reminder_notification(*args, **kwargs):
        print("❌ Push notification not sent - Firebase not configured")
        return False

try:
    from email_service import send_event_reminder_email
    EMAIL_AVAILABLE = True
except ImportError:
    print("⚠️ Email service not available - email notifications disabled")
    EMAIL_AVAILABLE = False
    def send_event_reminder_email(*args, **kwargs):
        print("❌ Email notification not sent - Email service not configured")
        return False

# Load environment variables
load_dotenv('config.env')

app = Flask(__name__)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY', 'your_super_secret_key_here_change_this_in_production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)  # Tokens expire in 7 days
jwt = JWTManager(app)

# JWT Error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print(f"❌ JWT token expired: {jwt_payload}")
    return jsonify({'error': 'Token has expired'}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"❌ Invalid JWT token: {error}")
    return jsonify({'error': 'Invalid token'}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    print(f"❌ Missing JWT token: {error}")
    return jsonify({'error': 'Missing token'}), 401

# Enable CORS for all origins (for production deployment)
CORS(app, origins="*")

# Database is automatically initialized when imported
# Create model instances with error handling
try:
    user_model = User()
    event_model = Event()
    print("✅ User and Event models initialized successfully")
except Exception as e:
    print(f"❌ Error initializing models: {e}")
    # Create fallback models
    class FallbackUser:
        def get_user_by_id(self, user_id):
            return None
        def get_all_users(self):
            return []
        def update_user(self, user_id, data):
            return {'success': False, 'error': 'Model not available'}
        def change_password(self, user_id, old_password, new_password):
            return {'success': False, 'error': 'Model not available'}
    
    class FallbackEvent:
        def delete_event(self, event_id):
            return False
    
    user_model = FallbackUser()
    event_model = FallbackEvent()
    print("⚠️ Using fallback models due to initialization error")

def create_notifications_for_event(event_id, start_datetime, reminders):
    """Create notification records for all users for each reminder time (in minutes)"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Get event details
        cursor.execute('SELECT title, description FROM events WHERE id = ?', (event_id,))
        event = cursor.fetchone()
        if not event:
            print(f"❌ Event {event_id} not found for notification creation")
            return
        
        event_title = event[0]
        event_description = event[1] or "No description provided"
        
        # Get all users
        users = user_model.get_all_users()
        
        for reminder in reminders:
            # Calculate notification time
            notify_at = (datetime.fromisoformat(start_datetime) - timedelta(minutes=reminder)).isoformat()
            
            # Create notification for each user
            for user in users:
                # Create notification title and message
                title = f"Event Reminder: {event_title}"
                message = f"Your event '{event_title}' starts in {reminder} minutes. {event_description}"
                
                cursor.execute('''
                    INSERT INTO notifications (
                        user_id, event_id, title, message, notification_type,
                        is_read, is_sent, scheduled_for, created_at
                    )
                    VALUES (?, ?, ?, ?, ?, 0, 0, ?, CURRENT_TIMESTAMP)
                ''', (
                    user['id'], event_id, title, message, 'event_reminder', notify_at
                ))
        
        conn.commit()
        conn.close()
        print(f"✅ Created {len(users) * len(reminders)} notifications for event {event_id}")
        
    except Exception as e:
        print(f"❌ Error creating notifications: {e}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")

# Add 'read' column to notifications table if not present
try:
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(notifications)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'read' not in columns:
        cursor.execute('ALTER TABLE notifications ADD COLUMN read BOOLEAN DEFAULT 0')
        conn.commit()
    conn.close()
    print("✅ Database schema check completed")
except Exception as e:
    print(f"⚠️ Could not add 'read' column to notifications: {e}")

def send_due_notifications():
    """Send notifications for events that are due"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Get notifications that are due to be sent
        current_time = datetime.now().isoformat()
        cursor.execute('''
            SELECT n.id, n.user_id, n.event_id, n.title, n.message, n.notification_type,
                   COALESCE(u.fcm_token, '') as fcm_token, u.email, u.first_name, u.last_name
            FROM notifications n
            JOIN users u ON n.user_id = u.id
            WHERE n.scheduled_for <= ? AND n.is_sent = 0
        ''', (current_time,))
        
        due_notifications = cursor.fetchall()
        
        for notification in due_notifications:
            notif_id, user_id, event_id, title, message, notif_type, fcm_token, email, first_name, last_name = notification
            
            # Mark as sent
            cursor.execute('UPDATE notifications SET is_sent = 1, sent_at = CURRENT_TIMESTAMP WHERE id = ?', (notif_id,))
            
            # Send push notification if FCM token available
            if fcm_token and FIREBASE_AVAILABLE:
                try:
                    send_event_reminder_notification(fcm_token, title, message)
                    print(f"✅ Push notification sent to {first_name} {last_name}")
                except Exception as e:
                    print(f"❌ Failed to send push notification: {e}")
            
            # Send email notification if email service available
            if email and EMAIL_AVAILABLE:
                try:
                    send_event_reminder_email(email, first_name, title, message)
                    print(f"✅ Email notification sent to {email}")
                except Exception as e:
                    print(f"❌ Failed to send email notification: {e}")
        
        conn.commit()
        conn.close()
        
        if due_notifications:
            print(f"✅ Processed {len(due_notifications)} notifications")
        
    except Exception as e:
        print(f"❌ Error sending due notifications: {e}")

# Start background scheduler for notifications
try:
    from apscheduler.schedulers.background import BackgroundScheduler
    from apscheduler.triggers.interval import IntervalTrigger
    
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        func=send_due_notifications,
        trigger=IntervalTrigger(minutes=1),  # Check every minute
        id='send_notifications',
        name='Send due notifications',
        replace_existing=True
    )
    scheduler.start()
    print("✅ Background notification scheduler started")
except ImportError:
    print("⚠️ APScheduler not available - notifications will be sent manually")
except Exception as e:
    print(f"⚠️ Failed to start notification scheduler: {e}")

# Authentication Routes
@app.route('/auth/signup', methods=['POST'])
def signup():
    """User signup endpoint"""
    try:
        data = request.get_json()
        result = user_model.create_user(
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role=data.get('role', 'employee')
        )
        
        if result['success']:
            # Backup passwords after successful signup
            if PASSWORD_PERSISTENCE_AVAILABLE:
                try:
                    password_persistence.backup_all_passwords()
                    print("💾 Password backup updated after new user signup")
                except Exception as e:
                    print(f"⚠️ Password backup failed: {e}")
            
            return jsonify({'message': 'User created successfully'}), 201
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        result = user_model.login_user(data['email'], data['password'])
        
        if result['success']:
            # Create JWT token - ensure user ID is a string
            user_id = str(result['user']['id'])  # Convert to string
            access_token = create_access_token(identity=user_id)
            
            return jsonify({
                'message': 'Login successful',
                'token': access_token,
                'user': result['user']
            }), 200
        else:
            return jsonify({'error': result['error']}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auth/logout', methods=['POST'])
def logout():
    """User logout endpoint"""
    try:
        # With JWT, we don't need to store sessions server-side
        # The client just needs to remove the token
        return jsonify({'message': 'Logged out successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Event Routes
@app.route('/events', methods=['GET'])
def get_events():
    """Get all events in local timezone"""
    try:
        # Get timezone from query parameter or detect from IP
        user_timezone = request.args.get('timezone') or timezone_utils.get_user_timezone(request.remote_addr)
        print(f"🌍 Requested timezone: {user_timezone}")
        
        events = event_model.get_all_events(user_timezone)
        return jsonify(events), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/events', methods=['POST'])
@jwt_required()
def create_event():
    """Create a new event - requires authentication"""
    try:
        print("🔍 Starting event creation...")
        
        # Get user ID from JWT token
        user_id = get_jwt_identity()
        print(f"👤 User ID from JWT: {user_id}")
        
        # Convert user_id to int if it's a string (for database lookup)
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
            except ValueError:
                return jsonify({'error': 'Invalid user ID format'}), 400
        
        # Get user data
        print(f"🔍 Looking up user with ID: {user_id} (type: {type(user_id)})")
        user = user_model.get_user_by_id(user_id)
        print(f"🔍 User lookup result: {user}")
        
        if not user:
            print("❌ User not found")
            # Let's check what users exist in the database
            try:
                conn = db.get_connection()
                cursor = conn.cursor()
                cursor.execute('SELECT id, email, first_name, last_name FROM users LIMIT 5')
                users = cursor.fetchall()
                conn.close()
                print(f"🔍 Available users in database: {users}")
            except Exception as db_error:
                print(f"❌ Error checking database: {db_error}")
            
            return jsonify({'error': 'User not found'}), 404
        
        print(f"✅ User found: {user.get('email', 'Unknown')}")
        
        data = request.get_json()
        print(f"📝 Request data: {data}")
        
        if not data:
            print("❌ No request data")
            return jsonify({'error': 'No request data provided'}), 400
        
        # Validate required fields
        required_fields = ['title', 'start_datetime', 'end_datetime']
        for field in required_fields:
            if not data.get(field):
                print(f"❌ Missing required field: {field}")
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        print("✅ All required fields present")
        
        # Get user's timezone (from request IP or default)
        user_timezone = data.get('timezone') or timezone_utils.get_user_timezone(request.remote_addr)
        print(f"🌍 User timezone: {user_timezone}")
        
        # Parse and convert datetime strings to UTC for storage
        start_datetime_utc = timezone_utils.parse_event_datetime(data['start_datetime'], user_timezone)
        end_datetime_utc = timezone_utils.parse_event_datetime(data['end_datetime'], user_timezone)
        
        print(f"🕐 Start datetime (local): {data['start_datetime']} -> UTC: {start_datetime_utc}")
        print(f"🕐 End datetime (local): {data['end_datetime']} -> UTC: {end_datetime_utc}")
        
        # Create event with UTC times
        result = event_model.create_event(
            title=data['title'],
            description=data.get('description', ''),
            start_datetime=start_datetime_utc,
            end_datetime=end_datetime_utc,
            created_by=user_id,
            timezone=user_timezone
        )
        
        print(f"📊 Event creation result: {result}")
        
        if result['success']:
            # Handle reminders/notifications
            reminders = data.get('reminders', [15])  # Default: 15 min before
            create_notifications_for_event(result['event_id'], data['start_datetime'], reminders)
            return jsonify(result), 201
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        print(f"❌ Error in create_event: {str(e)}")
        print(f"❌ Error type: {type(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return jsonify({'error': str(e)}), 500

@app.route('/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    """Get event by ID"""
    try:
        event = event_model.get_event_by_id(event_id)
        if event:
            return jsonify(event), 200
        else:
            return jsonify({'error': 'Event not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/events/stats', methods=['GET'])
def get_event_stats():
    """Get event statistics for dashboard"""
    try:
        total_events = event_model.get_events_count()
        today_events = event_model.get_today_events_count()
        return jsonify({
            'total_events': total_events,
            'today_events': today_events,
            'upcoming_events': 0,   # TODO: Implement upcoming events count
            'completed_events': 0   # TODO: Implement completed events count
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/events/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    """Delete an event by ID (admin or event creator)"""
    try:
        print(f"🔍 Starting delete event for ID: {event_id}")
        
        user_id = get_jwt_identity()
        print(f"👤 User ID from JWT: {user_id}")
        
        # Convert user_id to int if it's a string (for database lookup)
        if isinstance(user_id, str):
            try:
                user_id = int(user_id)
                print(f"✅ Converted user_id to int: {user_id}")
            except ValueError:
                print(f"❌ Failed to convert user_id to int: {user_id}")
                return jsonify({'error': 'Invalid user ID format'}), 400
        
        user = user_model.get_user_by_id(user_id)
        if not user:
            print(f"❌ User not found for ID: {user_id}")
            return jsonify({'error': 'User not found'}), 404
        
        print(f"✅ User found: {user.get('email', 'Unknown')}, Role: {user.get('role', 'Unknown')}")
        
        # Check if user is admin or the event creator
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT created_by FROM events WHERE id = ?', (event_id,))
        event = cursor.fetchone()
        conn.close()
        
        if not event:
            print(f"❌ Event not found for ID: {event_id}")
            return jsonify({'error': 'Event not found'}), 404
        
        print(f"✅ Event found, created by: {event['created_by']}")
        print(f"🔍 User ID: {user['id']}, Event creator: {event['created_by']}, User role: {user.get('role')}")
        
        # Allow admin or event creator to delete
        if user.get('role') != 'admin' and event['created_by'] != user['id']:
            print(f"❌ Access denied - User role: {user.get('role')}, Event creator: {event['created_by']}, User ID: {user['id']}")
            return jsonify({'error': 'Access denied. Only admin or event creator can delete events'}), 403
        
        print("✅ User has permission to delete event")
        
        success = event_model.delete_event(event_id)
        if success:
            print("✅ Event deleted successfully")
            return jsonify({'message': 'Event deleted successfully'}), 200
        else:
            print("❌ Failed to delete event in model")
            return jsonify({'error': 'Failed to delete event'}), 500
            
    except Exception as e:
        print(f"❌ Error in delete_event: {str(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        return jsonify({'error': 'Failed to delete event'}), 500

# User Routes
@app.route('/users/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    try:
        user_id = get_jwt_identity()
        user = user_model.get_user_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/users/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    """Update current user information"""
    try:
        user_id = get_jwt_identity()
        user = user_model.get_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        data = request.get_json()
        # Only allow updating certain fields
        allowed_fields = ['first_name', 'last_name', 'department', 'email']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        result = user_model.update_user(user['id'], update_data)
        if result['success']:
            # Update session (JWT token is not session, so no direct session update here)
            # The user object returned by get_user_by_id is the current state
            return jsonify({'message': 'Profile updated successfully'}), 200
        else:
            return jsonify({'error': result['error']}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auth/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        user_id = get_jwt_identity()
        user = user_model.get_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        data = request.get_json()
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        if not old_password or not new_password:
            return jsonify({'error': 'Old and new password required'}), 400
        result = user_model.change_password(user['id'], old_password, new_password)
        if result['success']:
            # Backup passwords after successful password change
            if PASSWORD_PERSISTENCE_AVAILABLE:
                try:
                    password_persistence.backup_all_passwords()
                    print("💾 Password backup updated after password change")
                except Exception as e:
                    print(f"⚠️ Password backup failed: {e}")
            
            return jsonify({'message': 'Password changed successfully'}), 200
        else:
            return jsonify({'error': result['error']}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users (admin only)"""
    try:
        user_id = get_jwt_identity()
        user = user_model.get_user_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        users = user_model.get_all_users()
        return jsonify(users), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User Management Endpoints
@app.route('/users/<int:user_id>/promote', methods=['POST'])
@jwt_required()
def promote_user(user_id):
    """Promote user to admin (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = user_model.get_user_by_id(current_user_id)
        
        if not current_user or current_user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Prevent self-promotion
        if int(current_user_id) == user_id:
            return jsonify({'error': 'Cannot promote yourself'}), 400
        
        result = user_model.promote_user(user_id)
        if result['success']:
            return jsonify({'message': 'User promoted to admin successfully'}), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/users/<int:user_id>/demote', methods=['POST'])
@jwt_required()
def demote_user(user_id):
    """Demote admin to employee (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = user_model.get_user_by_id(current_user_id)
        
        if not current_user or current_user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Prevent self-demotion
        if int(current_user_id) == user_id:
            return jsonify({'error': 'Cannot demote yourself'}), 400
        
        result = user_model.demote_user(user_id)
        if result['success']:
            return jsonify({'message': 'User demoted to employee successfully'}), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/users/<int:user_id>/deactivate', methods=['POST'])
@jwt_required()
def deactivate_user(user_id):
    """Deactivate user (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = user_model.get_user_by_id(current_user_id)
        
        if not current_user or current_user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        # Prevent self-deactivation
        if int(current_user_id) == user_id:
            return jsonify({'error': 'Cannot deactivate yourself'}), 400
        
        result = user_model.deactivate_user(user_id)
        if result['success']:
            return jsonify({'message': 'User deactivated successfully'}), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/users/<int:user_id>/reactivate', methods=['POST'])
@jwt_required()
def reactivate_user(user_id):
    """Reactivate user (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        current_user = user_model.get_user_by_id(current_user_id)
        
        if not current_user or current_user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        result = user_model.reactivate_user(user_id)
        if result['success']:
            return jsonify({'message': 'User reactivated successfully'}), 200
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Department Management Endpoints
@app.route('/departments', methods=['GET'])
def list_departments():
    """List all departments"""
    try:
        # Return default departments if database fails
        default_departments = [
            {'id': 1, 'name': 'HR'},
            {'id': 2, 'name': 'IT'},
            {'id': 3, 'name': 'Marketing'},
            {'id': 4, 'name': 'Sales'},
            {'id': 5, 'name': 'Finance'},
            {'id': 6, 'name': 'Operations'},
            {'id': 7, 'name': 'Legal'},
            {'id': 8, 'name': 'R&D'}
        ]
        
        try:
            conn = db.get_connection()
            cursor = conn.cursor()
            cursor.execute('SELECT id, name FROM departments ORDER BY name ASC')
            departments = [dict(row) for row in cursor.fetchall()]
            conn.close()
            
            # If we got departments from database, return them
            if departments:
                return jsonify(departments), 200
            else:
                # If no departments in database, return defaults
                return jsonify(default_departments), 200
                
        except Exception as db_error:
            print(f"❌ Database error in list_departments: {str(db_error)}")
            # Return default departments if database fails
            return jsonify(default_departments), 200
            
    except Exception as e:
        print(f"❌ Critical error in list_departments: {str(e)}")
        # Return default departments as fallback
        return jsonify([
            {'id': 1, 'name': 'HR'},
            {'id': 2, 'name': 'IT'},
            {'id': 3, 'name': 'Marketing'},
            {'id': 4, 'name': 'Sales'},
            {'id': 5, 'name': 'Finance'},
            {'id': 6, 'name': 'Operations'},
            {'id': 7, 'name': 'Legal'},
            {'id': 8, 'name': 'R&D'}
        ]), 200

@app.route('/departments', methods=['POST'])
@jwt_required()
def add_department():
    """Add a new department (admin only)"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user or user.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    data = request.get_json()
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Department name required'}), 400
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('INSERT INTO departments (name) VALUES (?)', (name,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Department added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/departments/<int:dept_id>', methods=['DELETE'])
@jwt_required()
def delete_department(dept_id):
    """Delete a department (admin only)"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user or user.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM departments WHERE id = ?', (dept_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Department deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Department Feed Endpoints
@app.route('/department-feeds', methods=['GET'])
def list_department_feeds():
    """List all department feeds, optionally filter by department"""
    try:
        department = request.args.get('department')
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Check if department_feeds table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='department_feeds'")
        table_exists = cursor.fetchone()
        
        if not table_exists:
            # Return empty array if table doesn't exist
            conn.close()
            return jsonify([]), 200
        
        if department:
            cursor.execute('SELECT * FROM department_feeds WHERE department = ? ORDER BY created_at DESC', (department,))
        else:
            cursor.execute('SELECT * FROM department_feeds ORDER BY created_at DESC')
        feeds = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(feeds), 200
    except Exception as e:
        print(f"❌ Error in list_department_feeds: {str(e)}")
        return jsonify([]), 200  # Return empty array instead of error

@app.route('/department-feeds', methods=['POST'])
@jwt_required()
def create_department_feed():
    """Create a new department feed (admin only)"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    department = data.get('department')
    if not title or not content or not department:
        return jsonify({'error': 'Title, content, and department are required'}), 400
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO department_feeds (title, content, department, created_by)
            VALUES (?, ?, ?, ?)
        ''', (title, content, department, user['id']))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Feed created successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/department-feeds/<int:feed_id>', methods=['DELETE'])
@jwt_required()
def delete_department_feed(feed_id):
    """Delete a department feed (admin only)"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM department_feeds WHERE id = ?', (feed_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Feed deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Health check
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM departments')
        dept_count = cursor.fetchone()[0]
        conn.close()
        
        return jsonify({
            'status': 'healthy',
            'database': 'sqlite',
            'database_path': db.db_path,
            'departments_count': dept_count,
            'message': 'Calendar App API is running'
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'sqlite',
            'database_path': db.db_path,
            'error': str(e),
            'message': 'Database connection failed'
        }), 500

# ============================================================================
# NEW NOTIFICATION SYSTEM
# ============================================================================

# Create new notifications table for the new system
def create_new_notifications_table():
    """Create the new notifications table"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Drop old notifications table if it exists
        cursor.execute("DROP TABLE IF EXISTS notifications")
        
        # Create new notifications table
        cursor.execute('''
        CREATE TABLE notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            event_id INTEGER,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            notification_type TEXT NOT NULL DEFAULT 'event_reminder',
            is_read BOOLEAN DEFAULT 0,
            is_sent BOOLEAN DEFAULT 0,
            scheduled_for TEXT,
            sent_at TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (event_id) REFERENCES events (id)
        )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ New notifications table created successfully")
        return True
    except Exception as e:
        print(f"❌ Error creating notifications table: {e}")
        return False

# Initialize new notifications table
create_new_notifications_table()

@app.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get all notifications for the current user"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT n.id, n.event_id, n.title, n.message, n.notification_type, 
                   n.is_read, n.is_sent, n.scheduled_for, n.sent_at, n.created_at,
                   e.title as event_title, e.start_datetime, e.end_datetime
            FROM notifications n
            LEFT JOIN events e ON n.event_id = e.id
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
            LIMIT 50
        ''', (user['id'],))
        
        notifications = []
        for row in cursor.fetchall():
            notifications.append({
                'id': row['id'],
                'event_id': row['event_id'],
                'title': row['title'],
                'message': row['message'],
                'type': row['notification_type'],
                'is_read': bool(row['is_read']),
                'is_sent': bool(row['is_sent']),
                'scheduled_for': row['scheduled_for'],
                'sent_at': row['sent_at'],
                'created_at': row['created_at'],
                'event_title': row['event_title'],
                'event_start': row['start_datetime'],
                'event_end': row['end_datetime']
            })
        
        conn.close()
        return jsonify(notifications), 200
        
    except Exception as e:
        print(f"❌ Error getting notifications: {e}")
        return jsonify([]), 200

@app.route('/notifications/<int:notif_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notif_id):
    """Mark a notification as read"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?
        ''', (notif_id, user['id']))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Notification marked as read'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/notifications/mark-all-read', methods=['POST'])
@jwt_required()
def mark_all_notifications_read():
    """Mark all notifications as read for the current user"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE notifications SET is_read = 1 WHERE user_id = ?
        ''', (user['id'],))
        conn.commit()
        conn.close()
        return jsonify({'message': 'All notifications marked as read'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/users/device-token', methods=['POST'])
@jwt_required()
def update_device_token():
    """Update user's device token for push notifications"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
            
        device_token = data.get('device_token')
        
        if not device_token:
            return jsonify({'error': 'Device token is required'}), 400
        
        conn = db.get_connection()
        cursor = conn.cursor()
        
        # Update device token in users table
        cursor.execute('''
            UPDATE users SET fcm_token = ? WHERE id = ?
        ''', (device_token, user['id']))
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Device token updated successfully'}), 200
    except Exception as e:
        print(f"❌ Error updating device token: {str(e)}")
        return jsonify({'error': 'Failed to update device token'}), 500

# ============================================================================
# NOTIFICATION ENDPOINTS
# ============================================================================

@app.route('/notifications/send-event-reminder', methods=['POST'])
@jwt_required()
def send_event_reminder():
    """Send event reminder to all users"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

@app.route('/users/fcm-token', methods=['POST'])
@jwt_required()
def update_fcm_token():
    """Update user's FCM token for push notifications"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        fcm_token = data.get('fcm_token')
        
        if not fcm_token:
            return jsonify({'error': 'FCM token is required'}), 400
        
        # Update user's FCM token
        conn = db.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('UPDATE users SET fcm_token = ? WHERE id = ?', (fcm_token, user_id))
        conn.commit()
        conn.close()
        
        print(f"✅ FCM token updated for user {user_id}")
        return jsonify({'message': 'FCM token updated successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error updating FCM token: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/notifications/test', methods=['POST'])
@jwt_required()
def test_notifications():
    """Test notification system by sending a test notification"""
    try:
        user_id = get_jwt_identity()
        user = user_model.get_user_by_id(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        # Create a test notification in the database
        conn = db.get_connection()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO notifications (
                user_id, event_id, title, message, notification_type,
                is_read, is_sent, scheduled_for, created_at
            )
            VALUES (?, NULL, ?, ?, ?, 0, 0, ?, CURRENT_TIMESTAMP)
        ''', (
            user['id'],
            'Test Notification',
            'This is a test notification to verify the system is working.',
            'test',
            datetime.now().isoformat()
        ))

        notification_id = cursor.lastrowid
        conn.commit()
        conn.close()

        return jsonify({
            'message': 'Test notification created successfully',
            'notification_id': notification_id,
            'user_id': user['id']
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        event_id = data.get('event_id')
        reminder_minutes = data.get('reminder_minutes', 15)
        
        if not event_id:
            return jsonify({'error': 'Event ID is required'}), 400
        
        # Send event reminder
        success = notification_service.send_event_reminder(event_id, reminder_minutes)
        
        if success:
            return jsonify({'message': 'Event reminder sent successfully'}), 200
        else:
            return jsonify({'error': 'Failed to send event reminder'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/notifications/test-push', methods=['POST'])
@jwt_required()
def test_push_notification():
    """Test push notification by sending a test notification to the current user's device"""
    try:
        user_id = get_jwt_identity()
        user = user_model.get_user_by_id(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        if not user.get('fcm_token'):
            return jsonify({'error': 'No FCM token found for user. Please allow notifications in your browser.'}), 400

        if not FIREBASE_AVAILABLE:
            return jsonify({'error': 'Firebase not configured'}), 500

        # Send test push notification
        title = "🧪 Test Push Notification"
        message = f"Hello {user['first_name']}! This is a test push notification from CalSync."
        
        success = send_event_reminder_notification([user['fcm_token']], title, message, 0)
        
        if success:
            return jsonify({
                'message': 'Test push notification sent successfully',
                'user_id': user['id'],
                'fcm_token': user['fcm_token'][:20] + '...'  # Show first 20 chars for security
            }), 200
        else:
            return jsonify({'error': 'Failed to send push notification'}), 500

    except Exception as e:
        print(f"❌ Error sending test push notification: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/notifications/send-system-notification', methods=['POST'])
@jwt_required()
def send_system_notification():
    """Send system notification to all users (admin only)"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if user is admin
    if user.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        title = data.get('title')
        message = data.get('message')
        notification_type = data.get('type', 'system')
        
        if not title or not message:
            return jsonify({'error': 'Title and message are required'}), 400
        
        # Send system notification
        success = notification_service.send_system_notification(title, message, notification_type)
        
        if success:
            return jsonify({'message': 'System notification sent successfully'}), 200
        else:
            return jsonify({'error': 'Failed to send system notification'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/notifications/unread-count', methods=['GET'])
@jwt_required()
def get_unread_notifications_count():
    """Get count of unread notifications for current user"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT COUNT(*) as count FROM notifications 
            WHERE user_id = ? AND is_read = 0
        ''', (user['id'],))
        
        result = cursor.fetchone()
        unread_count = result['count'] if result else 0
        
        conn.close()
        return jsonify({'unread_count': unread_count}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/timezone', methods=['GET'])
def get_timezone_info():
    """Get timezone information and available timezones"""
    try:
        # Get user's timezone based on IP
        user_timezone = timezone_utils.get_user_timezone(request.remote_addr)
        current_local_time = timezone_utils.get_current_local_time(user_timezone)
        timezone_offset = timezone_utils.get_timezone_offset(user_timezone)
        
        return jsonify({
            'current_timezone': user_timezone,
            'current_local_time': current_local_time.isoformat(),
            'timezone_offset_hours': timezone_offset,
            'available_timezones': timezone_utils.get_available_timezones()
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Automatic Event Cleanup Endpoints
@app.route('/events/cleanup', methods=['POST'])
@jwt_required()
def trigger_event_cleanup():
    """Manually trigger cleanup of expired events (admin only)"""
    try:
        user_id = get_jwt_identity()
        user = user_model.get_user_by_id(user_id)
        
        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        if AUTO_CLEANUP_AVAILABLE:
            from auto_cleanup_events import auto_cleanup
            auto_cleanup.cleanup_all_expired_events_now()
            
            # Get count of remaining events
            remaining_count = auto_cleanup.get_expired_events_count()
            
            return jsonify({
                'message': 'Event cleanup completed',
                'remaining_expired_events': remaining_count
            }), 200
        else:
            return jsonify({'error': 'Automatic cleanup system not available'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/events/expired', methods=['GET'])
@jwt_required()
def get_expired_events():
    """Get count of expired events (admin only)"""
    try:
        user_id = get_jwt_identity()
        user = user_model.get_user_by_id(user_id)
        
        if not user or user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        if AUTO_CLEANUP_AVAILABLE:
            from auto_cleanup_events import auto_cleanup
            expired_count = auto_cleanup.get_expired_events_count()
            expired_events = auto_cleanup.list_expired_events()
            
            return jsonify({
                'expired_count': expired_count,
                'expired_events': [
                    {
                        'id': event['id'],
                        'title': event['title'],
                        'end_datetime': event['end_datetime'],
                        'created_at': event['created_at']
                    }
                    for event in expired_events
                ]
            }), 200
        else:
            return jsonify({'error': 'Automatic cleanup system not available'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting SQLite Calendar App...")
    
    # Run persistent user backup system to ensure user credentials persist
    try:
        print("🔄 Running persistent user backup system...")
        from scripts.persistent_user_backup import PersistentUserBackup
        backup_system = PersistentUserBackup()
        
        # Backup current users
        backup_system.backup_users()
        
        # Restore users from backup
        backup_system.restore_users()
        
        # Create default users if none exist
        backup_system.create_default_users()
        
        # Preserve user passwords (only fix missing ones)
        backup_system.preserve_user_passwords()
        
        print("✅ Persistent user backup system completed")
    except Exception as e:
        print(f"⚠️ Persistent backup warning: {str(e)}")
        print("💡 App will continue, but you may need to run backup manually")
    
    # Bulletproof user system management
    if BULLETPROOF_SYSTEM_AVAILABLE:
        try:
            print("🔒 Bulletproof user system active - all users permanently preserved")
            print("💪 Your login details will NEVER be lost again!")
        except Exception as e:
            print(f"⚠️ Bulletproof system warning: {str(e)}")
    
    # Legacy password persistence management (backup)
    if PASSWORD_PERSISTENCE_AVAILABLE:
        try:
            print("🔐 Legacy password persistence backup...")
            password_persistence.backup_all_passwords()
            print("✅ Legacy backup completed")
        except Exception as e:
            print(f"⚠️ Legacy backup warning: {str(e)}")
    
    # Automatic event cleanup system
    if AUTO_CLEANUP_AVAILABLE:
        try:
            print("🗑️ Starting automatic event cleanup service...")
            # Clean up any existing expired events first
            cleanup_expired_events()
            # Start the automatic cleanup service
            start_auto_cleanup()
            print("✅ Automatic event cleanup service started")
        except Exception as e:
            print(f"⚠️ Automatic cleanup warning: {str(e)}")
    
    print("📊 Features available:")
    print("   ✅ User signup (employee/admin)")
    print("   ✅ User login/logout")
    print("   ✅ Event creation (authenticated users)")
    print("   ✅ Event viewing (public)")
    print("   ✅ Dashboard stats")
    print("   ✅ Admin user management")
    print()
    print("🔗 API Endpoints:")
    print("   POST /auth/signup   - Create new user")
    print("   POST /auth/login    - Login user")
    print("   POST /auth/logout   - Logout user")
    print("   GET  /events        - Get all events")
    print("   POST /events        - Create event (auth required)")
    print("   GET  /events/stats  - Get dashboard stats")
    print("   GET  /users/me      - Get current user")
    print("   PUT  /users/me      - Update current user")
    print("   POST /auth/change-password - Change password")
    print("   GET  /users         - Get all users (admin only)")
    print()
    print("🌐 Frontend should connect to: http://<your-computer-ip>:5000")
    
    app.run(host='0.0.0.0', debug=True, port=5000)

# Add startup message for Railway (moved to safer location)
def print_startup_info():
    try:
        print("🚀 CalSync Backend starting up...")
        print(f"📁 Database path: calendar_app.db")
        print(f"🔧 JWT Secret: {'Set' if os.getenv('SECRET_KEY') else 'Using default'}")
        print("✅ App initialization complete!")
    except Exception as e:
        print(f"⚠️ Could not print startup info: {e}")
        print("🚀 CalSync Backend starting up...")

# Call startup info function
print_startup_info()

# Add a test endpoint for debugging JWT tokens
@app.route('/test-token', methods=['POST'])
def test_token():
    """Test endpoint to debug JWT token issues"""
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'No Authorization header'}), 401
        
        if not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Invalid Authorization header format'}), 401
        
        token = auth_header.split(' ')[1]
        
        # Try to decode the token
        try:
            from flask_jwt_extended import decode_token
            decoded = decode_token(token)
            
            # Convert user_id to int if it's a string
            user_id = decoded['sub']
            if isinstance(user_id, str):
                try:
                    user_id = int(user_id)
                except ValueError:
                    pass  # Keep as string if conversion fails
            
            return jsonify({
                'valid': True,
                'user_id': user_id,
                'expires': decoded['exp'],
                'issued_at': decoded['iat']
            }), 200
        except Exception as jwt_error:
            return jsonify({
                'valid': False,
                'error': str(jwt_error),
                'token_preview': token[:50] + '...' if len(token) > 50 else token
            }), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500
