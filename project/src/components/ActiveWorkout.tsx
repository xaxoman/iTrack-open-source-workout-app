import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Hourglass, Pause, Play, RotateCcw, Timer, X } from 'lucide-react';
import type { Exercise, WorkoutTemplate } from '../types/workout';
import { ExerciseVideo } from './ExerciseVideo';
import { RestTimer } from './RestTimer';
import { Dialog } from './ui';
import { useI18n } from '../i18n';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { baseName, completionFrom, expandTemplate, groupBySet } from '../utils/workout';
import { playEnd, playTick, unlockAudio, vibrate } from '../utils/sound';
import { enableWorkoutWakeLock, disableWorkoutWakeLock, requestWakeLock } from '../utils/wakeLock';

export interface WorkoutResult {
  exercises: Exercise[];
  completedExerciseIds: string[];
  completionPercentage: number;
  duration: number;
  startedAt: string;
}

interface ActiveWorkoutProps {
  template: WorkoutTemplate;
  /** Called when the user finishes — or quits, with whatever they completed. */
  onFinish: (result: WorkoutResult) => void;
}

export function ActiveWorkout({ template, onFinish }: ActiveWorkoutProps) {
  const { t, tp, clock, muscle } = useI18n();
  const exercises = useMemo(() => expandTemplate(template), [template]);
  const groups = useMemo(() => groupBySet(exercises), [exercises]);

  const startedAt = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  const [completed, setCompleted] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState(exercises[0]?.id);
  const [openSets, setOpenSets] = useState<Record<number, boolean>>({});
  const [rest, setRest] = useState<{ nextId?: string } | null>(null);
  const [finishOpen, setFinishOpen] = useState(false);
  const [quitOpen, setQuitOpen] = useState(false);
  const currentRef = useRef<HTMLDivElement>(null);

  const elapsed = Math.floor((now - startedAt.current) / 1000);
  const done = completed.length;
  const total = exercises.length;
  const pct = completionFrom(done, total);
  const isDone = (id: string) => completed.includes(id);

  // Clock + keep the screen on for the whole session.
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    enableWorkoutWakeLock();
    const wake = setInterval(() => requestWakeLock(), 30000);
    return () => {
      clearInterval(tick);
      clearInterval(wake);
      disableWorkoutWakeLock();
    };
  }, []);

  // Android back button / browser back → ask before quitting.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const onPopState = () => {
      setQuitOpen(true);
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  // Keep the current exercise in view.
  useEffect(() => {
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [currentId]);

  /** Next unfinished exercise after `id`, wrapping around. */
  const nextOpenAfter = useCallback(
    (id: string, doneIds: string[]) => {
      const start = exercises.findIndex((e) => e.id === id);
      for (let step = 1; step <= exercises.length; step++) {
        const candidate = exercises[(start + step) % exercises.length];
        if (!doneIds.includes(candidate.id)) return candidate.id;
      }
      return undefined;
    },
    [exercises]
  );

  const toggle = useCallback(
    (id: string) => {
      unlockAudio();
      if (completed.includes(id)) {
        setCompleted(completed.filter((c) => c !== id));
        return;
      }
      const next = [...completed, id];
      setCompleted(next);
      const nextId = nextOpenAfter(id, next);
      if (!nextId) {
        setFinishOpen(true);
      } else {
        setRest({ nextId });
      }
    },
    [completed, nextOpenAfter]
  );

  const endRest = () => {
    if (rest?.nextId) setCurrentId(rest.nextId);
    setRest(null);
  };

  const result = (): WorkoutResult => ({
    exercises,
    completedExerciseIds: completed,
    completionPercentage: pct,
    duration: elapsed,
    startedAt: new Date(startedAt.current).toISOString(),
  });

  const nextExercise = rest?.nextId ? exercises.find((e) => e.id === rest.nextId) : undefined;

  const meta = (e: Exercise) => (e.type === 'time' ? clock(e.reps) : String(e.reps));

  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white dark:bg-gray-950">
      <div className="mx-auto max-w-2xl pb-36">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white px-5 pb-2 pt-safe dark:bg-gray-950">
          <div className="flex h-16 items-center justify-between">
            <button
              onClick={() => setQuitOpen(true)}
              aria-label={t('session.quit')}
              className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/[0.06]"
            >
              <X className="h-6 w-6" strokeWidth={1.75} />
            </button>
            <div className="min-w-0 text-center">
              <p className="truncate text-[13px] font-medium text-gray-500 dark:text-gray-400">{template.name}</p>
              <p className="text-[20px] font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white">{clock(elapsed)}</p>
            </div>
            <span className="w-10" />
          </div>
          <div className="h-[3px] rounded-full bg-gray-100 dark:bg-white/10">
            <div className="h-[3px] rounded-full bg-indigo-600 transition-all dark:bg-indigo-400" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-gray-400 dark:text-gray-500">
            <span>{t('session.progress', { done, total })}</span>
            <span>{Math.round(pct)}%</span>
          </div>
        </div>

        {/* Exercises grouped by set */}
        <div className="px-5">
          {groups.map(({ set, items }) => {
            const setDone = items.every((e) => isDone(e.id));
            const hasCurrent = items.some((e) => e.id === currentId);
            const collapsed = setDone && !hasCurrent && !openSets[set];
            const doneInSet = items.filter((e) => isDone(e.id)).length;

            if (collapsed) {
              return (
                <button
                  key={set}
                  onClick={() => setOpenSets({ ...openSets, [set]: true })}
                  className="flex w-full items-center justify-between border-b border-gray-100 py-3 dark:border-white/[0.06]"
                >
                  <span className="cap">{t('session.setComplete', { n: set })}</span>
                  <span className="flex items-center gap-1 text-[12px] text-gray-400 dark:text-gray-500">
                    {t('session.ofExercises', { done: doneInSet, total: items.length })}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </span>
                </button>
              );
            }

            return (
              <section key={set} className="pt-4">
                <div className="flex items-center justify-between">
                  <p className={`cap ${hasCurrent ? '!text-indigo-600 dark:!text-indigo-400' : ''}`}>
                    {hasCurrent ? t('session.setInProgress', { n: set }) : setDone ? t('session.setComplete', { n: set }) : t('session.set', { n: set })}
                  </p>
                  <span className="text-[12px] text-gray-400 dark:text-gray-500">{tp('session.exercises', items.length)}</span>
                </div>
                {items.map((exercise) =>
                  exercise.id === currentId ? (
                    <div
                      key={exercise.id}
                      ref={currentRef}
                      className="-mx-5 scroll-mt-32 border-y border-indigo-100 bg-indigo-50/50 px-5 pb-4 pt-4 dark:border-indigo-400/20 dark:bg-indigo-500/[0.08]"
                    >
                      {exercise.videoUrl && <ExerciseVideo url={exercise.videoUrl} title={t('session.videoTitle')} />}
                      <div className={`flex items-center gap-3 ${exercise.videoUrl ? 'mt-3.5' : ''}`}>
                        <Checkbox size="lg" checked={isDone(exercise.id)} onClick={() => toggle(exercise.id)} label={baseName(exercise)} />
                        <div className="min-w-0 flex-1">
                          <p className="text-[18px] font-semibold leading-tight text-gray-900 dark:text-white">{baseName(exercise)}</p>
                          {exercise.targetMuscles.length > 0 && (
                            <p className="text-[12px] text-gray-500 dark:text-gray-400">{exercise.targetMuscles.map(muscle).join(', ')}</p>
                          )}
                        </div>
                        {exercise.type === 'time' ? (
                          <Timer className="h-5 w-5 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                        ) : (
                          <span className="flex-shrink-0 text-[15px] font-semibold text-indigo-600 dark:text-indigo-400">
                            {tp('session.reps', exercise.reps)}
                          </span>
                        )}
                      </div>
                      {exercise.description && (
                        <p className="ml-10 mt-2 text-[13px] leading-snug text-gray-600 dark:text-gray-300">{exercise.description}</p>
                      )}
                      {exercise.type === 'time' && !isDone(exercise.id) && (
                        <TimedHold key={exercise.id} seconds={exercise.reps} onDone={() => toggle(exercise.id)} />
                      )}
                    </div>
                  ) : (
                    <div key={exercise.id} className="flex items-center gap-3 border-b border-gray-100 py-3 dark:border-white/[0.06]">
                      <Checkbox checked={isDone(exercise.id)} onClick={() => toggle(exercise.id)} label={baseName(exercise)} />
                      <button onClick={() => setCurrentId(exercise.id)} className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left">
                        <span
                          className={`truncate text-[15px] ${
                            isDone(exercise.id)
                              ? 'text-gray-400 line-through decoration-gray-300 dark:text-gray-500 dark:decoration-gray-600'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {baseName(exercise)}
                        </span>
                        <span className={`text-[13px] tabular-nums ${isDone(exercise.id) ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                          {meta(exercise)}
                        </span>
                      </button>
                    </div>
                  )
                )}
              </section>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white px-5 pb-safe pt-3 dark:border-white/10 dark:bg-gray-950">
        <div className="mx-auto mb-3 flex max-w-2xl items-center gap-2">
          <button onClick={() => setRest({})} className="pill-secondary px-4">
            <Hourglass className="h-4 w-4" strokeWidth={1.75} />
            {t('session.rest')}
          </button>
          <button onClick={() => setFinishOpen(true)} className={`flex-1 ${done === total ? 'pill-primary' : 'pill-dark'}`}>
            {t('session.finish')}
          </button>
        </div>
      </div>

      {rest && (
        <RestTimer
          onDone={endRest}
          nextLabel={nextExercise ? `${baseName(nextExercise)} · ${meta(nextExercise)}` : undefined}
        />
      )}

      <Dialog
        open={finishOpen}
        onClose={() => setFinishOpen(false)}
        title={t('session.finishTitle')}
        actions={
          <div className="flex justify-end gap-6 text-[15px] font-medium">
            <button onClick={() => setFinishOpen(false)} className="text-gray-600 dark:text-gray-300">
              {t('session.keepTraining')}
            </button>
            <button onClick={() => onFinish(result())} className="text-indigo-600 dark:text-indigo-400">
              {t('session.finishConfirm')}
            </button>
          </div>
        }
      >
        <p>{total - done > 0 ? tp('session.finishLeft', total - done) : t('session.finishAllDone')}</p>
        <div className="mt-4 divide-y divide-gray-100 border-y border-gray-100 text-[14px] dark:divide-white/[0.06] dark:border-white/[0.06]">
          <SummaryRow label={t('session.completion')} value={`${Math.round(pct)}%`} />
          <SummaryRow label={t('session.exercisesLabel')} value={t('session.ofTotal', { done, total })} />
          <SummaryRow label={t('session.duration')} value={clock(elapsed)} />
        </div>
      </Dialog>

      <Dialog
        open={quitOpen}
        onClose={() => setQuitOpen(false)}
        title={t('session.quitTitle')}
        actions={
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setQuitOpen(false)} className="pill-secondary py-2.5">
              {t('session.keepTraining')}
            </button>
            <button onClick={() => onFinish(result())} className="pill-danger py-2.5">
              {t('session.quitConfirm')}
            </button>
          </div>
        }
      >
        {done > 0 ? t('session.quitSaves', { pct: Math.round(pct) }) : t('session.quitNothing')}
      </Dialog>
    </div>,
    document.body
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2.5">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-semibold tabular-nums text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function Checkbox({
  checked,
  onClick,
  label,
  size = 'md',
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
  size?: 'md' | 'lg';
}) {
  const { t } = useI18n();
  const dims = size === 'lg' ? 'h-7 w-7' : 'h-6 w-6';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={t(checked ? 'session.markNotDone' : 'session.markDone', { name: label })}
      onClick={onClick}
      className={`flex ${dims} flex-shrink-0 items-center justify-center rounded-full transition-colors ${
        checked
          ? 'bg-indigo-600 text-white dark:bg-indigo-500'
          : size === 'lg'
            ? 'border-2 border-indigo-600 bg-white dark:border-indigo-400 dark:bg-transparent'
            : 'border-[1.5px] border-gray-300 hover:border-indigo-500 dark:border-white/20'
      }`}
    >
      {checked && <Check className={size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} strokeWidth={3} />}
    </button>
  );
}

/** Countdown for timed exercises; ticks the exercise off when it reaches zero. */
function TimedHold({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const { t, clock } = useI18n();
  const { restSound, restVibrate } = useWorkoutStore();
  const [remainingMs, setRemainingMs] = useState(seconds * 1000);
  const [endAt, setEndAt] = useState<number | null>(null);
  const lastWhole = useRef(seconds);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (endAt === null) return;
    const id = setInterval(() => {
      const left = Math.max(0, endAt - Date.now());
      setRemainingMs(left);
      const whole = Math.ceil(left / 1000);
      if (whole !== lastWhole.current) {
        lastWhole.current = whole;
        if (whole > 0 && whole <= 3) playTick(restSound);
      }
      if (left <= 0) {
        clearInterval(id);
        setEndAt(null);
        playEnd(restSound);
        if (restVibrate) vibrate([200, 100, 200]);
        doneRef.current();
      }
    }, 100);
    return () => clearInterval(id);
  }, [endAt, restSound, restVibrate]);

  const running = endAt !== null;
  const left = Math.ceil(remainingMs / 1000);
  const progress = 100 - (remainingMs / (seconds * 1000)) * 100;

  return (
    <div className="ml-10 mt-3">
      <div className="flex items-baseline justify-between">
        <p className="text-[48px] font-semibold leading-none tabular-nums tracking-tight text-gray-900 dark:text-white">{clock(left)}</p>
        <p className="text-[13px] tabular-nums text-gray-500 dark:text-gray-400">{t('session.of', { total: clock(seconds) })}</p>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-indigo-100 dark:bg-white/10">
        <div className="h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => {
            unlockAudio();
            if (running) {
              setEndAt(null);
            } else {
              setEndAt(Date.now() + remainingMs);
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600 px-4 py-1.5 text-[13px] font-medium text-white dark:bg-indigo-500"
        >
          {running ? <Pause className="h-3.5 w-3.5 fill-white" /> : <Play className="h-3.5 w-3.5 fill-white" />}
          {running ? t('session.pause') : remainingMs < seconds * 1000 ? t('session.resume') : t('session.startTimer')}
        </button>
        <button
          onClick={() => {
            setEndAt(null);
            setRemainingMs(seconds * 1000);
            lastWhole.current = seconds;
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-4 py-1.5 text-[13px] font-medium text-indigo-600 dark:border-indigo-400/30 dark:bg-transparent dark:text-indigo-300"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          {t('session.reset')}
        </button>
      </div>
    </div>
  );
}
