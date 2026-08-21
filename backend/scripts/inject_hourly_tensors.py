"""
Radar Tensor Data Injection Script.

Generates deterministic 32x32 dBZ (decibel relative to Z) radar reflectivity tensors
for each incident's hourly timeline. Injects realistic synthetic radar data based on
PAGASA warning levels and incident severity.

The script creates calibrated tensors that match the expected radar signatures for:
- Control incidents (clear weather): max 12 dBZ
- Yellow warnings: 20-35 dBZ with localized patterns
- Orange warnings: 35-50 dBZ with multiple rain cells
- Red warnings: 50-70 dBZ with intense precipitation cores

Usage:
    python scripts/inject_hourly_tensors.py
    
Output:
    Updates incidents.json with hourly_data.tensor fields for each time point.
"""
from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

import numpy as np

PATH = Path(__file__).resolve().parents[1] / "data" / "incidents.json"

CONTROL_IDS = {
    "20240315-sunny-control",
    "20230712-mild-monsoon",
    "20230915-afternoon-thunderstorm",
    "20240520-distant-typhoon",
}

WARNING_BASE = {
    "NONE": 6.0,
    "YELLOW": 28.0,
    "ORANGE": 42.0,
    "RED": 55.0,
}


def is_control(inc: dict) -> bool:
    """
    Determine if an incident is a control scenario (clear weather).
    
    Args:
        inc: Incident dictionary.
        
    Returns:
        bool: True if incident represents clear/control weather.
    """
    if inc["id"] in CONTROL_IDS:
        return True
    if inc.get("actual_action_code") == 0:
        tl = inc.get("hourly_timeline") or {}
        return all(h.get("pagasa_warning") == "NONE" for h in tl.values())
    return False


def seed_for(inc_id: str, hour_key: str) -> int:
    """
    Generate deterministic random seed for reproducible tensor generation.
    
    Args:
        inc_id: Incident identifier.
        hour_key: Hour key (e.g., "5.0", "5.5").
        
    Returns:
        int: Deterministic seed value.
    """
    digest = hashlib.md5(f"{inc_id}:{hour_key}".encode()).hexdigest()
    return int(digest[:8], 16)


def make_tensor(inc: dict, hour_key: str, hour_state: dict, rng: np.random.Generator) -> list:
    """
    Generate a 32x32 radar reflectivity tensor for a specific hour.
    
    Creates realistic synthetic radar data based on:
    - PAGASA warning level (NONE, YELLOW, ORANGE, RED)
    - LGU action code (0-4)
    - Time of day (temporal escalation)
    - Incident type (control vs. storm)
    
    Args:
        inc: Incident dictionary.
        hour_key: Hour key string (e.g., "5.0").
        hour_state: Timeline state for this hour.
        rng: NumPy random generator with deterministic seed.
        
    Returns:
        list: 32x32 nested list of dBZ values (0.0-70.0).
    """
    warning = hour_state.get("pagasa_warning", "NONE")
    action = inc.get("actual_action_code") or 0
    control = is_control(inc) and warning == "NONE"

    if control or (inc["id"] == "20240315-sunny-control"):
        grid = rng.uniform(0.0, 10.0, (32, 32)).astype(np.float32)
        yy, xx = np.mgrid[0:32, 0:32]
        grid += 1.5 * np.sin(xx / 7.0) * np.cos(yy / 9.0)
        hour = float(hour_key)
        if "thunderstorm" in inc["id"] and hour >= 10.0:
            cx, cy = 18, 14
            for r in range(32):
                for c in range(32):
                    d = math.hypot(c - cx, r - cy)
                    bump = max(0.0, 12.0 - d * 1.2)
                    grid[r, c] = min(12.0, grid[r, c] + bump * 0.35)
        grid = np.clip(grid, 0.0, 12.0)
        return np.round(grid, 1).tolist()

    if warning == "NONE" and action <= 1:
        grid = rng.uniform(0.0, 11.0, (32, 32)).astype(np.float32)
        grid = np.clip(grid, 0.0, 12.0)
        return np.round(grid, 1).tolist()

    base = WARNING_BASE.get(warning, 20.0) + action * 3.0
    hour = float(hour_key)
    time_factor = min(1.0, max(0.25, (hour - 3.0) / 6.0))

    grid = rng.uniform(2.0, 14.0, (32, 32)).astype(np.float32)

    n_spots = 1 if warning == "YELLOW" else (2 if warning == "ORANGE" else 3 if warning == "RED" else 1)
    if action >= 3:
        n_spots = max(n_spots, 2)

    centers = [(16, 16)]
    if n_spots >= 2:
        centers.append((10 + int(rng.integers(0, 5)), 20 + int(rng.integers(-2, 3))))
    if n_spots >= 3:
        centers.append((22 + int(rng.integers(-2, 3)), 11 + int(rng.integers(-2, 3))))

    peak = base * time_factor
    if warning == "RED":
        peak = min(65.0, peak + 8)
    elif warning == "ORANGE":
        peak = min(52.0, peak + 4)

    for i, (cx, cy) in enumerate(centers):
        strength = peak * (1.0 - i * 0.18)
        radius = 7.0 + (3.0 if warning in ("ORANGE", "RED") else 0.0)
        for r in range(32):
            for c in range(32):
                d = math.hypot(c - cx, r - cy)
                fall = max(0.0, 1.0 - d / radius)
                val = strength * (fall ** 1.4)
                if val > grid[r, c]:
                    grid[r, c] = val

    if warning != "NONE":
        fringe = rng.uniform(0, 1, (32, 32))
        mask = (grid < 16) & (fringe > 0.82)
        n = int(mask.sum())
        if n:
            grid[mask] = rng.uniform(16.0, 28.0, n)

    grid = np.clip(grid, 0.0, 70.0)
    return np.round(grid, 1).tolist()


def main() -> None:
    """
    Main execution function.
    
    Loads incidents.json, generates radar tensors for all hourly timeline points,
    validates control scenarios, and saves the enhanced dataset.
    """
    data = json.loads(PATH.read_text(encoding="utf-8"))
    for inc in data["incidents"]:
        timeline = inc.get("hourly_timeline") or {}
        hourly_data = {}
        for hour_key, hour_state in timeline.items():
            rng = np.random.default_rng(seed_for(inc["id"], hour_key))
            hourly_data[hour_key] = {"tensor": make_tensor(inc, hour_key, hour_state, rng)}
        inc["hourly_data"] = hourly_data

    PATH.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print("Wrote", PATH)
    print("\nControl verification (max dBZ must be <= 12):")
    for inc in data["incidents"]:
        if not is_control(inc):
            continue
        mx = 0.0
        ok = True
        for hour_key, payload in inc["hourly_data"].items():
            flat = [v for row in payload["tensor"] for v in row]
            m = max(flat)
            mx = max(mx, m)
            if m > 12.0 + 1e-6:
                ok = False
                print(" FAIL", inc["id"], hour_key, m)
        print((" OK" if ok else " BAD"), inc["id"], "global_max", mx)

    print("\nStorm sample maxima:")
    for inc in data["incidents"]:
        if is_control(inc):
            continue
        mx = max(max(v for row in p["tensor"] for v in row) for p in inc["hourly_data"].values())
        print(f"  {inc['id']}: max_dbz={mx}")


if __name__ == "__main__":
    main()