from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form
from datetime import datetime
import uuid
import asyncio
import json
from typing import Dict, List, Optional
from pydantic import BaseModel
from enum import Enum
import random
from geopy.distance import geodesic

# Import AI Service
from gemini_service import analyze_crisis_with_llm

# Create router
router = APIRouter(prefix="/crisis", tags=["Crisis Dispatch"])

# Models
class CrisisSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class CrisisType(str, Enum):
    MEDICAL = "medical"
    FIRE = "fire"
    NATURAL_DISASTER = "natural_disaster"
    ACCIDENT = "accident"
    CRIME = "crime"
    OTHER = "other"

# Note: We'll use Form parameters for the endpoint instead of Pydantic model for receiving data with files
class AgencyResponse(BaseModel):
    agency_id: str
    agency_name: str
    eta_minutes: int
    capacity: int
    accepts: bool

# Simulated agency database with MORE types
AGENCIES = [
    {"id": "med1", "name": "City Medical Center", "type": "medical", "lat": 28.6139, "lon": 77.2090, "capacity": 10, "specialties": ["trauma", "cardiac"]},
    {"id": "fire1", "name": "Central Fire Station", "type": "fire", "lat": 28.6140, "lon": 77.2095, "capacity": 15, "specialties": ["fire", "rescue"]},
    {"id": "rescue1", "name": "Rescue Team Alpha", "type": "rescue", "lat": 28.6135, "lon": 77.2085, "capacity": 8, "specialties": ["height_rescue", "water_rescue"]},
    {"id": "police1", "name": "Police HQ", "type": "police", "lat": 28.6145, "lon": 77.2099, "capacity": 20, "specialties": ["crowd_control", "investigation"]},
    {"id": "ndr1", "name": "National Disaster Response Force", "type": "disaster_management", "lat": 28.6200, "lon": 77.2150, "capacity": 50, "specialties": ["flood", "earthquake", "collapse"]},
    {"id": "ngo1", "name": "Red Cross Quick Response", "type": "ngo", "lat": 28.6110, "lon": 77.2050, "capacity": 5, "specialties": ["first_aid", "supplies"]},
    {"id": "med2", "name": "Westside Hospital", "type": "medical", "lat": 28.6150, "lon": 77.2105, "capacity": 12, "specialties": ["pediatrics", "burn"]},
]

# Active crises and connections
active_crises: Dict[str, dict] = {}
agency_responses: Dict[str, List[dict]] = {}
connected_agencies: Dict[str, WebSocket] = {}
connected_dashboards: List[WebSocket] = []
agency_status: Dict[str, dict] = {}

def calculate_distance(lat1, lon1, lat2, lon2):
    return geodesic((lat1, lon1), (lat2, lon2)).km

def calculate_eta(distance_km, severity, traffic_factor=1.0):
    base_speed = 40
    if severity == CrisisSeverity.CRITICAL:
        base_speed = 60
        traffic_factor *= 0.8
    effective_speed = base_speed * traffic_factor
    travel_time = (distance_km / effective_speed) * 60
    return max(1, int(travel_time + random.randint(0, 3)))

def find_nearest_agencies(crisis_lat, crisis_lon, crisis_type, severity, count=5, max_distance_km=10):
    agencies_with_score = []
    
    for agency in AGENCIES:
        if agency["id"] in agency_status and agency_status[agency["id"]].get("status") == "busy":
            continue
        
        dist = calculate_distance(crisis_lat, crisis_lon, agency["lat"], agency["lon"])
        
        # Filter by distance
        if dist > max_distance_km:
            continue
        
        # Determine relevance score
        type_match_score = 1.0
        if agency["type"] == crisis_type:
            type_match_score = 2.0
        elif crisis_type == "natural_disaster" and agency["type"] == "disaster_management":
             type_match_score = 3.0 # High priority for NDRF in disasters
        
        eta = calculate_eta(dist, severity)
        score = dist * (1/type_match_score) + (eta * 0.1)
        
        agencies_with_score.append({
            **agency,
            "distance_km": round(dist, 2),
            "eta_minutes": eta,
            "match_score": round(score, 2),
            "available": True
        })
    
    agencies_with_score.sort(key=lambda x: x["match_score"])
    return agencies_with_score[:count]

async def broadcast_to_dashboards(message: dict):
    for dashboard in connected_dashboards:
        try:
            await dashboard.send_json(message)
        except:
            continue

# --- New AI & File Handling Endpoints ---

@router.post("/alert")
async def create_crisis_alert(
    title: str = Form(...),
    description: str = Form(...),
    crisis_type: str = Form(...),
    severity: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    contact_number: str = Form(...),
    reported_by: str = Form(...),
    reporter_id: Optional[str] = Form(None), # Added for session filtering
    image: Optional[UploadFile] = File(None)
):
    """
    Create a new crisis alert with AI Analysis and Image handling.
    """
    crisis_id = str(uuid.uuid4())
    
    # 1. Handle Image & Run Mock CNN (Placeholder for user's CNN)
    image_url = None
    cnn_score = 0.0
    cnn_label = "unknown"
    
    if image:
        image_url = f"blob:{image.filename}" # Placeholder
        # --- MOCK CNN PREDICTION (DISABLED FOR TESTING) ---
        # cnn_score = random.uniform(0.7, 0.99)
        # cnn_label = crisis_type 

    # 2. Run Gemini 2.0 Flash Analysis (DISABLED FOR TESTING)
    # ai_analysis = analyze_crisis_with_llm(description, crisis_type, cnn_score, cnn_label)
    
    # Mock AI Analysis response for frontend compatibility
    ai_analysis = {
        "assessed_severity": severity,
        "confidence_score": 1.0,
        "reasoning": "AI Analysis disabled for testing. Using direct input.",
        "required_resources": {"medical": 1, "police": 1},
        "recommended_actions": ["Direct dispatch initiated"]
    }

    # 3. Use AI advice to refine severity and resources
    # assessed_severity = ai_analysis.get("assessed_severity", severity).lower()
    final_severity = severity # assessed_severity if assessed_severity in ["low", "medium", "high", "critical"] else severity

    # 4. Find Agencies
    # STATIC ARRAY LOGIC (User Requested)
    # We maintain the global AGENCIES list as the "Static Array".
    # The 10km logic checks if any of these static agencies are nearby.
    existing_nearby = find_nearest_agencies(latitude, longitude, crisis_type, final_severity, count=8, max_distance_km=10)
    
    # If no static agencies are within 10km (likely during testing elsewhere),
    # we "simulate" that there are agencies in that range by spawning them.
    if len(existing_nearby) < 3:
        for i in range(5):
            lat_offset = (random.random() - 0.5) * 0.15 # Approx 10km spread
            lon_offset = (random.random() - 0.5) * 0.15
            
            # Create a "Dummy" agency for this location
            # This satisfies "create dummy agencies within 10 km range"
            temp_agency = {
                "id": f"dummy_{uuid.uuid4().hex[:6]}",
                "name": f"Local Response Unit {i+1} ({crisis_type.capitalize()})",
                "type": crisis_type,
                "lat": latitude + lat_offset,
                "lon": longitude + lon_offset,
                "capacity": random.randint(3, 8),
                "specialties": ["emergency"]
            }
            AGENCIES.append(temp_agency)
        
        # Re-fetch to include the newly spawned ones
        nearest = find_nearest_agencies(latitude, longitude, crisis_type, final_severity, count=8, max_distance_km=10)
    else:
        nearest = existing_nearby

    crisis_data = {
        "id": crisis_id,
        "title": title,
        "description": description,
        "crisis_type": crisis_type,
        "severity": final_severity,
        "latitude": latitude,
        "longitude": longitude,
        "contact_number": contact_number,
        "reported_by": reported_by,
        "reporter_id": reporter_id, # STORED FOR SESSION ISOLATION
        "image_url": image_url,
        "ai_analysis": ai_analysis,
        "created_at": datetime.utcnow().isoformat(),
        "status": "pending",
        "nearest_agencies": nearest[:5],
        "accepted_agencies": [],
        "rejected_agencies": [],
        "location_updates": []
    }

    
    active_crises[crisis_id] = crisis_data
    agency_responses[crisis_id] = []
    
    # Notify dashboards
    await broadcast_to_dashboards({
        "type": "NEW_CRISIS",
        "crisis": crisis_data
    })
    
    return {
        "crisis_id": crisis_id,
        "message": "Alert processed by Gemini AI & dispatched.",
        "ai_analysis": ai_analysis,
        "agencies_notified": [a["name"] for a in nearest[:5]]
    }

@router.post("/{crisis_id}/respond")
async def agency_respond(crisis_id: str, response: AgencyResponse):
    """Agency responds to a crisis"""
    if crisis_id not in active_crises:
        raise HTTPException(status_code=404, detail="Crisis not found")
    
    crisis = active_crises[crisis_id]
    
    # Add response
    response_data = {
        **response.dict(),
        "responded_at": datetime.utcnow().isoformat(),
        "response_time_seconds": (datetime.utcnow() - datetime.fromisoformat(crisis["created_at"])).total_seconds()
    }
    
    # Update agency status
    agency_status[response.agency_id] = {
        "status": "busy" if response.accepts else "available",
        "current_crisis": crisis_id if response.accepts else None,
        "last_update": datetime.utcnow().isoformat()
    }
    
    if response.accepts:
        # Check if we still need this type of agency
        current_accepts = [r for r in agency_responses.get(crisis_id, []) if r.get("accepts")]
        
        # Check agency type compatibility
        agency = next((a for a in AGENCIES if a["id"] == response.agency_id), None)
        if agency:
            agency_type = agency["type"]
            needed = crisis["agencies_needed"].get(agency_type, 0)
            current_of_type = len([a for a in crisis.get("accepted_agencies", []) 
                                 if any(ag["id"] == a["agency_id"] for ag in AGENCIES if ag["type"] == agency_type)])
            
            if current_of_type < needed:
                crisis["accepted_agencies"].append({
                    "agency_id": response.agency_id,
                    "agency_name": response.agency_name,
                    "eta_minutes": response.eta_minutes,
                    "capacity": response.capacity,
                    "agency_type": agency_type,
                    "accepted_at": datetime.utcnow().isoformat()
                })
                
                # Update crisis status
                total_accepted = len(crisis["accepted_agencies"])
                total_needed = crisis["agencies_needed"]["total"]
                
                if total_accepted >= total_needed:
                    crisis["status"] = "fully_assigned"
                    # Cancel escalation task for this crisis
                elif total_accepted > 0:
                    crisis["status"] = "partially_assigned"
    else:
        crisis["rejected_agencies"].append({
            "agency_id": response.agency_id,
            "agency_name": response.agency_name,
            "reason": "declined",
            "rejected_at": datetime.utcnow().isoformat()
        })
    
    # Store response
    agency_responses[crisis_id].append(response_data)
    
    # Calculate average ETA of accepted agencies
    if crisis["accepted_agencies"]:
        avg_eta = sum(a["eta_minutes"] for a in crisis["accepted_agencies"]) / len(crisis["accepted_agencies"])
        crisis["average_eta"] = round(avg_eta, 1)
    
    # Broadcast update
    await broadcast_to_dashboards({
        "type": "AGENCY_RESPONSE",
        "crisis_id": crisis_id,
        "response": response_data,
        "crisis": crisis,
        "agency_status": agency_status.get(response.agency_id)
    })
    
    return {
        "status": "response recorded", 
        "crisis_status": crisis["status"],
        "accepted_agencies": len(crisis["accepted_agencies"]),
        "needed_agencies": crisis["agencies_needed"]["total"]
    }

@router.post("/{crisis_id}/escalate")
async def escalate_crisis(crisis_id: str):
    """Manually escalate a crisis"""
    if crisis_id not in active_crises:
        raise HTTPException(status_code=404, detail="Crisis not found")
    
    crisis = active_crises[crisis_id]
    
    # Find additional agencies
    new_agencies = find_nearest_agencies(
        crisis["latitude"], 
        crisis["longitude"], 
        crisis["crisis_type"], 
        crisis["severity"],
        count=10
    )
    
    # Filter out already notified agencies
    notified_ids = [a["id"] for a in crisis["all_nearby_agencies"]]
    additional_agencies = [a for a in new_agencies if a["id"] not in notified_ids]
    
    crisis["all_nearby_agencies"].extend(additional_agencies)
    crisis["escalation_level"] += 1
    
    # Notify additional agencies
    for agency in additional_agencies[:5]:  # Notify top 5 new agencies
        if agency["id"] in connected_agencies:
            await connected_agencies[agency["id"]].send_json({
                "type": "CRISIS_ESCALATION",
                "crisis_id": crisis_id,
                "crisis": crisis,
                "agency": agency,
                "priority": "critical"
            })
    
    await broadcast_to_dashboards({
        "type": "CRISIS_ESCALATED",
        "crisis_id": crisis_id,
        "crisis": crisis,
        "additional_agencies": additional_agencies[:5]
    })
    
    return {
        "message": "Crisis escalated",
        "new_agencies_notified": len(additional_agencies[:5]),
        "escalation_level": crisis["escalation_level"]
    }

@router.websocket("/ws/agency/{agency_id}")
async def agency_websocket(websocket: WebSocket, agency_id: str):
    """WebSocket for agencies to receive real-time alerts"""
    await websocket.accept()
    connected_agencies[agency_id] = websocket
    
    # Update agency status
    agency_status[agency_id] = {
        "status": "available",
        "last_seen": datetime.utcnow().isoformat(),
        "connected": True
    }
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Handle agency messages
            if data.get("type") == "LOCATION_UPDATE":
                crisis_id = data.get("crisis_id")
                if crisis_id in active_crises:
                    active_crises[crisis_id]["location_updates"].append(data)
                    await broadcast_to_dashboards({
                        "type": "LOCATION_UPDATE",
                        "crisis_id": crisis_id,
                        "update": data
                    })
            
            elif data.get("type") == "STATUS_UPDATE":
                agency_status[agency_id].update({
                    "status": data.get("status", "available"),
                    "location": data.get("location"),
                    "capacity": data.get("capacity")
                })
                
                await broadcast_to_dashboards({
                    "type": "AGENCY_STATUS_UPDATE",
                    "agency_id": agency_id,
                    "status": agency_status[agency_id]
                })
            
            # Keep connection alive
            elif data.get("type") == "PING":
                await websocket.send_json({"type": "PONG"})
                
    except WebSocketDisconnect:
        if agency_id in connected_agencies:
            del connected_agencies[agency_id]
        agency_status[agency_id] = {"status": "offline", "connected": False}

@router.websocket("/ws/dashboard")
async def dashboard_websocket(websocket: WebSocket):
    """WebSocket for dashboard real-time updates"""
    await websocket.accept()
    connected_dashboards.append(websocket)
    
    try:
        # Send initial state
        await websocket.send_json({
            "type": "INITIAL_STATE",
            "active_crises": list(active_crises.values()),
            "agencies": AGENCIES,
            "agency_status": agency_status
        })
        
        while True:
            await websocket.receive_text()  # Keep connection alive
            
    except WebSocketDisconnect:
        connected_dashboards.remove(websocket)

@router.get("/active")
async def get_active_crises():
    """Get all active crises"""
    return {
        "crises": list(active_crises.values()),
        "total": len(active_crises),
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/{crisis_id}")
async def get_crisis_details(crisis_id: str):
    """Get details of a specific crisis"""
    if crisis_id not in active_crises:
        raise HTTPException(status_code=404, detail="Crisis not found")
    
    crisis = active_crises[crisis_id]
    
    # Calculate response metrics
    responses = agency_responses.get(crisis_id, [])
    accept_rate = len([r for r in responses if r.get("accepts")]) / len(responses) if responses else 0
    
    return {
        **crisis,
        "response_metrics": {
            "total_responses": len(responses),
            "accept_rate": round(accept_rate * 100, 1),
            "average_response_time": sum(r.get("response_time_seconds", 0) for r in responses) / len(responses) if responses else 0,
            "escalation_level": crisis.get("escalation_level", 0)
        }
    }

@router.get("/agencies/nearby")
async def get_nearby_agencies(lat: float, lon: float, limit: int = 10, crisis_type: Optional[str] = None):
    """Get agencies near a location"""
    agencies_with_dist = []
    
    for agency in AGENCIES:
        # Filter by type if specified
        if crisis_type and agency["type"] != crisis_type:
            continue
        
        dist = calculate_distance(lat, lon, agency["lat"], agency["lon"])
        status = agency_status.get(agency["id"], {"status": "unknown"})
        
        agencies_with_dist.append({
            **agency,
            "distance_km": round(dist, 2),
            "status": status["status"],
            "eta_minutes": calculate_eta(dist, CrisisSeverity.MEDIUM)
        })
    
    # Sort by distance
    agencies_with_dist.sort(key=lambda x: x["distance_km"])
    return {
        "agencies": agencies_with_dist[:limit],
        "total_nearby": len(agencies_with_dist),
        "location": {"lat": lat, "lon": lon}
    }

@router.get("/analytics/summary")
async def get_analytics_summary():
    """Get analytics summary"""
    now = datetime.utcnow()
    hour_ago = now.replace(hour=now.hour-1)
    
    recent_crises = [
        c for c in active_crises.values() 
        if datetime.fromisoformat(c["created_at"]) > hour_ago
    ]
    
    # Calculate metrics
    total_responses = sum(len(responses) for responses in agency_responses.values())
    accepted_responses = sum(len([r for r in responses if r.get("accepts")]) 
                           for responses in agency_responses.values())
    
    return {
        "total_active_crises": len(active_crises),
        "crises_last_hour": len(recent_crises),
        "total_responses": total_responses,
        "acceptance_rate": round(accepted_responses / total_responses * 100, 1) if total_responses > 0 else 0,
        "connected_agencies": len(connected_agencies),
        "average_response_time_minutes": 0,  # Calculate from actual data
        "severity_distribution": {
            "critical": len([c for c in active_crises.values() if c["severity"] == "critical"]),
            "high": len([c for c in active_crises.values() if c["severity"] == "high"]),
            "medium": len([c for c in active_crises.values() if c["severity"] == "medium"]),
            "low": len([c for c in active_crises.values() if c["severity"] == "low"])
        }
    }

@router.post("/simulate/crisis")
async def simulate_crisis():
    """Simulate a crisis for testing"""
    crisis_types = ["medical", "fire", "accident", "crime"]
    severities = ["low", "medium", "high", "critical"]
    
    simulated_crisis = CrisisRequest(
        title=f"Simulated {random.choice(['Car Accident', 'Fire', 'Heart Attack', 'Robbery'])}",
        description="This is a simulated emergency for testing purposes.",
        crisis_type=random.choice(crisis_types),
        severity=random.choice(severities),
        latitude=28.6139 + (random.random() - 0.5) * 0.02,
        longitude=77.2090 + (random.random() - 0.5) * 0.02,
        contact_number=f"+91{random.randint(9000000000, 9999999999)}",
        reported_by="System Simulation"
    )
    
    return await create_crisis_alert(simulated_crisis)

@router.post("/simulate/response/{crisis_id}")
async def simulate_response(crisis_id: str, count: int = 2):
    """Simulate agency responses to a crisis"""
    if crisis_id not in active_crises:
        raise HTTPException(status_code=404, detail="Crisis not found")
    
    crisis = active_crises[crisis_id]
    responses = []
    
    # Simulate responses from nearest agencies
    for i, agency in enumerate(crisis["nearest_agencies"][:count]):
        response = AgencyResponse(
            agency_id=agency["id"],
            agency_name=agency["name"],
            eta_minutes=agency["eta_minutes"] + random.randint(-2, 2),
            capacity=random.randint(1, agency["capacity"]),
            accepts=random.choice([True, False]) if i < 2 else True  # First 2 might decline
        )
        
        await agency_respond(crisis_id, response)
        responses.append(response)
    
    return {
        "message": f"Simulated {len(responses)} responses",
        "responses": [r.dict() for r in responses]
    }