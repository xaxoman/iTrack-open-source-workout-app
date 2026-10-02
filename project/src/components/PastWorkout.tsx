import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Check, ChevronLeft, Minus, Pencil, Trash2 } from 'lucide-react';
import { Dialog, EditorBar, FullScreen, Group, Row } from './ui';
import { useI18n } from '../i18n';
import { useWorkoutStore } from '../store/useWorkoutStore';
import type { Workout } from '../types/workout';
import { baseName, completionFrom, dayKey, groupBySet } from '../utils/workout';

interface PastWorkoutProps {
  workout: Workout | null;
  onClose: () => void;
}

/** View a logged workout, then edit or delete it. */
export function PastWorkout({ workout, onClose }: PastWorkoutProps) {
  const { t, tp, clock, date } = useI18n();
  const { deleteWorkout } = useWorkoutStore();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setEditing(false);
    setConfirmDelete(false);
  }, [workout?.id]);

  if (!workout) return null;

  const tracked = Array.isArray(workout.completedExerciseIds);
  const doneIds = workout.completedExerciseIds ?? [];
  const groups = groupBySet(workout.exercises);
  const when = new Date(workout.date);

  const remove = () => {
    deleteWorkout(workout.id);
    toast.success(t('history.deleted'));
    setConfirmDelete(false);
    onClose();
  };

  return (
    <>
      <FullScreen
        open={!editing}
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
            <div className="flex items-center gap-2">
              <button onClick={() => setEditing(true)} className="pill-secondary px-3.5 py-1.5 text-[13px]">
                <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t('common.edit')}
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                aria-label={t('history.delete')}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border hairline text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
              >
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        }
      >
        <div className="px-5">
          <p className="cap">
            {date(when, { weekday: 'long', day: 'numeric', month: 'long' })} · {date(when, { hour: '2-digit', minute: '2-digit' })}
          </p>
          <h1 className="mt-1 text-[30px] font-semibold leading-tight tracking-[-.02em] text-gray-900 dark:text-white">{workout.name}</h1>

          <div className="mt-4 grid grid-cols-3 border-y hairline py-3.5">
            <Stat value={`${Math.round(workout.completionPercentage)}%`} label={t('history.completion')} />
            <Stat value={clock(workout.duration)} label={t('history.duration')} divider />
            <Stat
              value={tracked ? `${doneIds.length} / ${workout.exercises.length}` : String(workout.exercises.length)}
              label={t('history.exercises')}
              divider
            />
          </div>

          {!tracked && <p className="mt-4 text-[13px] leading-snug text-gray-500 dark:text-gray-400">{t('history.untracked')}</p>}

          {groups.map(({ set, items }) => {
            const doneInSet = items.filter((e) => doneIds.includes(e.id)).length;
            return (
              <section key={set} className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="cap">{t('session.set', { n: set })}</p>
                  {tracked && <span className="text-[13px] text-gray-500 dark:text-gray-400">{t('session.ofTotal', { done: doneInSet, total: items.length })}</span>}
                </div>
                {items.map((exercise) => {
                  const done = doneIds.includes(exercise.id);
                  return (
                    <div key={exercise.id} className="flex items-center gap-3 border-b border-gray-100 py-2.5 dark:border-white/[0.06]">
                      {tracked ? (
                        done ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white dark:bg-indigo-500">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-gray-300 text-gray-300 dark:border-white/20 dark:text-gray-600">
                            <Minus className="h-3 w-3" strokeWidth={3} />
                          </span>
                        )
                      ) : (
                        <span className="mx-[7px] h-1.5 w-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                      )}
                      <span className={`flex-1 text-[14px] ${tracked && !done ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                        {baseName(exercise)}
                      </span>
                      <span className="text-[13px] tabular-nums text-gray-500 dark:text-gray-400">
                        {tracked && !done ? t('history.skipped') : exercise.type === 'time' ? clock(exercise.reps) : tp('session.reps', exercise.reps)}
                      </span>
                    </div>
                  );
                })}
              </section>
            );
          })}
        </div>
      </FullScreen>

      {editing && <EditWorkout workout={workout} onClose={() => setEditing(false)} onDelete={() => setConfirmDelete(true)} />}

      <Dialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        icon={
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <Trash2 className="h-5 w-5" strokeWidth={1.75} />
          </span>
        }
        title={t('history.deleteTitle')}
        actions={
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setConfirmDelete(false)} className="pill-secondary py-2.5">
              {t('common.cancel')}
            </button>
            <button onClick={remove} className="pill-danger py-2.5">
              {t('common.delete')}
            </button>
          </div>
        }
      >
        {t('history.deleteBody', { name: workout.name, date: date(when, { weekday: 'short', day: 'numeric', month: 'short' }) })}
      </Dialog>
    </>
  );
}

function Stat({ value, label, divider }: { value: string; label: string; divider?: boolean }) {
  return (
    <div className={divider ? 'border-l hairline pl-4' : ''}>
      <p className="text-[24px] font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white">{value}</p>
      <p className="text-[12px] text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Edit date, start time, duration and which exercises were done. */
function EditWorkout({ workout, onClose, onDelete }: { workout: Workout; onClose: () => void; onDelete: () => void }) {
  const { t, tp, clock } = useI18n();
  const { updateWorkout } = useWorkoutStore();
  const tracked = Array.isArray(workout.completedExerciseIds);
  const start = new Date(workout.date);

  const [day, setDay] = useState(dayKey(start));
  const [time, setTime] = useState(`${pad(start.getHours())}:${pad(start.getMinutes())}`);
  const [minutes, setMinutes] = useState(String(Math.floor(workout.duration / 60)));
  const [seconds, setSeconds] = useState(String(Math.round(workout.duration % 60)));
  const [done, setDone] = useState<string[]>(workout.completedExerciseIds ?? []);
  const [manualPct, setManualPct] = useState(String(Math.round(workout.completionPercentage)));

  const groups = useMemo(() => groupBySet(workout.exercises), [workout.exercises]);
  const total = workout.exercises.length;
  const pct = tracked ? completionFrom(done.length, total) : Math.min(100, Math.max(0, Number(manualPct) || 0));

  const valid = Boolean(day) && /^\d{2}:\d{2}$/.test(time);

  const save = () => {
    if (!valid) return;
    const [y, m, d] = day.split('-').map(Number);
    const [hh, mm] = time.split(':').map(Number);
    const when = new Date(y, m - 1, d, hh, mm);
    updateWorkout({
      ...workout,
      date: when.toISOString(),
      duration: Math.max(0, (parseInt(minutes, 10) || 0) * 60 + (parseInt(seconds, 10) || 0)),
      completionPercentage: pct,
      ...(tracked ? { completedExerciseIds: done } : {}),
    });
    toast.success(t('history.updated'));
    onClose();
  };

  const toggle = (id: string) => setDone((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const fieldCls =
    'rounded-lg bg-white px-2.5 py-1 text-[15px] text-gray-900 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white dark:ring-white/10';

  return (
    <FullScreen
      open
      onClose={onClose}
      tone="grouped"
      z="z-[65]"
      header={
        <EditorBar
          title={t('history.editTitle')}
          onCancel={onClose}
          cancelLabel={t('common.cancel')}
          onSave={save}
          saveLabel={t('common.save')}
          saveDisabled={!valid}
        />
      }
    >
      <div className="px-4">
        <Group label={t('history.session')}>
          <Row label={t('history.routine')} value={workout.name} />
          <Row
            label={t('common.date')}
            htmlFor="edit-date"
            right={<input id="edit-date" type="date" value={day} max={dayKey(new Date())} onChange={(e) => setDay(e.target.value)} className={fieldCls} />}
          />
          <Row
            label={t('history.started')}
            htmlFor="edit-time"
            right={<input id="edit-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className={fieldCls} />}
          />
          <Row
            label={t('history.duration')}
            right={
              <span className="flex items-center gap-1.5">
                <input
                  aria-label={t('history.minutes')}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className={`${fieldCls} w-16 text-right`}
                />
                <span className="text-[13px]">{t('history.min')}</span>
                <input
                  aria-label={t('history.seconds')}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={59}
                  value={seconds}
                  onChange={(e) => setSeconds(e.target.value)}
                  className={`${fieldCls} w-14 text-right`}
                />
                <span className="text-[13px]">{t('history.sec')}</span>
              </span>
            }
          />
        </Group>

        {tracked ? (
          groups.map(({ set, items }, i) => (
            <Group
              key={set}
              label={t('history.tickSet', { n: set })}
              footnote={
                i === groups.length - 1
                  ? t('history.completionFrom', { done: done.length, total, pct: Math.round(pct) })
                  : undefined
              }
            >
              {items.map((exercise) => {
                const on = done.includes(exercise.id);
                return (
                  <button
                    key={exercise.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => toggle(exercise.id)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
                  >
                    <span
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md ${
                        on ? 'bg-indigo-600 text-white dark:bg-indigo-500' : 'border-[1.5px] border-gray-300 dark:border-white/20'
                      }`}
                    >
                      {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                    </span>
                    <span className="flex-1 text-[15px] text-gray-900 dark:text-white">{baseName(exercise)}</span>
                    <span className="text-[13px] tabular-nums text-gray-500 dark:text-gray-400">
                      {exercise.type === 'time' ? clock(exercise.reps) : tp('session.reps', exercise.reps)}
                    </span>
                  </button>
                );
              })}
            </Group>
          ))
        ) : (
          <Group label={t('history.completion')} footnote={t('history.manualCompletion')}>
            <Row
              label={t('history.completion')}
              htmlFor="edit-pct"
              right={
                <span className="flex items-center gap-1.5">
                  <input
                    id="edit-pct"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100}
                    value={manualPct}
                    onChange={(e) => setManualPct(e.target.value)}
                    className={`${fieldCls} w-16 text-right`}
                  />
                  <span>%</span>
                </span>
              }
            />
          </Group>
        )}

        <div className="mt-6 overflow-hidden rounded-2xl bg-gray-50 dark:bg-gray-900">
          <button onClick={onDelete} className="w-full py-3 text-center text-[15px] font-medium text-red-600 dark:text-red-400">
            {t('history.delete')}
          </button>
        </div>
      </div>
    </FullScreen>
  );
}
