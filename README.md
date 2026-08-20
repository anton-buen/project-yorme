# YORME-TRICS

AI-powered class suspension decision support system for Manila LGU using Reinforcement Learning.

## Overview

YORME-TRICS provides predictive early suspension recommendations by analyzing:
- Real-time PAGASA weather radar data
- Historical flooding patterns  
- Commute density models
- PAGASA warning escalation protocols

The system uses a PPO (Proximal Policy Optimization) agent trained on historical 2024 incidents (Typhoon Carina, Habagat surge) to recommend suspension decisions before flooding impacts occur.

## Project Structure

```
├── backend/                 # FastAPI + PyTorch RL backend
│   ├── data/               # Historical incident data (JSON)
│   ├── models/             # Trained PPO model weights
│   ├── src/
│   │   ├── env.py          # Gymnasium RL environment
│   │   ├── data_fetcher.py # PAGASA radar integration
│   │   ├── rl_agent.py     # PPO training logic
│   │   └── cnn_encoder.py  # Spatial feature extraction
│   ├── main.py             # API server entry point
│   ├── evaluate.py         # Model evaluation script
│   └── requirements.txt
│
└── frontend/               # React + Vite dashboard
    ├── public/            # Static assets
    ├── src/
    │   ├── components/    # React components
    │   ├── types/         # TypeScript definitions
    │   ├── utils/         # API client
    │   └── App.tsx        # Main application
    ├── index.html
    ├── package.json
    └── vite.config.ts
```

## Quick Start

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Start API server
uvicorn main:app --host 0.0.0.0 --port 8000
```

API will be available at `http://localhost:8000`

### Frontend Setup

```bash
cd frontend
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

# Start development server
npm run dev
```

Dashboard will be available at `http://localhost:5173`

## API Endpoints

- `GET /api/health` - Server health check
- `GET /api/incidents` - Historical incident data
- `POST /api/predict` - AI prediction endpoint

## Deployment

### Backend (Render)
- Configured via `backend/Dockerfile`
- Auto-deploys from main branch
- Environment: Python 3.11, PyTorch CPU

### Frontend (Vercel)  
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_API_URL`

## Training the Model

```bash
cd backend
python src/rl_agent.py
```

This trains a PPO agent for 100k timesteps. Logs are saved to `logs/ppo_yorme_tensorboard/`.

## Technologies

**Backend:**
- FastAPI - REST API framework
- PyTorch - Deep learning
- Stable-Baselines3 - RL algorithms
- Gymnasium - Environment API

**Frontend:**
- React 19 - UI framework  
- Vite - Build tool
- TypeScript - Type safety
- Tailwind CSS - Styling
- Recharts - Data visualization

## License

This project is for academic purposes. Historical incident data sourced from NDRRMC and PAGASA public records.

## Acknowledgments

- PAGASA for weather data access
- NDRRMC for incident records
- Stable-Baselines3 team for RL infrastructure
