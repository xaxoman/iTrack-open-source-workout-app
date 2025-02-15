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
}