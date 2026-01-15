import os
import datetime
import requests
import sqlite3
import math
import time
from flask import Flask, jsonify, render_template, request
from requests.exceptions import RequestException

app = Flask(__name__)

# --- CONFIGURATION ---
# Use absolute path for database to ensure it's always found regardless of where the script is run
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, 'disaster_news.db')

# API KEYS (Replace these with your actual keys)
GNEWS_API_KEY = "36b38d93610935363447703e54bb8688"

# Keywords for disaster detection and categorization
DISASTER_KEYWORDS = {
    'flood': 'Flood',
    'earthquake': 'Earthquake',
    'quake': 'Earthquake',
    'cyclone': 'Cyclone',
    'storm': 'Cyclone',
    'hurricane': 'Cyclone',
    'fire': 'Wildfire',
    'landslide': 'Landslide',
    'drought': 'Drought'
}

def init_db():
    """Initializes the SQLite database and table."""
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS disaster_news (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            image_url TEXT,
            source_name TEXT,
            article_url TEXT UNIQUE NOT NULL,
            published_at TIMESTAMP,
            category TEXT,
            location_name TEXT,
            latitude REAL,
            longitude REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def get_db_connection():
    """Establishes connection to SQLite database."""
    try:
        # Increase timeout to 30 seconds to allow for concurrent access
        conn = sqlite3.connect(DB_FILE, timeout=30)
        conn.row_factory = sqlite3.Row # Helper to return dict-like rows
        # Enable Write-Ahead Logging (WAL) for better concurrency
        conn.execute("PRAGMA journal_mode=WAL")
        return conn
    except Exception as e:
        print(f"Error connecting to SQLite: {e}")
        return None

def determine_category(title, description):
    """Auto-detects disaster category based on text content."""
    text = (title + " " + (description or "")).lower()
    for key, category in DISASTER_KEYWORDS.items():
        if key in text:
            return category
    return "General Alert"

def get_coordinates(location_name):
    """Get coordinates for a location using geocoding API."""
    if not location_name or len(location_name) > 50:
        return None, None
        
    try:
        # Respect Nominatim Usage Policy (max 1 request/sec)
        time.sleep(1.1) 
        
        url = f"https://nominatim.openstreetmap.org/search?q={location_name}&format=json&limit=1"
        headers = {
            'User-Agent': 'SanketSathi_DisasterApp/1.0 (sanketsathi@example.com)',
            'Accept-Language': 'en'
        }
        # Reduced timeout to 3 seconds to fail fast
        response = requests.get(url, headers=headers, timeout=3)
        
        if response.status_code == 200:
            data = response.json()
            if data:
                return float(data[0]['lat']), float(data[0]['lon'])
    except RequestException as e:
        print(f"Geocoding network error for {location_name}: {e}")
    except Exception as e:
        print(f"Geocoding error for {location_name}: {e}")
    return None, None

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula (in km)."""
    if None in (lat1, lon1, lat2, lon2):
        return float('inf')
    
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c

def extract_location_from_text(text):
    """Extract potential location names from article text."""
    # Simple extraction - looks for capitalized words
    # This is a basic implementation, can be enhanced with NLP
    import re
    # Limit to words that look like proper nouns, avoid very long sequences
    # Stop looking if we find a likely candidate
    words = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b', text or '')
    
    # Filter out common false positives (Days, Disaster names)
    ignore_list = {'The', 'A', 'An', 'In', 'On', 'At', 'Of', 'To', 'For', 'With', 'From', 
                   'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
                   'Flood', 'Earthquake', 'Cyclone', 'Fire', 'Storm', 'Hurricane', 'Alert', 'Warning'}
    
    candidates = [w for w in words if w not in ignore_list and w.split()[0] not in ignore_list]
    
    return candidates[0] if candidates else None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/fetch-news', methods=['POST', 'GET'])
def trigger_fetch_news():
    """Fetches news from GNews, processes them, and stores in DB."""
    try:
        if GNEWS_API_KEY == "YOUR_GNEWS_API_KEY":
             return jsonify({"status": "error", "message": "GNews API Key missing"}), 500

        # Get location from request (JSON or Args)
        location = "India" # Default
        if request.method == 'POST':
            data = request.get_json()
            if data and 'location' in data:
                location = data['location']
        elif request.args.get('location'):
            location = request.args.get('location')

        # Search query combining keywords
        base_query = " OR ".join(DISASTER_KEYWORDS.keys())
        
        # Primary Search: Targeted Location
        final_query = f"({base_query}) AND {location}"
        url = f"https://gnews.io/api/v4/search?q={final_query}&lang=en&max=10&sortby=publishedAt&apikey={GNEWS_API_KEY}"

        print(f"Fetching news for: {location}")
        response = requests.get(url, timeout=10)
        data = response.json()
        articles = data.get('articles', [])
        
        # Fallback Strategy: If no local news found, fetch broad/national news
        if len(articles) == 0:
            print(f"No local news found for {location}. Switching to broad search.")
            fallback_query = f"({base_query})" # Just the keywords
            # If we think location is a city, maybe try searching the country? 
            # For now, let's just go global/broad to ensure the dashboard isn't empty.
            url_fallback = f"https://gnews.io/api/v4/search?q={fallback_query}&lang=en&max=10&sortby=publishedAt&apikey={GNEWS_API_KEY}"
            
            response = requests.get(url_fallback, timeout=10)
            data = response.json()
            articles = data.get('articles', [])

        if response.status_code != 200:
            print(f"GNews Error: {data}")
            return jsonify({"status": "error", "message": "Failed to fetch from GNews", "details": data}), 500

        # articles is already assigned above
        processed_articles = []
        
        # 1. Process articles IN MEMORY (Network intensive operations)
        # We do this BEFORE opening the database connection to prevent locking
        for article in articles:
            # parsing
            title = article.get('title')
            desc = article.get('description')
            url = article.get('url')
            
            # Skip if critical data missing
            if not title or not url:
                continue
                
            img_url = article.get('image')
            source = article.get('source', {}).get('name')
            pub_date_str = article.get('publishedAt') 
            
            # GNews format: 2023-01-01T12:00:00Z
            try:
                # Store as string for consistency with JS Date parsing
                if isinstance(pub_date_str, str):
                    pub_date = pub_date_str
                else:
                    pub_date = datetime.datetime.now().isoformat()
            except:
                pub_date = datetime.datetime.now().isoformat()

            category = determine_category(title, desc)

            # Image Fallback (Simple static placeholder instead of Unsplash)
            if not img_url:
                img_url = "https://via.placeholder.com/600x400?text=Disaster+News"

            # Extract and geocode location from article
            article_text = f"{title} {desc or ''}"
            # Use found location or fallback to search location
            found_location = extract_location_from_text(article_text)
            location_name_to_use = found_location if found_location else location
            
            lat, lon = get_coordinates(location_name_to_use)
            
            # If specific location geocoding failed, but we have a general search location
            # matching the article (simple check), fallback to geocoding the search location
            if lat is None and location and location.lower() != "india" and location.lower() in article_text.lower():
                 # Only try to geocode the broad location if we haven't already tried it as the specific location
                 if location_name_to_use != location:
                     lat, lon = get_coordinates(location)
            
            processed_articles.append({
                'title': title,
                'description': desc,
                'image_url': img_url,
                'source_name': source,
                'article_url': url,
                'published_at': pub_date,
                'category': category,
                'location_name': location_name_to_use,
                'latitude': lat,
                'longitude': lon
            })

        # 2. Bulk Insert into Database (Database intensive operation)
        # Open connection only when ready to write
        new_count = 0
        conn = get_db_connection()
        if not conn:
             return jsonify({"status": "error", "message": "Database connection failed"}), 500
             
        try:
            cursor = conn.cursor()
            for item in processed_articles:
                try:
                    # Check for existence by URL OR Title (to prevent same story/different source duplicates)
                    check_sql = "SELECT id FROM disaster_news WHERE article_url = ? OR title = ?"
                    cursor.execute(check_sql, (item['article_url'], item['title']))
                    if not cursor.fetchone():
                        insert_sql = """
                            INSERT INTO disaster_news 
                            (title, description, image_url, source_name, article_url, published_at, category, location_name, latitude, longitude)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """
                        cursor.execute(insert_sql, (
                            item['title'], item['description'], item['image_url'], item['source_name'], 
                            item['article_url'], item['published_at'], item['category'], 
                            item['location_name'], item['latitude'], item['longitude']
                        ))
                        new_count += 1
                except sqlite3.OperationalError as e:
                    if "locked" in str(e):
                        print("Database locked, retrying insertion...")
                        # In WAL mode with timeout, this shouldn't happen often, but good to log
                    print(f"Error inserting article (DB Locked): {e}")
                except Exception as err:
                    print(f"Error inserting article: {err}")
            
            conn.commit()
        except Exception as e:
            print(f"Database transaction error: {e}")
            conn.rollback() # Rollback on critical error
        finally:
            cursor.close()
            conn.close()

        return jsonify({"status": "success", "new_articles_count": new_count})

    except Exception as e:
        print(f"CRITICAL ERROR in fetch-news: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/api/news', methods=['GET'])
def get_news():
    """Retrieves stored news from SQLite and prioritizes by distance from user location."""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "Database connection failed"}), 500

        user_location = request.args.get('location', '').lower().strip()
        
        # Safely get float args
        try:
            user_lat = float(request.args.get('latitude')) if request.args.get('latitude') else None
            user_lon = float(request.args.get('longitude')) if request.args.get('longitude') else None
        except ValueError:
            user_lat = None
            user_lon = None

        cursor = conn.cursor()
        # Fetch latest 50 items for better filtering
        cursor.execute("SELECT * FROM disaster_news ORDER BY published_at DESC LIMIT 50")
        rows = cursor.fetchall()
        
        # Convert row objects to dicts
        results = [dict(row) for row in rows]
        
        print(f"Fetched {len(results)} articles. User Loc: {user_location}, Lat: {user_lat}")

        # Distance-based sorting if user coordinates provided
        if user_lat is not None and user_lon is not None:
            for item in results:
                # Ensure we handle NULLs/Nones from DB safely
                i_lat = item.get('latitude')
                i_lon = item.get('longitude')
                
                if i_lat is not None and i_lon is not None:
                    try:
                        distance = calculate_distance(user_lat, user_lon, float(i_lat), float(i_lon))
                        item['distance_km'] = round(distance, 2)
                    except Exception as e:
                        print(f"Distance calc error: {e}")
                        item['distance_km'] = float('inf')
                else:
                    item['distance_km'] = float('inf')
            
            # Sort by distance (closest first)
            results.sort(key=lambda x: x.get('distance_km', float('inf')))
        
        # Fallback: Text-based location matching
        elif user_location and user_location != "india":
            def sort_key(item):
                content = (item['title'] + " " + (item['description'] or "") + " " + (item.get('location_name') or "")).lower()
                if user_location in content:
                    return 0 
                return 1
            results.sort(key=sort_key)

        # Return top 20 after sorting
        results = results[:20]

        cursor.close()
        conn.close()
        return jsonify(results)
    except Exception as e:
        print(f"GET /api/news FAIL: {str(e)}")
        # Return traceback for debug
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    init_db()  # Initialize SQLite on startup
    app.run(debug=True, port=5000)
