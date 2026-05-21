export function AppointmentSkeleton() {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="skeleton-shimmer h-4 w-32 rounded-lg" />
        <div className="skeleton-shimmer h-5 w-14 rounded-full" />
      </div>
      <div className="skeleton-shimmer h-3 w-48 rounded-lg" />
      <div className="skeleton-shimmer h-3 w-40 rounded-lg" />
      <div className="skeleton-shimmer h-8 w-28 rounded-xl mt-2" />
    </div>
  )
}

export function AppointmentSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <AppointmentSkeleton key={i} />
      ))}
    </div>
  )
}
