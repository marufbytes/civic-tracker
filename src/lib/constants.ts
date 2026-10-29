export const CATEGORIES = [
  'Road',
  'Water',
  'Garbage',
  'Streetlight',
  'Road Protest',
  'Heavy Traffic Jam',
  'Accident / Emergency',
  'Waterlogging',
] as const;

// Live alerts get a glowing badge and a special pin on the map
export const ALERT_CATEGORIES: string[] = ['Road Protest', 'Heavy Traffic Jam', 'Accident / Emergency', 'Waterlogging'];

export type Comment = {
  id: number;
  issueId: number;
  authorName: string;
  text: string;
  createdAt: Date | string;
};
export const STATUSES = ['Pending', 'In Progress', 'Resolved'] as const;
export const SEVERITIES = ['Low', 'Medium', 'High'] as const;
export type Severity = (typeof SEVERITIES)[number];

export const SEVERITY_BADGE: Record<string, string> = {
  Low: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  Medium: 'bg-red-100 text-red-700 border border-red-300',
  High: 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.85)] animate-pulse',
  Critical: 'bg-red-600 text-white shadow-[0_0_12px_rgba(220,38,38,0.85)] animate-pulse',
};

export type SessionUser = {
  id: number;
  name: string; // username
  displayName: string; // full name, or the username with a capital first letter
  role: 'user' | 'admin';
  avatarUrl: string | null;
};

export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];

export const STATUS_COLORS: Record<Status, string> = {
  Pending: '#ef4444',
  'In Progress': '#eab308',
  Resolved: '#22c55e',
};

export const STATUS_BADGE: Record<Status, string> = {
  Pending: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  'In Progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  Resolved: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
};

export const NEXT_STATUS: Record<Status, Status> = {
  Pending: 'In Progress',
  'In Progress': 'Resolved',
  Resolved: 'Pending',
};

export type Issue = {
  id: number;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  imageUrl: string | null;
  status: string;
  upvotes: number;
  createdAt: Date | string;
  userId: number | null;
  authorName: string;
  severity: string;
  afterImageUrl: string | null;
  spamCount: number;
  isApproved: boolean;
  locationName: string | null;
};

export function asStatus(s: string): Status {
  return (STATUSES as readonly string[]).includes(s) ? (s as Status) : 'Pending';
}


