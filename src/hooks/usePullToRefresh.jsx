import { useRef, useState, useCallback } from 'react';

/**
 * Pull-to-Refresh hook for mobile.
 * Attach `containerProps` to a scrollable container and pass a `refetch` callback.
 */
export function usePullToRefresh(refetch) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const isPulling = useRef(false);
  const THRESHOLD = 70;
  const MAX_PULL = 100;

  const onTouchStart = useCallback((e) => {
    if (refreshing) return;
    const scrollTop = e.currentTarget.scrollTop;
    if (scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    } else {
      isPulling.current = false;
    }
  }, [refreshing]);

  const onTouchMove = useCallback((e) => {
    if (!isPulling.current || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      const eased = Math.min(delta * 0.4, MAX_PULL);
      setPullDistance(eased);
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;
    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await refetch();
      } catch (e) {
        console.error(e);
      }
      setRefreshing(false);
    }
    setPullDistance(0);
  }, [pullDistance, refetch, refreshing]);

  const containerProps = {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };

  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return {
    containerProps,
    pullDistance,
    refreshing,
    progress,
    PullIndicator: () => (
      <div
        style={{
          height: pullDistance,
          opacity: refreshing ? 1 : progress,
        }}
        className="flex items-center justify-center overflow-hidden transition-opacity"
      >
        <div
          className={`w-6 h-6 border-2 border-brass/30 border-t-brass rounded-full ${
            refreshing ? 'animate-spin' : ''
          }`}
          style={{ transform: `rotate(${progress * 360}deg)` }}
        />
      </div>
    ),
  };
}