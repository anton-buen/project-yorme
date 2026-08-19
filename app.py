import streamlit as st
import numpy as np
import matplotlib.pyplot as plt
import pandas as pd

# --- PAGE CONFIGURATION ---
st.set_page_config(
    page_title="WALANG PASOK AI - Suspension Advisor",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
    .main {
        background-color: #0E1117;
    }
    .metric-card {
        background-color: #1E222A;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #2E3440;
    }
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
    .text-critical { color: #E53935; font-weight: bold; }
    .text-safe { color: #43A047; font-weight: bold; }
    .text-warning { color: #FB8C00; font-weight: bold; }
    .text-muted { color: #8892B0; font-size: 0.9em; }
</style>
""", unsafe_allow_dict=True)


# --- DUMMY DATA GENERATOR FOR HISTORICAL & RADAR ---
def generate_radar_matrix(intensity_level):
    """Generates a 32x32 synthetic radar tensor grid for display."""
    np.random.seed(int(intensity_level * 10))
    grid = np.random.uniform(0.0, 0.3, (32, 32))
    if intensity_level > 2:
        # Generate heavy storm core
        x, y = np.ogrid[:32, :32]
        center_x, center_y = 16, 16
        mask = (x - center_x)**2 + (y - center_y)**2 <= (intensity_level * 3)**2
        grid[mask] += np.random.uniform(0.5, 0.7, np.count_nonzero(mask))
    return np.clip(grid, 0.0, 1.0)


# --- HEADER & TOP CONTROL BAR ---
st.title("WALANG PASOK AI: Predictive Early Suspension Advisor")
st.caption("City of Manila LGU Decision Support System | Reinforcement Learning Model")

st.divider()

col_mode, col_event, col_time = st.columns([1, 1.5, 2])

with col_mode:
    app_mode = st.radio(
        "Mode Select",
        ["Historical Replay", "Live Watch"],
        horizontal=True
    )

with col_event:
    if app_mode == "Historical Replay":
        selected_event = st.selectbox(
            "Select Incident",
            [
                "August 2024 Monsoon / U-Belt Flood",
                "Typhoon Carina (July 2024)",
                "Typhoon Ulysses Historical Case"
            ]
        )
    else:
        st.text_input("Active Target Region", value="Metro Manila (District 1-6)", disabled=True)

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


# --- SIMULATION STATE MAPPING ---
# action: 0=Status Quo, 1=ADM/Online, 2=Basic Ed, 3=All Levels,4=Full Lockdown
if selected_time < 5.0:
    actual_code = 0
    ai_code = 3
    stranded_count_actual = 0
    stranded_count_ai = 0
    actual_risk = "SAFE (Pre-Commute)"
    ai_risk = "PROTECTED (Early Call)"
elif selected_time < 11.5:
    actual_code = 0
    ai_code = 3
    stranded_count_actual = int((selected_time - 5.0) * 800)
    stranded_count_ai = 0
    actual_risk = "CRITICAL (Commuters Stranded)"
    ai_risk = "PREEMPTED (Safe at Home)"
else:
    actual_code = 3  #late suspension issued 11:30 am
    ai_code = 3
    stranded_count_actual = 5200
    stranded_count_ai = 0
    actual_risk = "HIGH INJURY/STRANDED RISK"
    ai_risk = "SAFE"

action_names = {
    0: "Status Quo (Normal F2F)",
    1: "Shift to ADM / Online (All Levels)",
    2: "Suspend Basic Education (K-12)",
    3: "Suspend All Levels (Basic Ed + Tertiary)",
    4: "Full LGU Lockdown (School + City Govt Work)"
}


# --- MAIN VIEW: SIDE-BY-SIDE DECISION---
st.subheader(f"Decision Status Comparison at {time_str}")

col_actual, col_ai = st.columns(2)

with col_actual:
    st.markdown(f"""
    <div class="status-actual">
        <h4>ACTUAL OFFICIAL LGU DECISION</h4>
        <h3>{action_names[actual_code]}</h3>
        <p class="text-muted">Source: Manila PIO Official Log</p>
    </div>
    """, unsafe_allow_dict=True)
    
    m1, m2 = st.columns(2)
    with m1:
        st.metric("Estimated Stranded Students", f"{stranded_count_actual:,}")
    with m2:
        st.metric("Commuter Safety Index", actual_risk)

with col_ai:
    st.markdown(f"""
    <div class="status-ai">
        <h4>WALANGPASOK AI POLICY RECOMMENDATION</h4>
        <h3>{action_names[ai_code]}</h3>
        <p class="text-muted">Model Confidence: 92.4% | Lead Time: 6.5 Hours</p>
    </div>
    """, unsafe_allow_dict=True)
    
    m3, m4 = st.columns(2)
    with m3:
        st.metric("Estimated Stranded Students", f"{stranded_count_ai:,}")
    with m4:
        st.metric("Commuter Safety Index", ai_risk)

st.divider()


# --- VISUAL GROUND TRUTH SECTION ---
st.subheader("Visual Ground Truth & Spatial Inputs")

col_radar, col_cctv = st.columns(2)

with col_radar:
    st.write("**PAGASA Radar Input Grid (32x32 Channel 0)**")
    radar_data = generate_radar_matrix(selected_time)
    
    fig, ax = plt.subplots(figsize=(5, 3.5))
    fig.patch.set_facecolor('#0E1117')
    ax.set_facecolor('#0E1117')
    im = ax.imshow(radar_data, cmap='Blues', vmin=0, vmax=1)
    ax.set_title("Local Manila dBZ Reflectivity", color="white", fontsize=10)
    ax.tick_params(colors='white')
    fig.colorbar(im, ax=ax)
    st.pyplot(fig)

with col_cctv:
    st.write("**Live / Historical Traffic CCTV Feed (Espana Blvd / U-Belt)**")
    # Placeholder container - public video feed 
    st.markdown("""
    <div style="background-color: #1E222A; height: 215px; border-radius: 8px; display: flex; flex-direction: column; justify-content: center; align-items: center; border: 1px solid #2E3440;">
        <p style="color: #8892B0; margin: 0;">[ PUBLIC CCTV STREAM FEED ]</p>
        <p style="color: #4C566A; font-size: 0.8em;">LOCATION: Espana Blvd cor. Lacson Ave</p>
        <p style="color: #E53935; font-weight: bold; margin-top: 10px;">STATUS: WATER LEVEL 18 INCHES (NON-PASSABLE)</p>
    </div>
    """, unsafe_allow_dict=True)

st.divider()


# --- SIDEBARR ---
with st.sidebar:
    st.header("TECHNICAL VAULT")
    st.caption("RL Model Mechanics & Developer Logs")
    
    st.subheader("Mayor Policy Bias Tuning")
    bias_setting = st.select_slider(
        "Reward Function Policy Bias",
        options=["Strict (Avoid False Alarms)", "Balanced", "Protective (Zero Stranded)"],
        value="Balanced"
    )
    
    st.divider()
    
    with st.expander("PPO Action Q-Value Distribution", expanded=True):
        q_vals = [0.05, 0.12, 0.18, 0.92, 0.10]
        fig_q, ax_q = plt.subplots(figsize=(4, 2.5))
        fig_q.patch.set_facecolor('#1E222A')
        ax_q.set_facecolor('#1E222A')
        
        bars = ax_q.bar(["A0", "A1", "A2", "A3", "A4"], q_vals, color='#43A047')
        bars[3].set_color('#00E676')  #winning action
        
        ax_q.tick_params(colors='white', labelsize=8)
        ax_q.set_ylabel("Probability", color='white', fontsize=8)
        st.pyplot(fig_q)
        st.caption("A0:StatusQuo | A1:ADM | A2:BasicEd | A3:AllLevels | A4:Lockdown")

    with st.expander("CNN Tensor Channel Inspector"):
        st.text("Input Tensor Shape: (4, 32, 32)")
        st.text("Channel 0: Manila Reflectivity")
        st.text("Channel 1: Regional Vector Map")
        st.text("Channel 2: Elevation Vulnerability")
        st.text("Channel 3: MCDRRMO Risk Index")

    with st.expander("Reward Matrix Weights"):
        st.code("""
Early Warning (t < 05:30):  +100
Late Suspension (t > 06:00): -1000
False Alarm Penalty:        -50
Status Quo Failure:         -2000
Legal Constraint Override:  ACTIVE
        """, language="python")

    with st.expander("PPO Training Convergence"):
        st.text("Policy Loss (L_pi): 0.014")
        st.text("Value Loss (L_v):   0.082")
        st.text("Total Timesteps:    500,000")