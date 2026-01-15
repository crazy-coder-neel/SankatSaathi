import sqlite3
import os

# Ensure we modify the database in the same directory as the script/app
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, 'disaster_news.db')

def deduplicate_database():
    """Remove duplicate articles from the database based on Title."""
    print(f"Checking database at: {DB_FILE}")
    
    if not os.path.exists(DB_FILE):
        print("db not found")
        return

    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    
    try:
        # Check initial count
        cursor.execute("SELECT count(*) FROM disaster_news")
        initial_count = cursor.fetchone()[0]
        print(f"Total articles before cleanup: {initial_count}")
        
        # Identify duplicates (keep the one with the highest ID = latest insertion)
        cursor.execute("""
        DELETE FROM disaster_news
        WHERE id NOT IN (
            SELECT MAX(id)
            FROM disaster_news
            GROUP BY title
        )
        """)
        deleted_count = cursor.rowcount
        
        conn.commit()
        
        cursor.execute("SELECT count(*) FROM disaster_news")
        final_count = cursor.fetchone()[0]
        
        print(f"Removed {deleted_count} duplicate articles.")
        print(f"Total articles after cleanup: {final_count}")

    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == '__main__':
    deduplicate_database()
