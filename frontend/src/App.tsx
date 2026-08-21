/**
 * YORME-TRICS Dashboard
 * 
 * Main application component providing AI-powered class suspension decision support.
 * Features historical replay and live monitoring modes with real-time weather integration.
 * 
 * @module App
 */

import { useState, useEffect } from "react";
import { BarChart2, BookOpen } from "lucide-react";

import { fetchIncidents, getPrediction, checkApiHealth, ApiError } from './utils/api';
import type { IncidentData, PredictionResponse } from './types/dashboard';

import LoadingScreen from './components/LoadingScreen';
import Header from './components/Header';
import SystemContextBanner from './components/SystemContextBanner';
import HeroCards from './components/HeroCards';
import SpatialContext from './components/SpatialContext';
import TimelineScrubber from './components/TimelineScrubber';
import TechnicalAppendix from './components/TechnicalAppendix';
import SourceLink from './components/SourceLink';
import YormeMark from './components/YormeMark';
import LegalDisclaimerModal from './components/LegalDisclaimerModal';
import OnboardingTour, { TOUR_STORAGE_KEY } from './components/OnboardingTour';

const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };

type PagasaLevel = "NONE" | "YELLOW" | "ORANGE" | "RED";
type BiasMode = "strict" | "balanced" | "protective";
type DashboardMode = "historical" | "live";

interface LoadingState {
  isLoading: boolean;
  error: string | null;
  stage: 'health' | 'incidents' | 'complete';
}

interface PredictionCache {
  [key: string]: PredictionResponse;
}

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

/**
 * Main application component managing dashboard state and data fetching.
 */
export default function App() {

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [techVaultOpen, setTechVaultOpen] = useState(false);
  const [legalDisclaimerOpen, setLegalDisclaimerOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(TOUR_STORAGE_KEY) !== 'true') {
        setTourOpen(true);
      }
    } catch {
      setTourOpen(true);
    }
  }, []);

  const [currentPrediction, setCurrentPrediction] = useState<PredictionResponse | null>(null);
  const [predictionError, setPredictionError] = useState<string | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);

  // Auto-open onboarding for first-time users
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setTechVaultOpen(true);
      localStorage.setItem('hasSeenOnboarding', 'true');
    }
  }, []);

  useEffect(() => {
    async function initializeApp() {
      try {
        setLoadingState(prev => ({ ...prev, stage: 'health' }));
        await checkApiHealth();

        setLoadingState(prev => ({ ...prev, stage: 'incidents' }));
        console.log('[App] Fetching incidents from API...');
        const incidentsData = await fetchIncidents();
        console.log('[App] Received incidents from API:', incidentsData.length, 'items');
        console.log('[App] Incident IDs:', incidentsData.map(inc => inc.id));
        setIncidents(incidentsData);
        console.log('[App] State updated with', incidentsData.length, 'incidents');

        setLoadingState(prev => ({ ...prev, stage: 'complete' }));
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

  useEffect(() => {
    console.log('[App] 🔄 Prediction useEffect triggered', {
      loadingState: loadingState.isLoading,
      hasError: !!loadingState.error,
      incidentsCount: incidents.length,
      incidentIdx,
      step,
      mode,
      bias
    });

    if (loadingState.isLoading || loadingState.error || incidents.length === 0) {
      console.log('[App] ⏸️ Skipping prediction fetch (loading or error or no incidents)');
      return;
    }

    async function fetchPrediction() {
      console.log('[App] 🚀 Starting fetchPrediction...');
      
      const currentIncident = incidents[incidentIdx];
      if (!currentIncident) {
        console.error('[App] ❌ No current incident found at index:', incidentIdx);
        setPredictionLoading(false);
        return;
      }

      const currentHour = mode === "live" 
        ? new Date().getHours() + new Date().getMinutes() / 60 
        : HOUR_STEPS[step]?.hour + (HOUR_STEPS[step]?.minute || 0) / 60;
      
      console.log('[App] ⏰ Current hour calculated:', currentHour, 'mode:', mode);
      
      const timelineKey = Number.isFinite(currentHour) ? Math.floor(currentHour).toFixed(1) : "3.0";
      console.log('[App] 🔑 Timeline key (floored):', timelineKey, 'from hour:', currentHour);
      
      const timeline = currentIncident?.hourly_timeline?.[timelineKey];

      if (!timeline) {
        console.error('[App] ❌ No timeline data for key:', timelineKey);
        console.error('[App] Available keys:', currentIncident?.hourly_timeline ? Object.keys(currentIncident.hourly_timeline) : 'No timeline data');
        setPredictionError(`No timeline data available for hour ${timelineKey}`);
        setPredictionLoading(false);
        return;
      }

      console.log('[App] ✅ Timeline data found:', timeline);

      const cacheKey = `${incidentIdx}-${step}-${mode}-${bias}`;
      console.log('[App] 🔑 Cache key:', cacheKey);
      
      if (predictionCache[cacheKey]) {
        console.log('[App] ✅ Using cached prediction');
        setCurrentPrediction(predictionCache[cacheKey]);
        setPredictionError(null);
        if (predictionLoading) {
          setPredictionLoading(false);
        }
        return;
      }

      console.log('[App] 💾 No cache found, fetching from API...');

      try {
        console.log('[App] ⏳ Setting loading state...');
        setPredictionLoading(true);
        setPredictionError(null);

        const request = {
          current_hour: Number.isFinite(currentHour) ? currentHour : 3.0,
          flood_active: timeline?.flood_active ?? false,
          pagasa_warning_red: timeline?.pagasa_warning === "RED",
        };

        console.log('[App] 📤 Calling getPrediction with request:', request);
        const prediction = await getPrediction(request);
        console.log('[App] ✅ Prediction received:', prediction);
        
        setPredictionCache(prev => ({
          ...prev,
          [cacheKey]: prediction
        }));
        
        setCurrentPrediction(prediction);
        setPredictionError(null);

      } catch (error) {
        console.error('[App] ❌ PREDICTION FETCH FAILED:', error);
        const errorMsg = error instanceof ApiError 
          ? error.message 
          : 'Failed to connect to AI backend. Server may be waking up.';
        console.error('[App] ❌ Setting error message:', errorMsg);
        setPredictionError(errorMsg);
        setCurrentPrediction(null);
      } finally {
        console.log('[App] 🏁 Setting loading to false');
        setPredictionLoading(false);
      }
    }

    fetchPrediction();
  }, [incidentIdx, step, mode, bias, incidents, loadingState]);

  if (loadingState.isLoading || loadingState.error) {
    return <LoadingScreen stage={loadingState.stage} error={loadingState.error} />;
  }

  if (incidents.length === 0) {
    return <LoadingScreen stage="complete" error="No incidents data available from backend" />;
  }

  const currentIncident = incidents[incidentIdx];
  
  if (!currentIncident) {
    console.error('[App] Invalid incidentIdx:', incidentIdx, 'total incidents:', incidents.length);
    return <LoadingScreen stage="complete" error={`Invalid incident selection (index ${incidentIdx}). Please reload the page.`} />;
  }
  
  const currentHour = mode === "live" 
    ? new Date().getHours() + new Date().getMinutes() / 60 
    : HOUR_STEPS[step]?.hour + (HOUR_STEPS[step]?.minute || 0) / 60;
  
  const timelineKey = Number.isFinite(currentHour) ? Math.floor(currentHour).toFixed(1) : "3.0";
  const currentTimeline = currentIncident?.hourly_timeline?.[timelineKey] ?? {
    pagasa_warning: "NONE" as PagasaLevel,
    flood_active: false,
    simulated_stranded_projection: 0
  };

  const announcementStep = currentIncident?.actual_announcement_time != null
    ? HOUR_STEPS.findIndex(h => (h.hour + h.minute / 60) === currentIncident.actual_announcement_time)
    : -1;

  const simulatedStranded = typeof currentTimeline?.simulated_stranded_projection === 'number' 
    ? currentTimeline.simulated_stranded_projection 
    : 0;
  const pagasaWarning: PagasaLevel = currentTimeline?.pagasa_warning ?? "NONE";

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col relative">
      
      {/* TIER 1: Top Navigation */}
      <Header
        mode={mode}
        setMode={setMode}
        incidents={incidents}
        incidentIdx={incidentIdx}
        setIncidentIdx={setIncidentIdx}
        step={step}
        setStep={setStep}
        pagasaWarning={pagasaWarning}
        onReplayTour={() => setTourOpen(true)}
      />

      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1">
        
        {/* SystemContextBanner removed from main flow - now in Technical Vault modal */}

        {/* Timeline Control - Positioned at top for historical mode */}
        {mode === "historical" && (
          <div className="mb-6">
            <TimelineScrubber
              step={step}
              setStep={setStep}
              announcementStep={announcementStep}
            />
          </div>
        )}

        {/* TIER 2: The Command Deck - 12-column grid */}
        {mode === "historical" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mb-6">
            {/* Left Column: AI + LGU Decision Cards */}
            <div className="col-span-12 lg:col-span-7 flex flex-col h-full">
              <HeroCards
                currentIncident={currentIncident}
                prediction={currentPrediction}
                currentHour={currentHour}
                simulatedStranded={simulatedStranded}
                predictionError={predictionError}
                predictionLoading={predictionLoading}
                pagasaWarning={pagasaWarning}
                onRetry={() => {
                  console.log('[App] Retry button clicked - resetting prediction state');
                  setPredictionError(null);
                  setPredictionLoading(false);
                  setCurrentPrediction(null);
                  setPredictionCache({});
                }}
              />
            </div>

            {/* Right Column: Telemetry + Spatial Tensor */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 lg:gap-6 h-full">
              <SpatialContext
                step={step}
                incidentIdx={incidentIdx}
                pagasaWarning={pagasaWarning}
                mode="historical"
                isLoading={predictionLoading}
                setStep={setStep}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mb-6">
            {/* Left Column: AI + LGU Decision Cards */}
            <div className="col-span-12 lg:col-span-7 flex flex-col h-full">
              <HeroCards
                currentIncident={currentIncident}
                prediction={currentPrediction}
                currentHour={currentHour}
                simulatedStranded={simulatedStranded}
                predictionError={predictionError}
                predictionLoading={predictionLoading}
                pagasaWarning={pagasaWarning}
                onRetry={() => {
                  console.log('[App] Retry button clicked (Live mode) - resetting prediction state');
                  setPredictionError(null);
                  setPredictionLoading(false);
                  setCurrentPrediction(null);
                  setPredictionCache({});
                }}
                mode={mode}
              />
            </div>

            {/* Right Column: Telemetry + Map */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 lg:gap-6 h-full">
              <SpatialContext
                step={step}
                incidentIdx={incidentIdx}
                pagasaWarning={pagasaWarning}
                mode="live"
                isLoading={predictionLoading}
                setStep={setStep}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div
          id="step-legal-footer"
          className="text-center text-slate-500 text-sm pt-4 pb-2 space-y-2"
          style={SANS}
        >
          <div>
            <YormeMark /> v2.1 • Powered by PyTorch PPO • Live{' '}
            <SourceLink source="pagasa" className="text-slate-500">
              PAGASA
            </SourceLink>{' '}
            Integration • 100% Factual Compliance
          </div>
          <button
            type="button"
            onClick={() => setLegalDisclaimerOpen(true)}
            className="text-slate-400 hover:text-slate-200 text-xs underline underline-offset-2 decoration-slate-600/50 hover:decoration-slate-400 transition-colors"
          >
            Legal &amp; AI Disclaimer
          </button>
        </div>
      </main>

      <TechnicalAppendix
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        bias={bias}
        setBias={setBias}
        prediction={currentPrediction}
        pagasaWarning={pagasaWarning}
      />

      {/* Technical Vault Modal */}
      <SystemContextBanner 
        isOpen={techVaultOpen} 
        onClose={() => setTechVaultOpen(false)} 
      />

      <LegalDisclaimerModal
        isOpen={legalDisclaimerOpen}
        onClose={() => setLegalDisclaimerOpen(false)}
      />

      <OnboardingTour
        isOpen={tourOpen}
        onClose={() => setTourOpen(false)}
      />

      {/* Floating Action Buttons - Labeled Pills */}
      {!drawerOpen && !techVaultOpen && !legalDisclaimerOpen && !tourOpen && (
        <div className="fixed bottom-8 right-8 z-40 flex flex-col gap-3">
          {/* How it Works FAB */}
          <button
            onClick={() => setTechVaultOpen(true)}
            className="px-4 py-2 rounded-full shadow-lg hover:shadow-xl bg-slate-900 text-slate-200 hover:bg-slate-800 transition-all duration-300 ease-in-out hover:scale-105 active:scale-95 flex items-center gap-2"
            aria-label="Open How it Works"
          >
            <BookOpen className="w-5 h-5" />
            <span className="font-medium text-sm">How it Works</span>
          </button>

          {/* RL Metrics FAB */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="px-4 py-2 rounded-full shadow-lg hover:shadow-xl bg-slate-900 text-slate-200 hover:bg-slate-800 transition-all duration-300 ease-in-out hover:scale-105 active:scale-95 flex items-center gap-2"
            aria-label="Open RL Metrics"
          >
            <BarChart2 className="w-5 h-5" />
            <span className="font-medium text-sm">RL Metrics</span>
          </button>
        </div>
      )}
    </div>
  );
}
