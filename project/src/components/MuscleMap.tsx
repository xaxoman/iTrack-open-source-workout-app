import { useMemo } from 'react';
import { useI18n } from '../i18n';
import type { Workout } from '../types/workout';
import { BODY_REGIONS, regionsFor, type BodyRegion } from '../utils/muscles';

/**
 * Front/back body silhouette with the muscles a workout trained, shaded by how
 * many completed sets hit each one (single-hue sequential scale).
 */

type Level = 0 | 1 | 2 | 3;

// Sequential indigo ramp: light → dark in light mode; flipped anchor in dark mode.
const FILL: Record<Level, string> = {
  0: 'fill-gray-200 dark:fill-white/10',
  1: 'fill-indigo-200 dark:fill-indigo-900',
  2: 'fill-indigo-400 dark:fill-indigo-600',
  3: 'fill-indigo-600 dark:fill-indigo-400',
};
const STROKE: Record<Level, string> = {
  0: 'stroke-gray-200 dark:stroke-white/10',
  1: 'stroke-indigo-200 dark:stroke-indigo-900',
  2: 'stroke-indigo-400 dark:stroke-indigo-600',
  3: 'stroke-indigo-600 dark:stroke-indigo-400',
};
const BASE_FILL = 'fill-gray-100 dark:fill-white/[0.05]';
const BASE_STROKE = 'stroke-gray-100 dark:stroke-white/[0.05]';

const mx = (x: number) => 120 - x; // mirror across the body's centre line

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

function Silhouette() {
  return (
    <g>
      <ellipse cx={60} cy={17} rx={10} ry={12} className={BASE_FILL} />
      <rect x={54} y={27} width={12} height={9} rx={3} className={BASE_FILL} />
      <path d="M42 37 Q60 33 78 37 Q87 40 86 52 L81 96 Q80 106 79 113 L41 113 Q40 106 39 96 L34 52 Q33 40 42 37 Z" className={BASE_FILL} />
      {[1, -1].map((side) => {
        const x = (v: number) => (side === 1 ? v : mx(v));
        return (
          <g key={side} strokeLinecap="round" className={BASE_STROKE}>
            <line x1={x(35)} y1={45} x2={x(28)} y2={80} strokeWidth={12} />
            <line x1={x(28)} y1={83} x2={x(23)} y2={113} strokeWidth={10} />
            <circle cx={x(22)} cy={120} r={5} className={BASE_FILL} stroke="none" />
            <line x1={x(51)} y1={118} x2={x(49)} y2={163} strokeWidth={18} />
            <line x1={x(49)} y1={169} x2={x(48)} y2={208} strokeWidth={12} />
            <ellipse cx={x(47)} cy={216} rx={7} ry={3.5} className={BASE_FILL} stroke="none" />
          </g>
        );
      })}
    </g>
  );
}

/** A limb muscle drawn as a rounded capsule. */
function Capsule({ x1, y1, x2, y2, w, level }: { x1: number; y1: number; x2: number; y2: number; w: number; level: Level }) {
  return (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={w} strokeLinecap="round" className={STROKE[level]} />
      <line x1={mx(x1)} y1={y1} x2={mx(x2)} y2={y2} strokeWidth={w} strokeLinecap="round" className={STROKE[level]} />
    </>
  );
}

function Front({ level }: { level: (r: BodyRegion) => Level }) {
  const abs = level('abs');
  return (
    <svg viewBox="0 0 120 224" className="h-auto w-full" aria-hidden="true">
      <Silhouette />
      <ellipse cx={38} cy={46} rx={6.5} ry={7} className={FILL[level('frontDelts')]} />
      <ellipse cx={mx(38)} cy={46} rx={6.5} ry={7} className={FILL[level('frontDelts')]} />
      <path d="M42 47 Q50 42 59 45 L59 61 Q50 65 43 59 Q40 53 42 47 Z" className={FILL[level('chest')]} />
      <path d="M78 47 Q70 42 61 45 L61 61 Q70 65 77 59 Q80 53 78 47 Z" className={FILL[level('chest')]} />
      <Capsule x1={33} y1={55} x2={29.5} y2={75} w={8} level={level('biceps')} />
      <Capsule x1={27} y1={88} x2={24} y2={108} w={7} level={level('forearms')} />
      {[66, 74, 82].map((y) => (
        <g key={y}>
          <rect x={53.5} y={y} width={6} height={7} rx={1.8} className={FILL[abs]} />
          <rect x={60.5} y={y} width={6} height={7} rx={1.8} className={FILL[abs]} />
        </g>
      ))}
      <rect x={53.5} y={90} width={13} height={8} rx={3} className={FILL[abs]} />
      <path d="M44 64 Q47 63 51.5 66 L51.5 97 L47 98 Q43.5 82 44 64 Z" className={FILL[level('obliques')]} />
      <path d="M76 64 Q73 63 68.5 66 L68.5 97 L73 98 Q76.5 82 76 64 Z" className={FILL[level('obliques')]} />
      <Capsule x1={51.5} y1={124} x2={49.5} y2={158} w={13} level={level('quads')} />
      <Capsule x1={57.5} y1={121} x2={57} y2={140} w={4} level={level('adductors')} />
      <Capsule x1={45.5} y1={176} x2={46.5} y2={198} w={5} level={level('calves')} />
    </svg>
  );
}

function Back({ level }: { level: (r: BodyRegion) => Level }) {
  return (
    <svg viewBox="0 0 120 224" className="h-auto w-full" aria-hidden="true">
      <Silhouette />
      <path d="M60 30 L73 40 Q66 50 60 70 Q54 50 47 40 Z" className={FILL[level('traps')]} />
      <ellipse cx={38} cy={46} rx={6.5} ry={7} className={FILL[level('rearDelts')]} />
      <ellipse cx={mx(38)} cy={46} rx={6.5} ry={7} className={FILL[level('rearDelts')]} />
      <Capsule x1={32.5} y1={54} x2={29.5} y2={76} w={8} level={level('triceps')} />
      <Capsule x1={27} y1={88} x2={24} y2={108} w={7} level={level('forearms')} />
      <path d="M43 50 Q46 47 52 52 Q56 62 57 78 L56 92 Q49 90 46 86 Q41 70 43 50 Z" className={FILL[level('lats')]} />
      <path d="M77 50 Q74 47 68 52 Q64 62 63 78 L64 92 Q71 90 74 86 Q79 70 77 50 Z" className={FILL[level('lats')]} />
      <path d="M54 80 L66 80 L68 100 Q60 103 52 100 Z" className={FILL[level('lowerBack')]} />
      <ellipse cx={52} cy={113} rx={8.5} ry={8} className={FILL[level('glutes')]} />
      <ellipse cx={mx(52)} cy={113} rx={8.5} ry={8} className={FILL[level('glutes')]} />
      <Capsule x1={51} y1={130} x2={49.5} y2={158} w={12} level={level('hamstrings')} />
      <ellipse cx={48.5} cy={182} rx={5.5} ry={11} className={FILL[level('calves')]} />
      <ellipse cx={mx(48.5)} cy={182} rx={5.5} ry={11} className={FILL[level('calves')]} />
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

  if (!max) return null;
  const names = muscles.map(muscle);

  return (
    <section className="mt-5 border-t hairline pt-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="cap">{t('today.musclesTitle')}</p>
        <span className="truncate text-[12px] text-gray-400 dark:text-gray-500">
          {workout.name} · {date(workout.date, { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_1fr_1.2fr] items-start gap-3" role="img" aria-label={t('today.musclesAria', { list: names.join(', ') })}>
        <figure>
          <Front level={level} />
          <figcaption className="mt-1 text-center text-[11px] text-gray-400 dark:text-gray-500">{t('today.front')}</figcaption>
        </figure>
        <figure>
          <Back level={level} />
          <figcaption className="mt-1 text-center text-[11px] text-gray-400 dark:text-gray-500">{t('today.back')}</figcaption>
        </figure>
        <div className="pt-2">
          <ul className="space-y-1 text-[13px] text-gray-900 dark:text-white">
            {names.slice(0, 6).map((n, i) => (
              <li key={n} className={`truncate ${i < 2 ? 'font-semibold' : ''}`}>
                {n}
              </li>
            ))}
            {names.length > 6 && <li className="text-gray-400 dark:text-gray-500">+{names.length - 6}</li>}
          </ul>
          <div className="mt-4 flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500" aria-hidden="true">
            <span>{t('today.legendLess')}</span>
            {([1, 2, 3] as Level[]).map((l) => (
              <svg key={l} width="10" height="10" viewBox="0 0 10 10">
                <rect width="10" height="10" rx="2.5" className={FILL[l]} />
              </svg>
            ))}
            <span>{t('today.legendMore')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
