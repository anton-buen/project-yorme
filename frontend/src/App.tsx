// @ts-ignore — keep this file type-checkable until @types/react is installed.
import { useState, useRef, useEffect } from "react";
import { ChevronDown, BarChart2, AlertCircle, Loader2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip as ReTooltip,
} from "recharts";

// API imports
import { fetchIncidents, getPrediction, checkApiHealth, ApiError } from './utils/api';
import type { IncidentData, PredictionResponse, ActionCode } from './types/dashboard';
import { ACTION_NAMES } from './types/dashboard';

// ─── Design tokens ────────────────────────────────────────────────────────────

const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const SANS: React.CSSProperties  = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties  = { fontFamily: "'JetBrains Mono', monospace" };

const TERRA = {
  text: "#9A4B2F", bg: "#FDF4F0", border: "#E8C2AE", line: "#C2745A",
};
const SAGE = {
  text: "#3A7050", bg: "#EEF5F0", border: "#AECBB7", line: "#6B9E7A",
};

const selectStyle: React.CSSProperties = {
  background: "#EFEDE9",
  border: "1px solid #E2E0DC",
  appearance: "none",
  WebkitAppearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2378716C' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 12px center",
  paddingRight: 28,
  ...SANS,
};

// ─── Types ────────────────────────────────────────────────────────────────────

type PagasaLevel   = "NONE" | "YELLOW" | "ORANGE" | "RED";
type BiasMode      = "strict" | "balanced" | "protective";
type DashboardMode = "historical" | "live";

const ACTION_SHORT: Record<ActionCode, string> = {
  0: "A0 — Status Quo",
  1: "A1 — Shift to ADM",
  2: "A2 — Suspend Basic Ed",
  3: "A3 — Suspend All Levels",
  4: "A4 — Full Lockdown",
};

// ─── Hour steps 03:00 – 12:00 in 30-min intervals ────────────────────────────

interface HourStep { label: string; hour: number; minute: number }

const HOUR_STEPS: HourStep[] = Array.from({ length: 19 }, (_, i) => {
  const total = 3 * 60 + i * 30;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return {
    label: `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`,
    hour: h, minute: m,
  };
});

// ─── Loading States ────────────────────────────────────────────────────────────

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  stage: 'health' | 'incidents' | 'complete';
}

// ─── AI Prediction Cache ────────────────────────────────────────────────────────

interface PredictionCache {
  [key: string]: PredictionResponse;
}

// ─── Live Weather Component ────────────────────────────────────────────────────

function LiveWeatherRadar() {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4" style={SERIF}>
        Live Meteorological Radar
      </h3>
      
      <div className="relative w-full h-80 rounded-lg overflow-hidden border border-gray-200">
        <iframe
          src="https://embed.windy.com/embed2.html?lat=14.5995&lon=120.9842&detailLat=14.5995&detailLon=120.9842&width=650&height=450&zoom=10&level=surface&overlay=rain&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1"
          className="w-full h-full"
          frameBorder="0"
          title="Live Weather Radar - Metro Manila"
          style={{
            border: 'none',
            backgroundColor: '#f8fafc'
          }}
        />
      </div>
      
      <div className="mt-4 text-sm text-gray-600" style={SANS}>
        <p>Real-time precipitation data over Metro Manila from Windy.com</p>
        <p className="text-xs mt-1 text-gray-500">
          Data sourced from ECMWF weather models • Updates every hour
        </p>
      </div>
    </div>
  );
}

// ─── Chart Data Helpers ────────────────────────────────────────────────────────

function getChartData(probabilities: number[]): Array<{ name: string; value: number; color: string }> {
  const colors = ["#A3A3A3", "#F59E0B", "#EF4444", "#DC2626", "#7F1D1D"];
  
  return probabilities.map((prob, idx) => ({
    name: ACTION_SHORT[idx as ActionCode] || `A${idx}`,
    value: Math.round(prob * 100),
    color: colors[idx] || "#A3A3A3",
  }));
}

// ─── Loading Screen Component ────────────────────────────────────────────────

function LoadingScreen({ stage, error }: { stage: string; error: string | null }) {
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="mx-auto mb-4 w-16 h-16 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4" style={SERIF}>
            Backend Unreachable
          </h2>
          <p className="text-gray-600 mb-6" style={SANS}>
            The YORME-TRICS AI engine is currently unavailable. This may be due to:
          </p>
          <ul className="text-left text-gray-600 mb-6 space-y-2" style={SANS}>
            <li>• Server cold start (up to 50 seconds on free tier)</li>
            <li>• Network connectivity issues</li>
            <li>• Backend maintenance</li>
          </ul>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
            <p className="text-red-800 text-sm" style={MONO}>
              {error}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            style={SANS}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const stageMessages = {
    health: "Checking AI Engine Status...",
    incidents: "Loading Historical Incidents...",
    complete: "Initializing Dashboard...",
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <Loader2 className="mx-auto mb-6 w-16 h-16 text-blue-600 animate-spin" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4" style={SERIF}>
          Waking up AI Engine...
        </h2>
        <p className="text-xl text-gray-600 mb-8" style={SANS}>
          {stageMessages[stage as keyof typeof stageMessages] || "Initializing..."}
        </p>
        <div className="w-64 mx-auto bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
            style={{
              width: stage === 'health' ? '33%' : 
                     stage === 'incidents' ? '66%' : '100%'
            }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-4" style={SANS}>
          Initial requests may take up to 50 seconds due to cold start
        </p>
      </div>
    </div>
  );
}

// ─── Main App Component ────────────────────────────────────────────────────────

export default function App() {
  // ─── State Management ────────────────────────────────────────────────────────

  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: true,
    error: null,
    stage: 'health'
  });

  const [incidents, setIncidents] = useState<IncidentData[]>([]);
  const [predictionCache, setPredictionCache] = useState<PredictionCache>({});

  const [incidentIdx, setIncidentIdx] = useState(0);
  const [step, setStep] = useState(7);
  const [mode, setMode] = useState<DashboardMode>("historical");
  const [bias, setBias] = useState<BiasMode>("balanced");

  const [currentPrediction, setCurrentPrediction] = useState<PredictionResponse | null>(null);

  // ─── Data Initialization ─────────────────────────────────────────────────────

  useEffect(() => {
    async function initializeApp() {
      try {
        // Stage 1: Health check
        setLoadingState(prev => ({ ...prev, stage: 'health' }));
        await checkApiHealth();

        // Stage 2: Load incidents
        setLoadingState(prev => ({ ...prev, stage: 'incidents' }));
        const incidentsData = await fetchIncidents();
        setIncidents(incidentsData);

        // Stage 3: Complete
        setLoadingState(prev => ({ ...prev, stage: 'complete' }));
        
        // Small delay to show completion
        await new Promise(resolve => setTimeout(resolve, 500));

        setLoadingState({ isLoading: false, error: null, stage: 'complete' });

      } catch (error) {
        const errorMessage = error instanceof ApiError 
          ? error.message 
          : 'Unknown error occurred while initializing the application';
        
        setLoadingState({
          isLoading: false,
          error: errorMessage,
          stage: 'health'
        });
      }
    }

    initializeApp();
  }, []);

  // ─── AI Prediction Fetching ──────────────────────────────────────────────────

  useEffect(() => {
    if (loadingState.isLoading || loadingState.error || incidents.length === 0) {
      return;
    }

    async function fetchPrediction() {
      const currentIncident = incidents[incidentIdx];
      if (!currentIncident) return;

      const currentHour = HOUR_STEPS[step]?.hour + (HOUR_STEPS[step]?.minute || 0) / 60;
      const timelineKey = currentHour.toString();
      const timeline = currentIncident.hourly_timeline[timelineKey];

      if (!timeline) return;

      const cacheKey = `${incidentIdx}-${step}-${mode}-${bias}`;
      
      if (predictionCache[cacheKey]) {
        setCurrentPrediction(predictionCache[cacheKey]);
        return;
      }

      try {
        const request = {
          current_hour: currentHour,
          flood_active: timeline.flood_active,
          pagasa_warning_red: timeline.pagasa_warning === "RED",
        };

        const prediction = await getPrediction(request);
        
        setPredictionCache(prev => ({
          ...prev,
          [cacheKey]: prediction
        }));
        
        setCurrentPrediction(prediction);

      } catch (error) {
        console.error('Failed to fetch prediction:', error);
        // Don't show error to user for prediction failures, just log it
      }
    }

    fetchPrediction();
  }, [incidentIdx, step, mode, bias, incidents, loadingState, predictionCache]);

  // ─── Helper Functions ─────────────────────────────────────────────────────────

  const currentIncident = incidents[incidentIdx];
  const currentHour = mode === "live" ? new Date().getHours() + new Date().getMinutes() / 60 : 
                      HOUR_STEPS[step]?.hour + (HOUR_STEPS[step]?.minute || 0) / 60;
  const timelineKey = currentHour.toString();
  const currentTimeline = currentIncident?.hourly_timeline[timelineKey];

  const getPagasaColor = (level: PagasaLevel): string => {
    switch (level) {
      case "NONE": return "#A3A3A3";
      case "YELLOW": return "#F59E0B";
      case "ORANGE": return "#EF4444";
      case "RED": return "#DC2626";
      default: return "#A3A3A3";
    }
  };

  // ─── Show loading screen while initializing ──────────────────────────────────

  if (loadingState.isLoading || loadingState.error) {
    return <LoadingScreen stage={loadingState.stage} error={loadingState.error} />;
  }

  // Ensure we have data before rendering
  if (incidents.length === 0) {
    return <LoadingScreen stage="complete" error="No incidents data available from backend" />;
  }

  // ─── Main Dashboard UI ───────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={SERIF}>
            YORME-TRICS
          </h1>
          <p className="text-gray-600" style={SANS}>
            AI-Powered Class Suspension Decision Support System for Manila LGU
          </p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2" style={SANS}>
              Dashboard Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as DashboardMode)}
              className="w-full px-3 py-2 rounded-md text-sm"
              style={selectStyle}
            >
              <option value="historical">Historical Analysis</option>
              <option value="live">Live Watch Mode</option>
            </select>
          </div>

          {mode === "historical" && (
            <>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2" style={SANS}>
                  Historical Incident
                </label>
                <select
                  value={incidentIdx}
                  onChange={(e) => setIncidentIdx(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={selectStyle}
                >
                  {incidents.map((incident, idx) => (
                    <option key={incident.id} value={idx}>
                      {incident.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2" style={SANS}>
                  Time Step
                </label>
                <select
                  value={step}
                  onChange={(e) => setStep(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-md text-sm"
                  style={selectStyle}
                >
                  {HOUR_STEPS.map((hourStep, idx) => (
                    <option key={idx} value={idx}>
                      {hourStep.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {mode === "live" && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2" style={SANS}>
                Current Time
              </label>
              <div className="text-lg font-mono text-gray-900 py-2">
                {new Date().toLocaleTimeString('en-US', { 
                  timeZone: 'Asia/Manila',
                  hour12: true,
                  hour: '2-digit',
                  minute: '2-digit'
                })} MNL
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2" style={SANS}>
              AI Bias Mode
            </label>
            <select
              value={bias}
              onChange={(e) => setBias(e.target.value as BiasMode)}
              className="w-full px-3 py-2 rounded-md text-sm"
              style={selectStyle}
            >
              <option value="strict">Strict (Minimize False Alarms)</option>
              <option value="balanced">Balanced (Default)</option>
              <option value="protective">Protective (Err on Caution)</option>
            </select>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column - AI Decision & Probabilities */}
          <div className="space-y-6">
            
            {/* AI Decision Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4" style={SERIF}>
                AI Recommendation
              </h3>
              
              {currentPrediction ? (
                <>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3"
                         style={{ backgroundColor: TERRA.bg, color: TERRA.text }}>
                      <span className="text-2xl font-bold" style={MONO}>
                        A{currentPrediction.ai_action_code}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2" style={SANS}>
                      {ACTION_NAMES[currentPrediction.ai_action_code as ActionCode]}
                    </h4>
                    <p className="text-sm text-gray-600" style={MONO}>
                      Confidence: {Math.max(...currentPrediction.action_probabilities).toFixed(1)}%
                    </p>
                  </div>

                  {/* Action Probabilities Chart */}
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getChartData(currentPrediction.action_probabilities)} layout="horizontal">
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                        <YAxis type="category" dataKey="name" width={80} />
                        <ReTooltip formatter={(value) => [`${value}%`, 'Probability']} />
                        <Bar dataKey="value">
                          {getChartData(currentPrediction.action_probabilities).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Loader2 className="mx-auto mb-2 w-6 h-6 text-gray-400 animate-spin" />
                  <p className="text-gray-500" style={SANS}>Loading AI prediction...</p>
                </div>
              )}
            </div>

            {/* Model Info */}
            {currentPrediction && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4" style={SERIF}>
                  Model Information
                </h3>
                <div className="space-y-3 text-sm" style={SANS}>
                  <div>
                    <span className="text-gray-600">Model Path:</span>
                    <p className="font-mono text-xs text-gray-800 mt-1 break-all">
                      {currentPrediction.loaded_model_path}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Observation Shape:</span>
                    <p className="font-mono text-xs text-gray-800 mt-1">
                      Spatial: [{currentPrediction.obs_tensor_shapes.spatial.join(', ')}]<br />
                      Vector: [{currentPrediction.obs_tensor_shapes.vector.join(', ')}]
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Middle Column - Weather Radar & System Info */}
          <div className="space-y-6">
            
            {/* Live Weather Radar */}
            <LiveWeatherRadar />

            {/* Current Weather Status */}
            {currentTimeline && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4" style={SERIF}>
                  Current Conditions
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600" style={SANS}>PAGASA Warning:</span>
                    <span 
                      className="font-semibold px-3 py-1 rounded text-sm text-white"
                      style={{ backgroundColor: getPagasaColor(currentTimeline.pagasa_warning) }}
                    >
                      {currentTimeline.pagasa_warning}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600" style={SANS}>Flood Status:</span>
                    <span className={`font-semibold ${
                      currentTimeline.flood_active ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {currentTimeline.flood_active ? 'ACTIVE FLOODING' : 'CLEAR ROADS'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center border-t pt-3">
                    <span className="text-gray-600" style={SANS}>Simulated Stranded Projection:</span>
                    <span className="font-mono font-semibold text-orange-600">
                      {currentTimeline.simulated_stranded_projection.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded" style={SANS}>
                    * Stranded count is a mathematical projection based on RL environment modeling 
                    of 5:00-8:00 AM commute densities, not actual reported figures.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Incident Timeline */}
          <div className="space-y-6">
            
            {/* Current Incident Info */}
            {currentIncident && (
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4" style={SERIF}>
                  Incident Details
                </h3>
                
                <div className="space-y-4 text-sm" style={SANS}>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{currentIncident.name}</h4>
                    <p className="text-gray-600">{currentIncident.description}</p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-600">Actual Announcement:</span>
                      <span className="font-mono">{currentIncident.actual_announcement_time}:00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Actual Action:</span>
                      <span className="font-semibold">
                        {ACTION_SHORT[currentIncident.actual_action_code]}
                      </span>
                    </div>
                  </div>

                  {currentTimeline && (
                    <div className="border-t pt-4">
                      <h5 className="font-semibold text-gray-900 mb-3">
                        Current Status ({mode === "live" ? "Live" : HOUR_STEPS[step]?.label})
                      </h5>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Simulated Stranded Projection:</span>
                          <span className="font-mono text-orange-600">{currentTimeline.simulated_stranded_projection.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">PAGASA Warning:</span>
                          <span 
                            className="font-semibold px-2 py-1 rounded text-xs text-white"
                            style={{ backgroundColor: getPagasaColor(currentTimeline.pagasa_warning) }}
                          >
                            {currentTimeline.pagasa_warning}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Flood Active:</span>
                          <span className={`font-semibold ${
                            currentTimeline.flood_active ? 'text-red-600' : 'text-green-600'
                          }`}>
                            {currentTimeline.flood_active ? 'YES' : 'NO'}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500 mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                          <strong>Academic Note:</strong> Stranded count is a simulated projection 
                          generated by our RL environment based on standard commute patterns, 
                          not actual reported student counts.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm" style={SANS}>
          YORME-TRICS v2.0 • Powered by PyTorch PPO • Real-time PAGASA Integration
        </div>
      </div>
    </div>
  );
}