'use client';

import { useMemo, useState, useTransition } from 'react';
import { addComment, approveIssue, deleteIssue, flagSpam, updateIssueStatus, upvoteIssue, type ActionResult } from '../app/actions';
import type { Comment, Issue, SessionUser } from '../lib/constants';
import { AuthModal } from './AuthModal';
import { Navbar } from './Navbar';
import { StatsBar } from './StatsBar';
import { FilterBar, type Filters } from './FilterBar';
import { IssueForm } from './IssueForm';
import { IssueCard } from './IssueCard';
import { MapView } from './MapView';
import { ToastProvider, useToast } from './Toast';

function DashboardInner({ issues, comments, user }: { issues: Issue[]; comments: Comment[]; user: SessionUser | null }) {
  const toast = useToast();
  const [authOpen, setAuthOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string | undefined>();
  const [filters, setFilters] = useState<Filters>({ category: 'All', status: 'All', search: '', sort: 'upvotes' });
  const [lat, setLat] = useState('23.8103');
  const [lng, setLng] = useState('90.4125');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [busy, startTransition] = useTransition();

  const requireAuth = (reason?: string) => {
    setAuthReason(reason);
    setAuthOpen(true);
  };

  const run = (fn: () => Promise<ActionResult>) =>
    startTransition(async () => {
      const res = await fn();
      if (res.authRequired) return requireAuth();
      toast(res.success ? 'success' : 'error', res.message);
    });

  const visible = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    const list = issues.filter(
      (i) =>
        (filters.category === 'All' || i.category === filters.category) &&
        (filters.status === 'All' || i.status === filters.status) &&
        (!q || i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q))
    );
    return list.sort((a, b) =>
      filters.sort === 'upvotes'
        ? b.upvotes - a.upvotes
        : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [issues, filters]);

  const latN = parseFloat(lat);
  const lngN = parseFloat(lng);
  const picked: [number, number] | null = Number.isFinite(latN) && Number.isFinite(lngN) ? [latN, lngN] : null;

  const onUpvote = (id: number) => {
    if (!user) return requireAuth('Log in to upvote issues.');
    run(() => upvoteIssue(id));
  };
  const onFlag = (id: number) => {
    if (!user) return requireAuth('Log in to flag spam.');
    run(() => flagSpam(id));
  };

  return (
    <>
      <Navbar user={user} onLogin={() => requireAuth()} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} reason={authReason} />
      <main className="mx-auto w-full max-w-7xl space-y-6 p-4">
        <StatsBar issues={issues} />
        <FilterBar filters={filters} onChange={setFilters} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <IssueForm
              latitude={lat}
              longitude={lng}
              user={user}
              onGpsFound={(a, b) => {
                setLat(a.toFixed(6));
                setLng(b.toFixed(6));
                setFlyTarget([a, b]);
              }}
              onRequireAuth={() => requireAuth('Log in to submit a report.')}
              onLocationChange={(a, b) => {
                setLat(a);
                setLng(b);
              }}
            />
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="h-[420px] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
              <MapView
                issues={visible}
                picked={picked}
                flyTarget={flyTarget}
                selectedId={selectedId}
                busy={busy}
                onPick={(a, b) => {
                  setLat(a.toFixed(6));
                  setLng(b.toFixed(6));
                }}
                onUpvote={onUpvote}
                onSelect={setSelectedId}
              />
            </div>

            <div className="space-y-4">
              <h1 className="text-2xl font-bold">
                Reported Civic Issues <span className="text-base font-normal text-zinc-500">({visible.length})</span>
              </h1>
              {visible.length === 0 ? (
                <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
                  {issues.length === 0 ? 'No issues reported yet. Add one!' : 'No issues match your filters.'}
                </p>
              ) : (
                visible.map((issue) => (
                  <IssueCard
                    key={issue.id}
                    issue={issue}
                    user={user}
                    busy={busy}
                    selected={issue.id === selectedId}
                    onUpvote={onUpvote}
                    onFlag={onFlag}
                    comments={comments.filter((c) => c.issueId === issue.id)}
                    onComment={async (text) => {
                      if (!user) {
                        requireAuth('Log in to comment.');
                        return false;
                      }
                      const res = await addComment(issue.id, text);
                      toast(res.success ? 'success' : 'error', res.message);
                      return res.success;
                    }}
                    onApprove={(id) => run(() => approveIssue(id))}
                    onStatus={(id, s, after) => run(() => updateIssueStatus(id, s, after))}
                    onDelete={(id) => run(() => deleteIssue(id))}
                    onFocus={(id) => {
                      setSelectedId(id);
                      setFlyTarget([issue.latitude, issue.longitude]);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export function Dashboard({ issues, comments, user }: { issues: Issue[]; comments: Comment[]; user: SessionUser | null }) {
  return (
    <ToastProvider>
      <DashboardInner issues={issues} comments={comments} user={user} />
    </ToastProvider>
  );
}




