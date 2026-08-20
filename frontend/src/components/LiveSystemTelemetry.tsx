const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

interface LiveSystemTelemetryProps {
  currentTime: Date;
  commuteDensity: number;
}

export default function LiveSystemTelemetry({ currentTime, commuteDensity }: LiveSystemTelemetryProps) {
  return (
    <div className="bg-stone-900 border border-stone-800 rounded-2xl shadow-sm flex flex-col relative overflow-hidden">
      <div className="p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-stone-100" style={SERIF}>
              Live System Telemetry
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono bg-rose-900/30 text-rose-400 border border-rose-800">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              LIVE
            </span>
          </div>
          <p className="text-xs text-stone-400" style={SANS}>
            Backend Inference Monitor
          </p>
        </div>

        <div className="space-y-4" style={MONO}>
          <div className="flex justify-between items-center py-3 border-b border-stone-800">
            <span className="text-stone-400 text-sm">INFERENCE_STATUS</span>
            <span className="flex items-center gap-2 text-stone-100 text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              ACTIVE
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-stone-800">
            <span className="text-stone-400 text-sm">VECTOR_TIME</span>
            <span className="text-stone-100 text-sm font-semibold">
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
            <span className="text-stone-400 text-sm">COMMUTER_DENSITY</span>
            <span className="text-stone-100 text-sm font-semibold">
              {typeof commuteDensity === 'number' 
                ? commuteDensity.toFixed(2) 
                : (Number(commuteDensity) || 0).toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="text-stone-400 text-sm">PAGASA_API_PING</span>
            <span className="text-emerald-400 text-sm font-semibold">
              24ms
            </span>
          </div>
        </div>

        <div className="mt-6 p-3 bg-stone-950 border border-stone-800 rounded-lg">
          <p className="text-xs text-stone-400 leading-relaxed" style={SANS}>
            Real-time parameters processed by the PPO policy network for live inference decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
