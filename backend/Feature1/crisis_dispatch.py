from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form, Depends, Header
from datetime import datetime
import uuid
import asyncio
import json
import os
import sys
from typing import Dict, List, Optional
from pydantic import BaseModel
from enum import Enum
import random
from geopy.distance import geodesic
from dotenv import load_dotenv
from supabase import create_client, Client
from pathlib import Path

# Add the backend directory to sys.path to ensure imports work in Vercel
# This is especially important for the top-level app.py and nested modules.
base_dir = Path(__file__).parent.parent.resolve()
if str(base_dir) not in sys.path:
    sys.path.insert(0, str(base_dir))

# Import AI & Twilio Services (Relative imports are safer within the same package)
try:
    from .gemini_service import analyze_crisis_with_llm
    from .twilio_service import send_emergency_sms
except ImportError:
    # Fallback to absolute if relative fails
    from Feature1.gemini_service import analyze_crisis_with_llm
    from Feature1.twilio_service import send_emergency_sms

# Force load from backend directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Settings
EMERGENCY_CONTACTS = [
    num for num in [os.getenv("TEST1_MOB_NO")] if num
]

# Supabase Client Setup
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY")

supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("DEBUG: Supabase Initialized")
    except Exception as e:
        print(f"DEBUG: Supabase Init Failed: {e}")
else:
    print("DEBUG: Supabase Credentials MISSING")

# Create router
router = APIRouter(prefix="/crisis", tags=["Crisis Dispatch"])

# Models
class CrisisSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

# --- Realtime Management ---
async def broadcast_to_dashboards(payload: dict):
    print(f"DEBUG: Broadcast: {payload.get('type')}")
    pass

# --- Endpoints ---

@router.get("/test-sms")
async def test_sms_diagnostic():
    """Diagnostic endpoint to verify Twilio connectivity."""
    if not EMERGENCY_CONTACTS:
        return {"status": "error", "message": "No TEST1_MOB_NO found in environment vars."}
    
    test_number = EMERGENCY_CONTACTS[0]
    success = send_emergency_sms(test_number, "🛠️ SankatSaathi diagnostic: Twilio is connected!")
    
    return {
        "status": "success" if success else "failed",
        "recipient": test_number,
        "message": "Check your phone or Twilio logs if failed."
    }

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
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not initialized. Check Vercel/Local env vars.")

    try:
        # 1. Image Upload
        image_public_url = None
        if image:
            try:
                file_content = await image.read()
                file_ext = image.filename.split(".")[-1]
                file_path = f"incidents/{uuid.uuid4()}.{file_ext}"
                supabase.storage.from_("incident-images").upload(file_path, file_content)
                image_public_url = supabase.storage.from_("incident-images").get_public_url(file_path)
            except Exception as e:
                print(f"Image Upload Failed: {e}")

        # 2. AI Analysis
        ai_analysis = {
            "severity": "critical", 
            "reasoning": "Standard emergency dispatch protocol.",
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
        data = supabase.table("incidents").insert(new_incident).execute()
        incident_id = data.data[0]["id"] if data.data else None

        # 4. SMS Alerts to EMERGENCY_CONTACTS (Direct Test Loop)
        for phone in EMERGENCY_CONTACTS:
            # Assume within distance for test numbers to guarantee trigger
            msg = f"🚨 SankatSaathi ALERT: {title} reported. Type: {crisis_type}. Severity: {final_severity}. Stay safe!"
            send_emergency_sms(phone, msg)

        # 5. Dynamic SMS to Nearby Users from DB
        try:
            res = supabase.table("profiles").select("phone_number, last_latitude, last_longitude").not_.is_("phone_number", "null").execute()
            for p in res.data:
                p_lat, p_lon = p.get("last_latitude"), p.get("last_longitude")
                if p_lat and p_lon and p.get("phone_number"):
                    dist = geodesic((p_lat, p_lon), (latitude, longitude)).km
                    if dist <= 5 and p["phone_number"] not in EMERGENCY_CONTACTS:
                        msg = f"🚨 SankatSaathi ALERT: {title} reported near you ({dist:.1f}km). Stay safe!"
                        send_emergency_sms(p["phone_number"], msg)
        except Exception as e:
            print(f"Dynamic SMS Logic Failed: {e}")

        return {"message": "Incident Reported & Alerts Sent", "incident_id": incident_id}

    except Exception as e:
        print(f"ERROR in /alert: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

@router.get("/active")
async def get_active_crises():
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not initialized. Check Vercel Env Vars.")
    
    try:
        response = supabase.table("incidents").select("*").neq("status", "closed").execute()
        return {"crises": response.data}
    except Exception as e:
        print(f"ERROR in /active: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Fetch Error: {str(e)}")

@router.get("/{incident_id}")
async def get_incident_detail(incident_id: str):
    if not supabase: raise HTTPException(500, "Supabase missing")
    try:
        inc_res = supabase.table("incidents").select("*, profiles(full_name, phone_number)").eq("id", incident_id).execute()
        if not inc_res.data: raise HTTPException(404, "Not found")
        
        incident = inc_res.data[0]
        room_res = supabase.table("incident_rooms").select("id").eq("incident_id", incident_id).execute()
        messages = []
        if room_res.data:
            room_id = room_res.data[0]["id"]
            msg_res = supabase.table("incident_messages").select("*, profiles(full_name)").eq("room_id", room_id).order("created_at", desc=False).execute()
            messages = msg_res.data
        return {"incident": incident, "messages": messages}
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/{incident_id}/accept")
async def accept_incident(incident_id: str, responder_id: str = Form(...)):
    if not supabase: raise HTTPException(500, "Supabase missing")
    try:
        res = supabase.table("incidents").update({"status": "dispatched", "responder_id": responder_id}).eq("id", incident_id).execute()
        updated_incident = res.data[0]
        room_res = supabase.table("incident_rooms").select("id").eq("incident_id", incident_id).execute()
        if room_res.data:
            room_id = room_res.data[0]["id"]
            prof_res = supabase.table("profiles").select("full_name").eq("id", responder_id).execute()
            name = prof_res.data[0]["full_name"] if prof_res.data else "A responder"
            supabase.table("incident_messages").insert({"room_id": room_id, "sender_id": responder_id, "content": f"🚨 {name} has accepted this incident."}).execute()
        return {"message": "Accepted", "incident": updated_incident}
    except Exception as e:
        raise HTTPException(500, str(e))
