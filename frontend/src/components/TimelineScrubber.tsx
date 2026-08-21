const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };

interface TimelineScrubberProps {
  step: number;
  setStep: (step: number) => void;
  announcementStep: number;
}

const TOTAL_STEPS = 18;
const START_HOUR = 3;

const TICK_MARKS = Array.from({ length: 19 }, (_, i) => {
  const totalMinutes = START_HOUR * 60 + i * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const isHourMark = m === 0;
  
  return {
    step: i,
    hour: h,
    minute: m,
    hour12: h12,
    period: h < 12 ? 'AM' : 'PM',
    isHourMark,
    label: isHourMark ? `${String(h12).padStart(2, '0')}:00` : null,
  };
});

function getTimeLabel(step: number): string {
  const totalMinutes = START_HOUR * 60 + step * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 
    ? `${String(h12).padStart(2, '0')}:00 ${h < 12 ? 'AM' : 'PM'}`
    : `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export default function TimelineScrubber({
  step,
  setStep,
  announcementStep,
}: TimelineScrubberProps) {
  const progressPercent = (step / TOTAL_STEPS) * 100;
  const currentTimeLabel = getTimeLabel(step);
  const decisionWindowStep = 6;
  
  return (
    <div 
      className="bg-white border border-slate-200 shadow-sm ring-1 ring-slate-900/5 overflow-hidden" 
      role="region" 
      aria-label="Master Timeline Control"
    >
      {/* Compact Header Bar - Navy Anchor */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider" style={SANS}>
            Simulation Timeline
          </h3>
          <span className="text-xs text-slate-400 font-medium" style={SANS}>
            03:00 AM → 12:00 PM (9 hours)
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-slate-700 text-white rounded-sm">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-pulse" />
          <span className="text-xs font-bold" style={SANS}>
            {currentTimeLabel}
          </span>
        </div>
      </div>

      {/* Interactive Scrub Graph */}
      <div className="px-6 py-6">
        <div className="relative">
          
          {/* Clickable Track Background - Sharp Corners */}
          <div 
            className="relative h-12 bg-slate-100 rounded-sm cursor-pointer border border-slate-200"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const percent = clickX / rect.width;
              const newStep = Math.round(percent * TOTAL_STEPS);
              setStep(Math.max(0, Math.min(TOTAL_STEPS, newStep)));
            }}
          >
            {/* Progress Fill - Navy Anchor */}
            <div 
              className="absolute inset-y-0 left-0 bg-slate-900/10 rounded-sm transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />

            {/* Vertical Event Markers */}
            <div 
              className="absolute inset-y-0 w-0.5 bg-emerald-600 pointer-events-none"
              style={{ left: `${(decisionWindowStep / TOTAL_STEPS) * 100}%` }}
            >
              <div className="absolute -top-6 left-0 -translate-x-1/2">
                <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide whitespace-nowrap" style={SANS}>
                  Decision
                </div>
              </div>
            </div>

            {announcementStep >= 0 && (
              <div 
                className="absolute inset-y-0 w-0.5 bg-rose-600 pointer-events-none animate-pulse"
                style={{ left: `${(announcementStep / TOTAL_STEPS) * 100}%` }}
              >
                <div className="absolute -top-6 left-0 -translate-x-1/2">
                  <div className="text-[10px] font-bold text-rose-700 uppercase tracking-wide whitespace-nowrap" style={SANS}>
                    LGU Action
                  </div>
                </div>
              </div>
            )}

            {/* Hour Tick Marks */}
            {TICK_MARKS.filter(t => t.isHourMark).map((tick) => (
              <div
                key={tick.step}
                className="absolute inset-y-0 w-px bg-slate-300 pointer-events-none"
                style={{ left: `${(tick.step / TOTAL_STEPS) * 100}%` }}
              />
            ))}

            {/* Interactive Playhead - Navy Anchor */}
            <div 
              className="absolute inset-y-0 w-1 bg-slate-900 rounded-sm shadow-lg cursor-grab active:cursor-grabbing transition-all duration-200 hover:w-1.5"
              style={{ left: `${progressPercent}%`, transform: 'translateX(-50%)' }}
              onMouseDown={(e) => {
                e.preventDefault();
                const track = e.currentTarget.parentElement;
                if (!track) return;

                const handleMouseMove = (moveEvent: MouseEvent) => {
                  const rect = track.getBoundingClientRect();
                  const x = moveEvent.clientX - rect.left;
                  const percent = Math.max(0, Math.min(1, x / rect.width));
                  const newStep = Math.round(percent * TOTAL_STEPS);
                  setStep(newStep);
                };

                const handleMouseUp = () => {
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };

                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              }}
            >
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-3 bg-slate-900" />
            </div>
          </div>

          {/* Time Labels Below Track */}
          <div className="relative mt-6 flex justify-between">
            {TICK_MARKS.filter(t => t.isHourMark).map((tick) => (
              <div 
                key={tick.step}
                className="flex flex-col items-center"
                style={{ 
                  position: 'absolute',
                  left: `${(tick.step / TOTAL_STEPS) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                <span className="text-xs font-bold text-slate-900" style={SANS}>
                  {tick.hour12}
                </span>
                <span className="text-[10px] font-medium text-slate-500" style={SANS}>
                  {tick.period}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-6 text-[11px] text-slate-600 pt-4 border-t border-slate-200" style={SANS}>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-slate-900" />
            <span>Current Time</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm bg-emerald-600" />
            <span>Decision Window (06:00)</span>
          </div>
          {announcementStep >= 0 && (
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-sm bg-rose-600 animate-pulse" />
              <span>Official Announcement</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
