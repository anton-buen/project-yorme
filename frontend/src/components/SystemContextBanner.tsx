import { Activity, X } from 'lucide-react';

const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

interface SystemContextBannerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function SystemContextBanner({ isOpen = true, onClose }: SystemContextBannerProps) {
  if (!isOpen) return null;

  const isModal = typeof onClose === 'function';

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div 
          className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto"
          onClick={onClose}
        />
        
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border border-stone-200 rounded-2xl shadow-2xl transition-transform duration-300 pointer-events-auto max-w-5xl w-full mx-4"
          style={{ maxHeight: '80vh', overflowY: 'auto' }}
        >
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold font-sans tracking-tight text-slate-900" style={SANS}>
                How it Works
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              
              {/* Left Column: The What */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-12 bg-slate-800 rounded-full" />
                  <h3 className="text-2xl font-bold font-sans tracking-tight text-slate-800" style={SANS}>
                    The AI Decision System
                  </h3>
                </div>
                
                <p className="text-base text-slate-700 leading-relaxed" style={SANS}>
                  YORME-TRICS uses an AI trained on historical disaster response data from NDRRMC to recommend class suspension policies for Manila. The system balances two critical objectives: <span className="font-semibold text-emerald-800">protecting commuter safety</span> through early warnings, and <span className="font-semibold text-amber-800">minimizing false alarms</span> to preserve instructional days.
                </p>
                
                <p className="text-sm text-slate-600 leading-relaxed" style={SANS}>
                  All incident dates, PAGASA warnings, and official LGU decisions shown in the dashboard are <span className="font-semibold">factual historical records</span>. The AI learned optimal decision patterns by analyzing years of real-world outcomes, measuring success by reduced stranded students and preserved school days.
                </p>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900 leading-relaxed" style={SANS}>
                    <span className="font-semibold">Key Insight:</span> The AI weighs <span className="font-medium">Commuter Safety</span> (preventing students from being stranded in floods) against <span className="font-medium">Instructional Hours Lost</span> (maintaining educational continuity). This trade-off is explicitly learned from historical data.
                  </p>
                </div>
              </div>

              {/* Right Column: The How */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-4 h-4 text-slate-600" />
                  <h4 className="text-sm font-semibold text-slate-700 uppercase tracking-wide" style={SANS}>
                    System Configuration
                  </h4>
                </div>
                
                <div className="space-y-2 text-sm" style={SANS}>
                  <div className="flex justify-between items-center py-2.5 border-b border-stone-200/50">
                    <span className="text-slate-600">AI Model Type</span>
                    <span className="text-slate-900 font-semibold">PPO Neural Network</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-stone-200/50">
                    <span className="text-slate-600">Data Input</span>
                    <span className="text-slate-900 font-semibold">Radar + Weather Grid</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-stone-200/50">
                    <span className="text-slate-600">Decision Options</span>
                    <span className="text-slate-900 font-semibold">5 Action Levels (A0-A4)</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-stone-200/50">
                    <span className="text-slate-600">Training Data Source</span>
                    <span className="text-slate-900 font-semibold">NDRRMC Historical</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-slate-600">Training Iterations</span>
                    <span className="text-slate-900 font-semibold">100,000 Scenarios</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <p className="text-xs text-slate-600 leading-relaxed" style={SANS}>
                    <span className="font-semibold text-slate-800">Technical Note:</span> The AI uses a 32×32 spatial tensor (weather radar grid) combined with PAGASA warnings to predict optimal suspension timing. The model was trained on 100,000 simulated disaster scenarios derived from real NDRRMC incident patterns.
                  </p>
                </div>
              </div>
              
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Original banner display (kept for backward compatibility if needed)
  return (
    <div className="border-b border-stone-200/50 bg-white/40">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Left Column: The What */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-12 bg-slate-800 rounded-full" />
              <h2 className="text-2xl font-bold font-sans tracking-tight text-slate-800" style={SANS}>
                The AI Decision System
              </h2>
            </div>
            
            <p className="text-base text-slate-700 leading-relaxed" style={SANS}>
              YORME-TRICS uses an AI trained on historical disaster response data from NDRRMC to recommend class suspension policies for Manila. The system balances two critical objectives: <span className="font-semibold text-emerald-800">protecting commuter safety</span> through early warnings, and <span className="font-semibold text-amber-800">minimizing false alarms</span> to preserve instructional days.
            </p>
            
            <p className="text-sm text-slate-600 leading-relaxed" style={SANS}>
              All incident dates, PAGASA warnings, and official LGU decisions shown in the dashboard are <span className="font-semibold">factual historical records</span>. The AI learned optimal decision patterns by analyzing years of real-world outcomes, measuring success by reduced stranded students and preserved school days.
            </p>
          </div>

          {/* Right Column: The How */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide" style={SANS}>
                System Configuration
              </h3>
            </div>
            
            <div className="space-y-2 text-sm" style={SANS}>
              <div className="flex justify-between items-center py-2.5 border-b border-stone-200/50">
                <span className="text-slate-600">AI Model Type</span>
                <span className="text-slate-900 font-semibold">PPO Neural Network</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-stone-200/50">
                <span className="text-slate-600">Data Input</span>
                <span className="text-slate-900 font-semibold">Radar + Weather Grid</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-stone-200/50">
                <span className="text-slate-600">Decision Options</span>
                <span className="text-slate-900 font-semibold">5 Action Levels (A0-A4)</span>
              </div>
              <div className="flex justify-between items-center py-2.5 border-b border-stone-200/50">
                <span className="text-slate-600">Training Data Source</span>
                <span className="text-slate-900 font-semibold">NDRRMC Historical</span>
              </div>
              <div className="flex justify-between items-center py-2.5">
                <span className="text-slate-600">Training Iterations</span>
                <span className="text-slate-900 font-semibold">100,000 Scenarios</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
