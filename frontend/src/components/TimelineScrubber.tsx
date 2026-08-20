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

function getKnobGradient(step: number, totalSteps: number): string {
  const progress = step / (totalSteps - 1);
  
  const morningColor = { r: 251, g: 191, b: 36 };
  const nightColor = { r: 30, g: 41, b: 59 };
  
  const r = Math.round(morningColor.r + (nightColor.r - morningColor.r) * progress);
  const g = Math.round(morningColor.g + (nightColor.g - morningColor.g) * progress);
  const b = Math.round(morningColor.b + (nightColor.b - morningColor.b) * progress);
  
  return `rgb(${r}, ${g}, ${b})`;
}

export default function TimelineScrubber({
  step,
  setStep,
  announcementStep,
}: TimelineScrubberProps) {
  const knobColor = getKnobGradient(step, HOUR_STEPS.length);
  
  return (
    <div className="py-8 bg-gradient-to-b from-stone-50 to-white rounded-2xl border border-stone-200 shadow-sm">
      <div className="mb-8 text-center px-6">
        <h3 className="text-xl font-bold text-slate-800 mb-2" style={SERIF}>
          Timeline Control
        </h3>
        <p className="text-xs text-slate-500 tracking-wider uppercase" style={MONO}>
          Simulation Period: 03:00 AM — 12:00 PM
        </p>
        <p className="text-[10px] text-slate-400 mt-1" style={SANS}>
          19 intervals • 30-minute resolution • Click any point to jump
        </p>
      </div>

      <div className="relative px-8">
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

        {/* Timeline Circles */}
        <div className="relative flex items-center justify-between gap-1 mb-4">
          {HOUR_STEPS.map((s, i) => {
            const isActive = i === step;
            const isAnnouncement = i === announcementStep;
            const isPast = i < step;

            return (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`
                  relative shrink-0 w-4 h-4 rounded-full border-2 transition-all duration-200
                  ${isActive 
                    ? "scale-150 shadow-lg border-white z-20" 
                    : isPast 
                    ? "border-stone-300 bg-stone-200 hover:scale-125 hover:border-stone-400" 
                    : "border-stone-400 bg-white hover:scale-125 hover:border-stone-600"
                  }
                `}
                style={{
                  backgroundColor: isActive ? knobColor : undefined,
                  boxShadow: isActive ? `0 0 16px ${knobColor}, 0 4px 8px rgba(0,0,0,0.15)` : undefined
                }}
                aria-label={s.label}
              >
                {isAnnouncement && (
                  <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75" />
                )}
              </button>
            );
          })}
        </div>

        {/* Time Axis Labels */}
        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-6 px-1" style={MONO}>
          <div className="flex flex-col items-start">
            <span>03:00</span>
            <span className="text-[9px] text-slate-400 font-normal">Early Morning</span>
          </div>
          <div className="flex flex-col items-center">
            <span>06:00</span>
            <span className="text-[9px] text-emerald-600 font-normal">Decision Window</span>
          </div>
          <div className="flex flex-col items-center">
            <span>09:00</span>
            <span className="text-[9px] text-slate-400 font-normal">Mid Morning</span>
          </div>
          <div className="flex flex-col items-end">
            <span>12:00</span>
            <span className="text-[9px] text-slate-400 font-normal">Noon</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 pt-4 border-t border-stone-200">
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
  );
}
