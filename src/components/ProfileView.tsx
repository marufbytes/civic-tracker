import { Briefcase, Mail, MapPin, Pencil, Phone, User, UserCircle, Users } from 'lucide-react';
import type { ProfileData } from './ProfileForm';

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 text-blue-600">{icon}</span>
      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
        <p className="font-medium">{value || <span className="font-normal text-zinc-400">Not added yet</span>}</p>
      </div>
    </div>
  );
}

export function ProfileView({ profile, onEdit }: { profile: ProfileData; onEdit: () => void }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header with avatar and name */}
      <div className="flex flex-col items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-8 text-white">
        {profile.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatarUrl} alt="Profile" className="h-28 w-28 rounded-full border-4 border-white object-cover" />
        ) : (
          <UserCircle size={112} className="text-white/80" />
        )}
        <h2 className="text-2xl font-bold">{profile.fullName || profile.username}</h2>
        <p className="text-blue-100">@{profile.username}</p>
      </div>

      <div className="divide-y divide-zinc-100 px-6 dark:divide-zinc-800">
        <Row icon={<User size={18} />} label="Full name" value={profile.fullName} />
        <Row icon={<Mail size={18} />} label="Email" value={profile.email} />
        <Row icon={<Phone size={18} />} label="Phone" value={profile.phone} />
        <Row icon={<MapPin size={18} />} label="Address" value={profile.address} />
        <Row icon={<Briefcase size={18} />} label="Occupation" value={profile.occupation} />
        <Row icon={<Users size={18} />} label="Gender" value={profile.gender} />
      </div>

      <div className="p-6">
        <button
          onClick={onEdit}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 font-medium text-white hover:bg-blue-700"
        >
          <Pencil size={16} /> Edit Profile
        </button>
      </div>
    </div>
  );
}

