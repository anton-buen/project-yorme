import { useRef, useEffect } from 'react';

const SERIF: React.CSSProperties = { fontFamily: "'Playfair Display', Georgia, serif" };
const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };
const TERRA = { text: "#9A4B2F" };

interface VisualGroundingProps {
  step: number;
  incidentIdx: number;
}

function RadarCanvas({ step, incidentIdx }: { step: number; incidentIdx: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 320;
    const centerX = size / 2;
    const centerY = size / 2;

    ctx.clearRect(0, 0, size, size);

    // Concentric circles
    for (let radius = 35; radius <= 140; radius += 35) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.strokeStyle = "#E7E5E4";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Grid lines
    ctx.strokeStyle = "#E7E5E4";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - 140);
    ctx.lineTo(centerX, centerY + 140);
    ctx.moveTo(centerX - 140, centerY);
    ctx.lineTo(centerX + 140, centerY);
    ctx.stroke();

    // Radar blobs
    const intensity = Math.min(1, step / 12);
    const numBlobs = 5 + Math.floor(intensity * 7);

    for (let i = 0; i < numBlobs; i++) {
      const angle = (i * 2 * Math.PI) / numBlobs + (step * 0.12);
      const radius = 50 + Math.random() * 70;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      
      const blobSize = 20 + Math.random() * 15;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, blobSize);
      const r = Math.floor(220 - intensity * 60);
      const g = Math.floor(120 - intensity * 80);
      
      gradient.addColorStop(0, `rgba(${r}, ${g}, 80, ${0.75 + intensity * 0.25})`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, 80, 0)`);
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, blobSize, 0, 2 * Math.PI);
      ctx.fill();
    }

    // Center marker
    ctx.fillStyle = TERRA.text;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add "MNL" label
    ctx.fillStyle = TERRA.text;
    ctx.font = "bold 12px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText("MNL", centerX, centerY + 25);

  }, [step, incidentIdx]);

  return (
    <div className="flex flex-col items-center">
      <canvas ref={ref} width={320} height={320} className="rounded-xl" />
      <div className="mt-4 flex items-center gap-5 text-xs" style={SANS}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ background: 'linear-gradient(to right, #FCD34D, #F59E0B)' }} />
          <span className="text-stone-600 font-medium">Light</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ background: 'linear-gradient(to right, #FB923C, #EA580C)' }} />
          <span className="text-stone-600 font-medium">Moderate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full" style={{ background: 'linear-gradient(to right, #DC2626, #991B1B)' }} />
          <span className="text-stone-600 font-medium">Heavy</span>
        </div>
      </div>
    </div>
  );
}

export default function VisualGrounding({ step, incidentIdx }: VisualGroundingProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Left Card: PAGASA Radar Input Grid */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-stone-900 mb-2" style={SERIF}>
            PAGASA Radar Input Grid
          </h3>
          <p className="text-sm text-stone-600" style={SANS}>
            Channel 0: dBZ Reflectivity • Local Manila Grid (32×32 Tensor Input)
          </p>
        </div>

        <div className="flex justify-center">
          <RadarCanvas step={step} incidentIdx={incidentIdx} />
        </div>

        <div className="mt-6 p-4 bg-stone-50 rounded-xl border border-stone-200">
          <div className="text-xs text-stone-600" style={SANS}>
            <strong>Data Source:</strong> Multi-shade intensity tiles representing storm vectors 
            derived from PAGASA Doppler radar. This simulated visualization approximates the spatial 
            tensor input (32×32 grid) processed by the CNN encoder branch of the PPO policy network.
          </div>
        </div>
      </div>

      {/* Right Card: Live Meteorological Radar */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
        <div className="mb-6">
          <h3 className="text-2xl font-bold text-stone-900 mb-2" style={SERIF}>
            Live Meteorological Radar
          </h3>
          <p className="text-sm text-stone-600" style={SANS}>
            Real-time Precipitation Data • Metro Manila Region
          </p>
        </div>

        <div className="relative w-full rounded-xl overflow-hidden border-2 border-stone-200" style={{ height: '360px' }}>
          <iframe
            src="https://embed.windy.com/embed2.html?lat=14.5995&lon=120.9842&detailLat=14.5995&detailLon=120.9842&width=650&height=450&zoom=10&level=surface&overlay=rain&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1"
            className="w-full h-full"
            title="Live Weather Radar - Metro Manila"
            style={{ border: 'none' }}
          />
        </div>

        <div className="mt-6 p-4 bg-stone-50 rounded-xl border border-stone-200">
          <div className="text-xs text-stone-600" style={SANS}>
            <strong>Live Source:</strong> Windy.com • ECMWF weather models • 
            Updates hourly • Centered on Manila coordinates (14.5995°N, 120.9842°E)
          </div>
        </div>
      </div>
    </div>
  );
}
