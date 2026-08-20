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
      <div className="sticky top-0 z-50 bg-stone-950 shadow-lg">
        
        {/* Row 1: Wordmark (Left) + Controls (Right: Incident Dropdown + Mode Toggle) */}
        <header className="w-full bg-stone-950 px-8 py-4 flex justify-between items-center border-b border-stone-800">
          {/* LEFT SIDE: Logo & Subtitle */}
          <div className="flex flex-col text-left">
            <h1 className="text-white text-3xl font-bold" style={SERIF}>
              Yormetrics
            </h1>
            <p className="text-stone-400 text-sm" style={SANS}>
              Predictive Early Suspension Advisor — City of Manila LGU
            </p>
          </div>
          
          {/* RIGHT SIDE: Controls */}
          <div className="flex items-center gap-4">
            {/* Incident Selector */}
            {mode === "historical" && (
              <select
                value={incidentIdx}
                onChange={(e) => setIncidentIdx(Number(e.target.value))}
                className="min-w-[280px] px-4 py-2 bg-stone-800 border border-stone-700 text-stone-200 rounded-xl text-sm transition-all duration-300 ease-in-out hover:border-stone-600 focus:border-stone-500 focus:ring-2 focus:ring-stone-600"
                style={SANS}
              >
                {incidents.map((incident, idx) => (
                  <option key={incident.id} value={idx}>
                    {incident.name}
                  </option>
                ))}
              </select>
            )}

            {/* Segmented Control */}
            <div className="inline-flex bg-stone-800 rounded-full p-1 shadow-inner">
              <button
                onClick={() => setMode("historical")}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out ${
                  mode === "historical" 
                    ? 'bg-stone-200 text-stone-900 shadow-md' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                style={SANS}
              >
                Historical Replay
              </button>
              <button
                onClick={() => setMode("live")}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ease-in-out flex items-center gap-2 ${
                  mode === "live" 
                    ? 'bg-stone-200 text-stone-900 shadow-md' 
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                style={SANS}
              >
                {mode === "live" && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
                Live Watch
              </button>
            </div>
          </div>
        </header>

        {/* Row 2: PAGASA Status + Clock + Timeline Scrubber */}
        <div className="w-full bg-stone-900 px-8 py-3 flex items-center border-b border-stone-800">
          {/* PAGASA Status Badge */}
          <div 
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white whitespace-nowrap"
            style={{ backgroundColor: getPagasaColor(pagasaWarning), ...SANS }}
          >
            PAGASA: {pagasaWarning === "NONE" ? "No Warning" : `${pagasaWarning} Warning`}
          </div>

          {/* Clock Display */}
          <div className="px-3 py-1.5 bg-stone-800 rounded-lg text-sm text-stone-200 whitespace-nowrap ml-4" style={MONO}>
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
            <div className="flex-1 ml-4">
              <input
                type="range"
                min="0"
                max={HOUR_STEPS.length - 1}
                value={step}
                onChange={(e) => setStep(Number(e.target.value))}
                className="w-full h-2 bg-stone-800 rounded-full appearance-none cursor-pointer slider-thumb"
                style={{
                  background: `linear-gradient(to right, ${SAGE.line} 0%, ${SAGE.line} ${(step / (HOUR_STEPS.length - 1)) * 100}%, #292524 ${(step / (HOUR_STEPS.length - 1)) * 100}%, #292524 100%)`
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
          border: 3px solid #1c1917;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        .slider-thumb::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${SAGE.line};
          cursor: pointer;
          border: 3px solid #1c1917;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
      `}</style>
    </>
  );
}
