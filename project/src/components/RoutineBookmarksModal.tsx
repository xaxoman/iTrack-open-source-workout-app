import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Bookmark, StickyNote, Trash2, Youtube, Link2, Plus, Loader2 } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import type { RoutineBookmark } from '../types/workout';

interface RoutineBookmarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  routineName: string;
}

/** Extract the 11-char video id from any common YouTube URL shape. */
function getYouTubeVideoId(url: string) {
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/);
  return match && match[2].length === 11 ? match[2] : null;
}

function isLikelyUrl(text: string) {
  return /^(https?:\/\/|www\.)\S+$/i.test(text);
}

/**
 * Best-effort title/channel lookup via YouTube's key-less oEmbed endpoint.
 * Offline or blocked? The bookmark still saves — the card just shows the URL.
 */
async function fetchYouTubeMeta(url: string): Promise<Pick<RoutineBookmark, 'title' | 'author'>> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { signal: controller.signal }
    );
    clearTimeout(timer);
    if (!res.ok) return {};
    const data = await res.json();
    return {
      title: typeof data.title === 'string' ? data.title : undefined,
      author: typeof data.author_name === 'string' ? data.author_name : undefined,
    };
  } catch {
    return {};
  }
}

/** Notion-style link preview card: thumbnail, title, channel and URL. */
function VideoBookmarkCard({
  bookmark,
  onDelete,
}: {
  bookmark: RoutineBookmark;
  onDelete: () => void;
}) {
  const videoId = getYouTubeVideoId(bookmark.content);

  return (
    <div className="relative">
      <a
        href={bookmark.content}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-stretch overflow-hidden rounded-xl border border-gray-200/70 transition-colors hover:bg-gray-50 dark:border-white/[0.07] dark:hover:bg-white/[0.03]"
      >
        <div className="relative w-28 flex-shrink-0 self-stretch bg-gray-100 dark:bg-gray-800 sm:w-40">
          <span className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
            {videoId ? <Youtube className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
          </span>
          {videoId && (
            <img
              src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              // Deleted video / offline: hide the broken image, the icon shows.
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>
        <div className="min-w-0 flex-1 p-3 pr-10 sm:p-3.5 sm:pr-11">
          <p className="line-clamp-2 text-sm font-medium leading-snug text-gray-900 dark:text-white">
            {bookmark.title ?? bookmark.content}
          </p>
          {bookmark.author && (
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
              {bookmark.author}
            </p>
          )}
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            {videoId ? (
              <Youtube className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
            ) : (
              <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
            )}
            <span className="truncate">{bookmark.content}</span>
          </p>
        </div>
      </a>
      <button
        onClick={onDelete}
        className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
        aria-label="Delete bookmark"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** Plain text note, like a text block under the bookmark in Notion. */
function NoteBookmarkRow({
  bookmark,
  onDelete,
}: {
  bookmark: RoutineBookmark;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-2 rounded-xl border border-gray-200/70 px-3.5 py-3 dark:border-white/[0.07]">
      <div className="flex min-w-0 items-start gap-2.5">
        <StickyNote className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
        <p className="whitespace-pre-wrap break-words text-sm text-gray-700 dark:text-gray-200">
          {bookmark.content}
        </p>
      </div>
      <button
        onClick={onDelete}
        className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
        aria-label="Delete note"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function RoutineBookmarksModal({
  isOpen,
  onClose,
  templateId,
  routineName,
}: RoutineBookmarksModalProps) {
  const { routineBookmarks, addRoutineBookmark, deleteRoutineBookmark } = useWorkoutStore();
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) setDraft('');
  }, [isOpen]);

  if (!isOpen) return null;

  const bookmarks = routineBookmarks[templateId] ?? [];

  const handleAdd = async () => {
    const text = draft.trim();
    if (!text || saving) return;

    if (isLikelyUrl(text)) {
      const url = text.startsWith('www.') ? `https://${text}` : text;
      setSaving(true);
      const meta = getYouTubeVideoId(url) ? await fetchYouTubeMeta(url) : {};
      addRoutineBookmark(templateId, {
        id: crypto.randomUUID(),
        type: 'video',
        content: url,
        ...meta,
        createdAt: new Date().toISOString(),
      });
      setSaving(false);
    } else {
      addRoutineBookmark(templateId, {
        id: crypto.randomUUID(),
        type: 'note',
        content: text,
        createdAt: new Date().toISOString(),
      });
    }
    setDraft('');
  };

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-panel flex max-h-[85vh] max-w-lg flex-col">
        <div className="flex items-center justify-between border-b border-gray-100 p-6 dark:border-white/[0.07]">
          <div className="flex min-w-0 items-center space-x-2">
            <Bookmark className="h-5 w-5 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
            <h2 className="truncate text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
              {routineName}
            </h2>
          </div>
          <button onClick={onClose} className="icon-btn" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto p-6">
          <div>
            <label className="label" htmlFor="bookmark-input">
              Add a video or note
            </label>
            <div className="flex gap-2">
              <input
                id="bookmark-input"
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAdd();
                }}
                placeholder="Paste a YouTube link or write a note…"
                className="input"
                autoFocus
              />
              <button
                onClick={handleAdd}
                disabled={!draft.trim() || saving}
                className="btn-primary flex-shrink-0 px-3"
                aria-label="Add bookmark"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              Links become video cards, anything else is saved as a note.
            </p>
          </div>

          {bookmarks.length > 0 ? (
            <div className="space-y-2.5">
              {bookmarks.map((bookmark) =>
                bookmark.type === 'video' ? (
                  <VideoBookmarkCard
                    key={bookmark.id}
                    bookmark={bookmark}
                    onDelete={() => deleteRoutineBookmark(templateId, bookmark.id)}
                  />
                ) : (
                  <NoteBookmarkRow
                    key={bookmark.id}
                    bookmark={bookmark}
                    onDelete={() => deleteRoutineBookmark(templateId, bookmark.id)}
                  />
                )
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No bookmarks yet. Save form-check videos or reminders for this routine — they live
              here, so your progress page stays clean.
            </p>
          )}
        </div>

        <div className="flex justify-end border-t border-gray-100 p-6 dark:border-white/[0.07]">
          <button onClick={onClose} className="btn-secondary">
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
