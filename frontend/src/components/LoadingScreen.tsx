import { AlertCircle, Loader2 } from 'lucide-react';
import YormeMark from './YormeMark';

const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

interface LoadingScreenProps {
  stage: string;
  error: string | null;
}

export default function LoadingScreen({ stage, error }: LoadingScreenProps) {
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1e3a8a' }}>
        <div className="text-center p-8 max-w-md">
          <AlertCircle className="mx-auto mb-4 w-16 h-16" style={{ color: '#f1f5f9' }} />
          <h2 className="text-2xl font-bold font-sans tracking-tight mb-4" style={{ color: '#f1f5f9', ...SANS }}>
            Backend Unreachable
          </h2>
          <p className="mb-6" style={{ color: '#cbd5e1', ...SANS }}>
            The <YormeMark className="text-slate-300" /> AI engine is currently unavailable. This may be due to:
          </p>
          <ul className="text-left mb-6 space-y-2" style={{ color: '#cbd5e1', ...SANS }}>
            <li>• Server cold start (up to 50 seconds on free tier)</li>
            <li>• Network connectivity issues</li>
            <li>• Backend maintenance</li>
          </ul>
          <div className="p-4 rounded-xl" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
            <p className="text-sm" style={{ color: '#f1f5f9', ...MONO }}>
              {error}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 rounded-xl transition-all duration-300 ease-in-out hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: '#f1f5f9', color: '#1e3a8a', ...SANS }}
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
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1e3a8a' }}>
      <div className="text-center p-8">
        <Loader2 className="mx-auto mb-6 w-16 h-16 animate-spin" style={{ color: '#f1f5f9' }} />
        <h2 className="text-3xl font-bold font-sans tracking-tight mb-4" style={{ color: '#f1f5f9', ...SANS }}>
          <YormeMark className="text-slate-100" />
        </h2>
        <p className="text-xl mb-8" style={{ color: '#cbd5e1', ...SANS }}>
          {stageMessages[stage] || "Initializing..."}
        </p>
        <div className="w-64 mx-auto rounded-full h-2" style={{ backgroundColor: '#0f172a' }}>
          <div
            className="h-2 rounded-full transition-all duration-1000"
            style={{
              backgroundColor: '#f1f5f9',
              width: stage === 'health' ? '33%' : 
                     stage === 'incidents' ? '66%' : '100%'
            }}
          />
        </div>
        <p className="text-sm mt-4" style={{ color: '#94a3b8', ...SANS }}>
          Initial requests may take up to 50 seconds due to cold start
        </p>
      </div>
    </div>
  );
}
