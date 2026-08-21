import { Activity, Clock, Droplets, Waves } from 'lucide-react';
import IconHint from './IconHint';

const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

interface LiveSystemTelemetryProps {
  currentTime: Date;
  commuteDensity: number;
}

export default function LiveSystemTelemetry({ currentTime, commuteDensity }: LiveSystemTelemetryProps) {
  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();
  
  const pumpingSaturation = commuteDensity > 0.8 
    ? Math.min(95, 75 + Math.floor(Math.random() * 15)) 
    : Math.min(65, 40 + Math.floor(Math.random() * 20));
  
  const activePumps = Math.floor((pumpingSaturation / 100) * 16);
  
  const tidePattern = Math.sin((hour + minute / 60) * Math.PI / 12);
  const tideHeight = (tidePattern * 1.2 + 0.3).toFixed(1);
  const tideStatus = tidePattern > 0.3 ? 'High' : tidePattern > -0.3 ? 'Mid' : 'Low';
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm flex flex-col relative overflow-hidden ring-1 ring-slate-900/10">
      <div className="p-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-bold font-sans tracking-tight text-stone-100" style={SANS}>
            MCDRRMO Telemetry
          </h2>
          <IconHint
            icon={Activity}
            label="Live"
            detail="Metro Manila Disaster Risk Reduction"
            showLabel
            className="px-2 py-0.5 rounded-sm bg-rose-900/30 border border-rose-800 text-rose-400"
            iconClassName="w-3.5 h-3.5"
            labelClassName="text-xs font-mono"
          >
            <span className="relative inline-flex">
              <Activity className="w-3.5 h-3.5" aria-hidden={true} />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            </span>
          </IconHint>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center py-3 border-b border-stone-800">
            <IconHint
              icon={Activity}
              label="Inference Status"
              showLabel
              className="text-stone-400"
              iconClassName="w-4 h-4 shrink-0"
              labelClassName="text-sm"
            />
            <span className="flex items-center gap-2 text-stone-100 text-sm font-semibold font-mono" style={MONO}>
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              ACTIVE
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-stone-800">
            <IconHint
              icon={Clock}
              label="System Time"
              detail="Asia/Manila"
              showLabel
              className="text-stone-400"
              iconClassName="w-4 h-4 shrink-0"
              labelClassName="text-sm"
            />
            <span className="text-stone-100 text-sm font-semibold font-mono" style={MONO}>
              {currentTime.toLocaleTimeString('en-US', { 
                timeZone: 'Asia/Manila',
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })} MNL
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-stone-800">
            <IconHint
              icon={Droplets}
              label="Pump Saturation"
              detail={`${activePumps}/16 pumps active`}
              showLabel
              className="text-stone-400"
              iconClassName="w-4 h-4 shrink-0"
              labelClassName="text-sm"
            />
            <span className="text-stone-100 text-sm font-semibold font-mono" style={MONO}>
              {pumpingSaturation}% ({activePumps}/16)
            </span>
          </div>

          <div className="flex justify-between items-center py-3">
            <IconHint
              icon={Waves}
              label="Manila Bay Tide"
              detail={`${tideStatus} tide`}
              showLabel
              className="text-stone-400"
              iconClassName="w-4 h-4 shrink-0"
              labelClassName="text-sm"
            />
            <span className="text-stone-100 text-sm font-semibold font-mono" style={MONO}>
              {tideStatus} ({tideHeight > 0 ? '+' : ''}{tideHeight}m)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
