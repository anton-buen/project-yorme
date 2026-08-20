import { X, Loader2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Cell,
  ResponsiveContainer,
  Tooltip as ReTooltip,
} from 'recharts';
import type { ActionCode, PredictionResponse } from '../types/dashboard';

const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const SAGE = { text: "#3A7050", line: "#6B9E7A" };

const ACTION_SHORT: Record<ActionCode, string> = {
  0: "A0 — Status Quo",
  1: "A1 — Shift to ADM",
  2: "A2 — Suspend Basic Ed",
  3: "A3 — Suspend All Levels",
  4: "A4 — Full Lockdown",
};

type BiasMode = "strict" | "balanced" | "protective";

interface TechnicalAppendixProps {
  isOpen: boolean;
  onClose: () => void;
  bias: BiasMode;
  setBias: (b: BiasMode) => void;
  prediction: PredictionResponse | null;
}

export default function TechnicalAppendix({ 
  isOpen, 
  onClose, 
  bias, 
  setBias, 
  prediction 
}: TechnicalAppendixProps) {
  if (!isOpen) return null;

  const chartData = prediction ? prediction.action_probabilities.map((prob, idx) => ({
    name: ACTION_SHORT[idx as ActionCode] || `A${idx}`,
    value: Math.round(prob * 100),
    color: idx === prediction.ai_action_code ? SAGE.line : "#A8A29E",
  })) : [];

  const maxProb = prediction ? Math.max(...prediction.action_probabilities) : 0;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div 
        className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-stone-200 shadow-2xl transition-transform duration-300 pointer-events-auto ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-stone-900" style={SERIF}>
                Technical Vault & Developer Metrics
              </h2>
              <p className="text-sm text-stone-600 mt-1" style={SANS}>
                PPO Policy Weights, Tensor Shapes, and System Configuration
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-6 h-6 text-stone-600" />
            </button>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Col 1: Mayor Policy Bias */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-bold text-stone-900 mb-4" style={SERIF}>
                Mayor Policy Bias Tuning
              </h3>
              <div className="space-y-3">
                {(['strict', 'balanced', 'protective'] as BiasMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setBias(mode)}
                    className={`w-full p-3 rounded-xl text-left transition-all ${
                      bias === mode 
                        ? 'bg-stone-900 text-white shadow-lg' 
                        : 'bg-stone-50 text-stone-700 hover:bg-stone-100'
                    }`}
                    style={SANS}
                  >
                    <div className="font-semibold capitalize">{mode}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {mode === 'strict' && 'Minimize False Alarms'}
                      {mode === 'balanced' && 'Default Operating Mode'}
                      {mode === 'protective' && 'Err on Side of Caution'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Col 2: PPO Action Probability Distribution */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              <h3 className="text-lg font-bold text-stone-900 mb-4" style={SERIF}>
                PPO Action Probability Distribution
              </h3>
              {prediction ? (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical">
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                        <YAxis type="category" dataKey="name" width={120} style={SANS} />
                        <ReTooltip 
                          formatter={(value) => [`${value}%`, 'Probability']}
                          contentStyle={{ ...SANS, fontSize: '12px' }}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 text-xs text-stone-600 text-center" style={SANS}>
                    Winner: <span className="font-mono font-bold" style={{ color: SAGE.text }}>
                      {ACTION_SHORT[prediction.ai_action_code as ActionCode]} ({Math.round(maxProb * 100)}%)
                    </span>
                  </div>
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-stone-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            {/* Col 3: Tensor Inspector & Reward Matrix */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-stone-200 p-6">
                <h3 className="text-lg font-bold text-stone-900 mb-4" style={SERIF}>
                  Active Observation Tensor
                </h3>
                {prediction ? (
                  <div className="space-y-2 text-sm" style={SANS}>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Spatial Shape:</span>
                      <span className="font-mono text-stone-900">
                        [{prediction.obs_tensor_shapes.spatial.join(', ')}]
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Vector Shape:</span>
                      <span className="font-mono text-stone-900">
                        [{prediction.obs_tensor_shapes.vector.join(', ')}]
                      </span>
                    </div>
                    <div className="pt-2 border-t border-stone-200 mt-3">
                      <div className="text-stone-600 text-xs mb-1">Model Path:</div>
                      <div className="font-mono text-xs text-stone-900 break-all bg-stone-50 p-2 rounded">
                        {prediction.loaded_model_path}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-stone-400">Loading...</div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-stone-200 p-6">
                <h3 className="text-lg font-bold text-stone-900 mb-4" style={SERIF}>
                  Reward Matrix Weights
                </h3>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between py-1">
                    <span className="text-stone-600">Early Warning (t &lt; 05:30):</span>
                    <span className="text-green-600 font-bold">+100</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-600">Late Suspension (t &gt; 06:00):</span>
                    <span className="text-red-600 font-bold">-1000</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-600">False Alarm Penalty:</span>
                    <span className="text-orange-600 font-bold">-50</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-stone-600">Status Quo Failure:</span>
                    <span className="text-red-700 font-bold">-2000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
