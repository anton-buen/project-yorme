"""
Incident Data Normalization Script.

Converts incident data to the standardized schema expected by the frontend.
Handles schema migrations and ensures consistency across historical data.

This script transforms various input formats into the canonical format with:
- Normalized action codes (0-4)
- Standardized PAGASA warning levels
- Consistent time representations
- Estimated flood and stranded projections

Usage:
    python normalize_incidents.py
"""

import json

ACTION_MAP = {
    "A0": 0,
    "A1": 1,
    "A2": 2,
    "A3": 3,
    "A4": 4
}

WARNING_MAP = {
    "No Warning": "NONE",
    "Yellow Warning": "YELLOW",
    "Orange Warning": "ORANGE",
    "Red Warning": "RED"
}


def convert_time_to_float(time_str):
    """
    Convert HH:MM time string to fractional hour float.
    
    Args:
        time_str: Time string in "HH:MM" format (e.g., "05:30").
        
    Returns:
        float: Hour as decimal (e.g., 5.5).
        
    Examples:
        >>> convert_time_to_float("05:00")
        5.0
        >>> convert_time_to_float("05:30")
        5.5
    """
    if not time_str:
        return 5.0
    parts = time_str.split(":")
    hours = int(parts[0])
    minutes = int(parts[1]) if len(parts) > 1 else 0
    return hours + minutes / 60.0


def estimate_flood_active(precip_mm):
    """
    Estimate flooding status based on precipitation.
    
    Args:
        precip_mm: Precipitation in millimeters.
        
    Returns:
        bool: True if flooding is likely (>= 10mm threshold).
    """
    return precip_mm >= 10.0


def estimate_stranded(precip_mm, hour_float):
    """
    Estimate number of stranded individuals based on weather and time.
    
    Applies a multiplier during commute hours (5-9 AM) when more people
    are exposed to weather conditions.
    
    Args:
        precip_mm: Precipitation in millimeters.
        hour_float: Hour of day as decimal (0-24).
        
    Returns:
        int: Estimated count of stranded individuals.
    """
    if precip_mm < 5.0:
        return 0
    
    time_multiplier = 2.0 if 5.0 <= hour_float <= 9.0 else 1.0
    base_stranded = (precip_mm - 5.0) * 150 * time_multiplier
    
    return int(base_stranded)


def normalize_incident(incident):
    """
    Normalize a single incident to the expected schema.
    
    Transforms various input formats into the canonical schema with
    standardized action codes, warning levels, and timeline data.
    
    Args:
        incident: Raw incident dictionary from input data.
        
    Returns:
        dict: Normalized incident with standardized schema.
    """
    if "actual_announcement_time" in incident and "actual_action_code" in incident:
        return incident
    
    lgu_decision = incident.get("lgu_decision", {})
    action_code_str = lgu_decision.get("action_code", "A0")
    announcement_time_str = lgu_decision.get("announcement_time", "05:00")
    
    normalized = {
        "id": incident["id"],
        "name": incident["name"],
        "description": incident.get("description", lgu_decision.get("source_log", "Historical incident")),
        "actual_announcement_time": convert_time_to_float(announcement_time_str),
        "actual_action_code": ACTION_MAP.get(action_code_str, 0),
        "hourly_timeline": {}
    }
    
    old_timeline = incident.get("hourly_timeline", {})
    for time_key, time_data in old_timeline.items():
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
    """
    Main execution function.
    
    Loads incidents.json, normalizes all incidents, and saves the result.
    """
    with open("data/incidents.json", "r") as f:
        data = json.load(f)
    
    print(f"Loaded {len(data['incidents'])} incidents")
    
    normalized_incidents = []
    for incident in data["incidents"]:
        normalized = normalize_incident(incident)
        normalized_incidents.append(normalized)
        print(f"  Normalized: {incident['id']}")
    
    data["incidents"] = normalized_incidents
    
    with open("data/incidents.json", "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"\nSuccessfully normalized {len(normalized_incidents)} incidents")


if __name__ == "__main__":
    main()