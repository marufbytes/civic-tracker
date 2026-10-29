'use client';

import { useRef, useState, useTransition } from 'react';
import { Crosshair, Loader2, Send } from 'lucide-react';
import { createIssue } from '../app/actions';
import { CATEGORIES, SEVERITIES, type SessionUser } from '../lib/constants';
import { uploadImage } from '../lib/upload-client';
import { useToast } from './Toast';
import { ImageDropzone } from './ImageDropzone';

const input =
  'w-full rounded-lg border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800';

export function IssueForm({
  latitude,
  longitude,
  onLocationChange,
  onGpsFound,
  locationName,
  onLocationNameChange,
  user,
  onRequireAuth,
}: {
  latitude: string;
  longitude: string;
  onLocationChange: (lat: string, lng: string) => void;
  // Called when the browser GPS finds the user, so the map can fly to that spot
  onGpsFound: (lat: number, lng: number) => void;
  locationName: string;
  onLocationNameChange: (name: string) => void;
  user: SessionUser | null;
  onRequireAuth: () => void;
}) {
  const toast = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [locating, setLocating] = useState(false);

  const useGps = () => {
    if (!navigator.geolocation) return toast('error', 'Geolocation is not supported by your browser.');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onGpsFound(pos.coords.latitude, pos.coords.longitude);
        setLocating(false);
        toast('success', 'Location set from GPS.');
      },
      () => {
        setLocating(false);
        toast('error', 'Could not get your location. Check browser permissions.');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
  };

  const onSubmit = (formData: FormData) => {
    if (!user) return onRequireAuth();
    if (!file) {
      setErrors({ image: 'A photo is required to submit a report.' });
      return toast('error', 'Please attach a photo of the issue.');
    }
    startTransition(async () => {
      const up = await uploadImage(file);
      if ('error' in up) {
        setErrors({ image: up.error });
        return toast('error', up.error);
      }
      formData.set('imageUrl', up.url);
      const res = await createIssue(formData);
      if (res.authRequired) return onRequireAuth();
      if (res.success) {
        toast('success', res.message);
        setErrors({});
        setFile(null);
        onLocationNameChange('');
        formRef.current?.reset();
      } else {
        setErrors(res.fieldErrors ?? {});
        toast('error', res.message);
      }
    });
  };

  const err = (k: string) => errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k]}</p>;

  return (
    <div className="h-fit rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="mb-4 text-xl font-bold">Report an Issue</h2>
      <form ref={formRef} action={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm">Title</label>
          <input name="title" required maxLength={120} placeholder="e.g., Huge pothole near Mirpur 10 roundabout" className={input} />
          {err('title')}
        </div>

        <div>
          <label className="mb-1 block text-sm">Category</label>
          <select name="category" className={input}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {err('category')}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="text-sm">Location</label>
            <button
              type="button"
              onClick={useGps}
              disabled={locating}
              className="flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              {locating ? <Loader2 size={12} className="animate-spin" /> : <Crosshair size={12} />}
              Use My GPS Location
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                name="latitude"
                type="number"
                step="any"
                required
                aria-label="Latitude"
                value={latitude}
                onChange={(e) => onLocationChange(e.target.value, longitude)}
                className={input}
              />
              {err('latitude')}
            </div>
            <div>
              <input
                name="longitude"
                type="number"
                step="any"
                required
                aria-label="Longitude"
                value={longitude}
                onChange={(e) => onLocationChange(latitude, e.target.value)}
                className={input}
              />
              {err('longitude')}
            </div>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Tip: click anywhere on the map to pick a location.</p>
        </div>

        <div>
          <label className="mb-1 block text-sm">Location / Area Name (optional)</label>
          <input
            name="locationName"
            value={locationName}
            onChange={(e) => onLocationNameChange(e.target.value)}
            maxLength={150}
            placeholder="e.g., Kandirpar, Cumilla or Mirpur 10, Dhaka"
            className={input}
          />
          {err('locationName')}
        </div>

        <div>
          <label className="mb-1 block text-sm">Photo (required)</label>
          <ImageDropzone file={file} onChange={setFile} />
          {err('image')}
        </div>

        <div>
          <label className="mb-1 block text-sm">Severity</label>
          <select name="severity" defaultValue="Medium" className={input}>
            {SEVERITIES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          {err('severity')}
        </div>

        <div>
          <label className="mb-1 block text-sm">Description</label>
          <textarea
            name="description"
            required
            rows={3}
            maxLength={2000}
            placeholder="e.g., Waterlogging after rain is blocking rickshaws and buses..."
            className={input}
          />
          {err('description')}
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {pending ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}



