#!/bin/bash
# Render startup script with dynamic port binding

PORT=${PORT:-8000}
echo "[START] Starting FastAPI server on 0.0.0.0:$PORT"
echo "[START] Working directory: $(pwd)"
echo "[START] Python version: $(python --version)"
echo "[START] Checking critical files..."

if [ -f "main.py" ]; then
    echo "[START] ✓ main.py found"
else
    echo "[START] ✗ main.py NOT FOUND"
    exit 1
fi

if [ -d "models" ]; then
    echo "[START] ✓ models/ directory found"
    if [ -f "models/ppo_yorme_agent.zip" ]; then
        echo "[START] ✓ PPO model found ($(stat -c%s models/ppo_yorme_agent.zip 2>/dev/null || stat -f%z models/ppo_yorme_agent.zip) bytes)"
    else
        echo "[START] ⚠ PPO model NOT found - will use fallback"
    fi
else
    echo "[START] ✗ models/ directory NOT FOUND"
fi

if [ -f "data/incidents.json" ]; then
    echo "[START] ✓ incidents.json found"
else
    echo "[START] ✗ incidents.json NOT FOUND"
    exit 1
fi

echo "[START] Launching uvicorn..."
exec uvicorn main:app --host 0.0.0.0 --port $PORT
