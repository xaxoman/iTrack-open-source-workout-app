export interface Exercise {
  id: string;
  name: string;
  sets: Set[];
  reps: number;
  type: 'reps' | 'time';
  videoUrl?: string;
  targetMuscles: string[];
  description?: string;
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
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  exercises: Omit<Exercise, 'sets'>[];
  numberOfSets: number; // New field to store the number of sets
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
