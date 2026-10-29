'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Search } from 'lucide-react';

type PlaceSuggestion = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

/** Search box above the map. Uses the free OpenStreetMap Nominatim service to find a place. */
export function MapSearch({ onFound }: { onFound: (lat: number, lng: number, name: string) => void }) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setMessage(null);

      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmedQuery)}&countrycodes=bd&limit=5`;
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error(`Location search failed with status ${response.status}.`);

        const places: PlaceSuggestion[] = await response.json();
        setSuggestions(places);
        if (places.length === 0) setMessage('No matching places found.');
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error('Could not search for places.', error);
        setSuggestions([]);
        setMessage('Search failed. Check your internet connection and try again.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setSuggestions([]);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, []);

  const selectPlace = (place: PlaceSuggestion) => {
    const lat = Number(place.lat);
    const lng = Number(place.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      setMessage('This place has invalid coordinates. Please choose another result.');
      return;
    }

    setQuery(place.display_name);
    setSuggestions([]);
    setMessage(null);
    onFound(lat, lng, place.display_name);
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setSuggestions([]);
            setLoading(false);
            setMessage(null);
          }}
          placeholder="e.g., Rampura, Dhaka or Kandirpar, Cumilla"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={suggestions.length > 0}
          aria-controls="map-place-suggestions"
          className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-zinc-700 dark:bg-zinc-800"
        />
        {loading && <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-zinc-400" />}
      </div>
      {suggestions.length > 0 && (
        <ul
          id="map-place-suggestions"
          role="listbox"
          className="absolute inset-x-0 top-full z-[1000] mt-1 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
        >
          {suggestions.map((place) => (
            <li key={place.place_id} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => selectPlace(place)}
                className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                {place.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {message && <p className="mt-1 truncate text-xs text-zinc-500">{message}</p>}
    </div>
  );
}
