const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };

interface TimelineScrubberProps {
  step: number;
  announcementStep: number;
}

// Total steps: 0-18 (19 intervals from 03:00 AM to 12:00 PM = 540 minutes)
const TOTAL_STEPS = 18;
const START_HOUR = 3; // 3:00 AM
const TOTAL_MINUTES = 9 * 60; // 9-hour window

// Generate all tick marks (19 total: 0, 1, 2, ... 18)
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
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

export default function TimelineScrubber({
  step,
  announcementStep,
}: TimelineScrubberProps) {
  const progressPercent = (step / TOTAL_STEPS) * 100;
  const currentTimeLabel = getTimeLabel(step);
  
  // Calculate elapsed minutes for precise positioning
  const elapsedMinutes = step * 30;
  const decisionWindowPercent = (6 / TOTAL_STEPS) * 100; // 06:00 AM is step 6
  const announcementPercent = announcementStep >= 0 ? (announcementStep / TOTAL_STEPS) * 100 : null;
  
  return (
    <div className="py-6 bg-white rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5" role="region" aria-label="Incident Timeline">
      {/* Header */}
      <div className="mb-6 px-8">
        <h3 className="text-xl font-bold font-sans tracking-tight text-slate-900 mb-1" style={SANS}>
          Incident Timeline
        </h3>
        <p className="text-xs font-medium text-slate-500" style={SANS}>
          Decision Milestones • 9-Hour Simulation Window
        </p>
      </div>

      <div className="px-8">
        {/* Tick-Mark Ruler with Badges */}
        <div className="relative pt-16 pb-12">
          
          {/* Progress Fill (Behind Axis) */}
          <div 
            className="absolute top-16 left-0 h-1 bg-blue-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
          
          {/* Main Axis Line */}
          <div className="relative border-b-2 border-slate-900 h-1">
            
            {/* Tick Marks */}
            {TICK_MARKS.map((tick) => {
              const position = (tick.step / TOTAL_STEPS) * 100;
              
              return (
                <div
                  key={tick.step}
                  className="absolute -translate-x-1/2"
                  style={{ left: `${position}%`, bottom: 0 }}
                >
                  {/* Tick Line */}
                  <div 
                    className={`${
                      tick.isHourMark 
                        ? 'h-4 border-l-2 border-slate-900' 
                        : 'h-2 border-l border-slate-400'
                    }`}
                  />
                  
                  {/* Hour Label (only for hour marks) */}
                  {tick.isHourMark && (
                    <div className="absolute top-6 -translate-x-1/2 left-1/2 whitespace-nowrap">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-slate-900" style={SANS}>
                          {tick.label}
                        </span>
                        <span className="text-sm font-semibold text-slate-500" style={SANS}>
                          {tick.period}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Badges Above Axis */}
          <div className="absolute top-0 left-0 right-0 pointer-events-none">
            
            {/* Decision Window Badge (Static) - Staggered Lower */}
            <div 
              className="absolute -translate-x-1/2"
              style={{ left: `${decisionWindowPercent}%`, top: '2.5rem' }}
            >
              <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-300 whitespace-nowrap shadow-sm">
                Decision Window
              </div>
            </div>

            {/* LGU Announcement Badge (Static) - Staggered Higher */}
            {announcementPercent !== null && (
              <div 
                className="absolute -translate-x-1/2"
                style={{ left: `${announcementPercent}%`, top: '0rem' }}
              >
                <div className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1.5 rounded-full border border-rose-300 animate-pulse whitespace-nowrap shadow-sm">
                  LGU Announcement
                </div>
              </div>
            )}

            {/* Current Time Badge (Dynamic) - Top Layer */}
            <div 
              className="absolute -translate-x-1/2 z-10 transition-all duration-300"
              style={{ left: `${progressPercent}%`, top: '0.5rem' }}
            >
              <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap border-2 border-white">
                Current: {currentTimeLabel}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
