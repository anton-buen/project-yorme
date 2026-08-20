"""
Script to normalize all incidents to the expected frontend schema.
Converts new schema format to match the original Carina/Habagat format.
"""

import json

# Action code mapping
ACTION_MAP = {
    "A0": 0,
    "A1": 1,
    "A2": 2,
    "A3": 3,
    "A4": 4
}

# PAGASA warning mapping
WARNING_MAP = {
    "No Warning": "NONE",
    "Yellow Warning": "YELLOW",
    "Orange Warning": "ORANGE",
    "Red Warning": "RED"
}

def convert_time_to_float(time_str):
    """Convert HH:MM time string to float hour"""
    if not time_str:
        return 5.0
    parts = time_str.split(":")
    hours = int(parts[0])
    minutes = int(parts[1]) if len(parts) > 1 else 0
    return hours + minutes / 60.0

def estimate_flood_active(precip_mm):
    """Estimate if flooding is active based on precipitation"""
    return precip_mm >= 10.0

def estimate_stranded(precip_mm, hour_float):
    """Estimate stranded count based on precipitation and time of day"""
    if precip_mm < 5.0:
        return 0
    
    # More people stranded during commute hours (5-9 AM)
    time_multiplier = 2.0 if 5.0 <= hour_float <= 9.0 else 1.0
    base_stranded = (precip_mm - 5.0) * 150 * time_multiplier
    
    return int(base_stranded)

def normalize_incident(incident):
    """Normalize incident to expected schema"""
    
    # Check if already in correct format
    if "actual_announcement_time" in incident and "actual_action_code" in incident:
        return incident
    
    # Extract data from new schema
    lgu_decision = incident.get("lgu_decision", {})
    action_code_str = lgu_decision.get("action_code", "A0")
    announcement_time_str = lgu_decision.get("announcement_time", "05:00")
    
    # Convert to expected format
    normalized = {
        "id": incident["id"],
        "name": incident["name"],
        "description": incident.get("description", lgu_decision.get("source_log", "Historical incident")),
        "actual_announcement_time": convert_time_to_float(announcement_time_str),
        "actual_action_code": ACTION_MAP.get(action_code_str, 0),
        "hourly_timeline": {}
    }
    
    # Normalize timeline entries
    old_timeline = incident.get("hourly_timeline", {})
    for time_key, time_data in old_timeline.items():
        # Convert to expected format
        pagasa_warning = time_data.get("pagasa_warning", "No Warning")
        precip_mm = time_data.get("precipitation_estimate_mm", 0.0)
        
        normalized_entry = {
            "flood_active": time_data.get("flood_active", estimate_flood_active(precip_mm)),
            "pagasa_warning": WARNING_MAP.get(pagasa_warning, pagasa_warning),
            "simulated_stranded_projection": time_data.get("simulated_stranded_projection", estimate_stranded(precip_mm, float(time_key)))
        }
        
        normalized["hourly_timeline"][time_key] = normalized_entry
    
    return normalized

def main():
    # Load incidents
    with open("data/incidents.json", "r") as f:
        data = json.load(f)
    
    print(f"Loaded {len(data['incidents'])} incidents")
    
    # Normalize all incidents
    normalized_incidents = []
    for incident in data["incidents"]:
        normalized = normalize_incident(incident)
        normalized_incidents.append(normalized)
        print(f"  Normalized: {incident['id']}")
    
    # Save normalized data
    data["incidents"] = normalized_incidents
    
    with open("data/incidents.json", "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"\nSuccessfully normalized {len(normalized_incidents)} incidents")

if __name__ == "__main__":
    main()
