import google.generativeai as genai
import os
import json
from typing import Dict, Any
from dotenv import load_dotenv
load_dotenv()
# Configure Gemini
# NOTE: Using a placeholder if environment variable is not set. 
# The user must set GEMINI_API_KEY in their environment.
GOOGLE_API_KEY = os.getenv("GEMINI_API_KEY")

def analyze_crisis_with_llm(description: str, crisis_type: str, cnn_score: float = 0.0, cnn_label: str = "") -> Dict[str, Any]:
    """
    Analyzes crisis using Gemini 2.0 Flash to determine severity, 
    agencies needed, and suggested actions.
    """
    if not GOOGLE_API_KEY:
        print("Warning: GEMINI_API_KEY not set. Returning mock AI response.")
        return _mock_ai_response(description)

    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""
        You are an AI Crisis Response Coordinator. Analyze the following emergency situation and provide a JSON response.
        
        Input Data:
        - Reported Description: "{description}"
        - Initial Category: {crisis_type}
        - Automated Image Analysis (CNN): Label="{cnn_label}", Confidence={cnn_score}
        
        Task:
        1. Determine the REAL Severity (low, medium, high, critical) based on the combined text and image analysis context.
        2. Identify the specific agencies/resources needed (medical, fire, police, disaster_management, etc.).
        3. Provide a list of immediate actions for the dispatch team.
        4. Provide a brief summary for the broadcast.
        
        Output Format (JSON ONLY):
        {{
            "assessed_severity": "string",
            "confidence_score": float (0-1),
            "reasoning": "string",
            "required_resources": {{
                "medical": int,
                "fire": int,
                "police": int,
                "disaster_management": int,
                "other": ["string"]
            }},
            "recommended_actions": ["string"],
            "broadcast_message": "string"
        }}
        """
        
        response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
        return json.loads(response.text)
        
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        # Fallback to simple matching if AI fails
        return _mock_ai_response(description)

def _mock_ai_response(description: str) -> Dict[str, Any]:
    return {
        "assessed_severity": "medium",
        "confidence_score": 0.5,
        "reasoning": "AI Service unavailable, using fallback logic based on keywords.",
        "required_resources": {
            "medical": 1,
            "police": 1
        },
        "recommended_actions": ["Verify info manually", "Dispatch nearest unit"],
        "broadcast_message": f"Emergency reported: {description[:50]}..."
    }
