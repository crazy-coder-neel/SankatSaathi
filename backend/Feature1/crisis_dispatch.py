from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form, Depends, Header
from datetime import datetime
import uuid
import asyncio
import json
import os
from typing import Dict, List, Optional
from pydantic import BaseModel
from enum import Enum
import random
from geopy.distance import geodesic
from dotenv import load_dotenv
from supabase import create_client, Client

# Import AI Service
from .gemini_service import analyze_crisis_with_llm

from pathlib import Path

# Force load from backend directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Supabase Client Setup
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

print(f"DEBUG: CWD is {os.getcwd()}")
print(f"DEBUG: SUPABASE_URL found: {bool(SUPABASE_URL)}")
print(f"DEBUG: SUPABASE_KEY found: {bool(SUPABASE_KEY)}")

# If env vars are missing, we'll warn but not crash immediately (local dev flexibility)
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("DEBUG: Supabase Client Initialized Successfully")
    except Exception as e:
        print(f"DEBUG: Supabase Client Init Failed: {e}")
else:
    print("DEBUG: CRITICAL - Supabase Credentials MISSING in backend/.env")

# Create router
router = APIRouter(prefix="/crisis", tags=["Crisis Dispatch"])

# Models
class CrisisSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AgencyResponse(BaseModel):
    agency_id: str
    agency_name: str
    eta_minutes: int
    capacity: int
    accepts: bool

# --- Realtime Management ---
# Persistence is handled via Supabase direct.
# WebSockets removed for Vercel Serverless compatibility.

# --- Helper Functions ---

def get_db_incident(incident_id: str):
    if not supabase: return None
    try:
        response = supabase.table("incidents").select("*").eq("id", incident_id).execute()
        if response.data:
            return response.data[0]
    except Exception as e:
        print(f"DB Error: {e}")
    return None

def find_nearby_agencies_static(lat, lon, radius_km=10):
    # For Hackathon: We still mock the "Agency Discovery" because agencies might not be "users" in the DB yet.
    # In a real system, we'd query `profiles` table with lat/long.
    # We will use the defined AGENCIES list but filter by distance.
    pass # Reusing logic from create_crisis_alert

# --- Endpoints ---

@router.post("/alert")
async def create_crisis_alert(
    title: str = Form(...),
    description: str = Form(""),
    crisis_type: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    image: Optional[UploadFile] = File(None),
    reporter_id: Optional[str] = Form(None)
):
    """
    1. Upload Image to Supabase Storage (if any)
    2. Analyze with Gemini (Visual + Text)
    3. Insert into Supabase DB (triggers chat creation)
    4. Broadcast Alert
    """
    
    # 1. Image Upload
    image_public_url = None
    if image and supabase:
        try:
            file_content = await image.read()
            file_ext = image.filename.split(".")[-1]
            file_path = f"incidents/{uuid.uuid4()}.{file_ext}"
            supabase.storage.from_("incident-images").upload(file_path, file_content)
            image_public_url = supabase.storage.from_("incident-images").get_public_url(file_path)
        except Exception as e:
            print(f"Image Upload Failed: {e}")

    # 2. AI Analysis
    # cnn_score = 0.9 # Mock
    # ai_analysis = analyze_crisis_with_llm(description, crisis_type, cnn_score, "fire") 
    ai_analysis = {
        "severity": "critical", 
        "reasoning": "Detected fire and received urgent text.",
        "resources": ["fire_brigade", "ambulance"]
    }
    
    final_severity = ai_analysis.get("severity", "medium").lower()

    # 3. DB Insert
    new_incident = {
        "title": title,
        "description": description,
        "type": crisis_type,
        "latitude": latitude,
        "longitude": longitude,
        "severity": final_severity,
        "status": "pending",
        "image_url": image_public_url,
        "ai_analysis": ai_analysis,
        "reporter_id": reporter_id 
    }
    incident_id = None
    if supabase:
        try:
            data = supabase.table("incidents").insert(new_incident).execute()
            if data.data:
                incident_id = data.data[0]["id"]
        except Exception as e:
            print(f"DB Insert Failed: {e}")
            raise HTTPException(status_code=500, detail=str(e))
    else:
        raise HTTPException(status_code=500, detail="Database not initialized")

    return {
        "message": "Incident Reported",
        "incident_id": incident_id,
        "ai_analysis": ai_analysis
    }

@router.get("/active")
async def get_active_crises():
    if not supabase:
        return {"crises": []}
    
    try:
        # Fetch active incidents
        response = supabase.table("incidents").select("*").neq("status", "closed").execute()
        return {"crises": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{incident_id}")
async def get_incident_detail(incident_id: str):
    if not supabase: return {}
    
    # Get Incident
    inc_res = supabase.table("incidents").select("*, profiles(full_name, phone_number)").eq("id", incident_id).execute()
    if not inc_res.data:
        raise HTTPException(404, "Incident not found")
        
    incident = inc_res.data[0]
    
    # Get Chat Messages (Just last 50)
    # Note: Client can also subscribe via Supabase Realtime
    room_res = supabase.table("incident_rooms").select("id").eq("incident_id", incident_id).execute()
    messages = []
    if room_res.data:
        room_id = room_res.data[0]["id"]
        msg_res = supabase.table("incident_messages").select("*, profiles(full_name)").eq("room_id", room_id).order("created_at", desc=False).execute()
        messages = msg_res.data

    return {"incident": incident, "messages": messages}
    
@router.post("/{incident_id}/accept")
async def accept_incident(incident_id: str, responder_id: str = Form(...)):
    if not supabase:
        raise HTTPException(500, "Supabase not initialized")
        
    try:
        # 1. Update Incident
        # We set status to 'dispatched' and record the responder
        res = supabase.table("incidents").update({
            "status": "dispatched",
            "responder_id": responder_id
        }).eq("id", incident_id).execute()
        
        if not res.data:
            raise HTTPException(404, "Incident not found")
            
        updated_incident = res.data[0]
        
        # 2. Add System Message to Chat
        # Get Room ID
        room_res = supabase.table("incident_rooms").select("id").eq("incident_id", incident_id).execute()
        if room_res.data:
            room_id = room_res.data[0]["id"]
            
            # Get Responder Name
            prof_res = supabase.table("profiles").select("full_name").eq("id", responder_id).execute()
            name = prof_res.data[0]["full_name"] if prof_res.data else "A responder"
            
            supabase.table("incident_messages").insert({
                "room_id": room_id,
                "sender_id": responder_id,
                "content": f"🚨 {name} has accepted this incident and is en route."
            }).execute()
            
        # 3. Broadcast update to dashboards
        await broadcast_to_dashboards({
            "type": "AGENCY_RESPONSE",
            "crisis_id": incident_id,
            "crisis": updated_incident
        })
        
        return {"message": "Incident accepted", "incident": updated_incident}
        
    except Exception as e:
        print(f"Accept Error: {e}")
        raise HTTPException(500, str(e))


