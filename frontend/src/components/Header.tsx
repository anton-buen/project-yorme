import { useState, useEffect } from 'react';
import type { IncidentData } from '../types/dashboard';

const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SAGE = { line: "#6B9E7A" };

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

type PagasaLevel = "NONE" | "YELLOW" | "ORANGE" | "RED";
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
}

function getPagasaColor(level: PagasaLevel): string {
  switch (level) {
    case "NONE": return "#A8A29E";
    case "YELLOW": return "#F59E0B";
    case "ORANGE": return "#F97316";
    case "RED": return "#DC2626";
    default: return "#A8A29E";
  }
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
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-stone-200/80 shadow-sm">
      <div className="max-w-7xl mx-auto">
        
        {/* Row 1: Wordmark + Mode Toggle (Centered) + Incident */}
        <div className="px-6 py-4 flex items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-stone-900" style={SERIF}>
              Yormetrics
            </h1>
            <p className="text-sm text-stone-600 mt-0.5" style={SANS}>
              Predictive Early Suspension Advisor — City of Manila LGU
            </p>
          </div>

          {/* iOS-style Segmented Control - Centered */}
          <div className="flex items-center justify-center">
            <div className="inline-flex bg-stone-100 rounded-full p-1 shadow-inner">
              <button
                onClick={() => setMode("historical")}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out ${
                  mode === "historical" 
                    ? 'bg-white text-stone-900 shadow-md' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                style={SANS}
              >
                📊 Historical Replay
              </button>
              <button
                onClick={() => setMode("live")}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center gap-2 ${
                  mode === "live" 
                    ? 'bg-white text-stone-900 shadow-md' 
                    : 'text-stone-600 hover:text-stone-900'
                }`}
                style={SANS}
              >
                {mode === "live" && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
                🔴 Live Watch
              </button>
            </div>
          </div>

          {/* Incident Selector - Fixed Width Container */}
          <div className="w-[300px] flex justify-end">
            {mode === "historical" && (
              <select
                value={incidentIdx}
                onChange={(e) => setIncidentIdx(Number(e.target.value))}
                className="w-full px-4 py-2 bg-white border border-stone-200 rounded-xl text-sm transition-all duration-300 ease-in-out hover:border-stone-300 focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                style={SANS}
              >
                  {incidents.map((incident, idx) => (
                    <option key={incident.id} value={idx}>
                      {incident.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: PAGASA Status + Clock + Timeline Scrubber */}
        <div className="px-6 pb-4 flex items-center gap-4">
          {/* PAGASA Status Badge */}
          <div 
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white whitespace-nowrap"
            style={{ backgroundColor: getPagasaColor(pagasaWarning), ...SANS }}
          >
            PAGASA: {pagasaWarning === "NONE" ? "No Warning" : `${pagasaWarning} Warning`}
          </div>

          {/* Clock Display */}
          <div className="px-3 py-1.5 bg-stone-100 rounded-lg text-sm text-stone-900 whitespace-nowrap" style={MONO}>
            {mode === "live" ? (
              <>
                {currentTime.toLocaleTimeString('en-US', { 
                  timeZone: 'Asia/Manila',
                  hour12: true,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                })} MNL (Live)
              </>
            ) : (
              <>
                {HOUR_STEPS[step]?.label} (Sim)
              </>
            )}
          </div>

          {/* Timeline Scrubber - Historical Mode Only */}
          {mode === "historical" && (
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max={HOUR_STEPS.length - 1}
                value={step}
                onChange={(e) => setStep(Number(e.target.value))}
                className="w-full h-2 bg-stone-200 rounded-full appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, ${SAGE.line} 0%, ${SAGE.line} ${(step / (HOUR_STEPS.length - 1)) * 100}%, #E7E5E4 ${(step / (HOUR_STEPS.length - 1)) * 100}%, #E7E5E4 100%)`
                }}
              />
            </div>
          )}
        </div>
      </div>

      <style>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${SAGE.line};
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .slider-thumb::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${SAGE.line};
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </>
  );
}
