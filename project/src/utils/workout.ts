import type { Exercise, Workout, WorkoutTemplate } from '../types/workout';

const SET_SUFFIX = /\s*\(set\s*\d+\)\s*$/i;

/** Expand a routine into one exercise copy per set, in set order. */
export function expandTemplate(template: WorkoutTemplate): Exercise[] {
  const sets = Math.max(1, template.numberOfSets || 1);
  const exercises: Exercise[] = [];
  for (let set = 1; set <= sets; set++) {
    template.exercises.forEach((exercise) => {
      exercises.push({
        ...exercise,
        id: `${exercise.id}-set-${set}`,
        setNumber: set,
        sets: [],
      });
    });
  }
  return exercises;
}

/** Exercise name without the legacy " (Set N)" suffix. */
export function baseName(exercise: Pick<Exercise, 'name'>): string {
  return exercise.name.replace(SET_SUFFIX, '').trim();
}

/** 1-based set number, from the field or (older data) the id/name. */
export function setNumberOf(exercise: Pick<Exercise, 'id' | 'name' | 'setNumber'>): number {
  if (exercise.setNumber) return exercise.setNumber;
  const fromId = exercise.id.match(/-set-(\d+)$/);
  if (fromId) return Number(fromId[1]);
  const fromName = exercise.name.match(/\(set\s*(\d+)\)\s*$/i);
  return fromName ? Number(fromName[1]) : 1;
}

export interface SetGroup<T> {
  set: number;
  items: T[];
}

/** Group exercises by set number, keeping their original order. */
export function groupBySet<T extends Pick<Exercise, 'id' | 'name' | 'setNumber'>>(exercises: T[]): SetGroup<T>[] {
  const groups = new Map<number, T[]>();
  exercises.forEach((exercise) => {
    const set = setNumberOf(exercise);
    if (!groups.has(set)) groups.set(set, []);
    groups.get(set)!.push(exercise);
  });
  return Array.from(groups.entries())
    .sort(([a], [b]) => a - b)
    .map(([set, items]) => ({ set, items }));
}

export function completionFrom(completed: number, total: number): number {
  return total > 0 ? (completed / total) * 100 : 0;
}

/** Local calendar day as YYYY-MM-DD (not UTC). */
export function dayKey(value: Date | string): string {
  const d = new Date(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Monday 00:00 of the week containing `value`. */
export function startOfWeek(value: Date): Date {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - offset);
  return d;
}

/**
 * Consecutive days with a workout, counting back from today. A rest day today
 * doesn't break the streak until it's over.
 */
export function computeStreak(workouts: Workout[], today = new Date()): number {
  const days = new Set(workouts.map((w) => dayKey(w.date)));
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  let streak = 0;
  for (let i = 0; i < 366; i++) {
    if (days.has(dayKey(cursor))) {
      streak++;
    } else if (i > 0) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Workouts that belong to a routine (by id when recorded, else by name). */
export function workoutsForTemplate(template: WorkoutTemplate, workouts: Workout[]): Workout[] {
  return workouts.filter((w) => (w.templateId ? w.templateId === template.id : w.name === template.name));
}

export function latestWorkout(workouts: Workout[]): Workout | undefined {
  return workouts.reduce<Workout | undefined>(
    (latest, w) => (!latest || new Date(w.date) > new Date(latest.date) ? w : latest),
    undefined
  );
}

/**
 * The routine to suggest next: one never done yet, otherwise the one done
 * longest ago — a simple rotation through the user's plan.
 */
export function nextRoutine(templates: WorkoutTemplate[], workouts: Workout[]) {
  let best: { template: WorkoutTemplate; last?: Workout } | null = null;
  for (const template of templates) {
    const last = latestWorkout(workoutsForTemplate(template, workouts));
    if (!last) return { template, last: undefined };
    if (!best || (best.last && new Date(last.date) < new Date(best.last.date))) {
      best = { template, last };
    }
  }
  return best;
}
