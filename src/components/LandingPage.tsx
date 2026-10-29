'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Map as MapIcon, MapPin, MapPinned, Radio } from 'lucide-react';
import { upvoteIssue } from '../app/actions';
import { asStatus, STATUS_BADGE, type Issue, type SessionUser } from '../lib/constants';
import { AuthModal } from './AuthModal';
import { AboutSection, OverviewSection, type HomeStats } from './HomeSections';
import { MapView } from './MapView';
import { Navbar } from './Navbar';
import { ToastProvider, useToast } from './Toast';

const mapCategories = [
  'All',
  'Road',
  'Waterlogging',
  'Heavy Traffic Jam',
  'Road Protest',
  'Accident / Emergency',
  'Garbage',
  'Streetlight',
] as const;

function LandingPageContent({
  user,
  stats,
  issues,
}: {
  user: SessionUser | null;
  stats: HomeStats;
  issues: Issue[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [category, setCategory] = useState<(typeof mapCategories)[number]>('All');
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(() =>
    params.get('login') ? 'login' : null
  );

  const visibleIssues = useMemo(
    () => (category === 'All' ? issues : issues.filter((issue) => issue.category === category)),
    [category, issues]
  );
  const recentIssues = issues.slice(0, 3);

  const reportIssue = () => {
    if (user) router.push('/dashboard');
    else setAuthMode('login');
  };

  const upvote = async (id: number) => {
    if (!user) {
      setAuthMode('login');
      return;
    }

    const result = await upvoteIssue(id);
    if (result.authRequired) {
      setAuthMode('login');
      return;
    }

    toast(result.success ? 'success' : 'error', result.message);
    if (result.success) router.refresh();
  };

  return (
    <>
      <Navbar
        user={user}
        onLogin={() => setAuthMode('login')}
        onSignUp={() => setAuthMode('signup')}
      />

      <section className="relative overflow-hidden bg-gradient-to-br from-green-950 via-green-800 to-emerald-600 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-red-600/50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:py-28 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200">
              <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
              <Radio className="h-3.5 w-3.5 animate-pulse text-red-300" aria-hidden="true" />
              <span>Live Civic &amp; Traffic Alerts in Bangladesh</span>
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
              Make your community safer, one report at a time.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-green-50">
              Report potholes, garbage, waterlogging, traffic jams and emergencies in your area. Follow every report
              from the first pin to the final fix.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-green-900 shadow-lg transition hover:bg-green-50"
              >
                <MapIcon size={18} /> Explore Live Map
              </button>
              <button
                onClick={reportIssue}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-red-700"
              >
                <MapPinned size={18} /> Report an Issue <ArrowRight size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { value: stats.active, label: 'Active reports', detail: 'Visible to everyone' },
              { value: stats.solved, label: 'Issues resolved', detail: 'Community-led progress' },
              { value: stats.citizens, label: 'Citizens involved', detail: 'Across Bangladesh' },
              { value: issues.length, label: 'Live on the map', detail: 'Approved reports' },
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/15 bg-white/10 p-5 shadow-lg backdrop-blur">
                <p className="text-3xl font-extrabold sm:text-4xl">{stat.value.toLocaleString()}</p>
                <p className="mt-2 font-semibold">{stat.label}</p>
                <p className="mt-1 text-sm text-green-100">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AboutSection />
      <OverviewSection stats={stats}>
        <div className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Explore reports by category</h3>
            <p className="text-sm text-zinc-500">{visibleIssues.length} reports shown</p>
          </div>
          <div className="mb-5 flex flex-wrap gap-2" aria-label="Filter map by category">
            {mapCategories.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  category === item
                    ? 'border-green-700 bg-green-700 text-white'
                    : 'border-zinc-300 bg-white hover:border-green-600 dark:border-zinc-700 dark:bg-zinc-900'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="h-[420px] overflow-hidden rounded-2xl border border-zinc-200 shadow-lg dark:border-zinc-800">
            <MapView
              issues={visibleIssues}
              picked={null}
              flyTarget={null}
              onPick={() => undefined}
              onUpvote={upvote}
              onSelect={() => undefined}
            />
          </div>
        </div>
      </OverviewSection>

      <section className="bg-white py-16 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-green-700 dark:text-green-400">From the community</p>
              <h2 className="mt-2 text-3xl font-bold">Recent Reports Across Bangladesh</h2>
            </div>
            <button onClick={() => document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' })} className="font-semibold text-green-700 hover:text-green-800 dark:text-green-400">
              View live map <ArrowRight className="ml-1 inline" size={16} />
            </button>
          </div>
          {recentIssues.length ? (
            <div className="grid gap-6 md:grid-cols-3">
              {recentIssues.map((issue) => {
                const status = asStatus(issue.status);
                return (
                  <article key={issue.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    {issue.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={issue.imageUrl} alt={issue.title} className="h-48 w-full object-cover" />
                    ) : (
                      <div className="flex h-48 items-center justify-center bg-zinc-100 text-zinc-400 dark:bg-zinc-800">
                        <MapPinned size={36} />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 dark:bg-green-950 dark:text-green-300">{issue.category}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[status]}`}>{status}</span>
                      </div>
                      <h3 className="mt-3 text-lg font-bold">{issue.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">{issue.description}</p>
                      <p className="mt-4 flex items-center gap-1.5 text-sm text-zinc-500">
                        <MapPin size={15} />
                        {issue.locationName || `${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)}`}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-zinc-500 dark:border-zinc-700">
              No approved reports yet. Be the first to report an issue.
            </p>
          )}
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-zinc-50 py-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-sm text-zinc-600 sm:flex-row dark:text-zinc-400">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">Civic Issue Tracker</span>
          <span>Built for a safer, more connected Bangladesh.</span>
          <a href="#overview" className="font-medium text-green-700 hover:underline dark:text-green-400">Explore the live map</a>
        </div>
      </footer>
      {authMode !== null && (
        <AuthModal
          initialMode={authMode || 'login'}
          onClose={() => setAuthMode(null)}
        />
      )}
    </>
  );
}

export function LandingPage({ user, stats, issues }: { user: SessionUser | null; stats: HomeStats; issues: Issue[] }) {
  return (
    <ToastProvider>
      <LandingPageContent user={user} stats={stats} issues={issues} />
    </ToastProvider>
  );
}
