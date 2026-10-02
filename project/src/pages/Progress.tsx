import { useMemo, useState } from 'react';
import { Activity, ChevronRight, StickyNote, Trash2, Trophy } from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { PageTitle } from '../components/ui';
import { RoutineNotes } from '../components/RoutineNotes';
import { LogWeightSheet } from '../components/LogWeightSheet';
import { useI18n } from '../i18n';
import { useUnits } from '../utils/units';
import type { Workout, WorkoutTemplate } from '../types/workout';
import { computeStreak, dayKey, latestWorkout, startOfWeek, workoutsForTemplate } from '../utils/workout';

/** Latest result per routine name within a period, averaged. */
function averageLatestCompletion(list: Workout[]) {
  const latest = new Map<string, Workout>();
  list.forEach((w) => {
    const prev = latest.get(w.name);
    if (!prev || new Date(w.date) > new Date(prev.date)) latest.set(w.name, w);
  });
  const values = Array.from(latest.values());
  return values.length ? values.reduce((s, w) => s + w.completionPercentage, 0) / values.length : null;
}

function useChartColors() {
  const darkMode = useWorkoutStore((s) => s.darkMode);
  return {
    darkMode,
    line: darkMode ? '#818cf8' : '#4f46e5',
    grid: darkMode ? 'rgba(255,255,255,0.08)' : '#f3f4f6',
    tick: darkMode ? '#6b7280' : '#9ca3af',
    surface: darkMode ? '#030712' : '#ffffff',
    tooltip: {
      backgroundColor: darkMode ? '#111827' : '#ffffff',
      border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e5e7eb',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(3,7,18,0.12)',
      color: darkMode ? '#f9fafb' : '#111827',
      fontSize: '12px',
    },
  };
}

export function Progress() {
  const { t, tp, lang, date, capitalize, weekdays, duration } = useI18n();
  const { workouts } = useWorkoutStore();
  const colors = useChartColors();

  const stats = useMemo(() => {
    const now = new Date();
    const thisMonth = workouts.filter((w) => {
      const d = new Date(w.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const avgCompletion = workouts.length ? workouts.reduce((s, w) => s + w.completionPercentage, 0) / workouts.length : 0;
    const avgDuration = workouts.length ? workouts.reduce((s, w) => s + w.duration, 0) / workouts.length : 0;

    // Last 8 weeks, Monday-based.
    const thisMonday = startOfWeek(now);
    const weekly = Array.from({ length: 8 }, (_, i) => {
      const start = new Date(thisMonday);
      start.setDate(start.getDate() - (7 - i) * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const inWeek = workouts.filter((w) => {
        const d = new Date(w.date);
        return d >= start && d < end;
      });
      return { start, completion: averageLatestCompletion(inWeek), count: inWeek.length };
    });
    const tracked = weekly.filter((w) => w.completion !== null);
    const delta = tracked.length >= 2 ? tracked[tracked.length - 1].completion! - tracked[0].completion! : null;

    // Sessions per weekday, Monday-first.
    const byWeekday = [0, 0, 0, 0, 0, 0, 0];
    workouts.forEach((w) => {
      byWeekday[(new Date(w.date).getDay() + 6) % 7]++;
    });
    const topDay = byWeekday.indexOf(Math.max(...byWeekday));

    return {
      thisMonth: thisMonth.length,
      streak: computeStreak(workouts),
      avgCompletion,
      avgDuration,
      weekly,
      delta,
      byWeekday,
      topDay,
    };
  }, [workouts]);

  const longDays = weekdays('long');
  const narrowDays = weekdays('narrow');
  const maxDay = Math.max(1, ...stats.byWeekday);
  const chartData = stats.weekly.map((w) => ({
    label: date(w.start, { day: 'numeric', month: 'short' }),
    completion: w.completion === null ? null : Math.round(w.completion),
    count: w.count,
  }));

  return (
    <div>
      <PageTitle eyebrow={capitalize(date(new Date(), { month: 'long' }))} title={t('nav.progress')} />

      {workouts.length === 0 ? (
        <div className="mt-6 border-y hairline py-10 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/[0.06] dark:text-gray-500">
            <Activity className="h-6 w-6" />
          </span>
          <p className="text-[15px] font-medium text-gray-900 dark:text-white">{t('progress.emptyTitle')}</p>
          <p className="mx-auto mt-1 max-w-xs text-[14px] text-gray-500 dark:text-gray-400">{t('progress.emptyBody')}</p>
        </div>
      ) : (
        <>
          <div className="mt-3 grid grid-cols-2 border-y hairline">
            <Stat value={String(stats.thisMonth)} label={tp('progress.workoutsThisMonth', stats.thisMonth)} />
            <Stat value={String(stats.streak)} label={tp('progress.dayStreak', stats.streak)} divider />
            <Stat value={`${Math.round(stats.avgCompletion)}%`} label={t('progress.avgCompletion')} top />
            <Stat value={duration(stats.avgDuration)} label={t('progress.avgDuration')} divider top />
          </div>

          <section className="mt-6">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">{t('progress.weeklyCompletion')}</h2>
              {stats.delta !== null && (
                <span className="text-[12px] text-gray-500 dark:text-gray-400">
                  {t('progress.delta', { delta: `${stats.delta >= 0 ? '+' : '−'}${Math.abs(Math.round(stats.delta))}` })}
                </span>
              )}
            </div>
            <p className="text-[12px] text-gray-500 dark:text-gray-400">{t('progress.weeklyHint')}</p>
            <div className="mt-3 h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={colors.grid} />
                  <XAxis dataKey="label" tick={{ fill: colors.tick, fontSize: 10 }} axisLine={false} tickLine={false} interval={1} />
                  <YAxis domain={[0, 100]} ticks={[0, 50, 100]} tick={{ fill: colors.tick, fontSize: 10 }} tickFormatter={(v) => `${v}%`} axisLine={false} tickLine={false} width={40} />
                  <Tooltip
                    contentStyle={colors.tooltip}
                    formatter={(value: number) => [`${value}%`, t('progress.completion')]}
                    labelFormatter={(label, payload) => {
                      const count = (payload?.[0]?.payload as { count?: number } | undefined)?.count ?? 0;
                      return `${t('progress.weekOf', { date: String(label) })} · ${tp('history.workouts', count)}`;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completion"
                    stroke={colors.line}
                    strokeWidth={2}
                    connectNulls
                    dot={{ r: 3, fill: colors.line, strokeWidth: 0 }}
                    activeDot={{ r: 5, stroke: colors.surface, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="mt-6 border-t hairline pt-4">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-[15px] font-semibold text-gray-900 dark:text-white">{t('progress.byWeekday')}</h2>
              <span className="text-[12px] text-gray-500 dark:text-gray-400">{t('progress.yourDay', { day: lang === 'en' ? capitalize(longDays[stats.topDay]) : longDays[stats.topDay] })}</span>
            </div>
            <div className="mt-3 flex h-24 items-end justify-between gap-2">
              {stats.byWeekday.map((count, i) => (
                <div
                  key={i}
                  className="flex flex-1 flex-col items-center gap-1.5"
                  role="img"
                  aria-label={`${capitalize(longDays[i])}: ${tp('history.workouts', count)}`}
                  title={`${capitalize(longDays[i])}: ${tp('history.workouts', count)}`}
                >
                  {i === stats.topDay && <span className="text-[11px] font-semibold tabular-nums text-gray-900 dark:text-white">{count}</span>}
                  <div
                    className={`w-full rounded-t ${i === stats.topDay ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-indigo-200 dark:bg-indigo-400/30'}`}
                    style={{ height: `${Math.max(2, (count / maxDay) * 64)}px` }}
                  />
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">{narrowDays[i]}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <TrainingPlan />
      <BodyWeight />
    </div>
  );
}

function Stat({ value, label, divider, top }: { value: string; label: string; divider?: boolean; top?: boolean }) {
  return (
    <div className={`py-3.5 ${divider ? 'border-l hairline pl-4' : ''} ${top ? 'border-t hairline' : ''}`}>
      <p className="text-[30px] font-semibold leading-none tracking-tight text-gray-900 dark:text-white">{value}</p>
      <p className="mt-1.5 text-[12px] text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

/** Latest vs. record completion per routine as a dot plot on a shared scale. */
function TrainingPlan() {
  const { t, tp, muscle, duration } = useI18n();
  const { templates, workouts, routineBookmarks } = useWorkoutStore();
  const [notesFor, setNotesFor] = useState<WorkoutTemplate | null>(null);

  const rows = useMemo(
    () =>
      templates.map((template) => {
        const history = workoutsForTemplate(template, workouts);
        const latest = latestWorkout(history);
        const record = history.length ? Math.max(...history.map((w) => w.completionPercentage)) : null;
        return {
          template,
          latest: latest ? Math.round(latest.completionPercentage) : null,
          record: record !== null ? Math.round(record) : null,
          lastDuration: latest?.duration ?? null,
          muscles: Array.from(new Set(template.exercises.flatMap((e) => e.targetMuscles ?? []))),
          notes: (routineBookmarks[template.id] ?? []).length,
        };
      }),
    [templates, workouts, routineBookmarks]
  );

  if (rows.length === 0) return null;

  return (
    <section className="mt-8 border-t hairline pt-4">
      <h2 className="text-[20px] font-semibold tracking-tight text-gray-900 dark:text-white">{t('plan.title')}</h2>
      <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">{t('plan.subtitle')}</p>
      <div className="mt-1">
        {rows.map((row) => (
          <div key={row.template.id} className="border-b hairline py-4">
            <div className="flex items-baseline justify-between gap-3">
              <p className="truncate text-[16px] font-semibold text-gray-900 dark:text-white">{row.template.name}</p>
              {row.lastDuration !== null && (
                <span className="flex-shrink-0 text-[13px] tabular-nums text-gray-500 dark:text-gray-400">{duration(row.lastDuration)}</span>
              )}
            </div>
            {row.muscles.length > 0 && <p className="text-[12px] text-gray-500 dark:text-gray-400">{row.muscles.map(muscle).join(', ')}</p>}

            {row.latest !== null && row.record !== null ? (
              <div className="mt-3 space-y-2">
                <ResultBar label={t('plan.latest')} value={row.latest} barClass="bg-indigo-600 dark:bg-indigo-500" />
                <ResultBar label={t('plan.record')} value={row.record} barClass="bg-emerald-600" />
                {row.latest === row.record && (
                  <p className="flex items-center gap-1.5 text-[12px] text-gray-600 dark:text-gray-300">
                    <Trophy className="h-3.5 w-3.5 text-emerald-600" strokeWidth={2} />
                    {t('plan.matchedRecord')}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-gray-400 dark:text-gray-500">{t('plan.notDoneYet')}</p>
            )}

            <button
              onClick={() => setNotesFor(row.template)}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border hairline px-3 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/[0.06]"
            >
              <StickyNote className="h-4 w-4 text-indigo-600 dark:text-indigo-400" strokeWidth={1.75} />
              {row.notes ? tp('plan.openNotes', row.notes) : t('plan.addNotes')}
              <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
            </button>
          </div>
        ))}
      </div>
      <RoutineNotes template={notesFor} onClose={() => setNotesFor(null)} />
    </section>
  );
}

/** Completion on a full 0–100% track, labelled at both ends. */
function ResultBar({ label, value, barClass }: { label: string; value: number; barClass: string }) {
  return (
    <div className="grid grid-cols-[64px_1fr_40px] items-center gap-3">
      <span className="text-[12px] text-gray-500 dark:text-gray-400">{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} aria-label={label}>
        <div className={`h-2 rounded-full ${barClass}`} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
      </div>
      <span className="text-right text-[13px] font-semibold tabular-nums text-gray-900 dark:text-white">{value}%</span>
    </div>
  );
}

/** Body-weight log: current value, quick log, trend and recent entries. */
function BodyWeight() {
  const { t, date, number } = useI18n();
  const { weightLog, addWeightEntry, deleteWeightEntry } = useWorkoutStore();
  const { unit, fromKg, toKg, formatValue } = useUnits();
  const colors = useChartColors();
  const [value, setValue] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  const latest = weightLog[weightLog.length - 1];
  const previous = weightLog[weightLog.length - 2];
  const first = weightLog[0];
  const parsed = parseFloat(value.replace(',', '.'));
  const kg = Number.isNaN(parsed) ? NaN : toKg(parsed);
  const valid = kg > 20 && kg < 400;

  const log = () => {
    if (!valid) return;
    addWeightEntry({ id: crypto.randomUUID(), date: dayKey(new Date()), weightKg: kg });
    setValue('');
  };

  const signed = (deltaKg: number) => `${deltaKg > 0 ? '+' : deltaKg < 0 ? '−' : '±'}${formatValue(Math.abs(deltaKg))}`;
  const data = weightLog.map((e) => ({ label: date(e.date, { day: 'numeric', month: 'short' }), value: fromKg(e.weightKg) }));
  const recent = [...weightLog].reverse().slice(0, 6);

  return (
    <section className="mt-8 border-t hairline pt-4">
      <h2 className="text-[20px] font-semibold tracking-tight text-gray-900 dark:text-white">{t('weight.title')}</h2>
      {latest ? (
        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-[56px] font-semibold leading-none tracking-[-.03em] text-gray-900 dark:text-white">{formatValue(latest.weightKg)}</p>
          <p className="text-[18px] text-gray-400">{unit}</p>
          <p className="ml-auto text-right text-[13px] leading-snug text-gray-500 dark:text-gray-400">
            {previous && (
              <>
                {t('weight.sinceDate', { delta: signed(latest.weightKg - previous.weightKg), date: date(previous.date, { day: 'numeric', month: 'short' }) })}
                <br />
              </>
            )}
            {first && first !== latest && previous !== first && t('weight.sinceDate', { delta: signed(latest.weightKg - first.weightKg), date: date(first.date, { day: 'numeric', month: 'short' }) })}
          </p>
        </div>
      ) : (
        <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">{t('weight.empty')}</p>
      )}

      <div className="mt-4 flex items-center gap-3 rounded-2xl border hairline p-2 pl-4">
        <label htmlFor="quick-weight" className="text-[13px] text-gray-500 dark:text-gray-400">
          {t('weight.today')}
        </label>
        <input
          id="quick-weight"
          type="number"
          inputMode="decimal"
          step="0.1"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && log()}
          placeholder={latest ? String(fromKg(latest.weightKg)) : '—'}
          className="min-w-0 flex-1 bg-transparent text-right text-[18px] font-semibold text-gray-900 placeholder:font-normal placeholder:text-gray-300 focus:outline-none dark:text-white dark:placeholder:text-gray-600"
        />
        <span className="text-[13px] text-gray-400">{unit}</span>
        <button onClick={log} disabled={!valid} className="pill-primary px-4 py-2 text-[14px]">
          {t('weight.log')}
        </button>
      </div>

      {data.length >= 2 && (
        <div className="mt-5 h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={colors.grid} />
              <XAxis dataKey="label" tick={{ fill: colors.tick, fontSize: 10 }} axisLine={false} tickLine={false} minTickGap={28} />
              <YAxis
                domain={['dataMin - 1', 'dataMax + 1']}
                tick={{ fill: colors.tick, fontSize: 10 }}
                tickFormatter={(v: number) => number(v, 0)}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip contentStyle={colors.tooltip} formatter={(v: number) => [`${number(v, 1)} ${unit}`, t('weight.title')]} />
              <Line type="monotone" dataKey="value" stroke={colors.line} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: colors.surface, strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-[1fr_auto_72px_32px] cap">
            <span>{t('common.date')}</span>
            <span>{t('weight.change')}</span>
            <span className="text-right">{unit}</span>
            <span />
          </div>
          {recent.map((entry, i) => {
            const before = recent[i + 1];
            return (
              <div key={entry.id} className="grid grid-cols-[1fr_auto_72px_32px] items-center border-b border-gray-100 py-2 text-[14px] dark:border-white/[0.06]">
                <span className="text-gray-900 dark:text-white">{date(entry.date, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                <span className="tabular-nums text-gray-500 dark:text-gray-400">{before ? signed(entry.weightKg - before.weightKg) : ''}</span>
                <span className="text-right font-semibold tabular-nums text-gray-900 dark:text-white">{formatValue(entry.weightKg)}</span>
                <button
                  onClick={() => deleteWeightEntry(entry.id)}
                  aria-label={t('weight.deleteEntry')}
                  className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 dark:text-gray-600 dark:hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      <button onClick={() => setSheetOpen(true)} className="mt-3 text-[14px] font-medium text-indigo-600 dark:text-indigo-400">
        {t('weight.logOtherDay')}
      </button>
      <LogWeightSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </section>
  );
}
