import { useState } from 'react';
import RadarGrid from './RadarGrid';
import LiveMap from './LiveMap';

type PagasaLevel = "NONE" | "YELLOW" | "ORANGE" | "RED";

interface SpatialContextProps {
  step: number;
  incidentIdx: number;
  pagasaWarning: PagasaLevel;
  mode: 'historical' | 'live';
  isLoading?: boolean;
}

const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };

export default function SpatialContext({
  step,
  incidentIdx,
  pagasaWarning,
  mode,
  isLoading = false,
}: SpatialContextProps) {
  const [activeView, setActiveView] = useState<'tensor' | 'radar'>('tensor');

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5 h-full flex flex-col">
      {/* Header with Segmented Control */}
      <div className="p-6 pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold font-sans tracking-tight text-slate-900" style={SANS}>
            Spatial Context
          </h3>
          <p className="text-xs text-slate-500 mt-1" style={SANS}>
            AI Observation Input • Metro Manila Region
          </p>
        </div>

        {/* Segmented Control */}
        {mode === 'live' && (
          <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveView('tensor')}
              className={`
                px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                ${activeView === 'tensor'
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              AI Tensor
            </button>
            <button
              onClick={() => setActiveView('radar')}
              className={`
                px-4 py-2 text-sm font-medium rounded-md transition-all duration-200
                ${activeView === 'radar'
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
                }
              `}
            >
              Live Radar
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-[500px]">
        {mode === 'historical' || activeView === 'tensor' ? (
          <RadarGrid
            step={step}
            incidentIdx={incidentIdx}
            pagasaWarning={pagasaWarning}
            mode={mode}
            isLoading={isLoading}
            bare={true}
          />
        ) : (
          <LiveMap bare={true} />
        )}
      </div>
    </div>
  );
}
