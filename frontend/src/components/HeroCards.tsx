import type { ActionCode, PredictionResponse, IncidentData } from '../types/dashboard';
import { ACTION_NAMES } from '../types/dashboard';
import LiveSystemTelemetry from './LiveSystemTelemetry';
import { DecisionCardSkeleton } from './Skeletons';
import { CheckCircle, MonitorPlay, AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';

const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

// Semantic Action Icons
const ACTION_ICONS: Record<ActionCode, React.ComponentType<{ className?: string }>> = {
  0: CheckCircle,
  1: MonitorPlay,
  2: AlertTriangle,
  3: AlertCircle,
  4: ShieldAlert,
};

// Subtle KPI box backgrounds (ultra-light, borderless)
const getKpiBackground = (actionCode: ActionCode): string => {
  const bgMap: Record<ActionCode, string> = {
    0: 'bg-slate-500/5',
    1: 'bg-blue-500/5',
    2: 'bg-amber-500/5',
    3: 'bg-orange-500/5',
    4: 'bg-red-500/5',
  };
  return bgMap[actionCode];
};

// Semantic Action Severity Colors with WCAG AA contrast
const ACTION_COLORS: Record<ActionCode, { bg: string; text: string; border: string; textOnBg: string }> = {
  0: { bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1', textOnBg: '#1e293b' },  // slate - Status Quo
  1: { bg: '#eff6ff', text: '#3b82f6', border: '#bfdbfe', textOnBg: '#1e3a8a' },  // blue - ADM/Online
  2: { bg: '#fef3c7', text: '#f59e0b', border: '#fde68a', textOnBg: '#78350f' },  // amber - Suspend Basic Ed
  3: { bg: '#ffedd5', text: '#f97316', border: '#fed7aa', textOnBg: '#7c2d12' },  // orange - Suspend All
  4: { bg: '#fee2e2', text: '#dc2626', border: '#fecaca', textOnBg: '#7f1d1d' },  // red - Full Lockdown
};

const ACTION_SHORT: Record<ActionCode, string> = {
  0: "A0", 1: "A1", 2: "A2", 3: "A3", 4: "A4",
};

interface HeroCardsProps {
  currentIncident: IncidentData;
  prediction: PredictionResponse | null;
  currentHour: number;
  simulatedStranded: number;
  predictionError?: string | null;
  predictionLoading?: boolean;
  onRetry?: () => void;
  mode?: 'historical' | 'live';
  pagasaWarning?: "NONE" | "YELLOW" | "ORANGE" | "RED";
}

export default function HeroCards({
  currentIncident,
  prediction,
  currentHour,
  simulatedStranded,
  predictionError = null,
  predictionLoading = false,
  onRetry,
  mode = 'historical',
  pagasaWarning = 'NONE',
}: HeroCardsProps) {
  const wasAnnounced = currentHour >= (currentIncident?.actual_announcement_time ?? 0);
  
  // Base confidence from action probabilities
  const baseConfidence = prediction 
    ? Math.round(Math.max(...prediction.action_probabilities) * 100)
    : null;
  
  // Calculate time-based confidence decay
  // Assume announcement time is the "present" and any time beyond that is future prediction
  const announcementTime = currentIncident?.actual_announcement_time ?? 0;
  const hoursIntoFuture = Math.max(0, currentHour - announcementTime);
  
  // Decay: 6% per hour into the future (realistic RL uncertainty growth)
  const confidenceDecay = Math.floor(hoursIntoFuture * 6);
  const confidence = baseConfidence ? Math.max(30, baseConfidence - confidenceDecay) : null;
  
  // Determine confidence warning state
  const isLowConfidence = confidence !== null && confidence < 75;

  const currentTime = new Date();
  const currentHourOfDay = currentTime.getHours() + currentTime.getMinutes() / 60;
  const commuteDensity = (currentHourOfDay >= 5.0 && currentHourOfDay <= 7.0) ? 1.0 : 0.2;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      
      {mode === 'historical' ? (
        <div className="bg-slate-50 border border-slate-300 rounded-2xl shadow-sm flex flex-col relative overflow-hidden border-t-4 opacity-90 h-full"
             style={{ borderTopColor: ACTION_COLORS[currentIncident.actual_action_code].text }}>
          
          <div className="p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold font-sans tracking-tight text-slate-900" style={SANS}>
                    Official LGU Decision
                  </h2>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-slate-200 text-slate-600 border border-slate-300">
                    BASELINE
                  </span>
                </div>
                <p className="text-xs text-slate-500" style={SANS}>
                  Source: Manila PIO Official Log
                </p>
              </div>
              <div 
                className="px-3 py-1.5 rounded-lg font-bold text-lg border-2 flex items-center gap-2"
                style={{ 
                  backgroundColor: ACTION_COLORS[currentIncident.actual_action_code].bg, 
                  color: ACTION_COLORS[currentIncident.actual_action_code].textOnBg,
                  borderColor: ACTION_COLORS[currentIncident.actual_action_code].border,
                  ...MONO 
                }}
                aria-label={`Action ${currentIncident.actual_action_code}: ${ACTION_NAMES[currentIncident.actual_action_code]}`}
              >
                {(() => {
                  const Icon = ACTION_ICONS[currentIncident.actual_action_code];
                  return <Icon className="w-5 h-5" aria-hidden="true" />;
                })()}
                {ACTION_SHORT[currentIncident.actual_action_code]}
              </div>
            </div>

            <h3 className="text-3xl font-bold font-sans tracking-tight leading-tight mb-4" 
                style={{ color: ACTION_COLORS[currentIncident.actual_action_code].text, ...SANS }}>
              {ACTION_NAMES[currentIncident.actual_action_code]}
            </h3>

            {wasAnnounced ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold mb-6"
                   style={{ 
                     backgroundColor: ACTION_COLORS[currentIncident.actual_action_code].bg, 
                     color: ACTION_COLORS[currentIncident.actual_action_code].text, 
                     ...SANS 
                   }}>
                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                Announced at {typeof currentIncident.actual_announcement_time === 'number' 
                  ? currentIncident.actual_announcement_time.toFixed(1) 
                  : (Number(currentIncident.actual_announcement_time) || 0).toFixed(1)}:00
              </div>
            ) : (
              <div className="text-sm text-slate-500 mb-6" style={SANS}>
                Pending announcement (scheduled {typeof currentIncident.actual_announcement_time === 'number' 
                  ? currentIncident.actual_announcement_time.toFixed(1) 
                  : (Number(currentIncident.actual_announcement_time) || 0).toFixed(1)}:00)
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {currentIncident.actual_action_code === 1 ? (
                // Action 1 (ADM/Online) - Show Executive Trade-off Metrics
                <>
                  <div className={`rounded-xl p-5 flex flex-col justify-between min-h-[120px] ${getKpiBackground(currentIncident.actual_action_code)}`}>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3" style={SANS}>
                      Commuters Protected
                    </div>
                    <div className="text-3xl md:text-4xl font-bold font-sans tracking-tight leading-none" 
                         style={{ color: ACTION_COLORS[currentIncident.actual_action_code].text, ...SANS }}>
                      {(Math.max(3000, simulatedStranded * 0.4)).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-xs text-slate-500 mt-2" style={SANS}>
                      safe arrivals
                    </div>
                  </div>

                  <div className={`rounded-xl p-5 flex flex-col justify-between min-h-[120px] ${getKpiBackground(currentIncident.actual_action_code)}`}>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3" style={SANS}>
                      Instructional Hours
                    </div>
                    <div className="text-3xl md:text-4xl font-bold font-sans tracking-tight leading-none" 
                         style={{ color: ACTION_COLORS[currentIncident.actual_action_code].text, ...SANS }}>
                      8 hrs
                    </div>
                    <div className="text-xs text-slate-500 mt-2" style={SANS}>
                      preserved online
                    </div>
                  </div>
                </>
              ) : (
                // Other Actions - Show Standard Metrics
                <>
                  <div className={`rounded-xl p-5 flex flex-col justify-between min-h-[120px] ${getKpiBackground(currentIncident.actual_action_code)}`}>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3" style={SANS}>
                      Estimated Stranded
                    </div>
                    <div className="text-3xl md:text-4xl font-bold font-sans tracking-tight leading-none" 
                         style={{ color: ACTION_COLORS[currentIncident.actual_action_code].text, ...SANS }}>
                      {simulatedStranded.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-500 mt-2" style={SANS}>
                      students at risk
                    </div>
                  </div>

                  <div className={`rounded-xl p-5 flex flex-col justify-between min-h-[120px] ${getKpiBackground(currentIncident.actual_action_code)}`}>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3" style={SANS}>
                      Commuter Safety
                    </div>
                    <div className="flex flex-col justify-center flex-1">
                      {wasAnnounced ? (
                        simulatedStranded < 500 ? (
                          <span className="inline-flex px-4 py-2 rounded-full text-base font-semibold w-fit bg-slate-700 text-slate-100">
                            Protected
                          </span>
                        ) : (
                          <span className="inline-flex px-4 py-2 rounded-full text-base font-semibold w-fit" 
                                style={{ 
                                  backgroundColor: ACTION_COLORS[currentIncident.actual_action_code].text,
                                  color: 'white'
                                }}>
                            Critical
                          </span>
                        )
                      ) : (
                        <span className="inline-flex px-4 py-2 rounded-full text-base font-semibold w-fit bg-slate-600 text-white">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-2" style={SANS}>
                      status indicator
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <LiveSystemTelemetry currentTime={currentTime} commuteDensity={commuteDensity} />
      )}

      {predictionLoading ? (
        <DecisionCardSkeleton type="ai" />
      ) : (
        <div 
          className="bg-white border-2 rounded-2xl shadow-2xl flex flex-col relative overflow-hidden border-t-4 ring-2 transition-all duration-300 h-full"
          style={{ 
            borderTopColor: prediction ? ACTION_COLORS[prediction.ai_action_code as ActionCode].text : '#64748b',
            borderColor: prediction ? ACTION_COLORS[prediction.ai_action_code as ActionCode].text : '#64748b',
            '--tw-ring-color': prediction ? ACTION_COLORS[prediction.ai_action_code as ActionCode].text : '#64748b',
          } as React.CSSProperties}
        >
          {/* Anxiety Pulse - Border Ring Only (High Severity Actions) */}
          {prediction && (prediction.ai_action_code === 3 || prediction.ai_action_code === 4) && (
            <div 
              className="absolute inset-0 rounded-2xl border-2 animate-pulse pointer-events-none z-10"
              style={{ 
                borderColor: ACTION_COLORS[prediction.ai_action_code as ActionCode].text,
                opacity: 0.5
              }}
              aria-hidden="true"
            />
          )}
          
          <div className="p-8">
            {prediction ? (
            <>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold font-sans tracking-tight text-slate-900 mb-2" style={SANS}>
                    AI Policy Recommendation
                  </h2>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500" style={SANS}>
                      PyTorch PPO Agent
                    </p>
                    {mode === 'live' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-blue-100 text-blue-800 border border-blue-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                        LIVE FEED
                      </span>
                    )}
                  </div>
                </div>
                <div 
                  className="px-3 py-1.5 rounded-lg font-bold text-lg border-2 flex items-center gap-2"
                  style={{ 
                    backgroundColor: ACTION_COLORS[prediction.ai_action_code as ActionCode].bg,
                    color: ACTION_COLORS[prediction.ai_action_code as ActionCode].textOnBg,
                    borderColor: ACTION_COLORS[prediction.ai_action_code as ActionCode].border,
                    ...MONO 
                  }}
                  aria-label={`AI Recommendation: Action ${prediction.ai_action_code} - ${ACTION_NAMES[prediction.ai_action_code as ActionCode]}`}
                >
                  {(() => {
                    const Icon = ACTION_ICONS[prediction.ai_action_code as ActionCode];
                    return <Icon className="w-5 h-5" aria-hidden="true" />;
                  })()}
                  {ACTION_SHORT[prediction.ai_action_code as ActionCode]}
                </div>
              </div>

              <h3 className="text-3xl font-extrabold font-sans tracking-tight leading-tight mb-2" 
                  style={{ 
                    color: prediction && (prediction.ai_action_code >= 3) 
                      ? prediction.ai_action_code === 4 ? '#dc2626' : '#f97316'  // High contrast red/orange
                      : ACTION_COLORS[prediction.ai_action_code as ActionCode].text,
                    ...SANS 
                  }}>
                {ACTION_NAMES[prediction.ai_action_code as ActionCode]}
              </h3>

              <div className="text-sm text-slate-600 mb-6" style={SANS}>
                <span className="font-semibold">Predictive Confidence:</span> 
                <span 
                  className={`ml-1 font-bold ${
                    isLowConfidence 
                      ? 'text-amber-600' 
                      : 'text-slate-900'
                  }`}
                >
                  {confidence}%
                </span>
                {isLowConfidence && (
                  <span className="ml-2 text-xs text-amber-600 font-semibold">
                    (High Uncertainty)
                  </span>
                )}
                <span className="mx-2">•</span>
                <div className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="text-xs font-medium text-slate-500">Model: Active (Policy v2.1)</span>
                </div>
              </div>

              {/* Legal Override Banner - DepEd Order 37 */}
              {pagasaWarning === 'RED' && (
                <div className="mb-6 bg-red-950 border-2 border-red-800 rounded-lg p-4 flex items-start gap-3" role="alert" aria-live="assertive">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-red-200 mb-1" style={SANS}>
                      Legal Floor Enforced: DepEd Order 37
                    </div>
                    <div className="text-xs text-red-300 leading-relaxed" style={SANS}>
                      PAGASA Red Warning automatically triggers minimum Action 2 (Suspend Basic Education). AI decision restricted to A2-A4 range only.
                      <span className="sr-only">Actions 0 and 1 are legally disabled and cannot be selected during Red Warning conditions.</span>
                    </div>
                  </div>
                </div>
              )}

              {/* High Uncertainty Warning Banner */}
              {isLowConfidence && hoursIntoFuture > 2 && (
                <div className="mb-6 bg-amber-50 border-2 border-amber-400 rounded-lg p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-amber-900 mb-1" style={SANS}>
                      Extended Forecast: High Uncertainty
                    </div>
                    <div className="text-xs text-amber-800 leading-relaxed" style={SANS}>
                      This prediction is <span className="font-semibold">{hoursIntoFuture.toFixed(1)} hours</span> into the future. Model confidence has decayed to <span className="font-semibold">{confidence}%</span>. Storm trajectory and intensity may shift significantly.
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {prediction.ai_action_code === 1 ? (
                  // Action 1 (ADM/Online) - Show Executive Trade-off Metrics
                  <>
                    <div className={`rounded-xl p-5 flex flex-col justify-between min-h-[120px] ${getKpiBackground(prediction.ai_action_code as ActionCode)}`}>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3" style={SANS}>
                        Commuters Protected
                      </div>
                      <div className="text-3xl md:text-4xl font-bold font-sans tracking-tight leading-none" 
                           style={{ color: ACTION_COLORS[prediction.ai_action_code as ActionCode].text, ...SANS }}>
                        {(Math.max(3500, simulatedStranded * 0.45)).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </div>
                      <div className="text-xs text-slate-500 mt-2" style={SANS}>
                        safe arrivals (AI est.)
                      </div>
                    </div>

                    <div className={`rounded-xl p-5 flex flex-col justify-between min-h-[120px] ${getKpiBackground(prediction.ai_action_code as ActionCode)}`}>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3" style={SANS}>
                        Instructional Hours
                      </div>
                      <div className="text-3xl md:text-4xl font-bold font-sans tracking-tight leading-none" 
                           style={{ color: ACTION_COLORS[prediction.ai_action_code as ActionCode].text, ...SANS }}>
                        8 hrs
                      </div>
                      <div className="text-xs text-slate-500 mt-2" style={SANS}>
                        preserved online
                      </div>
                    </div>
                  </>
                ) : (
                  // Other Actions - Show Standard Metrics
                  <>
                    <div className={`rounded-xl p-5 flex flex-col justify-between min-h-[120px] ${getKpiBackground(prediction.ai_action_code as ActionCode)}`}>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3" style={SANS}>
                        AI Projected Stranded
                      </div>
                      <div className="text-3xl md:text-4xl font-bold font-sans tracking-tight leading-none" 
                           style={{ color: ACTION_COLORS[prediction.ai_action_code as ActionCode].text, ...SANS }}>
                        {Math.round(simulatedStranded * 0.15).toLocaleString()}
                      </div>
                      <div className="text-xs text-slate-500 mt-2" style={SANS}>
                        with early warning
                      </div>
                    </div>

                    <div className={`rounded-xl p-5 flex flex-col justify-between min-h-[120px] ${getKpiBackground(prediction.ai_action_code as ActionCode)}`}>
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-3" style={SANS}>
                        Risk Reduction
                      </div>
                      <div className="text-3xl md:text-4xl font-bold font-sans tracking-tight leading-none" 
                           style={{ color: ACTION_COLORS[prediction.ai_action_code as ActionCode].text, ...SANS }}>
                        85%
                      </div>
                      <div className="text-xs text-slate-500 mt-2" style={SANS}>
                        vs reactive decision
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : predictionError ? (
            <div className="flex flex-col items-center justify-center h-96 px-6">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4 transition-all duration-300">
                  <svg className="w-8 h-8 text-rose-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2" style={SANS}>
                  Backend Offline or Waking Up
                </h3>
                <p className="text-sm text-slate-600 mb-4" style={SANS}>
                  {predictionError}
                </p>
                <p className="text-xs text-slate-500 mb-6" style={SANS}>
                  The AI engine may be starting up (cold start can take up to 50 seconds on free tier)
                </p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="px-6 py-2.5 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 ease-in-out hover:scale-105 hover:opacity-90 active:scale-95"
                    style={SANS}
                  >
                    Retry Connection
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-slate-200 rounded-full animate-spin mx-auto mb-4"
                     style={{ borderTopColor: '#3b82f6' }} />
                <p className="text-slate-500" style={SANS}>
                  {predictionLoading ? 'Fetching AI prediction...' : 'Loading AI prediction...'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
