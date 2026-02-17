/**
 * Loading state for the time page
 *
 * Shows a skeleton UI matching the 12-column grid layout
 * while the page is loading.
 */

export default function TimeLoading() {
  return (
    <div className="h-screen w-screen overflow-hidden text-white cursor-none bg-slate-950">
      <div className="grid grid-cols-12 h-full">
        {/* Status Panel skeleton - 5 columns */}
        <div className="col-span-5 flex flex-col justify-between p-10 pb-20 border-r border-slate-800/50">
          {/* Branding skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-16 w-32 bg-slate-800 rounded" />
            <div className="h-8 w-24 bg-slate-800 rounded" />
          </div>

          {/* Countdown skeleton */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-lg bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
              <div className="h-8 w-48 bg-slate-800 rounded mx-auto mb-6" />
              <div className="flex justify-center gap-4">
                <div className="h-32 w-24 bg-slate-800 rounded" />
                <div className="h-32 w-24 bg-slate-800 rounded" />
                <div className="h-32 w-24 bg-slate-800 rounded" />
              </div>
            </div>
          </div>

          {/* Clock skeleton */}
          <div className="flex flex-col items-center">
            <div className="h-24 w-64 bg-slate-800 rounded mb-4" />
            <div className="h-8 w-80 bg-slate-800 rounded mb-2" />
            <div className="h-6 w-48 bg-slate-800 rounded" />
          </div>
        </div>

        {/* Schedule Panel skeleton - 7 columns */}
        <div className="col-span-7 p-4">
          {/* Header row skeleton */}
          <div className="grid grid-cols-3 mb-4 px-6 py-6">
            <div className="w-1/3" />
            <div className="h-8 bg-slate-800 rounded mx-auto w-20" />
            <div className="h-8 bg-slate-800 rounded mx-auto w-20" />
          </div>

          {/* Prayer row skeletons */}
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="grid grid-cols-3 items-center py-4 px-6">
              <div className="h-10 bg-slate-800 rounded w-32" />
              <div className="h-10 bg-slate-800 rounded mx-auto w-20" />
              <div className="h-10 bg-slate-800 rounded mx-auto w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
