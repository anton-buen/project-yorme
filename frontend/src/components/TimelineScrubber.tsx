const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };
const SAGE = { line: "#6B9E7A" };
const TERRA = { line: "#C2745A" };

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
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-stone-900 mb-1" style={SANS}>
          Simulation Timeline
        </h3>
        <p className="text-sm text-stone-600" style={SANS}>
          03:00 AM – 12:00 PM (19 steps in 30-minute intervals)
        </p>
      </div>

      {/* Timeline Strip */}
      <div className="relative">
        {/* Background line */}
        <div className="absolute top-3 left-0 right-0 h-1 bg-stone-200 rounded-full" />

        {/* Active progress line */}
        <div 
          className="absolute top-3 left-0 h-1 rounded-full transition-all duration-300"
          style={{ 
            width: `${(step / (HOUR_STEPS.length - 1)) * 100}%`,
            backgroundColor: SAGE.line 
          }}
        />

        {/* Step indicators */}
        <div className="relative flex justify-between items-center mb-3">
          {HOUR_STEPS.map((hourStep, idx) => {
            const isActive = idx === step;
            const isPassed = idx < step;
            const isAnnouncement = idx === announcementStep;

            return (
              <button
                key={idx}
                onClick={() => setStep(idx)}
                className="relative group"
                title={hourStep.label}
              >
                {/* Step circle */}
                <div
                  className={`w-6 h-6 rounded-full border-3 transition-all duration-200 ${
                    isActive 
                      ? 'scale-125 shadow-lg' 
                      : 'hover:scale-110'
                  }`}
                  style={{
                    backgroundColor: isActive 
                      ? SAGE.line 
                      : isPassed 
                      ? '#D6D3D1' 
                      : 'white',
                    borderColor: isActive 
                      ? SAGE.line 
                      : isAnnouncement 
                      ? TERRA.line 
                      : '#E7E5E4',
                    borderWidth: isAnnouncement ? '3px' : '2px',
                  }}
                />

                {/* Announcement marker */}
                {isAnnouncement && (
                  <div 
                    className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-2 h-2 rounded-full animate-pulse"
                    style={{ backgroundColor: TERRA.line }}
                  />
                )}

                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-stone-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
                     style={MONO}>
                  {hourStep.label}
                  {isAnnouncement && (
                    <span className="block text-orange-300 text-[10px]">
                      Actual Announcement
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs text-stone-500 mt-2" style={MONO}>
          <span>03:00 AM</span>
          <span>06:00 AM</span>
          <span>09:00 AM</span>
          <span>12:00 PM</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-center gap-6 text-xs" style={SANS}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2" style={{ backgroundColor: SAGE.line, borderColor: SAGE.line }} />
          <span className="text-stone-600">Active Step</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 bg-white" style={{ borderColor: TERRA.line }} />
          <span className="text-stone-600">Actual Announcement</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 bg-stone-300 border-stone-300" />
          <span className="text-stone-600">Passed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 bg-white border-stone-200" />
          <span className="text-stone-600">Future</span>
        </div>
      </div>
    </div>
  );
}
