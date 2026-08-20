import { useRef, useEffect } from 'react';

const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
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

function TensorHeatmapCanvas({ step, incidentIdx }: { step: number; incidentIdx: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gridSize = 32;
    const cellSize = 10; // 10px per cell = 320px total
    const canvasSize = gridSize * cellSize;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

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
          // Light gray/teal
          r = 148 + (maxIntensity / 0.2) * 50;
          g = 163 + (maxIntensity / 0.2) * 30;
          b = 184;
        } else if (maxIntensity < 0.4) {
          // Yellow
          const t = (maxIntensity - 0.2) / 0.2;
          r = 198 + t * 54;
          g = 193 + t * 27;
          b = 184 - t * 94;
        } else if (maxIntensity < 0.7) {
          // Orange
          const t = (maxIntensity - 0.4) / 0.3;
          r = 252 - t * 28;
          g = 220 - t * 96;
          b = 90 - t * 52;
        } else {
          // Dark red
          const t = (maxIntensity - 0.7) / 0.3;
          r = 224 - t * 71;
          g = 124 - t * 97;
          b = 38 - t * 11;
        }

        ctx.fillStyle = `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);

        // Optional: subtle grid lines
        if (maxIntensity > 0.1) {
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }

    // Add Manila marker in center
    const centerX = 16 * cellSize;
    const centerY = 16 * cellSize;
    
    ctx.fillStyle = '#1F2937';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();

  }, [step, incidentIdx]);

  return (
    <canvas 
      ref={ref} 
      width={320} 
      height={320} 
      className="rounded-lg border-2 border-stone-200"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}

export default function RadarGrid({ step, incidentIdx, pagasaWarning }: RadarGridProps) {
  const currentTime = HOUR_STEPS[step]?.label || "12:00 PM";

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-8">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-stone-900 mb-2" style={SERIF}>
          PAGASA Radar Input Grid
        </h3>
        <p className="text-sm text-stone-600" style={SANS}>
          Channel 0: dBZ Reflectivity • Local Manila Grid (32×32 Tensor Input)
        </p>
      </div>

      {/* Tensor Heatmap with Annotations - Scaled Up */}
      <div className="w-full max-w-md mx-auto">
        <div className="relative aspect-square w-full">
          {/* Top-left coordinate metadata */}
          <div 
            className="absolute top-3 left-3 px-2 py-1 rounded text-xs font-medium text-white z-10"
            style={{ backgroundColor: 'rgba(31, 41, 55, 0.85)', ...MONO }}
          >
            14.5995°N 120.9842°E
          </div>

          {/* Top-right timestamp */}
          <div 
            className="absolute top-3 right-3 px-2 py-1 rounded text-xs font-medium text-white z-10"
            style={{ backgroundColor: 'rgba(31, 41, 55, 0.85)', ...MONO }}
          >
            {currentTime}
          </div>

          {/* Bottom-right PAGASA warning pill */}
          <div 
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold text-white z-10"
            style={{ backgroundColor: getPagasaColor(pagasaWarning), ...SANS }}
          >
            PAGASA: {pagasaWarning === "NONE" ? "No Warning" : `${pagasaWarning} Warning`}
          </div>

          <div className="w-full h-full flex items-center justify-center">
            <TensorHeatmapCanvas step={step} incidentIdx={incidentIdx} />
          </div>
        </div>
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

      {/* Data Source Note */}
      <div className="mt-6 p-4 rounded-xl border border-stone-200/80" style={{ backgroundColor: '#FBF9F6' }}>
        <div className="text-xs text-stone-600" style={SANS}>
          <strong>Data Source:</strong> 32×32 pixelated heatmap representing storm intensity vectors 
          derived from PAGASA Doppler radar. This visualization approximates the spatial 
          tensor input processed by the CNN encoder branch of the PPO policy network.
        </div>
      </div>

      {/* Elegant Caption */}
      <p className="text-xs text-stone-500 italic mt-3 text-center" style={SANS}>
        The PPO agent processes this 32×32 spatial tensor to identify storm density and trajectory relative to the Metro Manila grid.
      </p>
    </div>
  );
}
