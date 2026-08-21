const SANS: React.CSSProperties = { fontFamily: "'Inter', -apple-system, sans-serif" };

// Skeleton for Decision Card (AI or LGU)
export function DecisionCardSkeleton({ type = 'ai' }: { type?: 'ai' | 'lgu' }) {
  const isAI = type === 'ai';
  
  return (
    <div 
      className={`rounded-2xl shadow-sm flex flex-col relative overflow-hidden border-t-4 h-full ${
        isAI 
          ? 'bg-slate-100 border-2 border-slate-300 shadow-xl ring-2 ring-slate-300' 
          : 'bg-slate-50 border border-slate-300 opacity-90'
      }`}
    >
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="min-w-0 flex-1">
            <div className="h-8 w-3/5 max-w-full bg-slate-300 rounded animate-pulse mb-3" />
            <div className="h-4 w-2/5 max-w-full bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="shrink-0 w-16 h-10 bg-slate-300 rounded-lg animate-pulse" />
        </div>

        {/* Action Title */}
        <div className="h-10 w-4/5 bg-slate-300 rounded animate-pulse mb-4" />

        {/* Confidence/Metadata Line */}
        <div className="h-5 w-2/3 bg-slate-200 rounded animate-pulse mb-6" />

        {/* KPI Blocks Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl p-5 bg-slate-200 min-h-[120px] flex flex-col justify-between animate-pulse">
            <div className="h-3 w-3/4 bg-slate-300 rounded mb-3" />
            <div className="h-12 w-1/2 bg-slate-300 rounded" />
            <div className="h-3 w-2/3 bg-slate-300 rounded mt-2" />
          </div>
          <div className="rounded-xl p-5 bg-slate-200 min-h-[120px] flex flex-col justify-between animate-pulse">
            <div className="h-3 w-3/4 bg-slate-300 rounded mb-3" />
            <div className="h-12 w-1/2 bg-slate-300 rounded" />
            <div className="h-3 w-2/3 bg-slate-300 rounded mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton for GIS Map
export function MapSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-8 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 w-2/3 bg-slate-300 rounded animate-pulse mb-2" />
        <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
      </div>

      {/* Map Container */}
      <div className="flex-1 min-h-[400px] relative rounded-xl overflow-hidden border-2 border-stone-200 bg-slate-800 animate-pulse">
        {/* Map metadata overlay skeletons */}
        <div className="absolute top-3 left-3 w-32 h-6 bg-slate-700/80 rounded animate-pulse z-10" />
        <div className="absolute top-3 right-3 w-24 h-6 bg-slate-700/80 rounded animate-pulse z-10" />
        <div className="absolute bottom-3 right-3 w-40 h-8 bg-slate-700/80 rounded-full animate-pulse z-10" />
        
        {/* Subtle grid lines overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(0deg, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px'
          }} />
        </div>
      </div>

      {/* Color Scale Bar */}
      <div className="mt-6">
        <div className="flex items-center gap-3">
          <div className="h-4 w-24 bg-slate-200 rounded animate-pulse" />
          <div className="flex-1 h-6 bg-slate-200 rounded-lg animate-pulse" />
          <div className="flex gap-4">
            <div className="h-4 w-8 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-8 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-8 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>
      </div>

      {/* Explainer text */}
      <div className="mt-4 p-4 bg-stone-50 border border-stone-200 rounded-xl">
        <div className="h-4 w-48 bg-slate-200 rounded animate-pulse mb-2" />
        <div className="h-3 w-full bg-slate-200 rounded animate-pulse mb-2" />
        <div className="h-3 w-4/5 bg-slate-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

// Skeleton for Live Map
export function LiveMapSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm p-8 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="h-8 w-2/3 bg-slate-300 rounded animate-pulse mb-2" />
        <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
      </div>

      {/* Map Container */}
      <div className="flex-1 min-h-[300px] rounded-xl overflow-hidden border-2 border-stone-200 bg-slate-800 animate-pulse relative">
        {/* Loading indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-slate-500 text-sm font-mono" style={SANS}>
            Loading map tiles...
          </div>
        </div>
      </div>
    </div>
  );
}
