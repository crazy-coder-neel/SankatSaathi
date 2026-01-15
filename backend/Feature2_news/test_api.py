import requests
import json

# API KEY from app.py
GNEWS_API_KEY = "36b38d93610935363447703e54bb8688"
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

query = " OR ".join(DISASTER_KEYWORDS.keys())
url = f"https://gnews.io/api/v4/search?q={query}&lang=en&country=in&max=10&sortby=publishedAt&apikey={GNEWS_API_KEY}"

print(f"Testing URL: {url}")

try:
    response = requests.get(url, timeout=10)
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"Total articles found: {data.get('totalArticles')}")
        articles = data.get('articles', [])
        print(f"Articles in response: {len(articles)}")
        if len(articles) > 0:
            print("First article title:", articles[0].get('title'))
    else:
        print("Error response:", response.text)
except Exception as e:
    print(f"Exception: {e}")
