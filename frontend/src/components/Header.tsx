import { useState, useEffect } from 'react';
import type { IncidentData } from '../types/dashboard';
import YormeMark from './YormeMark';
import { TourHelpButton } from './OnboardingTour';
import PagasaBadge from './PagasaBadge';
import type { PagasaLevel } from '../utils/pagasa';

const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

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

type DashboardMode = "historical" | "live";

interface HeaderProps {
  mode: DashboardMode;
  setMode: (mode: DashboardMode) => void;
  incidents: IncidentData[];
  incidentIdx: number;
  setIncidentIdx: (idx: number) => void;
  step: number;
  setStep: (step: number) => void;
  pagasaWarning: PagasaLevel;
  onReplayTour?: () => void;
}

export default function Header({
  mode,
  setMode,
  incidents,
  incidentIdx,
  setIncidentIdx,
  step,
  setStep,
  pagasaWarning,
  onReplayTour,
}: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (mode === "live") {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [mode]);

  return (
    <>
      <div className="sticky top-0 z-50 bg-slate-900 shadow-lg">
        
        {/* Row 1: Wordmark (Left) + Controls (Right: Incident Dropdown + Mode Toggle) */}
        <header className="w-full bg-slate-900 px-8 py-4 flex justify-between items-center border-b border-slate-800">
          <div className="flex flex-col text-left">
            <h1 className="text-white text-3xl font-bold font-sans tracking-tight" style={SANS}>
              <YormeMark />
            </h1>
            <p className="text-slate-400 text-sm" style={SANS}>
              Predictive Class Suspension Advisor — City of Manila
            </p>
          </div>
          
          <div id="step-scenario-select" className="flex items-center gap-4">
            {mode === "historical" && (
              <select
                value={incidentIdx}
                onChange={(e) => setIncidentIdx(Number(e.target.value))}
                className="min-w-[280px] px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-sm transition-all duration-300 ease-in-out hover:border-slate-600 focus:border-slate-500 focus:ring-2 focus:ring-slate-600"
                style={SANS}
              >
                {incidents
                  .filter((inc) => inc && inc.id && inc.name)
                  .map((incident) => {
                    const originalIdx = incidents.indexOf(incident);
                    return (
                      <option key={incident.id} value={originalIdx}>
                        {incident.name}
                      </option>
                    );
                  })}
              </select>
            )}

            <div className="inline-flex bg-slate-800 rounded-full p-1 shadow-inner">
              <button
                onClick={() => setMode("historical")}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out ${
                  mode === "historical" 
                    ? 'bg-slate-200 text-slate-900 shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                style={SANS}
              >
                Replay
              </button>
              <button
                onClick={() => setMode("live")}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center gap-2 ${
                  mode === "live" 
                    ? 'bg-slate-200 text-slate-900 shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                style={SANS}
              >
                {mode === "live" && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
                Live
              </button>
            </div>
          </div>
        </header>

        {/* Row 2: PAGASA Status + Clock + Help */}
        <div className="w-full bg-slate-900 px-8 py-3 flex items-center gap-4 border-b border-slate-800">
          <PagasaBadge level={pagasaWarning} />

          {mode === "live" ? (
            <div className="px-3 py-1.5 bg-slate-800 rounded-sm text-sm text-slate-200 whitespace-nowrap" style={MONO}>
              {currentTime.toLocaleTimeString('en-US', { 
                timeZone: 'Asia/Manila',
                hour12: true,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })} MNL (Live)
            </div>
          ) : (
            <select
              value={step}
              onChange={(e) => setStep(Number(e.target.value))}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-sm text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600"
              style={MONO}
            >
              {HOUR_STEPS.map((hourStep, idx) => (
                <option key={idx} value={idx}>
                  {hourStep.label} (Sim)
                </option>
              ))}
            </select>
          )}

          {onReplayTour && (
            <div className="ml-auto">
              <TourHelpButton onClick={onReplayTour} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
