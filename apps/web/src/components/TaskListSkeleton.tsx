export function TaskListSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6" aria-busy="true" aria-label="Loading tasks">
      <div>
        <div className="h-5 sm:h-6 w-24 bg-gray-200 rounded animate-pulse mb-2 sm:mb-3"></div>
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3"
            >
              {/* Checkbox skeleton */}
              <div className="w-5 h-5 sm:w-4 sm:h-4 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
              
              {/* Content skeleton */}
              <div className="flex-1 min-w-0 space-y-2">
                {/* Title skeleton */}
                <div className="h-4 sm:h-5 bg-gray-200 rounded animate-pulse w-3/4"></div>
                {/* Date skeleton */}
                <div className="h-3 bg-gray-200 rounded animate-pulse w-24"></div>
              </div>
              
              {/* Delete button skeleton */}
              <div className="w-5 h-5 sm:w-4 sm:h-4 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

