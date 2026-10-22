'use client';

import { useEffect } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowBigUp } from 'lucide-react';
import { ALERT_CATEGORIES, asStatus, STATUS_COLORS, type Issue } from '../lib/constants';
import { StatusBadge } from './IssueCard';

const iconCache = new Map<string, L.DivIcon>();

function pinIcon(color: string, ring = false, alert = false) {
  const key = color + ring + alert;
  let icon = iconCache.get(key);
  if (!icon) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
      <path d="M16 1C8 1 2 7 2 15c0 10 14 26 14 26s14-16 14-26C30 7 24 1 16 1z" fill="${color}" stroke="${ring ? '#2563eb' : '#fff'}" stroke-width="${ring ? 3 : 2}"/>
      ${alert ? '<text x="16" y="20" text-anchor="middle" font-size="14" font-weight="bold" fill="#fff">!</text>' : '<circle cx="16" cy="15" r="5" fill="#fff"/>'}</svg>`;
    icon = L.divIcon({
      html: svg,
      className: alert ? 'alert-pin' : '',
      iconSize: [32, 42],
      iconAnchor: [16, 41],
      popupAnchor: [0, -38],
    });
    iconCache.set(key, icon);
  }
  return icon;
}

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, Math.max(map.getZoom(), 15), { duration: 0.8 });
  }, [target, map]);
  return null;
}

export type IssueMapProps = {
  issues: Issue[];
  picked: [number, number] | null;
  flyTarget: [number, number] | null;
  selectedId: number | null;
  busy: boolean;
  onPick: (lat: number, lng: number) => void;
  onUpvote: (id: number) => void;
  onSelect: (id: number) => void;
};

export default function IssueMap({ issues, picked, flyTarget, selectedId, busy, onPick, onUpvote, onSelect }: IssueMapProps) {
  const center: [number, number] = picked ?? (issues[0] ? [issues[0].latitude, issues[0].longitude] : [23.8103, 90.4125]);

  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full rounded-xl" style={{ minHeight: 360 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onPick={onPick} />
      <FlyTo target={flyTarget} />

      {issues.map((issue) => {
        const status = asStatus(issue.status);
        return (
          <Marker
            key={issue.id}
            position={[issue.latitude, issue.longitude]}
            icon={pinIcon(STATUS_COLORS[status], issue.id === selectedId, ALERT_CATEGORIES.includes(issue.category))}
            eventHandlers={{ click: () => onSelect(issue.id) }}
          >
            <Popup minWidth={220}>
              <div className="space-y-2 text-zinc-900">
                <p className="text-base font-semibold leading-tight">{issue.title}</p>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium">
                    {ALERT_CATEGORIES.includes(issue.category) && 'ALERT: '}
                    {issue.category}
                  </span>
                  <StatusBadge status={issue.status} />
                </div>
                {issue.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={issue.imageUrl} alt={issue.title} className="h-28 w-full rounded object-cover" />
                )}
                <button
                  onClick={() => onUpvote(issue.id)}
                  disabled={busy}
                  className="flex w-full items-center justify-center gap-1 rounded-md bg-blue-600 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <ArrowBigUp size={16} /> Upvote ({issue.upvotes})
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {picked && <Marker position={picked} icon={pinIcon('#2563eb', true)} zIndexOffset={1000} />}
    </MapContainer>
  );
}


