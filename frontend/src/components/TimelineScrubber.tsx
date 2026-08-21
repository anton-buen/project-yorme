import { Gavel, Megaphone, Play } from 'lucide-react';
import IconHint from './IconHint';

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
      className="bg-white border border-slate-200 shadow-sm ring-1 ring-slate-900/5 overflow-x-hidden" 
      role="region" 
      aria-label="Master Timeline Control"
    >
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

      <div className="px-6 pt-14 pb-8">
        <div className="relative">
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
            <div 
              className="absolute inset-y-0 left-0 bg-slate-900/10 rounded-sm transition-all duration-200"
              style={{ width: `${progressPercent}%` }}
            />

            {/* Decision window marker */}
            <div 
              className="absolute inset-y-0 w-0.5 bg-emerald-600 pointer-events-none"
              style={{ left: `${(decisionWindowStep / TOTAL_STEPS) * 100}%` }}
            >
              <div className="absolute -top-9 left-0 -translate-x-1/2 pointer-events-auto">
                <IconHint
                  icon={Gavel}
                  label="Decision"
                  detail="06:00 AM cutoff"
                  showLabel
                  side="bottom"
                  className="px-1.5 py-0.5 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-700"
                  iconClassName="w-3.5 h-3.5"
                  labelClassName="text-[10px] font-bold uppercase tracking-wide"
                />
              </div>
            </div>

            {announcementStep >= 0 && (
              <div 
                className="absolute inset-y-0 w-0.5 bg-rose-600 pointer-events-none animate-pulse"
                style={{ left: `${(announcementStep / TOTAL_STEPS) * 100}%` }}
              >
                <div className="absolute -top-9 left-0 -translate-x-1/2 pointer-events-auto">
                  <IconHint
                    icon={Megaphone}
                    label="LGU Action"
                    detail="Official announcement time"
                    showLabel
                    side="bottom"
                    className="px-1.5 py-0.5 rounded-sm bg-rose-50 border border-rose-200 text-rose-700"
                    iconClassName="w-3.5 h-3.5"
                    labelClassName="text-[10px] font-bold uppercase tracking-wide"
                  />
                </div>
              </div>
            )}

            {TICK_MARKS.filter(t => t.isHourMark).map((tick) => (
              <div
                key={tick.step}
                className="absolute inset-y-0 w-px bg-slate-300 pointer-events-none"
                style={{ left: `${(tick.step / TOTAL_STEPS) * 100}%` }}
              />
            ))}

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
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-px h-5 bg-slate-900" />
            </div>
          </div>

          <div className="relative mt-7 h-11">
            {TICK_MARKS.filter(t => t.isHourMark).map((tick) => (
              <div 
                key={tick.step}
                className="absolute top-0 flex flex-col items-center gap-0.5"
                style={{ 
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

        {/* Legend — icon + label */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 pt-5 border-t border-slate-200 text-slate-600">
          <IconHint
            icon={Play}
            label="Current Time"
            showLabel
            className="text-slate-700"
            iconClassName="w-3.5 h-3.5"
            labelClassName="text-[11px]"
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 shrink-0" />
          </IconHint>
          <IconHint
            icon={Gavel}
            label="Decision Window (06:00)"
            showLabel
            className="text-emerald-700"
            iconClassName="w-3.5 h-3.5"
            labelClassName="text-[11px]"
          />
          {announcementStep >= 0 && (
            <IconHint
              icon={Megaphone}
              label="Official Announcement"
              showLabel
              className="text-rose-700"
              iconClassName="w-3.5 h-3.5"
              labelClassName="text-[11px]"
            />
          )}
        </div>
      </div>
    </div>
  );
}
