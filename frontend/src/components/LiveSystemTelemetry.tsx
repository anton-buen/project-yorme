import {
  Activity,
  Clock,
  Droplets,
  Waves,
  Scale,
  GitBranch,
  Users,
  Grid3x3,
  Binary,
  ShieldCheck,
  Satellite,
  Database,
  Eye,
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

  const minutesToDeadline = (() => {
    const now = hour * 60 + minute;
    const deadline = 5 * 60 + 30;
    return deadline - now;
  })();
  
  return (
    <div
      id="step-telemetry"
      className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm flex flex-col relative overflow-hidden ring-1 ring-slate-900/10 h-full"
    >
      <div className="p-6 sm:p-8 flex flex-col gap-6 flex-1">
        {/* Header */}
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

        {/* Live metrics */}
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

          <div className="flex justify-between items-center py-2.5 border-b border-stone-800">
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

          <div className="flex justify-between items-center py-2.5">
            <IconHint
              icon={Clock}
              label="05:30 Decision Window"
              detail="Statutory announcement deadline"
              showLabel
              className="text-stone-400"
              iconClassName="w-4 h-4 shrink-0"
              labelClassName="text-sm"
            />
            <span
              className={`text-sm font-semibold font-mono ${
                minutesToDeadline >= 0 && minutesToDeadline <= 90
                  ? 'text-amber-400'
                  : 'text-stone-100'
              }`}
              style={MONO}
            >
              {minutesToDeadline > 0
                ? `T−${Math.floor(minutesToDeadline / 60)}h ${String(minutesToDeadline % 60).padStart(2, '0')}m`
                : minutesToDeadline === 0
                  ? 'NOW'
                  : 'PASSED'}
            </span>
          </div>
        </div>

        {/* Why MDRRMO — structured mandate strip */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-emerald-500 rounded-sm" />
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-stone-500" style={SANS}>
              Why MDRRMO is the Target Agency
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex gap-3 p-3 rounded-sm bg-stone-950/80 border border-stone-800">
              <Scale className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" aria-hidden={true} />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-stone-200 mb-0.5" style={SANS}>
                  Statutory Mandate{' '}
                  <SourceLink source="ra10121" className="text-emerald-400/90">
                    (RA 10121)
                  </SourceLink>
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed" style={SANS}>
                  Official executive body for local hazard monitoring, early warning, and disaster
                  preparedness in the City of Manila.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-3 rounded-sm bg-stone-950/80 border border-stone-800">
              <GitBranch className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" aria-hidden={true} />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-stone-200 mb-0.5" style={SANS}>
                  Decision Pipeline
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed" style={SANS}>
                  The City Mayor holds final authority;{' '}
                  <SourceLink source="mdrrmo" className="text-stone-400">
                    MDRRMO
                  </SourceLink>{' '}
                  evaluates weather in real time and drafts the technical suspension recommendation.
                </p>
              </div>
            </div>
            <div className="flex gap-3 p-3 rounded-sm bg-stone-950/80 border border-stone-800">
              <Users className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" aria-hidden={true} />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-stone-200 mb-0.5" style={SANS}>
                  Target User Persona
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed" style={SANS}>
                  Built for MDRRMO analysts and command operators who must evaluate spatial radar
                  tensors before the 05:30 AM deadline.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Observation vector Ot — dual role */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-4 bg-blue-500 rounded-sm" />
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-stone-500" style={SANS}>
              Dual Role — XAI + Observation Vector O<sub className="text-[8px]">t</sub>
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-3 rounded-sm border border-stone-800 bg-stone-950/60">
              <div className="flex items-center gap-1.5 mb-1">
                <Eye className="w-3.5 h-3.5 text-blue-400" aria-hidden={true} />
                <span className="text-[10px] font-bold uppercase tracking-wide text-blue-300" style={SANS}>
                  Explainable AI
                </span>
              </div>
              <p className="text-[11px] text-stone-500 leading-snug" style={SANS}>
                Operators verify why A4 fired—not a black box.
              </p>
            </div>
            <div className="p-3 rounded-sm border border-stone-800 bg-stone-950/60">
              <div className="flex items-center gap-1.5 mb-1">
                <Binary className="w-3.5 h-3.5 text-emerald-400" aria-hidden={true} />
                <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-300 font-mono">
                  State Input O_t
                </span>
              </div>
              <p className="text-[11px] text-stone-500 leading-snug" style={SANS}>
                Exact observation vector fed to the PPO policy each timestep.
              </p>
            </div>
          </div>

          {/* Pipeline chips */}
          <div className="flex flex-col gap-1.5 font-mono text-[10px]" style={MONO}>
            <div className="flex items-start gap-2 px-2.5 py-2 rounded-sm bg-slate-950 border border-slate-800">
              <Grid3x3 className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" aria-hidden={true} />
              <div>
                <span className="text-stone-300">spatial</span>
                <span className="text-stone-600"> — </span>
                <span className="text-stone-500">32×32 dBZ grid → CNN feature maps</span>
              </div>
            </div>
            <div className="flex items-start gap-2 px-2.5 py-2 rounded-sm bg-slate-950 border border-slate-800">
              <Activity className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" aria-hidden={true} />
              <div>
                <span className="text-stone-300">scalar</span>
                <span className="text-stone-600"> — </span>
                <span className="text-stone-500">mm/hr, pressure, Δt to 05:30 → MLP branch</span>
              </div>
            </div>
            <div className="flex items-start gap-2 px-2.5 py-2 rounded-sm bg-slate-950 border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" aria-hidden={true} />
              <div>
                <span className="text-stone-300">policy</span>
                <span className="text-stone-600"> — </span>
                <span className="text-stone-500">P(A_t | O_t) → A0–A4 tier</span>
              </div>
            </div>
          </div>
        </div>

        {/* Auditability + Trust */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-sm border-l-2 border-l-emerald-600 border border-stone-800 bg-stone-950/40">
            <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-400 mb-1" style={SANS}>
              Auditability
            </div>
            <p className="text-[11px] text-stone-500 leading-snug" style={SANS}>
              Raw met evidence (e.g. rainfall &gt; 35 mm/hr at 04:45) backs every prediction.
            </p>
          </div>
          <div className="p-3 rounded-sm border-l-2 border-l-blue-500 border border-stone-800 bg-stone-950/40">
            <div className="text-[10px] font-bold uppercase tracking-wide text-blue-400 mb-1" style={SANS}>
              Trust &amp; Verification
            </div>
            <p className="text-[11px] text-stone-500 leading-snug" style={SANS}>
              Confirms the live API feed is active—not stale—during an ongoing typhoon.
            </p>
          </div>
        </div>

        {/* Data provenance */}
        <div className="mt-auto pt-2 border-t border-stone-800">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-3.5 h-3.5 text-stone-500" aria-hidden={true} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500" style={SANS}>
              Backend Ingest Pipelines
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-stone-950 border border-stone-800 text-[10px] text-stone-400 font-mono">
              <Satellite className="w-3 h-3 text-stone-500" aria-hidden={true} />
              <SourceLink source="pagasa" className="text-stone-400">
                PAGASA
              </SourceLink>{' '}
              Doppler + Himawari
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-stone-950 border border-stone-800 text-[10px] text-stone-400 font-mono">
              Open-Meteo / synoptic
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-stone-950 border border-stone-800 text-[10px] text-stone-400 font-mono">
              incidents.json archive
            </span>
          </div>
          <p className="mt-2 text-[10px] text-stone-600 leading-relaxed" style={SANS}>
            Radar mapped over Metro Manila (14.5995°N, 120.9842°E). Replay mode streams pre-processed
            hourly tensors from 13 calibrated historical scenarios.
          </p>
        </div>
      </div>
    </div>
  );
}
