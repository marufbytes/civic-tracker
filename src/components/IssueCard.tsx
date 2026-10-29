'use client';

import { useEffect, useState } from 'react';
import { ArrowBigUp, Trash2, MapPin, Flag, AlertTriangle, MessageCircle, CheckCircle2, PlayCircle, RotateCcw, Loader2, X } from 'lucide-react';
import { ALERT_CATEGORIES, asStatus, SEVERITY_BADGE, type Comment, type Issue, type SessionUser } from '../lib/constants';
import { uploadImage } from '../lib/upload-client';
import { ImageDropzone } from './ImageDropzone';

export function StatusBadge({ status }: { status: string }) {
  const s = asStatus(status);
  const cls = {
    Pending: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
    'In Progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
    Resolved: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  }[s];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{s}</span>;
}

export function IssueCard({
  issue,
  user,
  busy,
  selected,
  onUpvote,
  onFlag,
  comments,
  onComment,
  onApprove,
  onStatus,
  onDelete,
  onFocus,
}: {
  issue: Issue;
  user: SessionUser | null;
  busy: boolean;
  selected: boolean;
  onUpvote: (id: number) => void;
  onFlag: (id: number) => void;
  comments: Comment[];
  onComment: (text: string) => Promise<boolean>;
  onApprove: (id: number) => void;
  onStatus: (id: number, status: string, afterImageUrl?: string) => void;
  onDelete: (id: number) => void;
  onFocus: (id: number) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [afterFile, setAfterFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const status = asStatus(issue.status);
  const isAlert = ALERT_CATEGORIES.includes(issue.category);

  const isAdmin = user?.role === 'admin';
  const canDelete = isAdmin || (user !== null && issue.userId === user.id);

  const confirmResolve = async () => {
    setUploadError(null);
    let url: string | undefined;
    if (afterFile) {
      setUploading(true);
      const up = await uploadImage(afterFile);
      setUploading(false);
      if ('error' in up) return setUploadError(up.error);
      url = up.url;
    } else if (!issue.afterImageUrl) {
      return setUploadError('Upload an "After" photo as proof of resolution.');
    }
    onStatus(issue.id, 'Resolved', url);
    setResolving(false);
    setAfterFile(null);
  };

  const postComment = async () => {
    const ok = await onComment(commentText);
    if (ok) setCommentText('');
  };

  useEffect(() => {
    if (!showComments) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowComments(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showComments]);

  const chronologicalComments = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return (
    <div
      className={`rounded-xl border bg-white p-4 dark:bg-zinc-900 ${
        selected ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {isAlert ? (
              <span className="alert-badge flex items-center gap-1 rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                <AlertTriangle size={12} /> {issue.category}
              </span>
            ) : (
              <span className="rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium dark:bg-zinc-800">{issue.category}</span>
            )}
            <StatusBadge status={issue.status} />
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGE[issue.severity] ?? SEVERITY_BADGE.Medium}`}>
              {issue.severity}
            </span>
            {!issue.isApproved && <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs dark:bg-zinc-700">Unapproved</span>}
          </div>
          <h3 className="mt-2 text-lg font-semibold">{issue.title}</h3>
          <p className="mt-1 whitespace-pre-line break-words text-sm text-zinc-600 dark:text-zinc-400">{issue.description}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Reported by <span className="font-medium">{issue.authorName}</span> - {new Date(issue.createdAt).toLocaleDateString()}
          </p>
          <button
            onClick={() => onFocus(issue.id)}
            className="mt-1 flex items-center gap-1 text-xs text-zinc-500 hover:text-blue-600"
          >
            <MapPin size={12} />
            {issue.locationName || `${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)}`}
          </button>
        </div>
        <button
          onClick={() => onUpvote(issue.id)}
          disabled={busy}
          aria-label="Upvote"
          className="flex flex-col items-center rounded-lg border border-zinc-300 px-3 py-1 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          <ArrowBigUp size={20} />
          <span className="text-sm font-bold">{issue.upvotes}</span>
        </button>
      </div>

      {((issue.imageUrl && !imgFailed) || issue.afterImageUrl) && (
        <div className={`mt-3 grid gap-2 ${issue.afterImageUrl ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {issue.imageUrl && !imgFailed && (
            <figure className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={issue.imageUrl}
                alt={issue.title}
                loading="lazy"
                onError={() => setImgFailed(true)}
                className="h-48 w-full rounded-lg object-cover"
              />
              {issue.afterImageUrl && (
                <figcaption className="absolute left-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">Before</figcaption>
              )}
            </figure>
          )}
          {issue.afterImageUrl && (
            <figure className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={issue.afterImageUrl} alt={`${issue.title} resolved`} loading="lazy" className="h-48 w-full rounded-lg object-cover" />
              <figcaption className="absolute left-2 top-2 rounded bg-green-600 px-2 py-0.5 text-xs text-white">After</figcaption>
            </figure>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-800">
        <button
          onClick={() => onFlag(issue.id)}
          disabled={busy}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-orange-600 disabled:opacity-50 dark:hover:bg-zinc-800"
        >
          <Flag size={12} /> Report as Spam ({issue.spamCount})
        </button>

        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <MessageCircle size={12} /> Updates ({comments.length})
        </button>

        {isAdmin && (
          <>
            {!issue.isApproved && (
              <button
                onClick={() => onApprove(issue.id)}
                disabled={busy}
                className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Approve (hidden as spam)
              </button>
            )}
            <span className="ml-2 text-xs font-semibold uppercase text-blue-600">Admin</span>
            {status === 'Pending' && (
              <button
                onClick={() => onStatus(issue.id, 'In Progress')}
                disabled={busy}
                className="flex items-center gap-1 rounded-lg bg-yellow-500 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-600 disabled:opacity-50"
              >
                <PlayCircle size={12} /> Mark In Progress
              </button>
            )}
            {status !== 'Resolved' && (
              <button
                onClick={() => setResolving((v) => !v)}
                disabled={busy}
                className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 size={12} /> Resolve
              </button>
            )}
            {status !== 'Pending' && (
              <button
                onClick={() => onStatus(issue.id, 'Pending')}
                disabled={busy}
                className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                <RotateCcw size={12} /> Reopen
              </button>
            )}
          </>
        )}

        {canDelete && (
          <button
            onClick={() => {
              if (confirm(`Delete "${issue.title}"?`)) onDelete(issue.id);
            }}
            disabled={busy}
            className="ml-auto flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 size={12} /> Delete
          </button>
        )}
      </div>

      {showComments && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowComments(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`updates-title-${issue.id}`}
            className="flex max-h-[80vh] w-full max-w-lg flex-col rounded-xl bg-white shadow-xl dark:bg-zinc-900"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
              <h2 id={`updates-title-${issue.id}`} className="font-semibold">
                Updates ({comments.length})
              </h2>
              <button
                type="button"
                onClick={() => setShowComments(false)}
                aria-label="Close updates"
                className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X size={18} />
              </button>
            </header>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
              {chronologicalComments.length === 0 && (
                <p className="text-sm text-zinc-500">No updates yet. Share one below.</p>
              )}
              {chronologicalComments.map((c) => (
                <div key={c.id} className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800/50">
                  <p>{c.text}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {c.authorName} - {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-zinc-200 p-4 dark:border-zinc-800">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void postComment()}
                maxLength={500}
                placeholder="Share an update, e.g. Police cleared the protest"
                className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-800"
              />
              <button
                type="button"
                onClick={() => void postComment()}
                disabled={commentText.trim().length < 2}
                className="rounded-lg bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </section>
        </div>
      )}

      {isAdmin && resolving && (
        <div className="mt-3 space-y-2 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800/50">
          <p className="text-sm font-medium">Upload an &quot;After&quot; photo to mark as Resolved</p>
          <ImageDropzone file={afterFile} onChange={setAfterFile} label="Drop the after photo here" compact />
          {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
          <div className="flex gap-2">
            <button
              onClick={confirmResolve}
              disabled={uploading || busy}
              className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              {uploading && <Loader2 size={12} className="animate-spin" />} Confirm Resolved
            </button>
            <button onClick={() => setResolving(false)} className="rounded-lg px-3 py-1 text-xs hover:bg-zinc-200 dark:hover:bg-zinc-700">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
