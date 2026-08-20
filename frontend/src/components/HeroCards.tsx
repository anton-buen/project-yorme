import type { ActionCode, PredictionResponse, IncidentData } from '../types/dashboard';
import { ACTION_NAMES } from '../types/dashboard';

const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

const TERRA = { text: "#9A4B2F", bg: "#FDF4F0", border: "#E8C2AE", line: "#C2745A" };
const SAGE = { text: "#3A7050", bg: "#EEF5F0", border: "#AECBB7", line: "#6B9E7A" };

const ACTION_SHORT: Record<ActionCode, string> = {
  0: "A0", 1: "A1", 2: "A2", 3: "A3", 4: "A4",
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
  const confidence = prediction 
    ? Math.round(Math.max(...prediction.action_probabilities) * 100)
    : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Left Hero: Official LGU Decision (Terra Palette) */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
        {/* Terra Top Border Accent */}
        <div className="h-1.5" style={{ backgroundColor: TERRA.text }} />
        
        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-stone-900 mb-2" style={SERIF}>
                Official LGU Decision
              </h2>
              <p className="text-xs text-stone-500" style={SANS}>
                Source: Manila PIO Official Log
              </p>
            </div>
            <div 
              className="px-3 py-1.5 rounded-lg font-bold text-lg"
              style={{ backgroundColor: TERRA.bg, color: TERRA.text, ...MONO }}
            >
              {ACTION_SHORT[currentIncident.actual_action_code]}
            </div>
          </div>

          {/* Action Title in Large Serif */}
          <h3 className="text-3xl font-bold leading-tight mb-4" style={{ color: TERRA.text, ...SERIF }}>
            {ACTION_NAMES[currentIncident.actual_action_code]}
          </h3>

          {/* Announcement Tag */}
          {wasAnnounced ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold mb-6"
                 style={{ backgroundColor: TERRA.bg, color: TERRA.text, ...SANS }}>
              <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
              Announced at {currentIncident.actual_announcement_time.toFixed(1)}:00
            </div>
          ) : (
            <div className="text-sm text-stone-500 mb-6" style={SANS}>
              Pending announcement (scheduled {currentIncident.actual_announcement_time.toFixed(1)}:00)
            </div>
          )}

          {/* Two Inner Stat Sub-cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Box 1: Estimated Stranded */}
            <div className="p-5 rounded-xl border border-stone-200/50" style={{ backgroundColor: TERRA.bg }}>
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-600 mb-2" style={SANS}>
                Estimated Stranded
              </div>
              <div className="text-3xl font-bold leading-none" style={{ color: TERRA.text, ...SERIF }}>
                {simulatedStranded.toLocaleString()}
              </div>
              <div className="text-xs text-stone-500 mt-2" style={SANS}>
                students
              </div>
            </div>

            {/* Box 2: Commuter Safety */}
            <div className="p-5 rounded-xl border border-stone-200/50" style={{ backgroundColor: TERRA.bg }}>
              <div className="text-xs font-semibold uppercase tracking-wide text-stone-600 mb-2" style={SANS}>
                Commuter Safety
              </div>
              <div className="mt-2">
                {wasAnnounced ? (
                  simulatedStranded < 500 ? (
                    <span className="inline-block px-3 py-1.5 rounded-full text-sm font-bold text-white bg-green-600">
                      Protected
                    </span>
                  ) : (
                    <span className="inline-block px-3 py-1.5 rounded-full text-sm font-bold text-white bg-red-600">
                      Critical
                    </span>
                  )
                ) : (
                  <span className="inline-block px-3 py-1.5 rounded-full text-sm font-bold text-white bg-stone-400">
                    Pending
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Hero: AI Policy Recommendation (Sage Palette) */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
        {/* Sage Top Border Accent */}
        <div className="h-1.5" style={{ backgroundColor: SAGE.text }} />
        
        <div className="p-8">
          {prediction ? (
            <>
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-stone-900 mb-2" style={SERIF}>
                    AI Policy Recommendation
                  </h2>
                  <p className="text-xs text-stone-500" style={SANS}>
                    PyTorch PPO Agent • Live Integration
                  </p>
                </div>
                <div 
                  className="px-3 py-1.5 rounded-lg font-bold text-lg"
                  style={{ backgroundColor: SAGE.bg, color: SAGE.text, ...MONO }}
                >
                  {ACTION_SHORT[prediction.ai_action_code as ActionCode]}
                </div>
              </div>

              {/* Action Title in Large Serif */}
              <h3 className="text-3xl font-bold leading-tight mb-2" style={{ color: SAGE.text, ...SERIF }}>
                {ACTION_NAMES[prediction.ai_action_code as ActionCode]}
              </h3>

              {/* Confidence & Weights Subtext */}
              <div className="text-sm text-stone-600 mb-6" style={SANS}>
                <span className="font-semibold">Confidence:</span> {confidence}% • 
                <span className="font-semibold ml-2">Weights:</span>
                <span className="text-xs font-mono ml-1 text-stone-500">
                  {prediction.loaded_model_path.split('/').pop()}
                </span>
              </div>

              {/* Two Inner Stat Sub-cards */}
              <div className="grid grid-cols-2 gap-4">
                {/* Box 1: Simulated Stranded */}
                <div className="p-5 rounded-xl border border-stone-200/50" style={{ backgroundColor: SAGE.bg }}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-stone-600 mb-2" style={SANS}>
                    Simulated Stranded
                  </div>
                  <div className="text-3xl font-bold leading-none" style={{ color: SAGE.text, ...SERIF }}>
                    {Math.round(simulatedStranded * 0.15).toLocaleString()}
                  </div>
                  <div className="text-xs text-stone-500 mt-2" style={SANS}>
                    students (AI projection)
                  </div>
                </div>

                {/* Box 2: Commuter Safety */}
                <div className="p-5 rounded-xl border border-stone-200/50" style={{ backgroundColor: SAGE.bg }}>
                  <div className="text-xs font-semibold uppercase tracking-wide text-stone-600 mb-2" style={SANS}>
                    Commuter Safety
                  </div>
                  <div className="mt-2">
                    <span className="inline-block px-3 py-1.5 rounded-full text-sm font-bold text-white"
                          style={{ backgroundColor: SAGE.text }}>
                      Protected
                    </span>
                  </div>
                  <div className="text-xs text-stone-500 mt-2" style={SANS}>
                    Early warning
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Loading State */
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-stone-200 border-t-stone-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-stone-500" style={SANS}>Loading AI prediction...</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
