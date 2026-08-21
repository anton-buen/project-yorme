const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };

interface LiveMapProps {
  bare?: boolean; // When true, renders without outer card wrapper
}

export default function LiveMap({ bare = false }: LiveMapProps) {
  const content = (
    <>
      {!bare && (
        <>
          <div className="mb-6 flex items-center gap-2">
            <h3 className="text-2xl font-bold font-sans tracking-tight text-stone-900" style={SANS}>
              Live Meteorological Radar
            </h3>
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </div>
          <p className="text-sm text-stone-600 mb-6" style={SANS}>
            Real-time Precipitation Data • Metro Manila Region
          </p>
        </>
      )}

      <div className="relative w-full rounded-xl overflow-hidden border-2 border-stone-200/80" style={{ height: '400px' }}>
        <iframe
          src="https://embed.windy.com/embed2.html?lat=14.5995&lon=120.9842&detailLat=14.5995&detailLon=120.9842&width=650&height=450&zoom=10&level=surface&overlay=rain&product=ecmwf&menu=&message=true&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1"
          className="w-full h-full"
          title="Live Weather Radar - Metro Manila"
          style={{ border: 'none' }}
        />
      </div>

      <div className="mt-6 p-4 rounded-xl border border-stone-200/80" style={{ backgroundColor: '#FBF9F6' }}>
        <div className="text-xs text-stone-600" style={SANS}>
          <strong>Live Source:</strong> Windy.com • ECMWF weather models • 
          Updates hourly • Centered on Manila coordinates (14.5995°N, 120.9842°E)
        </div>
      </div>

      {/* Elegant Caption */}
      <p className="text-xs text-stone-500 italic mt-3 text-center" style={SANS}>
        Real-time ECMWF meteorological data used as the live observation space for inference.
      </p>
    </>
  );

  if (bare) {
    return <div className="p-6 flex flex-col flex-1">{content}</div>;
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-8">
      {content}
    </div>
  );
}
