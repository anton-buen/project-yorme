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
    <div className="py-8">
      <div className="mb-6 text-center">
        <h3 className="text-lg font-bold text-slate-800 mb-1" style={SERIF}>
          Simulation Timeline
        </h3>
        <p className="text-xs text-slate-500 tracking-wide" style={MONO}>
          03:00 — 12:00 • 19 INTERVALS • 30 MIN RESOLUTION
        </p>
      </div>

      <div className="relative flex items-center justify-between gap-1 px-2">
        {HOUR_STEPS.map((s, i) => {
          const isActive = i === step;
          const isAnnouncement = i === announcementStep;
          const isPast = i < step;

          return (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`
                relative shrink-0 w-3 h-3 rounded-full border-2 transition-all duration-200
                ${isActive 
                  ? "scale-125 shadow-lg border-white" 
                  : isPast 
                  ? "border-stone-400 bg-stone-300 hover:scale-110" 
                  : "border-stone-400 bg-white hover:scale-110 hover:border-stone-500"
                }
              `}
              style={{
                backgroundColor: isActive ? knobColor : undefined,
                boxShadow: isActive ? `0 0 12px ${knobColor}` : undefined
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

      <div className="flex justify-between text-[10px] text-slate-500 mt-4 px-2" style={MONO}>
        <span>03:00</span>
        <span>06:00</span>
        <span>09:00</span>
        <span>12:00</span>
      </div>
    </div>
  );
}
