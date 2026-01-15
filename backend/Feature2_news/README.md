# Disaster News Module Documentation

## 1. Architecture Overview

This independent module is designed as a **Microservice-like** component for a larger Disaster Response Platform.

- **Backend:** Flask (Python) handles API requests and background processing.
- **Database:** SQLite stores news articles to prevent API exhaustion and allow historical tracking.
- **UI:** A lightweight HTML/JS frontend uses Bootstrap for responsiveness.
- **Geolocation:** Automatically detects user location and prioritizes nearby disaster news using distance-based sorting.

### Data Flow

1.  **Geolocation:** On page load, the app requests user's browser location permission.
2.  **Location Detection:** User coordinates are reverse-geocoded to determine city/region.
3.  **Trigger:** User clicks "Refresh" or Auto-refresh triggers `/api/fetch-news`.
4.  **External Fetch:** Backend calls **GNews API** with disaster keywords (flood, earthquake, etc.) and location.
5.  **Enrichment:**
    - Categories are auto-detected from title/description.
    - Location coordinates are extracted and geocoded from article content.
    - If no image is provided, a placeholder is used.
6.  **Storage:** Unique articles (deduplicated by URL) are saved to SQLite with location data.
7.  **Smart Display:** Frontend calls `/api/news` passing user coordinates for distance-based sorting.
    - News from nearby areas appears first (with distance shown in km).
    - Articles are sorted by proximity to user's current location.

---

## 2. Features

### 🌍 Geolocation-Based News Prioritization

- **Automatic Location Detection:** Uses browser geolocation API to detect user's current position
- **Distance Calculation:** Calculates distance between user and news event locations using Haversine formula
- **Smart Sorting:** Displays nearest disaster news first, showing distance in kilometers
- **Fallback Support:** If geolocation is denied, falls back to text-based location matching

### 🗺️ Location Intelligence

- **Geocoding:** Automatically extracts and geocodes location from news articles
- **Reverse Geocoding:** Converts user coordinates to readable city/region names
- **Multi-level Matching:** Supports city, state, and country-level location matching

### 📊 Visual Indicators

- **Distance Badges:** Shows distance in km for nearby news articles
- **Category Badges:** Color-coded disaster type indicators (Flood, Earthquake, Wildfire, etc.)
- **Real-time Updates:** Live terminal-style logs showing system status

---

## 3. API Endpoints

### `POST /api/fetch-news`

- **Purpose:** Forces the backend to check for new stories from GNews based on location.
- **Body:** `{ "location": "California" }` (optional)
- **Response:** `{ "status": "success", "new_articles_count": 5 }`

### `GET /api/news`

- **Purpose:** Returns the latest news items sorted by proximity to user.
- **Query Params:**
  - `location` (string): User's location name for text matching
  - `latitude` (float): User's latitude for distance calculation
  - `longitude` (float): User's longitude for distance calculation
- **Response:** JSON Array of news objects with distance information

---

## 3. Setup Instructions

### Prerequisites

- Python 3.8+
- MySQL Server

### Installation

1.  Navigate to the folder:
    ```bash
    cd disaster_news_module
    ```
2.  Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```
3.  Setup Database:
    - Log in to MySQL: `mysql -u root -p`
    - Run the SQL script:
      ```sql
      source schema.sql;
      ```
4.  Configure Keys:

    - Open `app.py`.
    - Replace `YOUR_GNEWS_API_KEY` and `YOUR_UNSPLASH_ACCESS_KEY`.
    - Update `DB_CONFIG` with your MySQL password.

5.  Run:
    ```bash
    python app.py
    ```
    Access at `http://localhost:5000`

---

## 4. Limitations

1.  **GNews Free Tier:** Limited to 100 requests/day. The caching/database strategy helps mitigate this.
2.  **Unsplash Rate Limit:** 50 requests/hour (demo tier).
3.  **Image Relevance:** Unsplash images are generic to the category (e.g., "Flood") and not the specific event depicted in the news.
