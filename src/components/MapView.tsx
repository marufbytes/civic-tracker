'use client';

import IssueMap, { type IssueMapProps } from './IssueMap';

export const MapSkeleton = () => (
  <div
    role="status"
    aria-live="polite"
    className="flex h-full min-h-[420px] w-full animate-pulse items-center justify-center rounded-xl bg-zinc-200 text-sm text-zinc-500 dark:bg-zinc-800"
  >
    Loading interactive map...
  </div>
);

export function MapView(props: IssueMapProps) {
  return <IssueMap {...props} />;
}
