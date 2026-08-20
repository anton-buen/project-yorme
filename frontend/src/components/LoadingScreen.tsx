import { AlertCircle, Loader2 } from 'lucide-react';

const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

interface LoadingScreenProps {
  stage: string;
  error: string | null;
}

export default function LoadingScreen({ stage, error }: LoadingScreenProps) {
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F6F0' }}>
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="mx-auto mb-4 w-16 h-16 text-red-500" />
          <h2 className="text-2xl font-bold text-stone-900 mb-4" style={SERIF}>
            Backend Unreachable
          </h2>
          <p className="text-stone-600 mb-6" style={SANS}>
            The Yormetrics AI engine is currently unavailable. This may be due to:
          </p>
          <ul className="text-left text-stone-600 mb-6 space-y-2" style={SANS}>
            <li>• Server cold start (up to 50 seconds on free tier)</li>
            <li>• Network connectivity issues</li>
            <li>• Backend maintenance</li>
          </ul>
          <div className="p-4 rounded-xl border border-red-200" style={{ backgroundColor: '#FEF2F2' }}>
            <p className="text-red-800 text-sm" style={MONO}>
              {error}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
            style={SANS}
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const stageMessages: Record<string, string> = {
    health: "Checking AI Engine Status...",
    incidents: "Loading Historical Incidents...",
    complete: "Initializing Dashboard...",
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F8F6F0' }}>
      <div className="text-center p-8">
        <Loader2 className="mx-auto mb-6 w-16 h-16 animate-spin" style={{ color: '#3A7050' }} />
        <h2 className="text-3xl font-bold text-stone-900 mb-4" style={SERIF}>
          Yormetrics
        </h2>
        <p className="text-xl text-stone-600 mb-8" style={SANS}>
          {stageMessages[stage] || "Initializing..."}
        </p>
        <div className="w-64 mx-auto rounded-full h-2" style={{ backgroundColor: '#E7E5E4' }}>
          <div
            className="h-2 rounded-full transition-all duration-1000"
            style={{
              backgroundColor: '#3A7050',
              width: stage === 'health' ? '33%' : 
                     stage === 'incidents' ? '66%' : '100%'
            }}
          />
        </div>
        <p className="text-sm text-stone-500 mt-4" style={SANS}>
          Initial requests may take up to 50 seconds due to cold start
        </p>
      </div>
    </div>
  );
}
