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

interface TimelineScrubberProps {
  step: number;
  setStep: (step: number) => void;
  announcementStep: number;
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

export default function TimelineScrubber({
  step,
  setStep,
  announcementStep,
}: TimelineScrubberProps) {
  const knobColor = getKnobGradient(step, HOUR_STEPS.length);
  
  return (
    <div className="py-8 bg-gradient-to-b from-stone-50 to-white rounded-2xl border border-stone-200 shadow-sm" role="region" aria-label="Timeline Control - Incident Simulation Scrubber">
      <div className="mb-8 text-center px-6">
        <h3 className="text-xl font-bold font-sans tracking-tight text-slate-800 mb-2" style={SANS}>
          Timeline Control
        </h3>
        <p className="text-xs text-slate-500 tracking-wider uppercase" style={MONO}>
          Simulation Period: 03:00 AM — 12:00 PM
        </p>
        <p className="text-[10px] text-slate-400 mt-1" style={SANS}>
          19 intervals • 30-minute resolution • Click any point to jump
        </p>
      </div>

      <div className="relative px-4 md:px-8">
        {/* Mobile: Horizontal scroll wrapper */}
        <div className="overflow-x-auto overscroll-x-contain pb-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          <div className="min-w-[768px]">
            {/* Graph Grid Background */}
            <div className="absolute inset-x-8 top-0 bottom-16 pointer-events-none">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-full border-t border-stone-200"
                  style={{ top: `${i * 25}%` }}
                />
              ))}
            </div>

            {/* Future Decay Gradient Overlay */}
            <div 
              className="absolute top-0 bottom-16 pointer-events-none z-10"
              style={{
                left: `calc(8% + ${(step / (HOUR_STEPS.length - 1)) * 84}%)`,
                right: '8%',
                background: 'linear-gradient(to right, rgba(226, 232, 240, 0) 0%, rgba(226, 232, 240, 0.4) 50%, rgba(226, 232, 240, 0.7) 100%)',
                backdropFilter: 'blur(1px)',
              }}
            />

            {/* Timeline Circles */}
            <div className="relative flex items-center justify-between gap-1 mb-4 px-8">
          {HOUR_STEPS.map((s, i) => {
            const isActive = i === step;
            const isAnnouncement = i === announcementStep;
            const isPast = i < step;
            const isFuture = i > step;
            
            // Calculate opacity decay for future intervals (further = more transparent)
            const distanceFromCurrent = i - step;
            const futureOpacity = isFuture 
              ? Math.max(0.15, 1 - (distanceFromCurrent / HOUR_STEPS.length) * 0.85)
              : 1;

            return (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`
                  relative shrink-0 w-8 h-8 md:w-4 md:h-4 rounded-full border-2 transition-all duration-200
                  ${isActive 
                    ? "scale-150 shadow-lg border-white z-20" 
                    : isPast 
                    ? "border-stone-300 bg-stone-200 hover:scale-125 hover:border-stone-400" 
                    : "border-stone-400 bg-white hover:scale-125 hover:border-stone-600"
                  }
                `}
                style={{
                  backgroundColor: isActive ? knobColor : undefined,
                  boxShadow: isActive ? `0 0 16px ${knobColor}, 0 4px 8px rgba(0,0,0,0.15)` : undefined,
                  opacity: isFuture ? futureOpacity : 1,
                }}
                aria-label={`${s.label}${isActive ? ' - Current time' : ''}${isAnnouncement ? ' - LGU announcement time' : ''}${isFuture ? ' - Future prediction (high uncertainty)' : isPast ? ' - Past' : ''}`}
                aria-current={isActive ? 'time' : undefined}
              >
                {isAnnouncement && (
                  <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75" />
                )}
              </button>
            );
          })}
        </div>

        {/* Time Axis Labels */}
        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-6 px-9" style={MONO}>
          <div className="flex flex-col items-start">
            <span>03:00</span>
            <span className="text-[9px] text-slate-400 font-normal hidden md:inline">Early Morning</span>
          </div>
          <div className="flex flex-col items-center">
            <span>06:00</span>
            <span className="text-[9px] text-emerald-600 font-normal hidden md:inline">Decision Window</span>
          </div>
          <div className="flex flex-col items-center">
            <span>09:00</span>
            <span className="text-[9px] text-slate-400 font-normal hidden md:inline">Mid Morning</span>
          </div>
          <div className="flex flex-col items-end">
            <span>12:00</span>
            <span className="text-[9px] text-slate-400 font-normal hidden md:inline">Noon</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 pt-4 border-t border-stone-200 px-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-stone-400 bg-white"></div>
            <span className="text-xs text-slate-600" style={SANS}>Future</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-stone-300 bg-stone-200"></div>
            <span className="text-xs text-slate-600" style={SANS}>Past</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
              style={{
                background: 'linear-gradient(135deg, rgb(251, 191, 36) 0%, rgb(30, 41, 59) 100%)'
              }}
            ></div>
            <span className="text-xs text-slate-600" style={SANS}>Current Time</span>
          </div>
          {announcementStep >= 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></div>
              <span className="text-xs text-slate-600" style={SANS}>LGU Announcement</span>
            </div>
          )}
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
