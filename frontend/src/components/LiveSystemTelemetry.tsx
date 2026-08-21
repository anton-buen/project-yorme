import {
  Activity,
  Clock,
  Droplets,
  Waves,
  Scale,
  Satellite,
  Database,
} from 'lucide-react';
import IconHint from './IconHint';
import SourceLink from './SourceLink';

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
    <div
      id="step-telemetry"
      className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm flex flex-col relative overflow-hidden ring-1 ring-slate-900/10 h-full"
    >
      <div className="p-6 sm:p-8 flex flex-col gap-6 flex-1">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h2 className="text-2xl font-bold font-sans tracking-tight text-stone-100" style={SANS}>
              <SourceLink source="mdrrmo" className="text-stone-100 hover:text-white no-underline decoration-transparent">
                MDRRMO
              </SourceLink>{' '}
              Telemetry
            </h2>
            <IconHint
              icon={Activity}
              label="Live"
              detail="Manila Disaster Risk Reduction and Management Office"
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
          <p className="text-xs text-stone-500" style={SANS}>
            Manila Disaster Risk Reduction and Management Office
          </p>
        </div>

        <div className="space-y-0">
          <div className="flex justify-between items-center py-2.5 border-b border-stone-800">
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

          <div className="flex justify-between items-center py-2.5 border-b border-stone-800">
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

          <div className="flex justify-between items-center py-2.5 border-b border-stone-800">
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

          <div className="flex justify-between items-center py-2.5">
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

        {/* Statutory mandate — muted white, no section header */}
        <div className="flex gap-3 p-3 rounded-sm bg-slate-950/60 border border-slate-800">
          <Scale className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" aria-hidden={true} />
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-200 mb-0.5" style={SANS}>
              Statutory Mandate{' '}
              <SourceLink source="ra10121" className="text-slate-300">
                (RA 10121)
              </SourceLink>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed" style={SANS}>
              Official executive body for local hazard monitoring, early warning, and disaster
              preparedness in the City of Manila.
            </p>
          </div>
        </div>

        {/* Backend ingest */}
        <div className="mt-auto pt-2 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-3.5 h-3.5 text-slate-500" aria-hidden={true} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500" style={SANS}>
              Backend Ingest Pipelines
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-mono">
              <Satellite className="w-3 h-3 text-slate-500" aria-hidden={true} />
              <SourceLink source="pagasa" className="text-slate-400">
                PAGASA
              </SourceLink>{' '}
              Doppler + Himawari
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-mono">
              Open-Meteo / synoptic
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-mono">
              incidents.json archive
            </span>
          </div>
          <p className="mt-2 text-[10px] text-slate-600 leading-relaxed" style={SANS}>
            Radar mapped over Metro Manila (14.5995°N, 120.9842°E). Replay mode streams pre-processed
            hourly tensors from 13 calibrated historical scenarios.
          </p>
        </div>
      </div>
    </div>
  );
}
