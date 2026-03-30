export default function DocumentsLoading() {
  const gridClass = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3'

  return (
    <div className="p-8 pt-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="h-20 w-40 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-4 w-32 bg-white/5 rounded mt-2 animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-28 bg-white/5 rounded-lg animate-pulse" />
            <div className="h-8 w-32 bg-white/5 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="h-4 w-10 bg-white/5 rounded animate-pulse" />
            <div className="h-6 w-16 bg-white/5 rounded animate-pulse" />
            <div className="h-6 w-12 bg-white/5 rounded animate-pulse" />
            <div className="h-6 w-16 bg-white/5 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="h-6 w-8 bg-white/5 rounded animate-pulse" />
              <div className="h-6 w-14 bg-white/5 rounded animate-pulse" />
              <div className="h-6 w-10 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-1 border-l border-white/10 pl-3">
              <div className="h-6 w-6 bg-white/5 rounded animate-pulse" />
              <div className="h-6 w-6 bg-white/5 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Card grid */}
        <div className={gridClass}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
