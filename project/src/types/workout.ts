export interface Exercise {
  id: string;
  name: string;
  sets: Set[];
  reps: number;
  type: 'reps' | 'time';
  videoUrl?: string;
  targetMuscles: string[];
  description?: string;
  /** Which round of the routine this copy belongs to (1-based). Older workouts
   *  encode it in the id (`<id>-set-N`) and name (`Name (Set N)`) instead. */
  setNumber?: number;
}

export interface Set {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
}

export interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
  date: string;
  duration: number;
  completionPercentage: number;
  completed: boolean;
  /** Ids of the exercises ticked off during the session. Missing on workouts
   *  logged before per-exercise tracking existed. */
  completedExerciseIds?: string[];
  /** The routine this session was started from, when known. */
  templateId?: string;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: Omit<Exercise, 'sets'>[];
  numberOfSets: number; // New field to store the number of sets
}

/**
 * A Notion-style bookmark attached to a routine: either a video/link card
 * or a plain text note (e.g. "watch minute 5:17 for form").
 */
export interface RoutineBookmark {
  id: string;
  type: 'video' | 'note';
  /** For 'video': the URL. For 'note': the note text. */
  content: string;
  /** Link metadata fetched best-effort when the bookmark is added. */
  title?: string;
  author?: string;
  createdAt: string;
}

/** A piece of equipment the user owns, used to ground AI recommendations. */
export interface EquipmentItem {
  id: string;
  type: string; // e.g. 'Dumbbells', 'Kettlebell', 'Barbell', 'Bodyweight'
  maxWeight?: number; // kg — heaviest available for weighted equipment
  notes?: string;
}
/** A single body-weight measurement, one per calendar day. */
export interface WeightEntry {
  id: string;
  /** ISO date string of the measurement. */
  date: string;
  weightKg: number;
}
