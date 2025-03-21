import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Exercise, Workout, WorkoutTemplate } from '../types/workout';

interface WorkoutStore {
  workouts: Workout[];
  templates: WorkoutTemplate[];
  activeWorkout: Workout | null;
  darkMode: boolean;
  addWorkout: (workout: Workout) => void;
  updateWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
  setActiveWorkout: (workout: Workout | null) => void;
  toggleDarkMode: () => void;
  addTemplate: (template: WorkoutTemplate) => void;
  updateTemplate: (template: WorkoutTemplate) => void;
  deleteTemplate: (id: string) => void;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set) => ({
      workouts: [],
      templates: [],
      activeWorkout: null,
      darkMode: false,
      addWorkout: (workout) =>
        set((state) => ({ workouts: [...state.workouts, workout] })),
      updateWorkout: (workout) =>
        set((state) => ({
          workouts: state.workouts.map((w) => (w.id === workout.id ? workout : w)),
        })),
      deleteWorkout: (id) =>
        set((state) => ({
          workouts: state.workouts.filter((w) => w.id !== id),
        })),
      setActiveWorkout: (workout) => set({ activeWorkout: workout }),
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      addTemplate: (template) =>
        set((state) => ({
          templates: [...state.templates, {
            ...template,
            numberOfSets: template.numberOfSets || 1 // Default to 1 if not provided
          }],
        })),
      updateTemplate: (template) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === template.id ? {
              ...template,
              numberOfSets: template.numberOfSets || 1 // Default to 1 if not provided
            } : t
          ),
        })),
      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'workout-storage',
    }
  )
);