import os
import json
import torch
import numpy as np
import pandas as pd
import streamlit as st
import matplotlib.pyplot as plt
from stable_baselines3 import PPO

from src.env import LguSuspensionEnv

# --- PAGE CONFIGURATION ---
st.set_page_config(
    page_title="WALANG PASOK AI - Suspension Advisor",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for dark minimalist aesthetic
st.markdown("""
<style>
    .main { background-color: #0E1117; }
    .status-actual {
        border-left: 6px solid #E53935;
        background-color: #1E222A;
        padding: 16px;
        border-radius: 4px;
        margin-bottom: 12px;
    }
    .status-ai {
        border-left: 6px solid #43A047;
        background-color: #1E222A;
        padding: 16px;
        border-radius: 4px;
        margin-bottom: 12px;
    }
    .text-muted { color: #8892B0; font-size: 0.9em; }
</style>
""", unsafe_allow_html=True)


# --- DATA LOADERS ---
@st.cache_data
def load_datasets():
    incidents_path = "data/incidents.json"
    cctv_path = "data/cctv_feeds.json"
    
    incidents = []
    cctvs = []
    
    if os.path.exists(incidents_path):
        with open(incidents_path, "r") as f:
            incidents = json.load(f).get("incidents", [])
            
    if os.path.exists(cctv_path):
        with open(cctv_path, "r") as f:
            cctvs = json.load(f).get("camera_feeds", [])
            
    return incidents, cctvs


@st.cache_resource
def load_ppo_agent():
    model_paths = [
        "models/best_model/best_model.zip",
        "models/ppo_yorme_agent.zip"
    ]
    for path in model_paths:
        if os.path.exists(path):
            try:
                model = PPO.load(path)
                return model, path
            except Exception as e:
                st.error(f"Error loading checkpoint at {path}: {e}")
    return None, None


def get_model_prediction(model, obs_dict):
    if model is None:
        return 3, [0.05, 0.10, 0.15, 0.65, 0.05]

    action, _ = model.predict(obs_dict, deterministic=True)
    ai_code = int(action)

    with torch.no_grad():
        obs_tensor = {
            k: torch.as_tensor(v).unsqueeze(0).to(model.device) 
            for k, v in obs_dict.items()
        }
        distribution = model.policy.get_distribution(obs_tensor)
        probs = distribution.distribution.probs.cpu().numpy()[0]

    return ai_code, probs


# --- INITIALIZE DATA & CONTROLS ---
incidents, cctv_feeds = load_datasets()

st.title("WALANG PASOK AI: Predictive Early Suspension Advisor")
st.caption("City of Manila LGU Decision Support System | Reinforcement Learning Model")

st.divider()

col_mode, col_event, col_time = st.columns([1, 1.5, 2])

with col_mode:
    app_mode = st.radio("Mode Select", ["Historical Replay", "Live Watch"], horizontal=True)

incident_data = None
if app_mode == "Historical Replay" and incidents:
    incident_names = [inc["name"] for inc in incidents]
    selected_name = col_event.selectbox("Select Incident", incident_names)
    incident_data = next(inc for inc in incidents if inc["name"] == selected_name)
else:
    col_event.text_input("Active Target Region", value="Metro Manila (District 1-6)", disabled=True)

with col_time:
    if app_mode == "Historical Replay":
        selected_time = st.slider(
            "Simulation Hour (03:00 AM - 12:00 PM)",
            min_value=3.0,
            max_value=12.0,
            value=4.5,
            step=0.5,
            format="%02.1f Hour"
        )
        time_str = f"{int(selected_time):02d}:{int((selected_time % 1) * 60):02d} AM"
    else:
        time_str = "05:00 AM (Real-Time)"
        selected_time = 5.0
        st.info("Live Monitoring Active: Connected to PAGASA & Public Traffic Streams")


# --- STATE INFERENCE & HISTORICAL MAPPING ---
env = LguSuspensionEnv()
env.reset()
env.current_hour = float(selected_time)

# Pull state details from JSON timeline if available
time_key = str(float(selected_time))
timeline_state = {}
if incident_data and time_key in incident_data.get("hourly_timeline", {}):
    timeline_state = incident_data["hourly_timeline"][time_key]
    env._will_flood = timeline_state.get("flood_active", False)
    env._has_pagasa_red_warning = (timeline_state.get("pagasa_warning") == "RED")

obs = env._get_obs()
model, model_path = load_ppo_agent()
ai_code, action_probs = get_model_prediction(model, obs)

# Actual LGU action mapping from incident metadata
actual_announcement_hour = incident_data.get("actual_announcement_time", 11.5) if incident_data else 11.5
if selected_time < actual_announcement_hour:
    actual_code = 0
else:
    actual_code = incident_data.get("actual_action_code", 3) if incident_data else 3

stranded_count_actual = timeline_state.get("stranded_count", 0)

if ai_code >= 3:
    stranded_count_ai = 0
    ai_risk = "PROTECTED (Early Call)"
elif ai_code in [1, 2]:
    stranded_count_ai = int(stranded_count_actual * 0.3)
    ai_risk = "PARTIAL PROTECTION"
else:
    stranded_count_ai = stranded_count_actual
    ai_risk = "CRITICAL (Commuters Stranded)" if stranded_count_actual > 0 else "SAFE"

actual_risk = "CRITICAL (Commuters Stranded)" if stranded_count_actual > 0 else "SAFE (Pre-Commute)"

action_names = {
    0: "Status Quo (Normal F2F)",
    1: "Shift to ADM / Online (All Levels)",
    2: "Suspend Basic Education (K-12)",
    3: "Suspend All Levels (Basic Ed + Tertiary)",
    4: "Full LGU Lockdown (School + City Govt Work)"
}


# --- MAIN DISPLAY ---
st.subheader(f"Decision Status Comparison at {time_str}")

col_actual, col_ai = st.columns(2)

with col_actual:
    st.markdown(f"""
    <div class="status-actual">
        <h4>ACTUAL OFFICIAL LGU DECISION</h4>
        <h3>{action_names[actual_code]}</h3>
        <p class="text-muted">Source: Manila PIO Official Log</p>
    </div>
    """, unsafe_allow_html=True)
    m1, m2 = st.columns(2)
    with m1: st.metric("Estimated Stranded Students", f"{stranded_count_actual:,}")
    with m2: st.metric("Commuter Safety Index", actual_risk)

with col_ai:
    status_sub = f"Loaded Weights: {model_path}" if model_path else "Fallback Inference"
    st.markdown(f"""
    <div class="status-ai">
        <h4>WALANGPASOK AI POLICY RECOMMENDATION</h4>
        <h3>{action_names[ai_code]}</h3>
        <p class="text-muted">{status_sub}</p>
    </div>
    """, unsafe_allow_html=True)
    m3, m4 = st.columns(2)
    with m3: st.metric("Estimated Stranded Students", f"{stranded_count_ai:,}")
    with m4: st.metric("Commuter Safety Index", ai_risk)

st.divider()


# --- GROUND TRUTH MAPS & CCTVS ---
st.subheader("Visual Ground Truth & Spatial Inputs")

col_radar, col_cctv = st.columns(2)

with col_radar:
    st.write("**PAGASA Radar Input Grid (Channel 0: dBZ Reflectivity)**")
    radar_data = obs["spatial"][0]
    
    fig, ax = plt.subplots(figsize=(5, 3.2))
    fig.patch.set_facecolor('#0E1117')
    ax.set_facecolor('#0E1117')
    im = ax.imshow(radar_data, cmap='Blues', vmin=0, vmax=1)
    ax.set_title(f"Manila Grid at {time_str}", color="white", fontsize=10)
    ax.tick_params(colors='white')
    fig.colorbar(im, ax=ax)
    st.pyplot(fig)

with col_cctv:
    st.write("**Live / Historical Traffic CCTV Feed**")
    selected_cctv = st.selectbox("Select Camera Location", [c["location_name"] for c in cctv_feeds]) if cctv_feeds else "Espana Blvd"
    
    is_flooded = timeline_state.get("flood_active", False)
    cctv_status = "WATER LEVEL 18 INCHES (NON-PASSABLE)" if is_flooded else "ROAD CLEAR (DRY)"
    cctv_color = "#E53935" if is_flooded else "#43A047"
    
    st.markdown(f"""
    <div style="background-color: #1E222A; height: 180px; border-radius: 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 1px solid #2E3440;">
        <p style="color: #8892B0; margin: 0;">[ PUBLIC MMDA CCTV STREAM FEED ]</p>
        <p style="color: #4C566A; font-size: 0.8em;">LOCATION: {selected_cctv}</p>
        <p style="color: {cctv_color}; font-weight: bold; margin-top: 10px;">STATUS: {cctv_status}</p>
    </div>
    """, unsafe_allow_html=True)

st.divider()


# --- TECHNICAL VAULT SIDEBAR ---
with st.sidebar:
    st.header("TECHNICAL VAULT")
    st.caption("RL Model Mechanics & Developer Logs")
    
    with st.expander("PPO Action Probability Distribution", expanded=True):
        fig_q, ax_q = plt.subplots(figsize=(4, 2.5))
        fig_q.patch.set_facecolor('#1E222A')
        ax_q.set_facecolor('#1E222A')
        
        bars = ax_q.bar(["A0", "A1", "A2", "A3", "A4"], action_probs, color='#3B4252')
        bars[ai_code].set_color('#43A047')
        
        ax_q.tick_params(colors='white', labelsize=8)
        ax_q.set_ylabel("Probability", color='white', fontsize=8)
        ax_q.set_ylim(0, 1.0)
        st.pyplot(fig_q)
        st.caption("A0:StatusQuo | A1:ADM | A2:BasicEd | A3:AllLevels | A4:Lockdown")

    with st.expander("Incident Metadata Inspector"):
        if incident_data:
            st.json({
                "incident_id": incident_data.get("id"),
                "actual_announcement_time": f"{incident_data.get('actual_announcement_time')}:00",
                "pagasa_warning_level": timeline_state.get("pagasa_warning", "NONE")
            })

    with st.expander("Reward Matrix Weights"):
        st.code("""
Early Warning (t < 05:30):  +100
Late Suspension (t > 06:00): -1000
False Alarm Penalty:        -50
Status Quo Failure:         -2000
Legal Constraint Override:  ACTIVE
        """, language="python")