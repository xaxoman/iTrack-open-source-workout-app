import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Moon, Play, Plus, Sparkles, Sun, UserCircle2 } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useAuthStore } from '../store/useAuthStore';
import { AuthModal } from '../components/AuthModal';
import { IconButton } from '../components/ui';
import { useI18n } from '../i18n';
import { computeStreak, dayKey, nextRoutine, startOfWeek } from '../utils/workout';

/** "Today": the next session, this week at a glance, the coach and recent workouts. */
export function Home() {
  const { t, tp, date, weekdays, clock, duration } = useI18n();
  const navigate = useNavigate();
  const { workouts, templates, darkMode, toggleDarkMode } = useWorkoutStore();
  const user = useAuthStore((s) => s.user);
  const [authOpen, setAuthOpen] = useState(false);

  const today = new Date();
  const todayKey = dayKey(today);
  const next = nextRoutine(templates, workouts);

  const week = useMemo(() => {
    const monday = startOfWeek(new Date());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      const key = dayKey(day);
      const best = workouts.filter((w) => dayKey(w.date) === key).reduce<number | null>((max, w) => Math.max(max ?? 0, w.completionPercentage), null);
      return { key, best };
    });
  }, [workouts]);
  const sessionsThisWeek = week.reduce((n, d) => n + (d.best !== null ? 1 : 0), 0);
  const streak = computeStreak(workouts);
  const recent = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 2);
  const labels = weekdays('narrow');

  return (
    <div>
      <div className="flex h-8 items-center justify-between">
        <p className="cap">{date(today, { weekday: 'long' })}</p>
        <div className="-mr-2 flex items-center">
          <IconButton label={t('settings.darkMode')} onClick={toggleDarkMode}>
            {darkMode ? <Sun className="h-5 w-5" strokeWidth={1.75} /> : <Moon className="h-5 w-5" strokeWidth={1.75} />}
          </IconButton>
          <IconButton label={user ? t('today.account') : t('today.signIn')} onClick={() => setAuthOpen(true)}>
            <span className="relative">
              <UserCircle2 className="h-5 w-5" strokeWidth={1.75} />
              {user && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-950" />}
            </span>
          </IconButton>
        </div>
      </div>
      <h1 className="mt-1 text-[44px] font-semibold leading-none tracking-[-.03em] text-gray-900 dark:text-white">
        {date(today, { day: 'numeric', month: 'long' })}
      </h1>

      {/* Next session */}
      <section className="mt-6 border-t hairline pt-4">
        {next ? (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <p className="cap">{t('today.nextSession')}</p>
              <span className="text-[12px] text-gray-400 dark:text-gray-500">
                {next.last ? t('today.lastDone', { when: date(next.last.date, { weekday: 'short', day: 'numeric', month: 'short' }) }) : t('today.notDoneYet')}
              </span>
            </div>
            <p className="mt-2 text-[22px] font-semibold tracking-tight text-gray-900 dark:text-white">{next.template.name}</p>
            <p className="text-[13px] text-gray-500 dark:text-gray-400">
              {t('workouts.exercisesTimesSets', { ex: next.template.exercises.length, sets: next.template.numberOfSets || 1 })}
              {next.last ? ` · ${t('today.about', { time: duration(next.last.duration) })}` : ''}
            </p>
            <ol className="mt-3 space-y-1">
              {next.template.exercises.slice(0, 3).map((e, i) => (
                <li key={e.id} className="flex items-baseline gap-3 text-[14px]">
                  <span className="w-4 text-[12px] tabular-nums text-gray-400 dark:text-gray-500">{i + 1}</span>
                  <span className="flex-1 truncate text-gray-900 dark:text-white">{e.name}</span>
                  <span className="text-[13px] tabular-nums text-gray-500 dark:text-gray-400">{e.type === 'time' ? clock(e.reps) : e.reps}</span>
                </li>
              ))}
              {next.template.exercises.length > 3 && (
                <li className="pl-7 text-[13px] text-gray-400 dark:text-gray-500">{tp('today.more', next.template.exercises.length - 3)}</li>
              )}
            </ol>
            <div className="mt-4 flex gap-2">
              <button onClick={() => navigate('/workouts', { state: { start: next.template.id } })} className="pill-primary flex-1">
                <Play className="h-4 w-4 fill-current" />
                {t('common.start')}
              </button>
              <button onClick={() => navigate('/workouts')} className="pill-secondary">
                {t('today.change')}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="cap">{t('today.nextSession')}</p>
            <p className="mt-2 text-[22px] font-semibold tracking-tight text-gray-900 dark:text-white">{t('today.firstRoutineTitle')}</p>
            <p className="mt-1 text-[14px] text-gray-500 dark:text-gray-400">{t('today.firstRoutineBody')}</p>
            <button onClick={() => navigate('/workouts', { state: { create: true } })} className="pill-primary mt-4">
              <Plus className="h-4 w-4" />
              {t('workouts.newRoutine')}
            </button>
          </>
        )}
      </section>

      {/* This week */}
      <section className="mt-5 border-t hairline pt-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="cap">{t('today.thisWeek')}</p>
          <span className="text-[12px] text-gray-400 dark:text-gray-500">
            {tp('today.sessions', sessionsThisWeek)}
            {streak > 0 ? ` · ${tp('today.streak', streak)}` : ''}
          </span>
        </div>
        <div className="mt-3 flex items-end justify-between">
          {week.map((d, i) => (
            <div
              key={d.key}
              className="flex w-9 flex-col items-center gap-1.5"
              aria-label={`${date(`${d.key}T12:00:00`, { weekday: 'long' })}: ${d.best !== null ? `${Math.round(d.best)}%` : t('today.rest')}`}
            >
              <div className="flex h-12 w-2 items-end overflow-hidden rounded-full bg-indigo-50 dark:bg-white/[0.08]">
                {d.best !== null && <div className="w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" style={{ height: `${Math.max(8, d.best)}%` }} />}
              </div>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium ${
                  d.key === todayKey
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-950'
                    : d.key > todayKey
                      ? 'text-gray-400 dark:text-gray-500'
                      : 'text-gray-900 dark:text-white'
                }`}
              >
                {labels[i]}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Coach */}
      <button onClick={() => navigate('/coach')} className="mt-5 flex w-full items-center justify-between border-t hairline pt-4 text-left">
        <span className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" strokeWidth={1.75} />
          <span>
            <span className="block text-[15px] font-medium text-gray-900 dark:text-white">{t('today.coach')}</span>
            <span className="block text-[12px] text-gray-500 dark:text-gray-400">{t('today.coachSub')}</span>
          </span>
        </span>
        <ArrowRight className="h-4 w-4 text-gray-400" />
      </button>

      {/* Recent */}
      {recent.length > 0 && (
        <section className="mt-4 border-t hairline pt-4">
          <div className="flex items-baseline justify-between">
            <p className="cap">{t('today.recent')}</p>
            <button onClick={() => navigate('/workouts?tab=history')} className="text-[13px] font-medium text-indigo-600 dark:text-indigo-400">
              {t('today.allHistory')}
            </button>
          </div>
          {recent.map((w) => (
            <div key={w.id} className="mt-2 flex items-baseline justify-between gap-3 text-[14px]">
              <span className="truncate text-gray-900 dark:text-white">{w.name}</span>
              <span className="flex-shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
                {date(w.date, { weekday: 'short' })} · {Math.round(w.completionPercentage)}%
              </span>
            </div>
          ))}
        </section>
      )}

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
