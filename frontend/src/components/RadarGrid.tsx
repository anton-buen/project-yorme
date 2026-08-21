import { useRef, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapSkeleton } from './Skeletons';
import SourceLink from './SourceLink';
import PagasaBadge from './PagasaBadge';
import type { RadarTensorGrid } from '../types/dashboard';
import type { PagasaLevel } from '../utils/pagasa';

const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const MONO: React.CSSProperties = { fontFamily: "'JetBrains Mono', monospace" };

interface HourStep { label: string; hour: number; minute: number }

const HOUR_STEPS: HourStep[] = Array.from({ length: 19 }, (_, i) => {
  const total = 3 * 60 + i * 30;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return {
    label: `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`,
    hour: h, minute: m,
  };
});

const GRID_SIZE = 32;

/** Clear / muted background for ≤15 dBZ; storm colors above. */
export function getDbzColor(dbz: number): string {
  if (dbz <= 15) return '#262626';
  if (dbz <= 30) return '#f59e0b';
  if (dbz <= 45) return '#ea580c';
  return '#dc2626';
}

/** Empty clear-air grid used when no calibrated tensor is available. */
export function defaultEmptyGrid(size = GRID_SIZE): RadarTensorGrid {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0));
}

interface RadarGridProps {
  step: number;
  incidentIdx?: number;
  pagasaWarning: PagasaLevel;
  mode?: 'historical' | 'live';
  isLoading?: boolean;
  bare?: boolean;
  setStep?: (step: number) => void;
  tensorGrid?: RadarTensorGrid | null;
}

/** Render a calibrated dBZ matrix to a canvas data URL — no procedural storm noise. */
function generateTensorCanvas(tensor: RadarTensorGrid): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const rows = tensor.length || GRID_SIZE;
  const cols = tensor[0]?.length || GRID_SIZE;
  const cellSize = 10;

  canvas.width = cols * cellSize;
  canvas.height = rows * cellSize;

  for (let row = 0; row < rows; row++) {
    const line = tensor[row] ?? [];
    for (let col = 0; col < cols; col++) {
      const dbz = Number(line[col] ?? 0);
      ctx.fillStyle = getDbzColor(Number.isFinite(dbz) ? dbz : 0);
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }

  return canvas.toDataURL();
}

function TensorOverlay({ tensorGrid }: { tensorGrid: RadarTensorGrid }) {
  const map = useMap();
  const overlayRef = useRef<L.ImageOverlay | null>(null);

  useEffect(() => {
    const bounds: L.LatLngBoundsExpression = [
      [14.35, 120.85],
      [14.85, 121.12],
    ];

    const imageUrl = generateTensorCanvas(tensorGrid);

    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
    }

    overlayRef.current = L.imageOverlay(imageUrl, bounds, {
      opacity: 0.72,
      interactive: false,
    }).addTo(map);

    return () => {
      if (overlayRef.current) {
        map.removeLayer(overlayRef.current);
      }
    };
  }, [tensorGrid, map]);

  return null;
}

function ManilaMarker() {
  const map = useMap();

  useEffect(() => {
    const manilaIcon = L.divIcon({
      className: 'manila-marker',
      html: `
        <div style="
          width: 12px;
          height: 12px;
          background-color: #1F2937;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        "></div>
      `,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    const marker = L.marker([14.5995, 120.9842], { icon: manilaIcon }).addTo(map);

    return () => {
      map.removeLayer(marker);
    };
  }, [map]);

  return null;
}

export default function RadarGrid({
  step,
  pagasaWarning,
  mode = 'historical',
  isLoading = false,
  bare = false,
  setStep,
  tensorGrid = null,
}: RadarGridProps) {
  if (isLoading) {
    return bare ? <MapSkeleton /> : (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 h-full flex flex-col ring-1 ring-slate-900/5">
        <MapSkeleton />
      </div>
    );
  }

  const activeTensor = useMemo(
    () => (tensorGrid && tensorGrid.length > 0 ? tensorGrid : defaultEmptyGrid()),
    [tensorGrid],
  );

  const currentTime = mode === 'live'
    ? new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: true })
    : HOUR_STEPS[step]?.label || "12:00 PM";

  const title = mode === 'live' ? 'Active Observation Tensor' : 'PAGASA Radar Input Grid';
  const subtitle = mode === 'live'
    ? 'Real-Time Satellite Telemetry • Metro Manila Grid (32×32 Tensor Input)'
    : 'Channel 0: dBZ Reflectivity • Local Manila Grid (32×32 Tensor Input)';

  const content = (
    <>
      {!bare && (
        <div className="mb-6">
          <h3 className="text-2xl font-bold font-sans tracking-tight text-stone-900 mb-2" style={SANS}>
            {mode === 'live' ? (
              title
            ) : (
              <>
                <SourceLink source="pagasa" className="text-stone-900">
                  PAGASA
                </SourceLink>{' '}
                Radar Input Grid
              </>
            )}
          </h3>
          <p className="text-sm text-stone-600" style={SANS}>
            {subtitle}
          </p>
        </div>
      )}

      <div className="h-64 md:h-80 lg:flex-1 lg:min-h-[400px] relative z-0 rounded-xl overflow-hidden border-2 border-stone-200">
        <div
          className="absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium text-white z-[1000]"
          style={{ backgroundColor: 'rgba(31, 41, 55, 0.85)', ...MONO }}
        >
          14.5995°N 120.9842°E
        </div>

        <div className="absolute top-3 right-3 z-[1000]">
          {mode === 'live' ? (
            <div
              className="px-2 py-1 rounded-sm text-xs font-medium text-white"
              style={{ backgroundColor: 'rgba(31, 41, 55, 0.85)', ...MONO }}
            >
              {currentTime}
            </div>
          ) : (
            <select
              value={step}
              onChange={(e) => setStep && setStep(Number(e.target.value))}
              className="px-2 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-sm text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-slate-700 hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600"
              style={MONO}
            >
              {HOUR_STEPS.map((hourStep, idx) => (
                <option key={idx} value={idx}>
                  {hourStep.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="absolute bottom-3 right-3 z-[1000]">
          <PagasaBadge level={pagasaWarning} compact />
        </div>

        <div className="absolute bottom-3 left-3 z-[400] bg-slate-900/80 backdrop-blur-sm p-3 rounded-lg border border-slate-700">
          <div className="text-xs font-semibold text-slate-300 mb-2" style={SANS}>
            dBZ Intensity
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-32 h-4 rounded overflow-hidden"
              style={{
                background: 'linear-gradient(to right, #262626 0%, #262626 22%, #f59e0b 38%, #ea580c 62%, #dc2626 100%)',
              }}
            />
            <div className="flex gap-2 text-xs font-mono text-slate-300">
              <span>≤15</span>
              <span>30</span>
              <span>45+</span>
            </div>
          </div>
        </div>

        <MapContainer
          center={[14.5995, 120.9842]}
          zoom={11}
          minZoom={10}
          maxZoom={14}
          maxBounds={[[14.3, 120.8], [14.9, 121.2]]}
          maxBoundsViscosity={1.0}
          scrollWheelZoom={false}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            className="map-tiles-brightened"
          />

          <TensorOverlay tensorGrid={activeTensor} />
          <ManilaMarker />
        </MapContainer>
      </div>

      <div className="mt-4 p-4 bg-stone-50 border border-stone-200 rounded-xl">
        <h4 className="text-xs font-semibold text-stone-900 mb-2 uppercase tracking-wide" style={SANS}>
          Spatial Observation Tensor
        </h4>
        <p className="text-sm text-stone-700 leading-relaxed" style={SANS}>
          This 32×32 grid maps radar reflectivity (dBZ intensity) across Metro Manila. The PPO policy network processes these spatial vectors through its convolutional encoder to evaluate storm trajectory and density before making a recommendation.
        </p>
      </div>
    </>
  );

  if (bare) {
    return <div className="p-6 flex flex-col flex-1">{content}</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 h-full flex flex-col ring-1 ring-slate-900/5">
      {content}
    </div>
  );
}
