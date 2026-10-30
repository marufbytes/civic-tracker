import { Camera, CheckCircle2, MapPinned, ShieldAlert, Siren, ThumbsUp, TrafficCone, UserCheck, Users } from 'lucide-react';
import type { ReactNode } from 'react';

export type HomeStats = {
  solved: number;
  active: number;
  citizens: number;
};

const steps = [
  {
    icon: Camera,
    title: '1. Spot & Snap',
    text: 'See a broken road, garbage pile, waterlogging or a traffic jam? Take a clear photo of the problem.',
  },
  {
    icon: MapPinned,
    title: '2. Verify & Submit',
    text: 'Pin the exact place in Bangladesh on the map or use GPS, then submit your report with the photo.',
  },
  {
    icon: ThumbsUp,
    title: '3. Track & Support',
    text: 'Follow the progress from Pending to Resolved, and upvote the problems that matter most to your area.',
  },
];

const features = [
  {
    icon: TrafficCone,
    title: 'Live Traffic & Road Protest Tracking',
    text: 'Heavy traffic jams, road protests, accidents and waterlogging appear as glowing alert pins so everyone sees them fast.',
  },
  {
    icon: Siren,
    title: 'Emergency Severity Levels',
    text: 'Every report is marked Low, Medium or High, so urgent problems are easy to find and filter.',
  },
  {
    icon: CheckCircle2,
    title: 'Transparent Admin Updates',
    text: 'Admins move reports from Pending to In Progress to Resolved, and upload an "after" photo as proof of the fix.',
  },
  {
    icon: ShieldAlert,
    title: 'Community Spam Prevention',
    text: 'A photo is required for every report, and reports flagged as spam by three people are hidden for review.',
  },
];

export function AboutSection() {
  return (
    <section id="about" className="scroll-mt-20 bg-white py-16 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">About Us</h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Civic Issue Tracker connects citizens and city authorities in one simple place. We believe a better digital
            Bangladesh starts when every person can report a problem, and every report can be seen, tracked and solved
            in the open.
          </p>
        </div>
      </div>
    </section>
  );
}

export function HowItWorksSection() {
  return (
    <section className="bg-white py-16 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="text-center text-2xl font-bold">How It Works</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                <Icon size={28} />
              </div>
              <h4 className="text-lg font-semibold">{title}</h4>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function OverviewSection({ stats, children }: { stats: HomeStats; children?: ReactNode }) {
  const counters = [
    { icon: CheckCircle2, value: stats.solved, label: 'Issues Solved', color: 'text-green-600' },
    { icon: ShieldAlert, value: stats.active, label: 'Active Reports', color: 'text-red-600' },
    { icon: Users, value: stats.citizens, label: 'Participating Citizens', color: 'text-blue-600' },
  ];

  return (
    <section id="overview" className="scroll-mt-20 bg-zinc-50 py-16 dark:bg-zinc-900/50">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold">Live Map Overview</h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">
            Every report appears on a live map of Bangladesh. Here is what you can do with it.
          </p>
        </div>

        {children}

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-950">
                <Icon size={22} />
              </div>
              <div>
                <h4 className="font-semibold">{title}</h4>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Counters */}
        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {counters.map(({ icon: Icon, value, label, color }) => (
            <div
              key={label}
              className="rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Icon className={`mx-auto mb-2 ${color}`} size={30} />
              <p className="text-4xl font-extrabold">{value}</p>
              <p className="mt-1 text-sm text-zinc-500">{label}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 flex items-center justify-center gap-1 text-xs text-zinc-500">
          <UserCheck size={12} /> Live numbers from across Bangladesh
        </p>
      </div>
    </section>
  );
}
