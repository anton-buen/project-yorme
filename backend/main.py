import os
import json
import asyncio
from contextlib import asynccontextmanager
import torch
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from stable_baselines3 import PPO

from src.env import LguSuspensionEnv
from src.data_fetcher import ManilaDataPipeline

# --- GLOBAL STATE & CACHE ---
MODEL_PATH = "models/ppo_yorme_agent.zip"
model = None
data_pipeline = ManilaDataPipeline()

async def refresh_radar_cache_loop():
    """
    Background worker that pings PAGASA/GeoRiskPH every 5 minutes (300s)
    to keep spatial tensor data fresh without blocking API requests.
    """
    while True:
        try:
            # Force cache reset in pipeline to grab fresh image
            data_pipeline._cached_radar = None
            _ = data_pipeline.fetch_radar_reflectivity()
            print("[BACKGROUND CACHE] Updated PAGASA Doppler radar tensor.")
        except Exception as e:
            print(f"[BACKGROUND CACHE] Warning: Radar refresh failed ({e})")
        
        await asyncio.sleep(300)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles server startup and shutdown lifecycle events."""
    global model
    # 1. Load trained RL model weights
    if os.path.exists(MODEL_PATH):
        try:
            model = PPO.load(MODEL_PATH)
            print(f"[STARTUP] Successfully loaded PPO model from {MODEL_PATH}")
        except Exception as e:
            print(f"[STARTUP] Error loading PPO model: {e}")
    else:
        print("[STARTUP] Warning: PPO model weights not found. Using fallback heuristics.")

    # 2. Kick off background task for live data fetching
    fetch_task = asyncio.create_task(refresh_radar_cache_loop())
    
    yield  # Server runs here
    
    # 3. Clean up on shutdown
    fetch_task.cancel()

# --- FASTAPI APP SETUP ---
app = FastAPI(title="WALANG PASOK AI - Backend API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REQUEST / RESPONSE SCHEMAS ---
class PredictRequest(BaseModel):
    current_hour: float
    flood_active: bool
    pagasa_warning_red: bool

class PredictResponse(BaseModel):
    ai_action_code: int
    action_probabilities: list[float]
    loaded_model_path: str
    obs_tensor_shapes: dict

# --- API ENDPOINTS ---
@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "model_loaded": model is not None,
        "radar_cached": data_pipeline._cached_radar is not None
    }

@app.get("/api/incidents")
def get_incidents():
    file_path = "data/incidents.json"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Incidents data not found")
    with open(file_path, "r") as f:
        return json.load(f)

@app.post("/api/predict", response_model=PredictResponse)
def get_prediction(req: PredictRequest):
    # Initialize environment state
    env = LguSuspensionEnv()
    env.reset()
    
    # Attach shared data pipeline instance (reuses memory cache)
    env.data_pipeline = data_pipeline
    env.current_hour = req.current_hour
    env._will_flood = req.flood_active
    env._has_pagasa_red_warning = req.pagasa_warning_red
    
    # Retrieve pre-cached observation tensor instantly
    obs = env._get_obs()
    
    # Run PyTorch inference
    if model:
        action, _ = model.predict(obs, deterministic=True)
        ai_code = int(action)
        
        with torch.no_grad():
            obs_tensor = {
                k: torch.as_tensor(v).unsqueeze(0).to(model.device) 
                for k, v in obs.items()
            }
            distribution = model.policy.get_distribution(obs_tensor)
            probs = distribution.distribution.probs.cpu().numpy()[0].tolist()
    else:
        ai_code = 3
        probs = [0.05, 0.10, 0.15, 0.65, 0.05]

    return PredictResponse(
        ai_action_code=ai_code,
        action_probabilities=probs,
        loaded_model_path=MODEL_PATH if model else "Fallback",
        obs_tensor_shapes={
            "spatial": list(obs["spatial"].shape),
            "vector": list(obs["vector"].shape)
        }
    )