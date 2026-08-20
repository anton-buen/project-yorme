import { Activity } from 'lucide-react';

const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

export default function SystemContextBanner() {
  return (
    <div className="border-b border-stone-200/50 bg-white/40">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: The What */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-12 bg-slate-800 rounded-full" />
              <h2 className="text-2xl font-bold text-slate-800" style={SERIF}>
                How it Works
              </h2>
            </div>
            
            <p className="text-base text-slate-700 leading-relaxed" style={SANS}>
              Yormetrics is a <span className="font-semibold text-slate-900">Reinforcement Learning agent</span> trained to recommend class suspension policies for Manila LGU. The system balances two competing objectives: <span className="font-medium text-emerald-800">protecting commuter safety</span> through early warnings, and <span className="font-medium text-rose-900">avoiding false alarms</span> that disrupt the economy.
            </p>
            
            <p className="text-sm text-slate-600 leading-relaxed" style={SANS}>
              All incident dates, PAGASA warnings, and official LGU decisions are <span className="font-semibold">factual historical records</span> from NDRRMC announcements. Metrics labeled as <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">Simulated Stranded</span> are mathematical projections from demographic density models.
            </p>
          </div>

          {/* Right Column: The How */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide" style={SANS}>
                Active System Configuration
              </h3>
            </div>
            
            <div className="space-y-2 text-sm" style={MONO}>
              <div className="flex justify-between items-center py-2.5 border-b border-stone-200/50">
                <span className="text-slate-600">Policy Network</span>
                <span className="text-slate-900 font-semibold">PPO</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-stone-200/50">
                <span className="text-slate-600">Observation Space</span>
                <span className="text-slate-900 font-semibold">32×32 Spatial Tensor</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-stone-200/50">
                <span className="text-slate-600">Action Space</span>
                <span className="text-slate-900 font-semibold">Discrete(5)</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-stone-200/50">
                <span className="text-slate-600">Reward Function</span>
                <span className="text-slate-900 font-semibold">Active</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-slate-600">Training Episodes</span>
                <span className="text-slate-900 font-semibold">100,000</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
