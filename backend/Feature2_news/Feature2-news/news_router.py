from fastapi import APIRouter, HTTPException, Request, Body, Query
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import os
import requests
import datetime
import math
import logging
import time

# Create Router
router = APIRouter(prefix="/news", tags=["News"])

# --- CONFIGURATION ---
# Use absolute path for database to ensure it's always found
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# We might want to store DB in the same folder as the script for now
DB_FILE = os.path.join(BASE_DIR, 'disaster_news.db')

# API KEYS (Ideally move to .env, but keeping here for direct port as per plan)
# NOTE: User provided this key in the original Flask app
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

# --- Pydantic Models ---
class NewsFetchRequest(BaseModel):
    location: str = "India"

class NewsArticle(BaseModel):
    title: str
    description: Optional[str]
    image_url: Optional[str]
    source_name: Optional[str]
    article_url: str
    published_at: Optional[str]
    category: Optional[str]
    location_name: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    distance_km: Optional[float] = None

# --- DATABASE HELPERS ---

def init_db():
    """Initializes the SQLite database and table."""
    try:
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
        logging.info(f"Database initialized at {DB_FILE}")
    except Exception as e:
        logging.error(f"DB Init Error: {e}")

def get_db_connection():
    """Establishes connection to SQLite database."""
    try:
        conn = sqlite3.connect(DB_FILE, timeout=30)
        conn.row_factory = sqlite3.Row
        # Enable Write-Ahead Logging (WAL) for better concurrency
        conn.execute("PRAGMA journal_mode=WAL")
        return conn
    except Exception as e:
        logging.error(f"Error connecting to SQLite: {e}")
        return None

# --- UTILITY FUNCTIONS ---

def determine_category(title, description):
    """Auto-detects disaster category based on text content."""
    text = (str(title) + " " + (str(description) or "")).lower()
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
        response = requests.get(url, headers=headers, timeout=3)
        
        if response.status_code == 200:
            data = response.json()
            if data:
                return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        logging.error(f"Geocoding error for {location_name}: {e}")
    return None, None

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula (in km)."""
    if None in (lat1, lon1, lat2, lon2):
        return float('inf')
    
    try:
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(float(lat1))
        lat2_rad = math.radians(float(lat2))
        delta_lat = math.radians(float(lat2) - float(lat1))
        delta_lon = math.radians(float(lon2) - float(lon1))
        
        a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    except:
        return float('inf')

def extract_location_from_text(text):
    """Extract potential location names from article text."""
    import re
    # Limit to words that look like proper nouns
    words = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b', text or '')
    
    ignore_list = {'The', 'A', 'An', 'In', 'On', 'At', 'Of', 'To', 'For', 'With', 'From', 
                   'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
                   'Flood', 'Earthquake', 'Cyclone', 'Fire', 'Storm', 'Hurricane', 'Alert', 'Warning'}
    
    candidates = [w for w in words if w not in ignore_list and w.split()[0] not in ignore_list]
    
    return candidates[0] if candidates else None

# --- ROUTES ---

@router.on_event("startup")
async def startup_event():
    init_db()

@router.post("/fetch-news")
async def trigger_fetch_news(payload: NewsFetchRequest):
    """Fetches news from GNews, processes them, and stores in DB."""
    try:
        location = payload.location

        # Search query
        base_query = " OR ".join(DISASTER_KEYWORDS.keys())
        final_query = f"({base_query}) AND {location}"
        
        url = f"https://gnews.io/api/v4/search?q={final_query}&lang=en&max=10&sortby=publishedAt&apikey={GNEWS_API_KEY}"

        print(f"Fetching news for: {location}")
        response = requests.get(url, timeout=10)
        data = response.json()
        articles = data.get('articles', [])
        
        # Fallback Strategy
        if not articles:
            print(f"No local news for {location}. Switching to broad search.")
            fallback_query = f"({base_query})"
            url_fallback = f"https://gnews.io/api/v4/search?q={fallback_query}&lang=en&max=10&sortby=publishedAt&apikey={GNEWS_API_KEY}"
            
            response = requests.get(url_fallback, timeout=10)
            data = response.json()
            articles = data.get('articles', [])

        if response.status_code != 200:
             raise HTTPException(status_code=500, detail=f"GNews Error: {data}")

        processed_articles = []
        
        for article in articles:
            title = article.get('title')
            desc = article.get('description')
            url = article.get('url')
            
            if not title or not url:
                continue
                
            img_url = article.get('image')
            source = article.get('source', {}).get('name')
            pub_date_str = article.get('publishedAt') 
            
            # Date normalization
            pub_date = pub_date_str if isinstance(pub_date_str, str) else datetime.datetime.now().isoformat()

            category = determine_category(title, desc)

            if not img_url:
                img_url = "https://via.placeholder.com/600x400?text=Disaster+News"

            # Geocoding
            article_text = f"{title} {desc or ''}"
            found_location = extract_location_from_text(article_text)
            location_name_to_use = found_location if found_location else location
            
            lat, lon = get_coordinates(location_name_to_use)
            
            # Fallback geocoding
            if lat is None and location and location.lower() != "india" and location.lower() in article_text.lower():
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

        # Database Insertion
        new_count = 0
        conn = get_db_connection()
        if not conn:
             raise HTTPException(status_code=500, detail="Database connection failed")
             
        try:
            cursor = conn.cursor()
            for item in processed_articles:
                try:
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
                except Exception as err:
                    print(f"Error inserting: {err}")
            
            conn.commit()
        except Exception as e:
            conn.rollback()
            raise HTTPException(status_code=500, detail=f"DB Error: {e}")
        finally:
            conn.close()

        return {"status": "success", "new_articles_count": new_count}

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/", response_model=List[NewsArticle])
async def get_news(
    location: Optional[str] = None,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None
):
    """Retrieves stored news, prioritizing distance."""
    try:
        conn = get_db_connection()
        if not conn:
             raise HTTPException(status_code=500, detail="Database connection failed")

        user_location = location.lower().strip() if location else ""
        
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM disaster_news ORDER BY published_at DESC LIMIT 50")
        rows = cursor.fetchall()
        
        results = [dict(row) for row in rows]
        
        # Calculate Distance
        if latitude is not None and longitude is not None:
            for item in results:
                i_lat = item.get('latitude')
                i_lon = item.get('longitude')
                
                if i_lat is not None and i_lon is not None:
                    dist = calculate_distance(latitude, longitude, i_lat, i_lon)
                    item['distance_km'] = round(dist, 2)
                else:
                    item['distance_km'] = float('inf')
            
            results.sort(key=lambda x: x.get('distance_km', float('inf')))
        
        # Fallback Text Match
        elif user_location and user_location != "india":
            def sort_key(item):
                content = (str(item['title']) + " " + (str(item['description']) or "") + " " + (str(item.get('location_name')) or "")).lower()
                if user_location in content:
                    return 0 
                return 1
            results.sort(key=sort_key)

        return results[:20]

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if 'conn' in locals() and conn:
            conn.close()
