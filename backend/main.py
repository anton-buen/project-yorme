import os
import json
import torch
import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from stable_baselines3 import PPO

from src.env import LguSuspensionEnv

# --- API CONFIGURATION ---
app = FastAPI(title="WALANG PASOK AI - Backend API")

# Allow the frontend (Vite/React) to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GLOBAL MODEL CACHE ---
MODEL_PATH = "models/ppo_yorme_agent.zip"
model = None

@app.on_event("startup")
def load_model():
    global model
    if os.path.exists(MODEL_PATH):
        try:
            model = PPO.load(MODEL_PATH)
            print(f"Successfully loaded PPO model from {MODEL_PATH}")
        except Exception as e:
            print(f"Error loading model: {e}")
    else:
        print("Warning: PPO model weights not found. Using fallback heuristics.")

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

# --- ENDPOINTS ---
@app.get("/api/health")
def health_check():
    return {"status": "online", "model_loaded": model is not None}

@app.get("/api/incidents")
def get_incidents():
    file_path = "data/incidents.json"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Incidents data not found")
    with open(file_path, "r") as f:
        return json.load(f)

@app.get("/api/cctv")
def get_cctv_feeds():
    file_path = "data/cctv_feeds.json"
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="CCTV data not found")
    with open(file_path, "r") as f:
        return json.load(f)

@app.post("/api/predict", response_model=PredictResponse)
def get_prediction(req: PredictRequest):
    # 1. Initialize environment temporarily to construct the correct state
    env = LguSuspensionEnv()
    env.reset()
    
    # Override environment with request state
    env.current_hour = req.current_hour
    env._will_flood = req.flood_active
    env._has_pagasa_red_warning = req.pagasa_warning_red
    
    # Generate the observation tensor (this triggers the DataFetcher)
    obs = env._get_obs()
    
    # 2. Run Inference
    if model:
        action, _ = model.predict(obs, deterministic=True)
        ai_code = int(action)
        
        # Extract probabilities
        with torch.no_grad():
            obs_tensor = {
                k: torch.as_tensor(v).unsqueeze(0).to(model.device) 
                for k, v in obs.items()
            }
            distribution = model.policy.get_distribution(obs_tensor)
            probs = distribution.distribution.probs.cpu().numpy()[0].tolist()
    else:
        # Fallback if model is missing
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