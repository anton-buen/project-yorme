const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };

interface TimelineScrubberProps {
  step: number;
  announcementStep: number;
}

// Total steps: 0-18 (19 intervals from 03:00 AM to 12:00 PM)
const TOTAL_STEPS = 18;

// Time blocks for segmented ruler (every 3 hours = 6 steps)
const TIME_BLOCKS = [
  { step: 0, hour: 3, label: '03:00', period: 'AM' },
  { step: 6, hour: 6, label: '06:00', period: 'AM' },
  { step: 12, hour: 9, label: '09:00', period: 'AM' },
  { step: 18, hour: 12, label: '12:00', period: 'PM' },
];

function getTimeLabel(step: number): { hour: string; period: string } {
  const totalMinutes = 3 * 60 + step * 30;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const formattedTime = m === 0 ? String(h12).padStart(2, "0") : `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return {
    hour: formattedTime,
    period: h < 12 ? "AM" : "PM"
  };
}

export default function TimelineScrubber({
  step,
  announcementStep,
}: TimelineScrubberProps) {
  const currentTime = getTimeLabel(step);
  const progressPercent = (step / TOTAL_STEPS) * 100;
  
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
        {/* Segmented Ruler Track */}
        <div className="relative">
          {/* Time block segments */}
          <div className="grid grid-cols-3 h-12 mb-8">
            {[0, 1, 2].map((blockIdx) => {
              const blockStart = blockIdx * 6;
              const blockEnd = (blockIdx + 1) * 6;
              const isFilled = step >= blockEnd;
              const isPartial = step > blockStart && step < blockEnd;
              const partialPercent = isPartial ? ((step - blockStart) / 6) * 100 : 0;
              
              return (
                <div
                  key={blockIdx}
                  className={`relative border-r-2 border-slate-300 last:border-r-0 ${
                    isFilled ? 'bg-blue-100' : isPartial ? 'bg-gradient-to-r from-blue-100 to-transparent' : 'bg-slate-50'
                  }`}
                  style={isPartial ? { 
                    background: `linear-gradient(to right, rgb(219 234 254) ${partialPercent}%, rgb(248 250 252) ${partialPercent}%)`
                  } : undefined}
                >
                  {/* Vertical divider lines for visual precision */}
                  <div className="absolute inset-y-0 right-0 w-px bg-slate-400" />
                </div>
              );
            })}
          </div>

          {/* Direct Badge Injection */}
          <div className="absolute top-0 left-0 right-0 h-12 pointer-events-none">
            {/* Decision Window Badge (06:00 AM) */}
            <div 
              className="absolute -translate-x-1/2"
              style={{ left: `${(6 / TOTAL_STEPS) * 100}%`, top: '-2rem' }}
            >
              <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 whitespace-nowrap">
                Decision Window
              </div>
            </div>

            {/* LGU Announcement Badge */}
            {announcementStep >= 0 && (
              <div 
                className="absolute -translate-x-1/2"
                style={{ left: `${(announcementStep / TOTAL_STEPS) * 100}%`, top: '-2rem' }}
              >
                <div className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-full border border-rose-200 animate-pulse whitespace-nowrap">
                  LGU Announcement
                </div>
              </div>
            )}

            {/* Current Time Badge */}
            <div 
              className="absolute -translate-x-1/2 z-10"
              style={{ left: `${progressPercent}%`, top: '-2rem' }}
            >
              <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg whitespace-nowrap">
                Current: {currentTime.hour} {currentTime.period}
              </div>
            </div>
          </div>
        </div>

        {/* Elevated Time Labels */}
        <div className="grid grid-cols-4 relative -mt-2">
          {TIME_BLOCKS.map((block, idx) => (
            <div key={idx} className="flex flex-col items-start" style={{ gridColumn: idx === 3 ? '4' : `${idx + 1}` }}>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900" style={SANS}>
                  {block.label.split(':')[0]}
                </span>
                {block.label.includes(':') && (
                  <span className="text-lg font-black text-slate-900" style={SANS}>
                    :{block.label.split(':')[1]}
                  </span>
                )}
                <span className="text-sm font-semibold text-slate-500 ml-1" style={SANS}>
                  {block.period}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
