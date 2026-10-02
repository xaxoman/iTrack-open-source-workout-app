import { useMemo } from 'react';
import { useI18n } from '../i18n';
import type { Workout } from '../types/workout';
import { BODY_REGIONS, regionsFor, type BodyRegion } from '../utils/muscles';
import { BACK_VIEWBOX, BODY_BACK, BODY_FRONT, FRONT_VIEWBOX, type BodyPart, type BodySlug } from './bodyPaths';

/**
 * Front/back anatomical body (outlines from MuscleMap, see bodyPaths.ts) with the
 * muscles a workout trained, shaded by how many completed sets hit each one
 * (single-hue sequential scale).
 */

type Level = 0 | 1 | 2 | 3;

// Sequential indigo ramp: light → dark in light mode; flipped anchor in dark mode.
const FILL: Record<Level, string> = {
  0: 'fill-gray-200 dark:fill-white/[0.09]',
  1: 'fill-indigo-200 dark:fill-indigo-900',
  2: 'fill-indigo-400 dark:fill-indigo-600',
  3: 'fill-indigo-600 dark:fill-indigo-400',
};
const HEAD = 'fill-gray-300 dark:fill-white/[0.16]';
const HAIR = 'fill-gray-500 dark:fill-white/[0.05]';

// Which region each outline belongs to; unlisted parts (hands, knees, feet…) stay neutral.
const FRONT_REGIONS: Partial<Record<BodySlug, BodyRegion>> = {
  chest: 'chest',
  deltoids: 'frontDelts',
  biceps: 'biceps',
  triceps: 'triceps',
  forearm: 'forearms',
  abs: 'abs',
  obliques: 'obliques',
  quadriceps: 'quads',
  adductors: 'adductors',
  calves: 'calves',
  tibialis: 'tibialis',
  trapezius: 'traps',
  neck: 'neck',
};
const BACK_REGIONS: Partial<Record<BodySlug, BodyRegion>> = {
  neck: 'neck',
  trapezius: 'traps',
  deltoids: 'rearDelts',
  upperBack: 'upperBack',
  triceps: 'triceps',
  lowerBack: 'lowerBack',
  forearm: 'forearms',
  gluteal: 'glutes',
  adductors: 'adductors',
  hamstring: 'hamstrings',
  calves: 'calves',
};

/** Exercises that count: the ticked ones, or all of them for older workouts. */
export function workedMuscles(workout: Workout) {
  const done = workout.completedExerciseIds;
  const exercises = done ? workout.exercises.filter((e) => done.includes(e.id)) : workout.exercises;
  const byRegion = Object.fromEntries(BODY_REGIONS.map((r) => [r, 0])) as Record<BodyRegion, number>;
  const byMuscle = new Map<string, number>();
  exercises.forEach((e) =>
    (e.targetMuscles ?? []).forEach((m) => {
      byMuscle.set(m, (byMuscle.get(m) ?? 0) + 1);
      regionsFor(m).forEach((r) => {
        byRegion[r] += 1;
      });
    })
  );
  const muscles = Array.from(byMuscle.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);
  return { byRegion, muscles };
}

function Body({
  parts,
  viewBox,
  regions,
  level,
}: {
  parts: BodyPart[];
  viewBox: string;
  regions: Partial<Record<BodySlug, BodyRegion>>;
  level: (r: BodyRegion) => Level;
}) {
  return (
    <svg viewBox={viewBox} className="h-auto w-full" aria-hidden="true">
      {parts.map(({ slug, paths }) => {
        const region = regions[slug];
        const fill = slug === 'hair' ? HAIR : slug === 'head' ? HEAD : FILL[region ? level(region) : 0];
        return (
          <g key={slug} className={`${fill} transition-colors duration-300`}>
            {paths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

export function MuscleMap({ workout }: { workout: Workout }) {
  const { t, muscle, date } = useI18n();
  const { byRegion, muscles } = useMemo(() => workedMuscles(workout), [workout]);
  const max = Math.max(0, ...Object.values(byRegion));
  const level = (r: BodyRegion): Level => {
    const v = byRegion[r];
    if (!v || !max) return 0;
    const ratio = v / max;
    return ratio > 0.67 ? 3 : ratio > 0.34 ? 2 : 1;
  };
  // A muscle's swatch matches the darkest region it lights up on the body.
  const muscleLevel = (m: string) => Math.max(0, ...regionsFor(m).map(level)) as Level;

  if (!max) return null;
  const names = muscles.map(muscle);
  const shown = muscles.slice(0, 8);

  return (
    <section className="mt-5 border-t hairline pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="cap">{t('today.musclesTitle')}</p>
        <span className="truncate text-[12px] text-gray-400 dark:text-gray-500">
          {workout.name} · {date(workout.date, { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>

      <div className="mt-4 flex justify-center gap-[6%]" role="img" aria-label={t('today.musclesAria', { list: names.join(', ') })}>
        <figure className="w-[42%] max-w-[176px]">
          <Body parts={BODY_FRONT} viewBox={FRONT_VIEWBOX} regions={FRONT_REGIONS} level={level} />
          <figcaption className="mt-2 text-center text-[11px] text-gray-400 dark:text-gray-500">{t('today.front')}</figcaption>
        </figure>
        <figure className="w-[42%] max-w-[176px]">
          <Body parts={BODY_BACK} viewBox={BACK_VIEWBOX} regions={BACK_REGIONS} level={level} />
          <figcaption className="mt-2 text-center text-[11px] text-gray-400 dark:text-gray-500">{t('today.back')}</figcaption>
        </figure>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <ul className="flex flex-wrap gap-1.5" aria-hidden="true">
          {shown.map((m) => (
            <li
              key={m}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 py-0.5 pl-1.5 pr-2.5 text-[12px] text-gray-700 dark:border-white/10 dark:text-gray-300"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" className="flex-shrink-0">
                <circle cx="5" cy="5" r="5" className={FILL[muscleLevel(m)]} />
              </svg>
              {muscle(m)}
            </li>
          ))}
          {muscles.length > shown.length && (
            <li className="px-1 py-0.5 text-[12px] text-gray-400 dark:text-gray-500">+{muscles.length - shown.length}</li>
          )}
        </ul>
        <div className="flex flex-shrink-0 items-center gap-1 pb-1 text-[10px] text-gray-400 dark:text-gray-500" aria-hidden="true">
          <span>{t('today.legendLess')}</span>
          {([1, 2, 3] as Level[]).map((l) => (
            <svg key={l} width="10" height="10" viewBox="0 0 10 10">
              <rect width="10" height="10" rx="2.5" className={FILL[l]} />
            </svg>
          ))}
          <span>{t('today.legendMore')}</span>
        </div>
      </div>
    </section>
  );
}
