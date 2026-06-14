export const PageSkeleton = () => (
  <div className="page-container py-8 animate-pulse">
    <div className="h-8 bg-[var(--bg-secondary)] rounded-xl w-1/3 mb-6" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="card p-4">
          <div className="aspect-square bg-[var(--bg-secondary)] rounded-xl mb-4" />
          <div className="h-4 bg-[var(--bg-secondary)] rounded w-3/4 mb-2" />
          <div className="h-4 bg-[var(--bg-secondary)] rounded w-1/2" />
        </div>
      ))}
    </div>
  </div>
);
