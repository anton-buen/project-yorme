import { useState } from 'react';
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

const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };

const ACTION_SHORT: Record<ActionCode, string> = {
  0: "A0 — Status Quo",
  1: "A1 — Shift to ADM",
  2: "A2 — Suspend Basic Ed",
  3: "A3 — Suspend All Levels",
  4: "A4 — Full Lockdown",
};

type BiasMode = "strict" | "balanced" | "protective";

interface RewardWeights {
  earlyWarning: number;
  lateSuspension: number;
  falseAlarm: number;
  statusQuoFailure: number;
}

const REWARD_PRESETS: Record<BiasMode, RewardWeights> = {
  strict: {
    earlyWarning: 100,
    lateSuspension: -1000,
    falseAlarm: -500,
    statusQuoFailure: -2000,
  },
  balanced: {
    earlyWarning: 100,
    lateSuspension: -1000,
    falseAlarm: -50,
    statusQuoFailure: -2000,
  },
  protective: {
    earlyWarning: 100,
    lateSuspension: -5000,
    falseAlarm: -50,
    statusQuoFailure: -2000,
  },
};

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
  const [activeBias, setActiveBias] = useState<BiasMode>('balanced');
  
  const handleBiasChange = (newBias: BiasMode) => {
    setActiveBias(newBias);
    setBias(newBias);
  };

  const currentWeights = REWARD_PRESETS[activeBias];

  if (!isOpen) return null;

  const chartData = prediction ? prediction.action_probabilities.map((prob, idx) => ({
    name: ACTION_SHORT[idx as ActionCode] || `A${idx}`,
    value: Math.round(prob * 100),
    isWinner: idx === prediction.ai_action_code,
  })) : [];

  const maxProb = prediction ? Math.max(...prediction.action_probabilities) : 0;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div 
        className={`absolute inset-0 bg-stone-900/20 backdrop-blur-md transition-opacity duration-300 pointer-events-auto ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-white border-t border-stone-200/80 shadow-2xl transition-transform duration-300 pointer-events-auto ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        <div className="max-w-7xl mx-auto p-6 pb-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold font-sans tracking-tight text-slate-900" style={SANS}>
                RL Metrics
              </h2>
              <p className="text-sm text-slate-600 mt-1" style={SANS}>
                PPO Policy Weights, Tensor Shapes, and System Configuration
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-6 h-6 text-slate-600" />
            </button>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Col 1: Mayor Policy Bias */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm">
              <h3 className="text-lg font-bold font-sans tracking-tight text-slate-900 mb-4" style={SANS}>
                Mayor Policy Bias Tuning
              </h3>
              <div className="space-y-3">
                {(['strict', 'balanced', 'protective'] as BiasMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => handleBiasChange(mode)}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98] ${
                      activeBias === mode 
                        ? 'bg-stone-900 text-white shadow-md' 
                        : 'bg-stone-50 text-stone-700 hover:bg-stone-100 border border-stone-200/50'
                    }`}
                    style={SANS}
                  >
                    <div className="font-bold capitalize text-base">{mode}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {mode === 'strict' && 'Avoid false alarms'}
                      {mode === 'balanced' && 'Default policy'}
                      {mode === 'protective' && 'Err on side of caution'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Col 2: PPO Action Probability Distribution */}
            <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm">
              <h3 className="text-lg font-bold font-sans tracking-tight text-slate-900 mb-4" style={SANS}>
                PPO Action Probability Distribution
              </h3>
              {prediction ? (
                <>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 10, top: 10, bottom: 10 }}>
                        <XAxis 
                          type="number" 
                          domain={[0, 100]} 
                          tickFormatter={(value) => `${value}%`}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={140}
                          tick={{ fontSize: 11, ...SANS }}
                        />
                        <ReTooltip 
                          formatter={(value) => [`${value}%`, 'Probability']}
                          contentStyle={{ ...SANS, fontSize: '12px' }}
                        />
                        <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.isWinner ? '#4d7c5f' : '#d6d3d1'} 
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 text-xs text-stone-600 text-center" style={SANS}>
                    Winner: <span className="font-mono font-bold text-emerald-800">
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
              <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm">
                <h3 className="text-lg font-bold font-sans tracking-tight text-slate-900 mb-4" style={SANS}>
                  Active Observation Tensor
                </h3>
                {prediction ? (
                  <div className="space-y-3 text-sm" style={SANS}>
                    <div className="flex justify-between items-center py-2 border-b border-stone-100">
                      <span className="text-stone-600 font-medium">Spatial Shape:</span>
                      <span className="font-mono text-stone-900 font-semibold">
                        [{prediction.obs_tensor_shapes.spatial.join(', ')}]
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-stone-100">
                      <span className="text-stone-600 font-medium">Vector:</span>
                      <span className="font-mono text-stone-900 text-xs">
                        Hour, Commute Density
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-stone-600 font-medium">MCDRRMO Risk:</span>
                      <span className="font-mono text-stone-900 text-xs">
                        Channel Max
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-stone-400 py-4">Loading...</div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-stone-200/80 p-6 shadow-sm">
                <h3 className="text-lg font-bold font-sans tracking-tight text-slate-900 mb-4" style={SANS}>
                  Reward Matrix Weights
                </h3>
                <div className="space-y-2.5 text-sm font-mono">
                  <div className="flex justify-between items-center py-2 border-b border-stone-100">
                    <span className="text-stone-600">Early Warning (t &lt; 05:30):</span>
                    <span className="font-bold text-base text-emerald-800">
                      {currentWeights.earlyWarning > 0 ? '+' : ''}{currentWeights.earlyWarning}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-stone-100">
                    <span className="text-stone-600">Late Suspension (t &gt; 06:00):</span>
                    <span className="font-bold text-base text-rose-900">
                      {currentWeights.lateSuspension}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-stone-100">
                    <span className="text-stone-600">False Alarm Penalty:</span>
                    <span className="font-bold text-base text-amber-800">
                      {currentWeights.falseAlarm}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-stone-600">Status Quo Failure:</span>
                    <span className="font-bold text-base text-rose-900">
                      {currentWeights.statusQuoFailure}
                    </span>
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
