'use client';

import dynamic from 'next/dynamic';
import type { IssueMapProps } from './IssueMap';

export const MapSkeleton = () => (
  <div className="flex h-full min-h-90 w-full animate-pulse items-center justify-center rounded-xl bg-zinc-200 text-sm text-zinc-500 dark:bg-zinc-800">
    Loading map...
  </div>
);

const IssueMap = dynamic(() => import('./IssueMap'), { ssr: false, loading: MapSkeleton });

export function MapView(props: IssueMapProps) {
  return <IssueMap {...props} />;
}

