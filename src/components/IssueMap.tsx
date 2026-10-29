'use client';

import { useEffect, useRef, useState } from 'react';
import type { LayerGroup, Map as LeafletMap, Marker } from 'leaflet';
import { ALERT_CATEGORIES, asStatus, STATUS_COLORS, type Issue } from '../lib/constants';

const DEFAULT_CENTER: [number, number] = [23.8103, 90.4125]; // Dhaka

// High-severity pins glow; the blue pin is reserved for the picked report location.
function pinIcon(L: typeof import('leaflet'), color: string, highSeverity = false) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 32 42">
    <path d="M16 1C8 1 2 7 2 15c0 10 14 26 14 26s14-16 14-26C30 7 24 1 16 1z" fill="${color}" stroke="#fff" stroke-width="2"/>
    <circle cx="16" cy="15" r="5" fill="#fff"/></svg>`;

  return L.divIcon({
    html: svg,
    className: highSeverity ? 'severity-high-pin' : '',
    iconSize: [32, 42],
    iconAnchor: [16, 41],
    popupAnchor: [0, -38],
  });
}

// The popup shown when a pin is clicked: title, category, status, photo and an upvote button
function buildPopup(L: typeof import('leaflet'), issue: Issue, onUpvote: (id: number) => void) {
  const status = asStatus(issue.status);
  const isAlert = ALERT_CATEGORIES.includes(issue.category);

  const box = document.createElement('div');
  box.className = 'space-y-2 text-zinc-900';

  const title = document.createElement('p');
  title.className = 'text-base font-semibold leading-tight';
  title.textContent = issue.title;
  box.appendChild(title);

  const info = document.createElement('p');
  info.className = 'text-xs font-medium';
  info.textContent = `${isAlert ? 'ALERT: ' : ''}${issue.category}`;
  box.appendChild(info);

  const badge = document.createElement('span');
  badge.className = 'inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white';
  badge.style.backgroundColor = STATUS_COLORS[status];
  badge.textContent = status;
  box.appendChild(badge);

  if (issue.imageUrl) {
    const photo = document.createElement('img');
    photo.className = 'h-28 w-full rounded object-cover';
    photo.src = issue.imageUrl;
    photo.alt = issue.title;
    box.appendChild(photo);
  }

  const button = document.createElement('button');
  button.className = 'w-full rounded-md bg-blue-600 py-1 text-sm font-medium text-white hover:bg-blue-700';
  button.textContent = `Upvote (${issue.upvotes})`;
  button.addEventListener('click', () => onUpvote(issue.id));
  box.appendChild(button);

  return box;
}

export type IssueMapProps = {
  issues: Issue[];
  picked: [number, number] | null;
  flyTarget: [number, number] | null;
  onPick: (lat: number, lng: number) => void;
  onUpvote: (id: number) => void;
  onSelect: (id: number) => void;
};

export default function IssueMap({ issues, picked, flyTarget, onPick, onUpvote, onSelect }: IssueMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [leaflet, setLeaflet] = useState<typeof import('leaflet') | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const issueLayerRef = useRef<LayerGroup | null>(null);
  const pickedMarkerRef = useRef<Marker | null>(null);
  const startCenter = useRef(picked ?? DEFAULT_CENTER);

  // Always call the newest callbacks from map events
  const callbacks = useRef({ onPick, onUpvote, onSelect });
  useEffect(() => {
    callbacks.current = { onPick, onUpvote, onSelect };
  });

  // Load Leaflet only in the browser, then initialize the map once.
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    let cancelled = false;
    let map: LeafletMap | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let frame = 0;

    const initializeMap = async () => {
      try {
        const leafletModule = await import('leaflet');
        const L = 'default' in leafletModule ? leafletModule.default : leafletModule;
        if (cancelled || !mapContainerRef.current) return;

        map = L.map(mapContainerRef.current).setView(startCenter.current, 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);
        map.on('click', (e) => callbacks.current.onPick(e.latlng.lat, e.latlng.lng));
        mapRef.current = map;
        issueLayerRef.current = L.layerGroup().addTo(map);
        setLeaflet(L);

        resizeObserver = new ResizeObserver(() => map?.invalidateSize());
        resizeObserver.observe(mapContainerRef.current);
        frame = requestAnimationFrame(() => map?.invalidateSize());
      } catch (error) {
        console.error('Could not initialize the issue map.', error);
        if (!cancelled) setLoadError('The map could not be loaded. Please try refreshing the page.');
      }
    };

    void initializeMap();
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      map?.off();
      map?.remove();
      if (mapRef.current === map) {
        mapRef.current = null;
        issueLayerRef.current = null;
        pickedMarkerRef.current = null;
      }
    };
  }, []);

  // 2. Draw one pin for every issue
  useEffect(() => {
    const layer = issueLayerRef.current;
    if (!leaflet || !layer) return;

    layer.clearLayers();
    for (const issue of issues) {
      const color = issue.severity === 'Low' ? '#eab308' : issue.severity === 'Medium' ? '#ef4444' : '#dc2626';
      const highSeverity = issue.severity === 'High' || issue.severity === 'Critical';

      leaflet
        .marker([issue.latitude, issue.longitude], {
          icon: pinIcon(leaflet, color, highSeverity),
        })
        .bindPopup(buildPopup(leaflet, issue, (id) => callbacks.current.onUpvote(id)), { minWidth: 220 })
        .on('click', () => callbacks.current.onSelect(issue.id))
        .addTo(layer);
    }
  }, [issues, leaflet]);

  // 3. Show the blue pin for the location the user picked
  useEffect(() => {
    const map = mapRef.current;
    if (!leaflet || !map) return;

    pickedMarkerRef.current?.remove();
    pickedMarkerRef.current = picked
      ? leaflet.marker(picked, { icon: pinIcon(leaflet, '#2563eb'), zIndexOffset: 1000 }).addTo(map)
      : null;
  }, [leaflet, picked]);

  // 4. Fly to a place (GPS, search, or clicking an issue card)
  useEffect(() => {
    if (leaflet && flyTarget) mapRef.current?.flyTo(flyTarget, 15);
  }, [flyTarget, leaflet]);

  return (
    <div className="relative h-full w-full rounded-xl" style={{ minHeight: 360 }}>
      <div ref={mapContainerRef} className="h-full w-full rounded-xl" />
      {!leaflet && !loadError && (
        <div className="absolute inset-0 flex animate-pulse items-center justify-center rounded-xl bg-zinc-200 text-sm text-zinc-500 dark:bg-zinc-800">
          Loading interactive map...
        </div>
      )}
      {loadError && (
        <div role="alert" className="absolute inset-0 flex items-center justify-center rounded-xl bg-zinc-100 p-6 text-center text-sm text-red-700 dark:bg-zinc-900 dark:text-red-300">
          {loadError}
        </div>
      )}
    </div>
  );
}
