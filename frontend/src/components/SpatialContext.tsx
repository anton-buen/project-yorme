import { useState } from 'react';
import { MapPin, Grid3x3, Radio } from 'lucide-react';
import RadarGrid from './RadarGrid';
import LiveMap from './LiveMap';
import IconHint from './IconHint';
import type { RadarTensorGrid } from '../types/dashboard';

type PagasaLevel = "NONE" | "YELLOW" | "ORANGE" | "RED";

interface SpatialContextProps {
  step: number;
  incidentIdx: number;
  pagasaWarning: PagasaLevel;
  mode: 'historical' | 'live';
  isLoading?: boolean;
  setStep?: (step: number) => void;
  /** Active-hour 32×32 dBZ matrix from the selected incident */
  tensorGrid?: RadarTensorGrid | null;
}

const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };

export default function SpatialContext({
  step,
  incidentIdx,
  pagasaWarning,
  mode,
  isLoading = false,
  setStep,
  tensorGrid = null,
}: SpatialContextProps) {
  const [activeView, setActiveView] = useState<'tensor' | 'radar'>('tensor');

  return (
    <div id="step-tensor-grid" className="bg-white rounded-2xl border border-slate-200 shadow-sm ring-1 ring-slate-900/5 h-full flex flex-col">
      {/* Header with Segmented Control */}
      <div className="p-6 pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold font-sans tracking-tight text-slate-900" style={SANS}>
            Spatial Context
          </h3>
          <IconHint
            icon={MapPin}
            label="Metro Manila"
            detail="AI Observation Input"
            showLabel
            className="text-slate-500"
            iconClassName="w-3.5 h-3.5"
            labelClassName="text-xs text-slate-500"
          />
        </div>

        {/* Segmented Control */}
        {mode === 'live' && (
          <div id="step-radar-toggle" className="flex bg-slate-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveView('tensor')}
              className={`
                px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 inline-flex items-center gap-1.5
                ${activeView === 'tensor'
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
                }
              `}
              title="AI Tensor"
              aria-label="AI Tensor view"
            >
              <Grid3x3 className="w-4 h-4" aria-hidden={true} />
              <span className="hidden sm:inline">Tensor</span>
            </button>
            <button
              onClick={() => setActiveView('radar')}
              className={`
                px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 inline-flex items-center gap-1.5
                ${activeView === 'radar'
                  ? 'bg-white shadow-sm text-slate-900'
                  : 'text-slate-600 hover:text-slate-900'
                }
              `}
              title="Live Radar"
              aria-label="Live Radar view"
            >
              <Radio className="w-4 h-4" aria-hidden={true} />
              <span className="hidden sm:inline">Radar</span>
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
            setStep={setStep}
            tensorGrid={tensorGrid}
          />
        ) : (
          <LiveMap bare={true} />
        )}
      </div>
    </div>
  );
}
