'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { validateImageFile } from '../lib/upload-client';

/** Drag-and-drop / click-to-browse image picker with live preview. */
export function ImageDropzone({
  file,
  onChange,
  label = 'Drag & drop a photo, or click to browse',
  compact = false,
}: {
  file: File | null;
  onChange: (f: File | null) => void;
  label?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const accept = (f: File | undefined) => {
    if (!f) return;
    const err = validateImageFile(f);
    setError(err);
    if (!err) onChange(f);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          accept(e.dataTransfer.files?.[0]);
        }}
        onClick={() => inputRef.current?.click()}
        className={`relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-center text-sm transition-colors ${
          compact ? 'p-3' : 'p-5'
        } ${
          dragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
            : 'border-zinc-300 hover:border-blue-400 dark:border-zinc-700'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            accept(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className={`w-full rounded-md object-cover ${compact ? 'h-28' : 'h-40'}`} />
        ) : (
          <>
            <ImagePlus className="mb-1 text-zinc-400" size={24} />
            <span className="text-zinc-500">{label}</span>
            <span className="text-xs text-zinc-400">JPG, PNG, WebP or GIF Â· max 5 MB</span>
          </>
        )}
        {preview && (
          <button
            type="button"
            aria-label="Remove photo"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
            }}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

