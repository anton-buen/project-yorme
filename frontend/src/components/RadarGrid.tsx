import { useRef, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapSkeleton } from './Skeletons';

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

type PagasaLevel = "NONE" | "YELLOW" | "ORANGE" | "RED";

interface RadarGridProps {
  step: number;
  incidentIdx: number;
  pagasaWarning: PagasaLevel;
  mode?: 'historical' | 'live';
  isLoading?: boolean;
}

function getPagasaColor(level: PagasaLevel): string {
  switch (level) {
    case "NONE": return "#A8A29E";
    case "YELLOW": return "#F59E0B";
    case "ORANGE": return "#F97316";
    case "RED": return "#DC2626";
    default: return "#A8A29E";
  }
}

// Generate tensor heatmap as canvas and return as data URL
function generateTensorCanvas(step: number, incidentIdx: number): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const gridSize = 32;
  const cellSize = 10;
  const canvasSize = gridSize * cellSize;
  
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  // Generate synthetic dBZ reflectivity data based on step
  const intensity = Math.min(1, step / 14);
  
  // Create hotspot centers
  const hotspots = [
    { x: 16, y: 16, strength: intensity },
    { x: 10, y: 20, strength: intensity * 0.7 },
    { x: 22, y: 12, strength: intensity * 0.6 },
  ];

  // Render 32x32 grid
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // Calculate distance-based intensity from hotspots
      let maxIntensity = 0;
      
      for (const hotspot of hotspots) {
        const dx = col - hotspot.x;
        const dy = row - hotspot.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const falloff = Math.max(0, 1 - distance / 8);
        const localIntensity = hotspot.strength * falloff;
        maxIntensity = Math.max(maxIntensity, localIntensity);
      }

      // Add some noise
      maxIntensity += (Math.random() - 0.5) * 0.1;
      maxIntensity = Math.max(0, Math.min(1, maxIntensity));

      // Color gradient: light gray/teal → yellow → orange → dark red
      let r, g, b;
      if (maxIntensity < 0.2) {
        r = 148 + (maxIntensity / 0.2) * 50;
        g = 163 + (maxIntensity / 0.2) * 30;
        b = 184;
      } else if (maxIntensity < 0.4) {
        const t = (maxIntensity - 0.2) / 0.2;
        r = 198 + t * 54;
        g = 193 + t * 27;
        b = 184 - t * 94;
      } else if (maxIntensity < 0.7) {
        const t = (maxIntensity - 0.4) / 0.3;
        r = 252 - t * 28;
        g = 220 - t * 96;
        b = 90 - t * 52;
      } else {
        const t = (maxIntensity - 0.7) / 0.3;
        r = 224 - t * 71;
        g = 124 - t * 97;
        b = 38 - t * 11;
      }

      ctx.fillStyle = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }

  return canvas.toDataURL();
}

// Component to add image overlay to map
function TensorOverlay({ step, incidentIdx }: { step: number; incidentIdx: number }) {
  const map = useMap();
  const overlayRef = useRef<L.ImageOverlay | null>(null);

  useEffect(() => {
    // Metro Manila bounding box (approximate)
    const bounds: L.LatLngBoundsExpression = [
      [14.35, 120.85],  // Southwest corner
      [14.85, 121.12],  // Northeast corner
    ];

    const imageUrl = generateTensorCanvas(step, incidentIdx);
    
    // Remove existing overlay
    if (overlayRef.current) {
      map.removeLayer(overlayRef.current);
    }

    // Add new overlay
    overlayRef.current = L.imageOverlay(imageUrl, bounds, {
      opacity: 0.65,
      interactive: false,
    }).addTo(map);

    return () => {
      if (overlayRef.current) {
        map.removeLayer(overlayRef.current);
      }
    };
  }, [step, incidentIdx, map]);

  return null;
}

// Component to add Manila center marker
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

export default function RadarGrid({ step, incidentIdx, pagasaWarning, mode = 'historical', isLoading = false }: RadarGridProps) {
  if (isLoading) {
    return <MapSkeleton />;
  }
  
  const currentTime = mode === 'live' 
    ? new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: true })
    : HOUR_STEPS[step]?.label || "12:00 PM";

  const title = mode === 'live' ? 'Active Observation Tensor' : 'PAGASA Radar Input Grid';
  const subtitle = mode === 'live' 
    ? 'Real-Time Satellite Telemetry • Metro Manila Grid (32×32 Tensor Input)'
    : 'Channel 0: dBZ Reflectivity • Local Manila Grid (32×32 Tensor Input)';

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-8 h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-2xl font-bold font-sans tracking-tight text-stone-900 mb-2" style={SANS}>
          {title}
        </h3>
        <p className="text-sm text-stone-600" style={SANS}>
          {subtitle}
        </p>
      </div>

      {/* Map Container with Tensor Overlay */}
      <div className="flex-1 min-h-[400px] relative rounded-xl overflow-hidden border-2 border-stone-200">
        {/* Map metadata overlays */}
        <div 
          className="absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium text-white z-[1000]"
          style={{ backgroundColor: 'rgba(31, 41, 55, 0.85)', ...MONO }}
        >
          14.5995°N 120.9842°E
        </div>

        <div 
          className="absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium text-white z-[1000]"
          style={{ backgroundColor: 'rgba(31, 41, 55, 0.85)', ...MONO }}
        >
          {currentTime}
        </div>

        <div 
          className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold text-white z-[1000]"
          style={{ backgroundColor: getPagasaColor(pagasaWarning), ...SANS }}
        >
          PAGASA: {pagasaWarning === "NONE" ? "No Warning" : `${pagasaWarning} Warning`}
        </div>

        <MapContainer
          center={[14.5995, 120.9842]}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          {/* Dark mode tile layer - CartoDB Dark Matter */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          />
          
          <TensorOverlay step={step} incidentIdx={incidentIdx} />
          <ManilaMarker />
        </MapContainer>
      </div>

      {/* Color Scale Bar */}
      <div className="mt-6">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-stone-600" style={SANS}>
            dBZ Intensity
          </span>
          <div className="flex-1 h-6 rounded-lg overflow-hidden border border-stone-200"
               style={{
                 background: 'linear-gradient(to right, #94A3B8 0%, #FCD34D 25%, #FB923C 50%, #EF4444 75%, #991B1B 100%)'
               }}
          />
          <div className="flex gap-4 text-xs" style={MONO}>
            <span className="text-stone-500">Low</span>
            <span className="text-stone-500">Med</span>
            <span className="text-stone-500">High</span>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-stone-50 border border-stone-200 rounded-xl">
        <h4 className="text-xs font-semibold text-stone-900 mb-2 uppercase tracking-wide" style={SANS}>
          Spatial Observation Tensor
        </h4>
        <p className="text-sm text-stone-700 leading-relaxed" style={SANS}>
          This 32×32 grid maps radar reflectivity (dBZ intensity) across Metro Manila. The PPO policy network processes these spatial vectors through its convolutional encoder to evaluate storm trajectory and density before making a recommendation.
        </p>
      </div>
    </div>
  );
}
