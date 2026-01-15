"""
Database migration script to add location columns to existing database.
Run this once to upgrade your existing database schema.
"""
import sqlite3
import os

# Ensure we modify the database in the same directory as the script/app
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, 'disaster_news.db')

def migrate_database():
    """Add location columns to existing disaster_news table."""
    print(f"Checking database at: {DB_FILE}")
    
    if not os.path.exists(DB_FILE):
        print("⚠️  Database file not found.")
        print("   Running the application (app.py) will create it automatically with the correct schema.")
        print("   Migration is not needed for a fresh install.")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        # Check if table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='disaster_news'")
        if not cursor.fetchone():
            print("⚠️  Table 'disaster_news' does not exist.")
            print("   Running the application (app.py) will create it automatically.")
            return

        # Check if columns already exist
        cursor.execute("PRAGMA table_info(disaster_news)")
        columns = [column[1] for column in cursor.fetchall()]
        
        # Add location_name column if it doesn't exist
        if 'location_name' not in columns:
            print("Adding 'location_name' column...")
            cursor.execute("ALTER TABLE disaster_news ADD COLUMN location_name TEXT")
            print("✓ location_name column added")
        else:
            print("✓ location_name column already exists")
        
        # Add latitude column if it doesn't exist
        if 'latitude' not in columns:
            print("Adding 'latitude' column...")
            cursor.execute("ALTER TABLE disaster_news ADD COLUMN latitude REAL")
            print("✓ latitude column added")
        else:
            print("✓ latitude column already exists")
        
        # Add longitude column if it doesn't exist
        if 'longitude' not in columns:
            print("Adding 'longitude' column...")
            cursor.execute("ALTER TABLE disaster_news ADD COLUMN longitude REAL")
            print("✓ longitude column added")
        else:
            print("✓ longitude column already exists")
        
        conn.commit()
        print("\n✅ Database migration check completed!")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    migrate_database()
