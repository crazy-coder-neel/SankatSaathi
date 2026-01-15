import sqlite3
import os

DB_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'disaster_news.db')
try:
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT count(*) FROM disaster_news")
    print(f"Total articles: {c.fetchone()[0]}")
    c.execute("SELECT title, location_name, latitude FROM disaster_news LIMIT 5")
    for row in c.fetchall():
        print(row)
    conn.close()
except Exception as e:
    print(f"Error: {e}")
