import type { ActionCode, PredictionResponse, IncidentData } from '../types/dashboard';
import { ACTION_NAMES } from '../types/dashboard';

const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

const TERRA = { text: "#9A4B2F", bg: "#FDF4F0", border: "#E8C2AE", line: "#C2745A" };
const SAGE = { text: "#3A7050", bg: "#EEF5F0", border: "#AECBB7", line: "#6B9E7A" };

const ACTION_SHORT: Record<ActionCode, string> = {
  0: "A0 — Status Quo",
  1: "A1 — Shift to ADM",
  2: "A2 — Suspend Basic Ed",
  3: "A3 — Suspend All Levels",
  4: "A4 — Full Lockdown",
};

interface HeroCardsProps {
  currentIncident: IncidentData;
  prediction: PredictionResponse | null;
  currentHour: number;
  simulatedStranded: number;
}

export default function HeroCards({
  currentIncident,
  prediction,
  currentHour,
  simulatedStranded,
}: HeroCardsProps) {
  const wasAnnounced = currentHour >= currentIncident.actual_announcement_time;
  const aiLeadTime = prediction 
    ? (currentIncident.actual_announcement_time - currentHour).toFixed(1)
    : null;
  const confidence = prediction 
    ? Math.round(Math.max(...prediction.action_probabilities) * 100)
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Left Card: Official LGU Decision */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Terra Top Border Bar */}
        <div className="h-2" style={{ backgroundColor: TERRA.line }} />
        
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-stone-900 mb-2" style={SERIF}>
                Official LGU Decision
              </h2>
              <p className="text-sm text-stone-600" style={SANS}>
                Manila City Government • NDRRMC Coordinated
              </p>
            </div>
            <div 
              className="px-3 py-1.5 rounded-lg font-bold text-sm"
              style={{ backgroundColor: TERRA.bg, color: TERRA.text, ...MONO }}
            >
              {ACTION_SHORT[currentIncident.actual_action_code]}
            </div>
          </div>

          {/* Action Title */}
          <div className="mb-6">
            <h3 className="text-3xl font-bold mb-2" style={{ color: TERRA.text, ...SERIF }}>
              {ACTION_NAMES[currentIncident.actual_action_code]}
            </h3>
            {wasAnnounced ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold"
                   style={{ backgroundColor: TERRA.bg, color: TERRA.text, ...SANS }}>
                <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                Announced at {currentIncident.actual_announcement_time.toFixed(1)}:00
              </div>
            ) : (
              <div className="text-sm text-stone-500" style={SANS}>
                Announcement pending (scheduled {currentIncident.actual_announcement_time.toFixed(1)}:00)
              </div>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl" style={{ backgroundColor: TERRA.bg }}>
              <div className="text-xs font-medium text-stone-600 mb-1" style={SANS}>
                Estimated Stranded Students
              </div>
              <div className="text-2xl font-bold" style={{ color: TERRA.text, ...MONO }}>
                {simulatedStranded.toLocaleString()}
              </div>
              <div className="text-xs text-stone-500 mt-1" style={SANS}>
                Simulated projection
              </div>
            </div>

            <div className="p-4 rounded-xl" style={{ backgroundColor: TERRA.bg }}>
              <div className="text-xs font-medium text-stone-600 mb-1" style={SANS}>
                Commuter Safety Status
              </div>
              <div className="text-lg font-bold" style={{ color: TERRA.text, ...SANS }}>
                {wasAnnounced ? (
                  simulatedStranded < 500 ? "PROTECTED" : "AT RISK"
                ) : (
                  "PENDING"
                )}
              </div>
              <div className="text-xs text-stone-500 mt-1" style={SANS}>
                {wasAnnounced ? "Early Call" : "Pre-announcement"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Card: AI Policy Recommendation */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Sage Top Border Bar */}
        <div className="h-2" style={{ backgroundColor: SAGE.line }} />
        
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-stone-900 mb-2" style={SERIF}>
                AI Policy Recommendation
              </h2>
              <p className="text-sm text-stone-600" style={SANS}>
                PyTorch PPO Agent • PAGASA Live Integration
              </p>
            </div>
            {prediction && (
              <div 
                className="px-3 py-1.5 rounded-lg font-bold text-sm"
                style={{ backgroundColor: SAGE.bg, color: SAGE.text, ...MONO }}
              >
                {ACTION_SHORT[prediction.ai_action_code as ActionCode]}
              </div>
            )}
          </div>

          {/* Action Title */}
          {prediction ? (
            <>
              <div className="mb-6">
                <h3 className="text-3xl font-bold mb-2" style={{ color: SAGE.text, ...SERIF }}>
                  {ACTION_NAMES[prediction.ai_action_code as ActionCode]}
                </h3>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold" style={{ color: SAGE.text, ...SANS }}>
                    Confidence: {confidence}%
                  </div>
                  {aiLeadTime && parseFloat(aiLeadTime) > 0 && (
                    <div className="text-sm text-stone-600" style={SANS}>
                      • Lead Time: <span className="font-mono font-bold text-green-600">
                        +{aiLeadTime}h
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl" style={{ backgroundColor: SAGE.bg }}>
                  <div className="text-xs font-medium text-stone-600 mb-1" style={SANS}>
                    Simulated Stranded Projection
                  </div>
                  <div className="text-2xl font-bold" style={{ color: SAGE.text, ...MONO }}>
                    {Math.round(simulatedStranded * 0.15).toLocaleString()}
                  </div>
                  <div className="text-xs text-stone-500 mt-1" style={SANS}>
                    With early AI call
                  </div>
                </div>

                <div className="p-4 rounded-xl" style={{ backgroundColor: SAGE.bg }}>
                  <div className="text-xs font-medium text-stone-600 mb-1" style={SANS}>
                    Safety Impact
                  </div>
                  <div className="text-lg font-bold" style={{ color: SAGE.text, ...SANS }}>
                    MINIMIZED
                  </div>
                  <div className="text-xs text-stone-500 mt-1" style={SANS}>
                    Proactive protection
                  </div>
                </div>
              </div>

              {/* Model Info */}
              <div className="mt-6 p-4 bg-stone-50 rounded-xl border border-stone-200">
                <div className="text-xs text-stone-600 mb-2" style={SANS}>
                  <strong>Model Path:</strong>
                </div>
                <div className="text-xs font-mono text-stone-800 break-all">
                  {prediction.loaded_model_path}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-stone-200 border-t-stone-600 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-stone-500" style={SANS}>Loading AI prediction...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
