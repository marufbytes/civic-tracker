'use client';

import { Search } from 'lucide-react';
import { CATEGORIES, STATUSES } from '../lib/constants';

export type Filters = {
  category: string;
  status: string;
  search: string;
  sort: 'upvotes' | 'newest';
};

const field =
  'rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800';

export function FilterBar({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...filters, [k]: v });
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="relative min-w-48 flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          placeholder="Search title or description..."
          className={`${field} w-full pl-9`}
        />
      </div>
      <select aria-label="Category" value={filters.category} onChange={(e) => set('category', e.target.value)} className={field}>
        <option value="All">All Categories</option>
        {CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <select aria-label="Status" value={filters.status} onChange={(e) => set('status', e.target.value)} className={field}>
        <option value="All">All Statuses</option>
        {STATUSES.map((s) => (
          <option key={s}>{s}</option>
        ))}
      </select>
      <select
        aria-label="Sort"
        value={filters.sort}
        onChange={(e) => set('sort', e.target.value as Filters['sort'])}
        className={field}
      >
        <option value="upvotes">Most Upvoted</option>
        <option value="newest">Newest First</option>
      </select>
    </div>
  );
}

