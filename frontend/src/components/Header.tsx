import { useState, useEffect } from 'react';
import type { IncidentData } from '../types/dashboard';
import SourceLink from './SourceLink';

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

function getKnobGradient(step: number, totalSteps: number): string {
  const progress = step / (totalSteps - 1);
  
  const nightColor = { r: 30, g: 41, b: 59 };
  const morningColor = { r: 251, g: 191, b: 36 };
  
  const r = Math.round(nightColor.r + (morningColor.r - nightColor.r) * progress);
  const g = Math.round(nightColor.g + (morningColor.g - nightColor.g) * progress);
  const b = Math.round(nightColor.b + (morningColor.b - nightColor.b) * progress);
  
  return `rgb(${r}, ${g}, ${b})`;
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
  const knobColor = getKnobGradient(step, HOUR_STEPS.length);

  // DIAGNOSTIC: Log raw incidents data
  useEffect(() => {
    console.log('[Header] 🔍 DIAGNOSTIC: Raw incidents array:', {
      totalCount: incidents.length,
      incidents: incidents.map((inc, i) => ({
        index: i,
        id: inc?.id || 'MISSING_ID',
        name: inc?.name || 'MISSING_NAME',
        hasTimeline: !!inc?.hourly_timeline,
        announcementTime: inc?.actual_announcement_time,
        announcementTimeType: typeof inc?.actual_announcement_time,
        actionCode: inc?.actual_action_code,
        actionCodeType: typeof inc?.actual_action_code,
      }))
    });
  }, [incidents]);

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
          {/* LEFT SIDE: Logo & Subtitle */}
          <div className="flex flex-col text-left">
            <h1 className="text-white text-3xl font-bold font-sans tracking-tight" style={SANS}>
              Yormetrics
            </h1>
            <p className="text-slate-400 text-sm" style={SANS}>
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
                className="min-w-[280px] px-4 py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-sm transition-all duration-300 ease-in-out hover:border-slate-600 focus:border-slate-500 focus:ring-2 focus:ring-slate-600"
                style={SANS}
              >
                {incidents
                  .filter((inc) => inc && inc.id && inc.name)
                  .map((incident, filteredIdx) => {
                    const originalIdx = incidents.indexOf(incident);
                    return (
                      <option key={incident.id} value={originalIdx}>
                        {incident.name}
                      </option>
                    );
                  })}
              </select>
            )}

            {/* Segmented Control */}
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

        {/* Row 2: PAGASA Status + Clock (Interactive Dropdown in Historical Mode) */}
        <div className="w-full bg-slate-900 px-8 py-3 flex items-center border-b border-slate-800">
          {/* PAGASA Status Badge */}
          <div 
            className="px-3 py-1.5 rounded-sm text-sm font-semibold text-white whitespace-nowrap"
            style={{ backgroundColor: getPagasaColor(pagasaWarning), ...SANS }}
          >
            <SourceLink source="pagasa" className="text-white">
              PAGASA
            </SourceLink>
            : {pagasaWarning === "NONE" ? "No Warning" : `${pagasaWarning} Warning`}
          </div>

          {/* Time Display - Interactive Dropdown in Historical Mode */}
          {mode === "live" ? (
            <div className="px-3 py-1.5 bg-slate-800 rounded-sm text-sm text-slate-200 whitespace-nowrap ml-4" style={MONO}>
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
              className="ml-4 px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-sm text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600"
              style={MONO}
            >
              {HOUR_STEPS.map((hourStep, idx) => (
                <option key={idx} value={idx}>
                  {hourStep.label} (Sim)
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </>
  );
}
