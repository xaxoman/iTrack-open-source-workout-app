import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useI18n } from '../i18n';
import type { Workout } from '../types/workout';
import { dayKey } from '../utils/workout';

interface HistoryCalendarProps {
  workouts: Workout[];
  onOpen: (workout: Workout) => void;
}

const firstOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

/** Month calendar of logged workouts; tap a day to list and open its sessions. */
export function HistoryCalendar({ workouts, onOpen }: HistoryCalendarProps) {
  const { t, tp, date, weekdays, capitalize, duration, clock } = useI18n();
  const today = new Date();
  const todayKey = dayKey(today);

  const byDay = useMemo(() => {
    const map = new Map<string, Workout[]>();
    workouts.forEach((w) => {
      const key = dayKey(w.date);
      map.set(key, [...(map.get(key) ?? []), w]);
    });
    map.forEach((list) => list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    return map;
  }, [workouts]);

  const [month, setMonth] = useState(() => firstOfMonth(today));
  const [selected, setSelected] = useState(() => {
    // Default to the latest training day this month, else today.
    const keys = Array.from(byDay.keys()).filter((k) => k.startsWith(todayKey.slice(0, 7)) && k <= todayKey).sort();
    return keys[keys.length - 1] ?? todayKey;
  });

  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leading = (month.getDay() + 6) % 7; // Monday-first grid
  const isCurrentMonth = year === today.getFullYear() && monthIndex === today.getMonth();

  const monthWorkouts = workouts.filter((w) => {
    const d = new Date(w.date);
    return d.getFullYear() === year && d.getMonth() === monthIndex;
  });
  const monthSeconds = monthWorkouts.reduce((sum, w) => sum + w.duration, 0);
  const monthAvg = monthWorkouts.length
    ? monthWorkouts.reduce((sum, w) => sum + w.completionPercentage, 0) / monthWorkouts.length
    : 0;

  const shift = (delta: number) => {
    const next = new Date(year, monthIndex + delta, 1);
    setMonth(next);
    const prefix = dayKey(next).slice(0, 7);
    const keys = Array.from(byDay.keys()).filter((k) => k.startsWith(prefix)).sort();
    setSelected(keys[keys.length - 1] ?? (prefix === todayKey.slice(0, 7) ? todayKey : `${prefix}-01`));
  };

  const goToday = () => {
    setMonth(firstOfMonth(today));
    setSelected(todayKey);
  };

  const selectedDate = new Date(`${selected}T12:00:00`);
  const selectedWorkouts = byDay.get(selected) ?? [];

  return (
    <div>
      <div className="mt-4 flex items-center justify-between">
        <button
          onClick={() => shift(-1)}
          aria-label={t('history.prevMonth')}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
        >
          <ChevronLeft className="h-5 w-5" strokeWidth={1.75} />
        </button>
        <p className="text-[17px] font-semibold text-gray-900 dark:text-white">{capitalize(date(month, { month: 'long', year: 'numeric' }))}</p>
        <div className="flex items-center gap-1">
          {!isCurrentMonth || selected !== todayKey ? (
            <button onClick={goToday} className="rounded-full border hairline px-2.5 py-0.5 text-[12px] font-medium text-gray-600 dark:text-gray-300">
              {t('history.today')}
            </button>
          ) : null}
          <button
            onClick={() => shift(1)}
            disabled={isCurrentMonth}
            aria-label={t('history.nextMonth')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-white/[0.06] dark:hover:text-gray-200"
          >
            <ChevronRight className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-semibold uppercase text-gray-400 dark:text-gray-500">
        {weekdays('narrow').map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7" role="grid">
        {Array.from({ length: leading }, (_, i) => (
          <span key={`blank-${i}`} className="h-[46px]" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const key = dayKey(new Date(year, monthIndex, day));
          const count = byDay.get(key)?.length ?? 0;
          const future = key > todayKey;
          const isSelected = key === selected;
          const isToday = key === todayKey;
          return (
            <button
              key={key}
              disabled={future}
              onClick={() => setSelected(key)}
              aria-label={`${date(new Date(year, monthIndex, day), { day: 'numeric', month: 'long' })}${count ? ` — ${tp('history.workouts', count)}` : ''}`}
              aria-pressed={isSelected}
              className="flex h-[46px] flex-col items-center gap-0.5 pt-0.5"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-[14px] tabular-nums ${
                  isSelected
                    ? 'bg-gray-900 font-semibold text-white dark:bg-white dark:text-gray-950'
                    : isToday
                      ? 'font-semibold text-indigo-600 ring-1 ring-indigo-600 dark:text-indigo-400 dark:ring-indigo-400'
                      : future
                        ? 'text-gray-300 dark:text-gray-700'
                        : count
                          ? 'font-medium text-gray-900 dark:text-white'
                          : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {day}
              </span>
              <span className="flex h-1.5 gap-0.5">
                {Array.from({ length: Math.min(count, 3) }, (_, j) => (
                  <span key={j} className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                ))}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-2 grid grid-cols-3 border-y hairline py-3">
        <MonthStat value={String(monthWorkouts.length)} label={tp('history.sessions', monthWorkouts.length)} />
        <MonthStat value={duration(monthSeconds)} label={t('history.trained')} divider />
        <MonthStat value={`${Math.round(monthAvg)}%`} label={t('history.avgCompletion')} divider />
      </div>

      <div className="mt-4">
        <p className="cap">{date(selectedDate, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        {selectedWorkouts.length === 0 ? (
          <p className="mt-2 text-[14px] text-gray-500 dark:text-gray-400">{t('history.noWorkoutThatDay')}</p>
        ) : (
          <div className="mt-2 space-y-2">
            {selectedWorkouts.map((w) => {
              const tracked = Array.isArray(w.completedExerciseIds);
              const parts = [date(w.date, { hour: '2-digit', minute: '2-digit' }), clock(w.duration)];
              if (tracked) parts.push(t('history.ofExercises', { done: w.completedExerciseIds!.length, total: w.exercises.length }));
              return (
                <button
                  key={w.id}
                  onClick={() => onOpen(w)}
                  className="flex w-full items-center gap-3 rounded-2xl border hairline p-3.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[16px] font-semibold text-gray-900 dark:text-white">{w.name}</p>
                    <p className="text-[12px] tabular-nums text-gray-500 dark:text-gray-400">{parts.join(' · ')}</p>
                  </div>
                  <span className="text-[17px] font-semibold tabular-nums text-gray-900 dark:text-white">{Math.round(w.completionPercentage)}%</span>
                  <ChevronRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                </button>
              );
            })}
          </div>
        )}
        <p className="mt-2 text-[12px] text-gray-400 dark:text-gray-500">{t('history.hint')}</p>
      </div>
    </div>
  );
}

function MonthStat({ value, label, divider }: { value: string; label: string; divider?: boolean }) {
  return (
    <div className={divider ? 'border-l hairline pl-3' : ''}>
      <p className="text-[18px] font-semibold tabular-nums tracking-tight text-gray-900 dark:text-white">{value}</p>
      <p className="text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
