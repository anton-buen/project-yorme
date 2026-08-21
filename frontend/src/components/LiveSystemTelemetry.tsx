const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

interface LiveSystemTelemetryProps {
  currentTime: Date;
  commuteDensity: number;
}

export default function LiveSystemTelemetry({ currentTime, commuteDensity }: LiveSystemTelemetryProps) {
  // Calculate dynamic MCDRRMO metrics based on time and conditions
  const hour = currentTime.getHours();
  const minute = currentTime.getMinutes();
  
  // Pumping station saturation (higher during rush hours and rain)
  const pumpingSaturation = commuteDensity > 0.8 
    ? Math.min(95, 75 + Math.floor(Math.random() * 15)) 
    : Math.min(65, 40 + Math.floor(Math.random() * 20));
  
  const activePumps = Math.floor((pumpingSaturation / 100) * 16);
  
  // Manila Bay tide (varies by hour - high tide around 6am and 6pm)
  const tidePattern = Math.sin((hour + minute / 60) * Math.PI / 12);
  const tideHeight = (tidePattern * 1.2 + 0.3).toFixed(1);
  const tideStatus = tidePattern > 0.3 ? 'High' : tidePattern > -0.3 ? 'Mid' : 'Low';
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-sm flex flex-col relative overflow-hidden ring-1 ring-slate-900/10">
      <div className="p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold font-sans tracking-tight text-stone-100" style={SANS}>
              MCDRRMO Telemetry
            </h2>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono bg-rose-900/30 text-rose-400 border border-rose-800">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
              LIVE
            </span>
          </div>
          <p className="text-xs text-stone-400" style={SANS}>
            Metro Manila Disaster Risk Reduction
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center py-3 border-b border-stone-800">
            <span className="font-sans text-sm text-stone-400">Inference Status</span>
            <span className="flex items-center gap-2 text-stone-100 text-sm font-semibold font-mono">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              ACTIVE
            </span>
          </div>

          <div className="flex justify-between items-center py-3 border-b border-stone-800">
            <span className="font-sans text-sm text-stone-400">System Time</span>
            <span className="text-stone-100 text-sm font-semibold font-mono">
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
            <span className="font-sans text-sm text-stone-400">Pumping Station Saturation</span>
            <span className="text-stone-100 text-sm font-semibold font-mono">
              {pumpingSaturation}% ({activePumps}/16 Active)
            </span>
          </div>

          <div className="flex justify-between items-center py-3">
            <span className="font-sans text-sm text-stone-400">Manila Bay Tide Sync</span>
            <span className="text-stone-100 text-sm font-semibold font-mono">
              {tideStatus} ({tideHeight > 0 ? '+' : ''}{tideHeight}m)
            </span>
          </div>
        </div>

        <div className="mt-6 p-3 bg-stone-950 border border-stone-800 rounded-lg">
          <p className="text-xs text-stone-400 leading-relaxed" style={SANS}>
            Real-time infrastructure and environmental parameters for Metro Manila flood risk assessment.
          </p>
        </div>
      </div>
    </div>
  );
}
