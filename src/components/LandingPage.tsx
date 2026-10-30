'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Droplets,
  Map as MapIcon,
  MapPin,
  MapPinned,
  Pause,
  Play,
  Radio,
  TrafficCone,
  Trash2,
  Users,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { upvoteIssue } from '../app/actions';
import type { Issue, SessionUser } from '../lib/constants';
import { AuthModal } from './AuthModal';
import { AboutSection, HowItWorksSection, OverviewSection, type HomeStats } from './HomeSections';
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

type HeroAlert = {
  category: string;
  title: string;
  location: string;
};

const sampleAlerts: HeroAlert[] = [
  { category: 'Traffic', title: 'Traffic moving slowly near a busy junction', location: 'Farmgate, Dhaka' },
  { category: 'Waterlogging', title: 'Residents reporting water on the road', location: 'Kandirpar, Cumilla' },
  { category: 'Road', title: 'Community update: road repairs underway', location: 'GEC Circle, Chattogram' },
];

function BangladeshMap() {
  return (
    <div className="relative mx-auto flex aspect-square w-full max-w-[360px] items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/bd-map.svg"
        alt="Map of Bangladesh"
        className="pointer-events-none h-full w-full select-none object-contain scale-110 opacity-50 invert brightness-200 drop-shadow-[0_0_16px_rgba(16,185,129,0.5)]"
      />
    </div>
  );
}

function categoryIcon(category: string): ReactNode {
  if (/water|flood/i.test(category)) return <Droplets size={18} />;
  if (/traffic|road/i.test(category)) return <TrafficCone size={18} />;
  if (/garbage/i.test(category)) return <Trash2 size={18} />;
  return <AlertTriangle size={18} />;
}

function LiveAlertTicker({ issues }: { issues: Issue[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const alerts = useMemo<HeroAlert[]>(
    () =>
      issues.length
        ? issues.slice(0, 5).map((issue) => ({
            category: issue.category,
            title: issue.title,
            location: issue.locationName || `${issue.latitude.toFixed(3)}, ${issue.longitude.toFixed(3)}`,
          }))
        : sampleAlerts,
    [issues]
  );
  const alert = alerts[activeIndex % alerts.length];
  useEffect(() => {
    if (paused || alerts.length < 2) return;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % alerts.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [alerts.length, paused]);

  const showPrevious = () => setActiveIndex((index) => (index - 1 + alerts.length) % alerts.length);
  const showNext = () => setActiveIndex((index) => (index + 1) % alerts.length);

  return (
    <div className="rounded-2xl border border-white/15 bg-green-950/45 p-4 shadow-lg backdrop-blur">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-100">
          <Radio size={14} className="animate-pulse text-red-300" /> Live Pulse
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={showPrevious}
            aria-label="Previous alert"
            className="cursor-pointer rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? 'Resume alert feed' : 'Pause alert feed'}
            className="cursor-pointer rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button
            type="button"
            onClick={showNext}
            aria-label="Next alert"
            className="cursor-pointer rounded-md p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
          >
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
      <div key={`${activeIndex}-${alert.title}`} className="mt-3 flex min-h-16 items-start gap-3 animate-[hero-alert-enter_450ms_ease-out]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-amber-300">
          {categoryIcon(alert.category)}
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-200">{alert.category}</p>
          <p className="mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-white">{alert.title}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-green-100/70">
            <MapPin size={12} /> {alert.location}
          </p>
        </div>
      </div>
    </div>
  );
}

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
        <div className="hero-grid-pattern pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative z-10 mx-auto max-w-[92%] px-4 pt-6 pb-10 sm:pt-8 sm:pb-10 lg:max-w-[96%]">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
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
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-green-900 shadow-lg transition hover:bg-green-50"
                >
                  <MapIcon size={18} /> Explore Live Map
                </button>
                <button
                  onClick={reportIssue}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-red-700"
                >
                  <MapPinned size={18} /> Report an Issue <ArrowRight size={16} />
                </button>
              </div>
            </div>

            <div className="relative flex min-h-[360px] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] sm:min-h-[430px] lg:col-span-5">
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-300/[0.08] via-transparent to-amber-300/[0.08]" />
              <BangladeshMap />
            </div>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_0.62fr]">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: AlertTriangle, value: stats.active, label: 'Active reports', detail: 'Visible to everyone' },
                { icon: CheckCircle2, value: stats.solved, label: 'Issues resolved', detail: 'Community-led progress' },
                { icon: Users, value: stats.citizens, label: 'Citizens involved', detail: 'Across Bangladesh' },
                { icon: MapPin, value: issues.length, label: 'Live on the map', detail: 'Approved reports' },
              ].map(({ icon: Icon, value, label, detail }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => document.getElementById('overview')?.scrollIntoView({ behavior: 'smooth' })}
                  className="cursor-pointer rounded-2xl border border-white/15 bg-white/10 p-4 text-left shadow-lg backdrop-blur transition-all hover:-translate-y-1 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
                >
                  <Icon size={19} className="mb-3 text-amber-200" />
                  <p className="text-2xl font-extrabold sm:text-3xl">{value.toLocaleString()}</p>
                  <p className="mt-1 text-sm font-semibold">{label}</p>
                  <p className="mt-1 text-xs text-green-100">{detail}</p>
                </button>
              ))}
            </div>
            <LiveAlertTicker issues={issues} />
          </div>
        </div>
      </section>

      <HowItWorksSection />
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
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition ${
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

      <AboutSection />
      <footer className="border-t border-zinc-200 bg-zinc-50 py-8 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto grid max-w-7xl gap-3 px-4 text-center text-sm text-zinc-600 sm:grid-cols-3 sm:items-center sm:px-6 sm:text-left lg:px-8 dark:text-zinc-400">
          {/* <a href="mailto:marufahammed496@gmail.com" className="font-medium text-green-700 hover:underline dark:text-green-400">
            Contact Us: marufahammed496@gmail.com
          </a> */}
          <p className="sm:text-left">Contact Us: marufahammed496@gmail.com</p>
          <p className="sm:text-center">© 2026 Civic Issue Tracker. All rights reserved.</p>
          <p className="sm:text-right">Built for a safer, more connected Bangladesh.</p>
        </div>
      </footer>
      <AuthModal
        key={authMode ?? 'closed'}
        isOpen={authMode !== null}
        initialMode={authMode ?? 'login'}
        onClose={() => setAuthMode(null)}
      />
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
