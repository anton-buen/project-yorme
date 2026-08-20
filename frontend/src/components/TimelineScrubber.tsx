const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };

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

interface TimelineScrubberProps {
  step: number;
  setStep: (step: number) => void;
  announcementStep: number;
}

function TimeIcon({ hour }: { hour: number }) {
  const isSunrise = hour >= 5.0 && hour <= 6.0;
  const iconColor = isSunrise ? "text-emerald-700" : "text-stone-800";
  
  if (hour < 5.0) {
    return (
      <svg className={`w-4 h-4 ${iconColor} transition-all duration-300 ease-in-out`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    );
  }
  
  if (hour >= 5.0 && hour <= 6.0) {
    return (
      <svg className={`w-4 h-4 ${iconColor} transition-all duration-300 ease-in-out`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="2" y1="12" x2="22" y2="12" strokeWidth="2" className="stroke-emerald-600" />
      </svg>
    );
  }
  
  if (hour < 11.5) {
    return (
      <svg className={`w-4 h-4 ${iconColor} transition-all duration-300 ease-in-out`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" />
        <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" />
      </svg>
    );
  }
  
  return (
    <svg className={`w-4 h-4 ${iconColor} transition-all duration-300 ease-in-out`} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="5" strokeWidth="2" />
      <line x1="12" y1="19" x2="12" y2="23" strokeWidth="2" />
      <line x1="3.22" y1="3.22" x2="6.34" y2="6.34" strokeWidth="2" />
      <line x1="17.66" y1="17.66" x2="20.78" y2="20.78" strokeWidth="2" />
      <line x1="1" y1="12" x2="5" y2="12" strokeWidth="2" />
      <line x1="19" y1="12" x2="23" y2="12" strokeWidth="2" />
      <line x1="3.22" y1="20.78" x2="6.34" y2="17.66" strokeWidth="2" />
      <line x1="17.66" y1="6.34" x2="20.78" y2="3.22" strokeWidth="2" />
    </svg>
  );
}

export default function TimelineScrubber({
  step,
  setStep,
  announcementStep,
}: TimelineScrubberProps) {
  const currentHour = HOUR_STEPS[step]?.hour + (HOUR_STEPS[step]?.minute || 0) / 60;
  const thumbPosition = (step / (HOUR_STEPS.length - 1)) * 100;
  
  return (
    <div className="py-8">
      <div className="mb-6 text-center">
        <h3 className="text-lg font-bold text-slate-800 mb-1" style={SERIF}>
          Simulation Timeline
        </h3>
        <p className="text-xs text-slate-500 tracking-wide" style={MONO}>
          03:00 — 12:00 • 19 INTERVALS • 30 MIN RESOLUTION
        </p>
      </div>

      <div className="relative px-4">
        <div className="relative">
          <input
            type="range"
            min="0"
            max={HOUR_STEPS.length - 1}
            value={step}
            onChange={(e) => setStep(Number(e.target.value))}
            className="timeline-scrubber-input w-full h-2 bg-stone-300 rounded-full appearance-none cursor-grab active:cursor-grabbing relative z-10"
            style={{
              background: `linear-gradient(to right, #1e293b 0%, #1e293b ${thumbPosition}%, #d6d3d1 ${thumbPosition}%, #d6d3d1 100%)`
            }}
          />
          
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white border-2 border-stone-800 shadow-md flex items-center justify-center pointer-events-none transition-all duration-300 ease-in-out z-20"
            style={{
              left: `calc(${thumbPosition}% - 14px)`
            }}
          >
            <TimeIcon hour={currentHour} />
          </div>
          
          {announcementStep >= 0 && (
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse pointer-events-none z-0"
              style={{
                left: `calc(${(announcementStep / (HOUR_STEPS.length - 1)) * 100}% - 3px)`
              }}
            />
          )}
        </div>

        <div className="flex justify-between text-[10px] text-slate-500 mt-4" style={MONO}>
          <span>03:00</span>
          <span>06:00</span>
          <span>09:00</span>
          <span>12:00</span>
        </div>
      </div>

      <style>{`
        .timeline-scrubber-input::-webkit-slider-thumb {
          appearance: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: transparent;
          border: none;
          cursor: grab;
        }
        
        .timeline-scrubber-input:active::-webkit-slider-thumb {
          cursor: grabbing;
        }
        
        .timeline-scrubber-input::-moz-range-thumb {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: transparent;
          border: none;
          cursor: grab;
        }
        
        .timeline-scrubber-input:active::-moz-range-thumb {
          cursor: grabbing;
        }
        
        .timeline-scrubber-input:active + div {
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}
