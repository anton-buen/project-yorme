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

export default function TimelineScrubber({
  step,
  setStep,
  announcementStep,
}: TimelineScrubberProps) {
  return (
    <div className="py-8">
      {/* Title */}
      <div className="mb-6 text-center">
        <h3 className="text-lg font-bold text-slate-800 mb-1" style={SERIF}>
          Simulation Timeline
        </h3>
        <p className="text-xs text-slate-500 tracking-wide" style={MONO}>
          03:00 — 12:00 • 19 INTERVALS • 30 MIN RESOLUTION
        </p>
      </div>

      {/* Timeline Track */}
      <div className="relative px-4">
        {/* Background line */}
        <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-0.5 bg-stone-300 rounded-full" />

        {/* Active progress line */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 left-4 h-0.5 bg-slate-800 rounded-full transition-all duration-300"
          style={{ 
            width: `calc((100% - 2rem) * ${step / (HOUR_STEPS.length - 1)})`
          }}
        />

        {/* Step indicators */}
        <div className="relative flex justify-between items-center">
          {HOUR_STEPS.map((hourStep, idx) => {
            const isActive = idx === step;
            const isPassed = idx < step;
            const isAnnouncement = idx === announcementStep;

            return (
              <button
                key={idx}
                onClick={() => setStep(idx)}
                className="relative group transition-transform duration-200 ease-out hover:scale-125"
                title={hourStep.label}
              >
                {/* Main circle */}
                <div
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    isActive 
                      ? 'scale-150 shadow-md' 
                      : 'hover:scale-125'
                  }`}
                  style={{
                    backgroundColor: isActive 
                      ? '#1e293b' 
                      : isPassed 
                      ? '#94a3b8' 
                      : '#e2e8f0',
                    border: isAnnouncement ? '2px solid #dc2626' : 'none',
                  }}
                />

                {/* Announcement indicator */}
                {isAnnouncement && (
                  <div 
                    className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"
                  />
                )}

                {/* Tooltip */}
                <div 
                  className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg"
                  style={MONO}
                >
                  {hourStep.label}
                  {isAnnouncement && (
                    <span className="block text-[10px] text-rose-300 mt-0.5">
                      Official Announcement
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Time labels */}
        <div className="flex justify-between text-[10px] text-slate-500 mt-4" style={MONO}>
          <span>03:00</span>
          <span>06:00</span>
          <span>09:00</span>
          <span>12:00</span>
        </div>
      </div>
    </div>
  );
}
