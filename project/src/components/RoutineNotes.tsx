import { useEffect, useMemo, useState } from 'react';
import { ArrowUp, ChevronLeft, Clock, Dumbbell, Link2, Loader2, Play, Tags, Target, Trash2, Youtube } from 'lucide-react';
import { FullScreen } from './ui';
import { useI18n } from '../i18n';
import { useWorkoutStore } from '../store/useWorkoutStore';
import type { RoutineBookmark, WorkoutTemplate } from '../types/workout';
import { latestWorkout, workoutsForTemplate } from '../utils/workout';

interface RoutineNotesProps {
  template: WorkoutTemplate | null;
  onClose: () => void;
  /** Start the routine straight from its page. */
  onStart?: (template: WorkoutTemplate) => void;
}

/** Extract the 11-char video id from any common YouTube URL shape. */
function getYouTubeVideoId(url: string) {
  const match = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|&v=)([^#&?]*).*/);
  return match && match[2].length === 11 ? match[2] : null;
}

const isLikelyUrl = (text: string) => /^(https?:\/\/|www\.)\S+$/i.test(text);

/** Best-effort title/channel via YouTube's key-less oEmbed. Offline → URL only. */
async function fetchYouTubeMeta(url: string): Promise<Pick<RoutineBookmark, 'title' | 'author'>> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`, {
      signal: controller.signal,
    });
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

/** A routine's page: properties, video bookmarks and notes, Notion-style. */
export function RoutineNotes({ template, onClose, onStart }: RoutineNotesProps) {
  const { t, muscle, duration, date } = useI18n();
  const { workouts, routineBookmarks, addRoutineBookmark, deleteRoutineBookmark } = useWorkoutStore();
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(''), [template?.id]);

  const stats = useMemo(() => {
    if (!template) return null;
    const history = workoutsForTemplate(template, workouts);
    const latest = latestWorkout(history);
    const record = history.length ? Math.max(...history.map((w) => w.completionPercentage)) : null;
    return { latest, record };
  }, [template, workouts]);

  if (!template) return null;

  const bookmarks = routineBookmarks[template.id] ?? [];
  const videos = bookmarks.filter((b) => b.type === 'video');
  const notes = bookmarks.filter((b) => b.type === 'note');
  const muscles = Array.from(new Set(template.exercises.flatMap((e) => e.targetMuscles ?? [])));

  const add = async () => {
    const text = draft.trim();
    if (!text || saving) return;
    if (isLikelyUrl(text)) {
      const url = text.startsWith('www.') ? `https://${text}` : text;
      setSaving(true);
      const meta = getYouTubeVideoId(url) ? await fetchYouTubeMeta(url) : {};
      addRoutineBookmark(template.id, { id: crypto.randomUUID(), type: 'video', content: url, ...meta, createdAt: new Date().toISOString() });
      setSaving(false);
    } else {
      addRoutineBookmark(template.id, { id: crypto.randomUUID(), type: 'note', content: text, createdAt: new Date().toISOString() });
    }
    setDraft('');
  };

  const props: [typeof Target, string, string][] = [
    [
      Target,
      t('notes.result'),
      stats?.latest
        ? t('notes.latestRecord', { latest: Math.round(stats.latest.completionPercentage), record: Math.round(stats.record ?? 0) })
        : t('notes.notDoneYet'),
    ],
    [Clock, t('notes.lastSession'), stats?.latest ? `${duration(stats.latest.duration)} · ${date(stats.latest.date, { day: 'numeric', month: 'short' })}` : '—'],
    [Tags, t('notes.muscles'), muscles.length ? muscles.map(muscle).join(', ') : '—'],
  ];

  return (
    <FullScreen
      open
      onClose={onClose}
      header={
        <div className="flex h-14 items-center justify-between px-3">
          <button
            onClick={onClose}
            aria-label={t('common.back')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]"
          >
            <ChevronLeft className="h-6 w-6" strokeWidth={1.75} />
          </button>
          {onStart && (
            <button onClick={() => onStart(template)} className="pill-primary px-4 py-2 text-[14px]">
              <Play className="h-3.5 w-3.5 fill-current" />
              {t('common.start')}
            </button>
          )}
        </div>
      }
    >
      <div className="px-5 pb-24">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
          <Dumbbell className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <h1 className="mt-3 text-[28px] font-semibold leading-tight tracking-tight text-gray-900 dark:text-white">{template.name}</h1>

        <div className="mt-3 space-y-1.5 text-[13px]">
          {props.map(([Icon, label, value]) => (
            <div key={label} className="flex items-start gap-3">
              <span className="flex w-28 flex-shrink-0 items-center gap-1.5 text-gray-400 dark:text-gray-500">
                <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                {label}
              </span>
              <span className="text-gray-800 dark:text-gray-200">{value}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t hairline pt-2">
          {videos.map((b) => (
            <VideoCard key={b.id} bookmark={b} onDelete={() => deleteRoutineBookmark(template.id, b.id)} deleteLabel={t('notes.delete')} />
          ))}

          {notes.length > 0 && (
            <ul className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-gray-800 dark:text-gray-200">
              {notes.map((n) => (
                <li key={n.id} className="group flex gap-2.5">
                  <span className="mt-[11px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gray-900 dark:bg-gray-300" />
                  <span className="flex-1 whitespace-pre-wrap break-words">{n.content}</span>
                  <button
                    onClick={() => deleteRoutineBookmark(template.id, n.id)}
                    aria-label={t('notes.delete')}
                    className="mt-1 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {bookmarks.length === 0 && <p className="mt-4 text-[14px] leading-relaxed text-gray-500 dark:text-gray-400">{t('notes.empty')}</p>}
        </div>
      </div>

      {/* Composer */}
      <div className="fixed inset-x-0 bottom-0 border-t hairline bg-white/95 px-4 pb-safe pt-3 backdrop-blur dark:bg-gray-950/95">
        <div className="mx-auto mb-3 flex max-w-2xl items-center gap-2 rounded-full bg-gray-100 py-1.5 pl-4 pr-1.5 dark:bg-white/[0.06]">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder={t('notes.placeholder')}
            aria-label={t('notes.placeholder')}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
          />
          <button
            onClick={add}
            disabled={!draft.trim() || saving}
            aria-label={t('notes.add')}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white disabled:opacity-40 dark:bg-indigo-500"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" strokeWidth={2.5} />}
          </button>
        </div>
      </div>
    </FullScreen>
  );
}

function VideoCard({ bookmark, onDelete, deleteLabel }: { bookmark: RoutineBookmark; onDelete: () => void; deleteLabel: string }) {
  const videoId = getYouTubeVideoId(bookmark.content);
  let host = bookmark.content;
  try {
    host = new URL(bookmark.content).hostname.replace(/^www\./, '');
  } catch {
    /* keep raw */
  }
  return (
    <div className="relative mt-2.5">
      <a
        href={bookmark.content}
        target="_blank"
        rel="noopener noreferrer"
        className="flex overflow-hidden rounded-xl border hairline transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
      >
        <div className="min-w-0 flex-1 p-3 pr-9">
          <p className="line-clamp-2 text-[14px] font-medium leading-snug text-gray-900 dark:text-white">{bookmark.title ?? bookmark.content}</p>
          {bookmark.author && <p className="mt-1 truncate text-[12px] text-gray-500 dark:text-gray-400">{bookmark.author}</p>}
          <p className="mt-2 flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
            {videoId ? <Youtube className="h-3.5 w-3.5 text-red-500" /> : <Link2 className="h-3.5 w-3.5" />}
            <span className="truncate">{host}</span>
          </p>
        </div>
        <div className="relative w-[118px] flex-shrink-0 bg-gray-100 dark:bg-gray-800">
          <span className="absolute inset-0 flex items-center justify-center text-gray-400">
            {videoId ? <Youtube className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
          </span>
          {videoId && (
            <img
              src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>
      </a>
      <button
        onClick={onDelete}
        aria-label={deleteLabel}
        className="absolute left-auto right-[124px] top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-500/10"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
