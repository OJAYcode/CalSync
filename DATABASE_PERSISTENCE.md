# Database Persistence Guide for CalSync

This guide explains how user credentials and data persist across deployments and updates in the CalSync application.

## 🔄 How Database Persistence Works

### The Problem
When you deploy changes to your app, you want existing users to still be able to log in with their original credentials. However, there were two different password hashing methods being used:

1. **Old Method**: Simple SHA256 (no salt) - used in `create_sqlite_db.py`
2. **New Method**: SHA256 with salt - used in `users.py`

This caused login issues when the database was created with one method but the app expected the other.

### The Solution
We've implemented a **database migration system** that:

1. ✅ **Preserves all existing user data**
2. ✅ **Updates password hashing to be consistent**
3. ✅ **Automatically runs on app startup**
4. ✅ **Creates backups before making changes**
5. ✅ **Supports both old and new password formats during transition**

## 🚀 Quick Start

### Option 1: Automatic Migration (Recommended)
Simply start the app normally - migration runs automatically:

```bash
cd backend
python app.py
```

### Option 2: Manual Migration
If you want to run migration manually:

```bash
cd backend
python scripts/migrate_database.py migrate
```

### Option 3: Windows Batch File
Use the provided batch file for easy startup:

```bash
cd backend
start_app.bat
```

## 📊 Migration Process

### What Happens During Migration

1. **Database Backup**: Creates a timestamped backup before making changes
2. **Password Analysis**: Checks which users have old vs new password formats
3. **Password Update**: Converts old passwords to new salted format
4. **Default Users**: Ensures default admin and test users exist
5. **Schema Check**: Verifies all required tables exist with correct structure

### Migration Output Example

```
🔄 Starting database migration...
📊 Found 3 existing users
🔄 Migrating password hashes to new salted format...
💾 Database backed up to: calendar_app.db.backup_20241201_143022
   🔄 Updated user: john@company.com (default password: ChangeMe123!)
   ➕ Added default admin: admin@test.com / admin123
   ➕ Added default employee: employee@test.com / employee123
   ➕ Added default departments
✅ Migration completed successfully!
   🔄 Updated 1 user passwords
   💾 Database backed up to: calendar_app.db.backup_20241201_143022

📋 Default login credentials:
   Admin: admin@test.com / admin123
   Employee: employee@test.com / employee123

⚠️  IMPORTANT: Users with migrated passwords need to reset their password!
   They can use the 'Forgot Password' feature or contact an admin.
```

## 🔧 Database Management Commands

### Check Database Status
```bash
python scripts/migrate_database.py info
```

### Create Database Backup
```bash
python scripts/migrate_database.py backup
```

### Run Migration Only
```bash
python scripts/migrate_database.py migrate
```

## 📁 Database Files

### Main Database
- **Location**: `backend/calendar_app.db`
- **Type**: SQLite database file
- **Content**: All user data, events, departments, notifications

### Backup Files
- **Format**: `calendar_app.db.backup_YYYYMMDD_HHMMSS`
- **Created**: Automatically before each migration
- **Purpose**: Rollback if needed

### Database Structure
```
users/
├── id (Primary Key)
├── email (Unique)
├── password_hash (Salted SHA256)
├── first_name
├── last_name
├── role (admin/employee)
├── is_active
├── fcm_token
├── created_at
└── updated_at

events/
├── id (Primary Key)
├── title
├── description
├── start_datetime
├── end_datetime
├── created_by (Foreign Key to users.id)
├── created_at
└── updated_at

departments/
├── id (Primary Key)
└── name (Unique)

notifications/
├── id (Primary Key)
├── event_id (Foreign Key)
├── user_id (Foreign Key)
├── notify_at
├── sent
├── read
└── created_at
```

## 🔐 Password Security

### Old vs New Password Format

**Old Format (Legacy)**:
```
a1b2c3d4e5f6... (64 characters, no salt)
```

**New Format (Salted)**:
```
salt64chars$hash64chars (129 characters, with salt)
```

### Password Verification
The system now supports both formats:
1. **New users**: Always use salted format
2. **Existing users**: Automatically migrated to salted format
3. **Login**: Checks both formats during transition period

## 🛠️ Troubleshooting

### Migration Fails
If migration fails, check:
1. **Database file exists**: `ls calendar_app.db`
2. **Permissions**: Ensure write access to backend directory
3. **Python dependencies**: `pip install -r requirements.txt`

### Users Can't Login After Migration
If users can't login after migration:
1. **Check migration output**: Look for "Updated user" messages
2. **Default passwords**: Users get `ChangeMe123!` as temporary password
3. **Password reset**: Users should change their password after first login

### Database Corruption
If database gets corrupted:
1. **Find latest backup**: Look for `calendar_app.db.backup_*` files
2. **Restore backup**: Copy backup file to `calendar_app.db`
3. **Re-run migration**: `python scripts/migrate_database.py migrate`

## 🔄 Deployment Best Practices

### Before Deploying
1. **Test migration locally**: Run migration on a copy of production data
2. **Backup database**: Always backup before deployment
3. **Check user count**: Ensure no users are lost during migration

### During Deployment
1. **Run migration first**: Migration should run before app starts
2. **Monitor logs**: Watch for migration success/failure messages
3. **Test login**: Verify default users can still login

### After Deployment
1. **Verify user access**: Test login with existing users
2. **Check data integrity**: Ensure all tables and data are intact
3. **Monitor for issues**: Watch for login problems or data loss

## 📋 Default Users

After migration, these users are guaranteed to exist:

| Email | Password | Role | Purpose |
|-------|----------|------|---------|
| `admin@test.com` | `admin123` | Admin | System administration |
| `employee@test.com` | `employee123` | Employee | Testing and development |

## 🎯 Key Benefits

1. **✅ Zero Data Loss**: All existing users and data preserved
2. **✅ Seamless Updates**: Users don't need to re-register
3. **✅ Automatic Migration**: No manual intervention required
4. **✅ Backup Safety**: Automatic backups before changes
5. **✅ Backward Compatibility**: Supports both password formats
6. **✅ Consistent Security**: All passwords use salted hashing

## 🚨 Important Notes

- **Migration is automatic**: Runs every time the app starts
- **Backups are created**: Before any database changes
- **Default users added**: If they don't exist
- **Password changes required**: For users with migrated passwords
- **No data loss**: All existing data is preserved

This system ensures that your CalSync application maintains user credentials and data integrity across all deployments and updates. 