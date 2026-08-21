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
import SourceLink from './SourceLink';

const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

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

const CHART_WINNER = '#e2e8f0';   // slate-200 — muted white
const CHART_MUTED = '#475569';    // slate-600
const CHART_LOCKED = '#64748b';   // slate-500
const CHART_TICK = '#94a3b8';     // slate-400 — readable on navy

interface TechnicalAppendixProps {
  isOpen: boolean;
  onClose: () => void;
  bias: BiasMode;
  setBias: (b: BiasMode) => void;
  prediction: PredictionResponse | null;
  pagasaWarning?: "NONE" | "YELLOW" | "ORANGE" | "RED";
}

function formatReward(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

function rewardTone(value: number): string {
  if (value > 0) return 'text-emerald-400';
  if (value < 0) return 'text-rose-400';
  return 'text-slate-400';
}

export default function TechnicalAppendix({ 
  isOpen, 
  onClose, 
  bias, 
  setBias, 
  prediction,
  pagasaWarning = 'NONE',
}: TechnicalAppendixProps) {
  const [activeBias, setActiveBias] = useState<BiasMode>(bias);
  
  const handleBiasChange = (newBias: BiasMode) => {
    setActiveBias(newBias);
    setBias(newBias);
  };

  const currentWeights = REWARD_PRESETS[activeBias];

  if (!isOpen) return null;

  const isRedWarning = pagasaWarning === 'RED';
  
  const chartData = prediction ? prediction.action_probabilities.map((prob, idx) => ({
    name: ACTION_SHORT[idx as ActionCode] || `A${idx}`,
    value: Math.round(prob * 100),
    isWinner: idx === prediction.ai_action_code,
    isLocked: isRedWarning && (idx === 0 || idx === 1),
  })) : [];

  const maxProb = prediction ? Math.max(...prediction.action_probabilities) : 0;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div 
        className={`absolute inset-0 bg-slate-900/50 backdrop-blur-md transition-opacity duration-300 pointer-events-auto ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />
      
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 shadow-2xl transition-transform duration-300 pointer-events-auto ring-1 ring-slate-900/40 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '70vh', overflowY: 'auto' }}
      >
        <div className="max-w-7xl mx-auto p-6 pb-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold font-sans tracking-tight text-white" style={SANS}>
                  RL Metrics
                </h2>
                <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-[10px] font-mono uppercase tracking-wider text-slate-400 rounded-sm">
                  Technical HUD
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1" style={SANS}>
                PPO Policy Weights, Tensor Shapes, and System Configuration
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 border border-transparent hover:border-slate-700 rounded-sm transition-colors"
              aria-label="Close drawer"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Col 1: Mayor Policy Bias */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-sm p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4" style={SANS}>
                Mayor Policy Bias Tuning
              </h3>
              <div className="space-y-2">
                {(['strict', 'balanced', 'protective'] as BiasMode[]).map((mode) => {
                  const isActive = activeBias === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => handleBiasChange(mode)}
                      className={`w-full p-4 rounded-sm text-left transition-all duration-200 border ${
                        isActive
                          ? 'bg-slate-800 text-white border-slate-600 border-l-[3px] border-l-slate-200 shadow-[inset_0_0_0_1px_rgba(226,232,240,0.08)]'
                          : 'bg-slate-900/40 text-slate-400 border-slate-800 hover:bg-slate-800/60 hover:text-slate-200 hover:border-slate-700'
                      }`}
                      style={SANS}
                    >
                      <div className={`font-bold capitalize text-sm ${isActive ? 'text-white' : ''}`}>
                        {mode}
                      </div>
                      <div className={`text-xs mt-1 font-mono ${isActive ? 'text-slate-400' : 'text-slate-500'}`} style={MONO}>
                        {mode === 'strict' && 'Avoid false alarms'}
                        {mode === 'balanced' && 'Default policy'}
                        {mode === 'protective' && 'Err on side of caution'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Col 2: PPO Action Probability Distribution */}
            <div className="bg-slate-950/60 border border-slate-800 rounded-sm p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4" style={SANS}>
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
                          tick={{ fontSize: 11, fill: CHART_TICK, fontFamily: "'JetBrains Mono', monospace" }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                        />
                        <YAxis 
                          type="category" 
                          dataKey="name" 
                          width={140}
                          tick={{ fontSize: 11, fill: CHART_TICK, fontFamily: "'JetBrains Mono', monospace" }}
                          axisLine={{ stroke: '#334155' }}
                          tickLine={{ stroke: '#334155' }}
                        />
                        <ReTooltip 
                          formatter={(value) => [`${value}%`, 'Probability']}
                          contentStyle={{
                            ...MONO,
                            fontSize: '12px',
                            backgroundColor: '#0f172a',
                            border: '1px solid #1e293b',
                            borderRadius: '2px',
                            color: '#e2e8f0',
                          }}
                          itemStyle={{ color: '#e2e8f0' }}
                          labelStyle={{ color: '#94a3b8' }}
                          cursor={{ fill: 'rgba(51, 65, 85, 0.35)' }}
                        />
                        <Bar dataKey="value" radius={[0, 0, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={
                                entry.isLocked 
                                  ? CHART_LOCKED
                                  : entry.isWinner 
                                    ? CHART_WINNER
                                    : CHART_MUTED
                              }
                              opacity={entry.isLocked ? 0.35 : 1}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 text-xs text-slate-500 text-center font-mono" style={MONO}>
                    Winner:{' '}
                    <span className="font-bold text-slate-200">
                      {ACTION_SHORT[prediction.ai_action_code as ActionCode]} ({Math.round(maxProb * 100)}%)
                    </span>
                  </div>
                  {isRedWarning && (
                    <div
                      className="mt-4 flex items-center justify-center gap-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-sm p-2 font-mono"
                      style={MONO}
                      role="alert"
                      aria-live="polite"
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span className="font-semibold text-rose-400">A0 & A1 Locked</span>
                      <span className="text-rose-700" aria-hidden="true">—</span>
                      <span className="text-rose-300/80">
                        <SourceLink source="depedOrder37" className="text-rose-300/90">
                          DepEd Order 37
                        </SourceLink>{' '}
                        enforces minimum A2
                      </span>
                      <span className="sr-only">Actions 0 and 1 are locked and grayed out in the chart above due to PAGASA Red Warning legal requirements.</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-64 flex items-center justify-center text-slate-600">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              )}
            </div>

            {/* Col 3: Tensor Inspector & Reward Matrix */}
            <div className="space-y-4">
              <div className="bg-slate-950/60 border border-slate-800 rounded-sm p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4" style={SANS}>
                  Active Observation Tensor
                </h3>
                {prediction ? (
                  <div className="space-y-0 font-mono text-xs" style={MONO}>
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-800">
                      <span className="text-slate-500">spatial_shape</span>
                      <span className="text-slate-200 font-medium">
                        [{prediction.obs_tensor_shapes.spatial.join(', ')}]
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 border-b border-slate-800">
                      <span className="text-slate-500">vector_channels</span>
                      <span className="text-slate-300">
                        hour, commute_density
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2.5">
                      <span className="text-slate-500">mcdrrmo_risk</span>
                      <span className="text-slate-300">
                        channel_max
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-slate-600 py-4 font-mono text-xs" style={MONO}>
                    awaiting_tensor…
                  </div>
                )}
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-sm p-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4" style={SANS}>
                  Reward Matrix Weights
                </h3>
                <div className="space-y-0 font-mono text-xs" style={MONO}>
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-800">
                    <span className="text-slate-500">early_warning (t &lt; 05:30)</span>
                    <span className={`font-bold text-sm ${rewardTone(currentWeights.earlyWarning)}`}>
                      {formatReward(currentWeights.earlyWarning)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-800">
                    <span className="text-slate-500">late_suspension (t &gt; 06:00)</span>
                    <span className={`font-bold text-sm ${rewardTone(currentWeights.lateSuspension)}`}>
                      {formatReward(currentWeights.lateSuspension)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-slate-800">
                    <span className="text-slate-500">false_alarm_penalty</span>
                    <span className={`font-bold text-sm ${rewardTone(currentWeights.falseAlarm)}`}>
                      {formatReward(currentWeights.falseAlarm)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2.5">
                    <span className="text-slate-500">status_quo_failure</span>
                    <span className={`font-bold text-sm ${rewardTone(currentWeights.statusQuoFailure)}`}>
                      {formatReward(currentWeights.statusQuoFailure)}
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
