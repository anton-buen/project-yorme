# Yormetrics

[![Live Demo](https://img.shields.io/badge/Live_App-yormetrics.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://yormetrics.vercel.app)
[![API Status](https://img.shields.io/badge/API_Endpoint-Online-46E3B7?style=for-the-badge&logo=render&logoColor=black)](https://yorme-trics.onrender.com/api/incidents)

[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-EE4C2C?style=flat-square&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4%2B-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](https://opensource.org/licenses/MIT)

> **LGU-Grade Reinforcement Learning Decision Engine for Early Class Suspension Modeling in Metro Manila.**

🌐 **Live Application:** [yormetrics.vercel.app](https://yormetrics.vercel.app)  
**Inference REST API:** [yorme-trics.onrender.com/api/incidents](https://yorme-trics.onrender.com/api/incidents)

---

### The Problem: The Commute Decision Window

Evaluating severe weather in high-density urban zones like Metro Manila is an extraordinarily complex real-time decision problem for Local Government Units (LGUs). 

When weather evaluations are delayed past **05:30 AM**, hundreds of thousands of students, teachers, and workers are already en route or stranded at transit hubs. However, suspending too early based on false alarms carries a high administrative and economic penalty.

**Yormetrics** addresses this challenge by converting raw spatial weather telemetry into an automated, safety-first Reinforcement Learning (PPO) decision-support system.

---

### Key Capabilities

* **32×32 Spatial Radar Tensor Grid:** Converts PAGASA Doppler radar reflectivity ($\text{dBZ}$) and satellite feeds into a spatial matrix centered on Metro Manila ($14.5995^\circ\text{N}, 120.9842^\circ\text{E}$)—leveraging CNN feature extraction inspired by visual state processing in game AI.
* **Asymmetric Safety Reward Matrix:** Powered by a PyTorch Proximal Policy Optimization (PPO) agent trained over **200,000 timesteps** across 13 historical weather scenarios. Heavily penalizes false negatives (unannounced flooding during peak commutes) over false positives.
* **Temporal Scrubber & 05:30 AM Threshold:** Interactive timeline scrubber (03:00 AM – 12:00 PM) featuring a time-morphing SVG handle that dynamically transitions relative to the critical 05:30 AM LGU announcement window.
* **13 Historical Scenario Replays + Live Mode:** Real-time active weather API streaming alongside 13 calibrated historical replays (7 severe typhoon events + 6 dry/mild control days).
* **Interactive Spotlight Onboarding Tour:** Built-in step-by-step onboarding guide (`OnboardingTour.tsx`) demystifying spatial tensor grids, risk utility calculations, and policy escalation codes ($A0$–$A4$).

---

### Live Deployments

| Component | Platform | URL |
| :--- | :--- | :--- |
| **Frontend Web App** | Vercel | [https://yormetrics.vercel.app](https://yormetrics.vercel.app) |
| **Backend REST API** | Render | [https://yorme-trics.onrender.com](https://yorme-trics.onrender.com) |
| **Model Predictions Endpoint** | Render | `POST https://yorme-trics.onrender.com/api/predict` |

### System Architecture

Yormetrics is deployed as a decoupled, low-latency microservice architecture. The Vite-powered React frontend communicates with an asynchronous FastAPI inference engine serving PyTorch model weights.

```text
[ Browser / Client ]
       │
       ▼
[ React + TypeScript Frontend (Vercel) ]
   ├── TimelineScrubber Component (03:00 AM - 12:00 PM)
   ├── RadarCanvas (32x32 Spatial Tensor Renderer)
   ├── OnboardingTour (Spotlight Guide)
   └── RLMetricsDrawer & HeroCard State
       │
       │  HTTP / REST (Cache-Busted Fetch API)
       ▼
[ FastAPI Backend Engine (Render) ]
   ├── main.py (Uvicorn / CORS Middleware)
   ├── /api/incidents (13 Calibrated Historical Scenarios)
   └── /api/predict (Inference Pipeline)
       │
       ▼
[ PyTorch RL Policy Engine ]
   ├── ppo_yorme_agent.zip (200k Timesteps Stable-Baselines3 Model)
   └── 4x32x32 Spatial CNN Encoder (dBZ Tensors + Station Feeds)

```

---

### AI Policy Action Tiers ($A0$ – $A4$)

The PPO policy network maps spatial observation vectors $O_t$ to five discrete action tiers:

| Action Code | Policy Recommendation | Trigger Condition & Risk Math |
| --- | --- | --- |
| **$A0$** | **Normal Operations (Status Quo)** | Low radar reflectivity ($\le 15\text{ dBZ}$); clear or dry conditions across watershed. |
| **$A1$** | **Online / Asynchronous Classes** | Isolated localized rain clusters; light urban flooding risk. |
| **$A2$** | **Suspend Basic Education** | Moderate precipitation rate ($15\text{--}30\text{ mm/hr}$) approaching the 05:30 AM window. |
| **$A3$** | **Suspend All Levels (Basic Ed + Tertiary)** | High spatial dBZ density covering neighboring LGUs; high commuter risk. |
| **$A4$** | **Full Emergency Lockdown (Schools + City Govt)** | Severe eyewall vectors ($\ge 45\text{ dBZ}$) coinciding with peak morning commute windows. |

---

### Tech Stack

| Domain | Technology | Role |
| --- | --- | --- |
| **Frontend UI** | React 18, TypeScript, Tailwind CSS | Responsive 2×2 command center UI, interactive radar canvas, dynamic SVG morphing. |
| **Iconography & Styling** | Lucide React, Tailwind Animate | UI indicators, live pulsing badges, telemetry status displays. |
| **Backend Service** | FastAPI, Uvicorn, Pydantic | Low-latency inference endpoints, path-bound JSON data streaming. |
| **Machine Learning** | PyTorch, Stable-Baselines3, NumPy | Custom CNN spatial encoder, PPO policy network, reward matrix training. |
| **Infrastructure** | Vercel (Frontend), Render (Backend) | Global edge distribution, auto-building containerized web service. |

---

### Repository Structure

```text
yormetrics/
├── backend/
│   ├── main.py                     # FastAPI application entrypoint & routing
│   ├── ppo_yorme_agent.zip         # Trained PyTorch PPO model weights
│   ├── incidents.json              # 13 Historical weather & control scenarios
│   └── requirements.txt            # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx          # System navigation & scenario selection
│   │   │   ├── HeroCard.tsx        # AI recommendation display & confidence score
│   │   │   ├── RadarCanvas.tsx     # 32x32 spatial dBZ canvas renderer
│   │   │   ├── TimelineScrubber.tsx# Time-morphing SVG slider (03:00 AM - 12:00 PM)
│   │   │   └── OnboardingTour.tsx  # Step-by-step spotlight tutorial overlay
│   │   ├── App.tsx                 # Core application state & API fetcher
│   │   └── main.tsx                # React DOM entrypoint
│   └── package.json
└── README.md

```

---

### Quickstart & Local Development

#### Prerequisites

* **Node.js** v18.0 or higher
* **Python** 3.10 or higher

#### 1. Backend Setup (FastAPI + PyTorch)

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start local FastAPI server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

```

*The API server will run at `http://localhost:8000`.*

#### 2. Frontend Setup (React + Vite)

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Configure environment variable
echo "VITE_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev

```

*Access the interactive web app at `http://localhost:5173`.*

---

### Personal & Institutional Non-Affiliation Disclaimer

**Notice of Independent Endeavor:** Yormetrics is an independent, non-commercial side project created solely for personal learning, educational exploration, and experimental technology demonstration.

* **No Government Affiliation:** The developer is **not** affiliated, associated, authorized, endorsed by, or in any way officially connected with the City Government of Manila, the Manila Disaster Risk Reduction and Management Office (MDRRMO), PAGASA, the Department of Education (DepEd), or any other government agency or public authority in the Philippines.
* **No Institutional Endorsement:** The research, data visualizations, and predictive models presented in this project are strictly those of the individual creator. They **do not** represent or reflect the official views, policies, or positions of any university, employer, or academic institution associated with the developer.
* **Educational "As-Is" Status:** All code, predictions, and spatial visualizations are provided on an "as-is" basis for experimental demonstration without warranties of fitness for public safety decision-making.

---

### Author & License

* **Author:** Antonio III Buenafe ([GitHub](https://github.com/anton-buen) | [LinkedIn](www.linkedin.com/in/antonio-buenafe))
* **License:** Distributed under the [MIT License](https://opensource.org/licenses/MIT?utm_source=gemini).
