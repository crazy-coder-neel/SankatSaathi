# Geolocation Implementation Summary

## ✅ Changes Completed

### 1. Backend Enhancements ([app.py](app.py))

#### Added Dependencies

- `import math` - For Haversine distance calculations

#### New Functions

- **`get_coordinates(location_name)`** - Geocodes location names to lat/lon using OpenStreetMap Nominatim API
- **`calculate_distance(lat1, lon1, lat2, lon2)`** - Calculates distance between two points using Haversine formula (returns km)
- **`extract_location_from_text(text)`** - Extracts potential location names from article text

#### Database Schema Updates

Added three new columns to `disaster_news` table:

- `location_name` (TEXT) - Extracted/inferred location name from article
- `latitude` (REAL) - Geocoded latitude coordinate
- `longitude` (REAL) - Geocoded longitude coordinate

#### API Endpoint Updates

**`POST /api/fetch-news`**

- Now geocodes each article's location during ingestion
- Stores location coordinates in database for distance calculations
- Extracts location from article title/description

**`GET /api/news`**

- New parameters: `latitude` and `longitude` for distance-based sorting
- Calculates distance from user to each news article
- Sorts results by proximity (closest first)
- Returns top 20 articles with distance information
- Falls back to text-based matching if coordinates unavailable

### 2. Frontend Enhancements ([index.html](templates/index.html))

#### Global Variables

- `userLatitude` and `userLongitude` - Store user's current coordinates

#### Enhanced Functions

**`initSequence()`**

- Requests browser geolocation permission on page load
- Stores user coordinates globally
- Enables distance-based news prioritization
- Shows detailed logs of geolocation status

**`loadNews()`**

- Passes user coordinates to backend API
- Receives distance information for each article
- Displays distance badges on news cards

**News Card Display**

- Shows green distance badge (e.g., "25.3 km") on nearby news
- Distance appears on top-left corner of news cards
- Only shows for articles with valid coordinates

### 3. Migration Script ([migrate_db.py](migrate_db.py))

Created standalone migration script to:

- Add new location columns to existing databases
- Check for existing columns before adding
- Provide clear success/error messages
- Can be run safely multiple times

### 4. Documentation ([README.md](README.md))

Updated with:

- Geolocation features description
- New data flow with location detection
- API endpoint parameter documentation
- Feature list highlighting location intelligence

---

## 🚀 How It Works

### User Flow

1. **Page Load**

   ```
   User opens app → Browser requests location permission
   ```

2. **Permission Granted**

   ```
   Browser provides coordinates → Reverse geocode to city name
   → Store coordinates → Fetch news for that location
   ```

3. **News Fetching**

   ```
   Backend receives location → Queries GNews with location filter
   → Extracts location from each article → Geocodes article locations
   → Stores with coordinates in database
   ```

4. **News Display**
   ```
   Frontend sends user coordinates to API
   → Backend calculates distance for each article
   → Sorts by distance (closest first)
   → Returns top 20 with distance info
   → Display with distance badges
   ```

### Distance Calculation

Uses **Haversine Formula** to calculate great-circle distance:

```
Distance = 2 × R × arcsin(√(sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)))
Where R = Earth's radius (6371 km)
```

---

## 🔧 Setup Instructions

### For Existing Database Users

If you already have a `disaster_news.db` file, run the migration:

```bash
python migrate_db.py
```

This will add the new location columns without losing existing data.

### For Fresh Installation

The database will be created automatically with the new schema when you run:

```bash
python app.py
```

### Testing the Feature

1. **Start the app:**

   ```bash
   python app.py
   ```

2. **Open browser:**

   ```
   http://localhost:5000
   ```

3. **Allow location permission** when prompted

4. **Verify:**
   - Check terminal logs for "Coordinates locked" message
   - Look for "Distance-based news prioritization: ENABLED"
   - News cards should show distance badges (e.g., "15.2 km")
   - News from nearby locations should appear first

### If Location Permission Denied

The app gracefully falls back to:

- Text-based location matching (city name in article)
- Default location (India)
- Manual location entry via input field

---

## 📊 Features Summary

✅ **Automatic geolocation detection**
✅ **Distance-based news sorting** (nearest first)
✅ **Distance badges** on news cards
✅ **Reverse geocoding** (coordinates → city name)
✅ **Forward geocoding** (article location → coordinates)
✅ **Graceful fallbacks** if geolocation denied
✅ **Manual location override** via input field
✅ **Real-time status logs** in terminal UI
✅ **Database migration script** for existing users

---

## 🎯 Example Scenarios

### Scenario 1: User in Mumbai

- User location detected: 19.0760° N, 72.8777° E
- News from Mumbai floods: **5.2 km** (appears first)
- News from Delhi earthquake: **1,140 km** (appears later)
- News from California wildfire: **13,562 km** (appears last)

### Scenario 2: User Denies Location

- Falls back to text matching
- User in "California" → News with "California" in title/description appear first
- Others sorted by recency

### Scenario 3: Manual Location Entry

- User types "Tokyo" → Fetches news about Tokyo disasters
- Sorts by text matching (Tokyo keyword)
- No distance calculation without coordinates

---

## 🔒 Privacy & Permissions

- **Location data never leaves the browser** except as lat/lon coordinates sent to your own backend
- No third-party tracking
- User can deny permission and still use the app
- Location can be manually overridden anytime
- Uses free, privacy-respecting services:
  - OpenStreetMap Nominatim for geocoding
  - BigDataCloud for reverse geocoding

---

## 🐛 Troubleshooting

**Distance badges not showing?**

- Check browser console for geolocation errors
- Ensure HTTPS (geolocation doesn't work on HTTP except localhost)
- Verify browser location permission is granted

**All distances show "Infinity"?**

- Articles may not have valid coordinates
- Run migration script if upgrading from old database
- New articles will have coordinates after re-fetching

**Location detection fails?**

- Check browser compatibility (works in Chrome, Firefox, Safari, Edge)
- Ensure location services are enabled on device
- Try manual location entry as fallback

---

## 📝 Code Locations

- **Backend logic:** [app.py](app.py) lines 1-210
- **Frontend geolocation:** [index.html](templates/index.html) lines 300-345
- **Distance calculation:** [app.py](app.py) lines 65-78
- **Migration script:** [migrate_db.py](migrate_db.py)

---

## 🔮 Future Enhancements

- Real-time location tracking for moving users
- Radius-based filtering (show only news within X km)
- Location accuracy indicator
- Historical location-based analytics
- Multi-language support for location names
- Offline mode with cached locations
