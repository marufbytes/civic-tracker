import { ListChecks, AlertCircle, Loader, CheckCircle2 } from 'lucide-react';
import type { Issue } from '../lib/constants';

export function StatsBar({ issues }: { issues: Issue[] }) {
  const count = (s: string) => issues.filter((i) => i.status === s).length;
  const stats = [
    { label: 'Total Issues', value: issues.length, Icon: ListChecks, color: 'text-blue-600 bg-blue-100 dark:bg-blue-950' },
    { label: 'Pending', value: count('Pending'), Icon: AlertCircle, color: 'text-red-600 bg-red-100 dark:bg-red-950' },
    { label: 'In Progress', value: count('In Progress'), Icon: Loader, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950' },
    { label: 'Resolved', value: count('Resolved'), Icon: CheckCircle2, color: 'text-green-600 bg-green-100 dark:bg-green-950' },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {stats.map(({ label, value, Icon, color }) => (
        <div
          key={label}
          className="flex items-center gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className={`rounded-lg p-3 ${color}`}>
            <Icon size={22} />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{value}</p>
            <p className="mt-1 text-xs text-zinc-500">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-20 animate-pulse rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      ))}
    </div>
  );
}

