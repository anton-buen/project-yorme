"""
YORME-TRICS Backend API

FastAPI server providing AI-powered class suspension predictions for Manila LGU.
Uses a PPO-trained reinforcement learning model with real-time PAGASA radar integration.

Main Dependencies:
    - FastAPI: REST API framework
    - PyTorch & Stable-Baselines3: RL model inference
    - Custom LguSuspensionEnv: Gymnasium environment for suspension decisions
"""

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

MODEL_PATH = "models/ppo_yorme_agent.zip"
model = None
data_pipeline = ManilaDataPipeline()

async def refresh_radar_cache_loop():
    """
    Background task that refreshes PAGASA radar data every 5 minutes.
    
    Runs continuously to ensure the spatial tensor cache remains current
    without blocking API requests. Failures are logged but don't crash the server.
    """
    while True:
        try:
            data_pipeline._cached_radar = None
            _ = data_pipeline.fetch_radar_reflectivity()
            print("[BACKGROUND CACHE] Updated PAGASA Doppler radar tensor.")
        except Exception as e:
            print(f"[BACKGROUND CACHE] Warning: Radar refresh failed ({e})")
        
        await asyncio.sleep(300)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifecycle manager.
    
    Startup:
        - Loads PPO model weights from disk
        - Starts background radar refresh task
    
    Shutdown:
        - Cancels background tasks cleanly
    """
    global model
    if os.path.exists(MODEL_PATH):
        try:
            model = PPO.load(MODEL_PATH)
            print(f"[STARTUP] Successfully loaded PPO model from {MODEL_PATH}")
        except Exception as e:
            print(f"[STARTUP] Error loading PPO model: {e}")
    else:
        print("[STARTUP] Warning: PPO model weights not found. Using fallback heuristics.")

    fetch_task = asyncio.create_task(refresh_radar_cache_loop())
    
    yield
    
    fetch_task.cancel()

app = FastAPI(title="WALANG PASOK AI - Backend API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PredictRequest(BaseModel):
    """Request schema for AI prediction endpoint."""
    current_hour: float
    flood_active: bool
    pagasa_warning_red: bool


class PredictResponse(BaseModel):
    """Response schema containing AI decision and metadata."""
    ai_action_code: int
    action_probabilities: list[float]
    loaded_model_path: str
    obs_tensor_shapes: dict

@app.get("/api/health")
def health_check():
    """
    Health check endpoint.
    
    Returns:
        dict: Server status, model load state, and radar cache status
    """
    return {
        "status": "online",
        "model_loaded": model is not None,
        "radar_cached": data_pipeline._cached_radar is not None
    }


@app.get("/api/incidents")
def get_incidents():
    """
    Fetch historical incident data.
    
    Returns:
        list: Array of incident objects from incidents.json
        
    Raises:
        HTTPException: 404 if incidents.json not found
    """
    file_path = "data/incidents.json"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Incidents data not found")
    with open(file_path, "r") as f:
        return json.load(f)


@app.post("/api/predict", response_model=PredictResponse)
def get_prediction(req: PredictRequest):
    """
    AI prediction endpoint for class suspension decisions.
    
    Args:
        req: PredictRequest containing current_hour, flood_active, pagasa_warning_red
        
    Returns:
        PredictResponse: AI action code (0-4), probability distribution, and tensor metadata
        
    Action Codes:
        0: Status Quo (Normal operations)
        1: Shift to ADM/Online
        2: Suspend Basic Education
        3: Suspend All Levels
        4: Full LGU Lockdown
    """
    env = LguSuspensionEnv()
    env.reset()
    
    env.data_pipeline = data_pipeline
    env.current_hour = req.current_hour
    env._will_flood = req.flood_active
    env._has_pagasa_red_warning = req.pagasa_warning_red
    
    obs = env._get_obs()
    
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