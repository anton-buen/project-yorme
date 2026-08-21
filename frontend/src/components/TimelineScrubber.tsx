const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

interface TimelineScrubberProps {
  step: number;
  setStep: (step: number) => void;
  announcementStep: number;
}

// Total steps: 0-18 (19 intervals from 03:00 AM to 12:00 PM)
const TOTAL_STEPS = 18;

// Key milestones (step indices)
const MILESTONE_START = 0;        // 03:00 AM
const MILESTONE_DECISION = 6;     // 06:00 AM (3 hours into simulation)
const MILESTONE_END = 18;         // 12:00 PM

function getTimeLabel(step: number): string {
  const totalMinutes = 3 * 60 + step * 30; // Start at 03:00 AM
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

export default function TimelineScrubber({
  step,
  announcementStep,
}: TimelineScrubberProps) {
  // Calculate progress percentage (0-100%)
  const progressPercent = (step / TOTAL_STEPS) * 100;
  
  return (
    <div className="py-6 bg-white rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5" role="region" aria-label="Event Track - Read-only Timeline Status">
      <div className="mb-6 text-center px-6">
        <h3 className="text-lg font-bold font-sans tracking-tight text-slate-800 mb-1" style={SANS}>
          Event Track
        </h3>
        <p className="text-xs text-slate-500" style={SANS}>
          Read-only status indicator • Use top navigation to change time
        </p>
      </div>

      <div className="px-8">
        {/* Horizontal Progress Bar */}
        <div className="relative mb-8">
          {/* Base track */}
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
            {/* Progress fill */}
            <div 
              className="h-full bg-gradient-to-r from-slate-400 to-blue-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Milestone Markers */}
          <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
            {/* Start Time (03:00 AM) */}
            <div 
              className="absolute -translate-x-1/2"
              style={{ left: `${(MILESTONE_START / TOTAL_STEPS) * 100}%` }}
            >
              <div className="w-3 h-3 rounded-full bg-slate-400 border-2 border-white shadow-sm" />
            </div>

            {/* Decision Window (06:00 AM) */}
            <div 
              className="absolute -translate-x-1/2"
              style={{ left: `${(MILESTONE_DECISION / TOTAL_STEPS) * 100}%` }}
            >
              <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
            </div>

            {/* LGU Announcement (if applicable) */}
            {announcementStep >= 0 && (
              <div 
                className="absolute -translate-x-1/2"
                style={{ left: `${(announcementStep / TOTAL_STEPS) * 100}%` }}
              >
                <div className="w-3 h-3 rounded-full bg-rose-500 border-2 border-white shadow-sm animate-pulse" />
              </div>
            )}

            {/* Current Time Marker */}
            <div 
              className="absolute -translate-x-1/2 z-10"
              style={{ left: `${progressPercent}%` }}
            >
              <div className="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-lg" />
            </div>

            {/* End Time (12:00 PM) */}
            <div 
              className="absolute -translate-x-1/2"
              style={{ left: `${(MILESTONE_END / TOTAL_STEPS) * 100}%` }}
            >
              <div className="w-3 h-3 rounded-full bg-slate-300 border-2 border-white shadow-sm" />
            </div>
          </div>
        </div>

        {/* Milestone Labels */}
        <div className="relative h-12 mb-4">
          {/* Start Time */}
          <div 
            className="absolute -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${(MILESTONE_START / TOTAL_STEPS) * 100}%` }}
          >
            <span className="text-xs font-mono font-semibold text-slate-700">03:00 AM</span>
            <span className="text-[10px] text-slate-400" style={SANS}>Start</span>
          </div>

          {/* Decision Window */}
          <div 
            className="absolute -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${(MILESTONE_DECISION / TOTAL_STEPS) * 100}%` }}
          >
            <span className="text-xs font-mono font-semibold text-emerald-700">06:00 AM</span>
            <span className="text-[10px] text-emerald-600" style={SANS}>Decision Window</span>
          </div>

          {/* Current Time */}
          <div 
            className="absolute -translate-x-1/2 flex flex-col items-center z-10"
            style={{ left: `${progressPercent}%` }}
          >
            <span className="text-xs font-mono font-bold text-blue-700">{getTimeLabel(step)}</span>
            <span className="text-[10px] text-blue-600" style={SANS}>Current</span>
          </div>

          {/* End Time */}
          <div 
            className="absolute -translate-x-1/2 flex flex-col items-center"
            style={{ left: `${(MILESTONE_END / TOTAL_STEPS) * 100}%` }}
          >
            <span className="text-xs font-mono font-semibold text-slate-700">12:00 PM</span>
            <span className="text-[10px] text-slate-400" style={SANS}>End</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 pt-4 border-t border-stone-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm"></div>
            <span className="text-xs text-slate-600" style={SANS}>Current Time</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
            <span className="text-xs text-slate-600" style={SANS}>Decision Window</span>
          </div>
          {announcementStep >= 0 && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500 border-2 border-white shadow-sm"></div>
              <span className="text-xs text-slate-600" style={SANS}>LGU Announcement</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
