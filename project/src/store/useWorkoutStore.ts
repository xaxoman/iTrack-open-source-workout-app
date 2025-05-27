import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Exercise, Workout, WorkoutTemplate } from '../types/workout';

export interface NotificationSettings {
  enabled: boolean;
  days: string[];
  time: string;
}

export interface UserProfile {
  height: number; // in centimeters
  weight: number; // in kilograms
  bmi?: number;
  bmiCategory?: string;
}

interface WorkoutStore {
  workouts: Workout[];
  templates: WorkoutTemplate[];
  activeWorkout: Workout | null;
  isWorkoutActive: boolean;
  darkMode: boolean;
  notificationSettings: NotificationSettings;
  userProfile: UserProfile | null;
  addWorkout: (workout: Workout) => void;
  updateWorkout: (workout: Workout) => void;
  deleteWorkout: (id: string) => void;
  setActiveWorkout: (workout: Workout | null) => void;
  setIsWorkoutActive: (active: boolean) => void;
  toggleDarkMode: () => void;
  addTemplate: (template: WorkoutTemplate) => void;
  updateTemplate: (template: WorkoutTemplate) => void;
  deleteTemplate: (id: string) => void;
  updateNotificationSettings: (settings: NotificationSettings) => void;
  updateUserProfile: (profile: UserProfile) => void;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set) => ({
      workouts: [],
      templates: [],
      activeWorkout: null,
      isWorkoutActive: false,
      darkMode: false,
      notificationSettings: {
        enabled: true,
        days: ['monday', 'wednesday', 'friday'],
        time: '18:00'
      },
      userProfile: null,
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
      setIsWorkoutActive: (active) => set({ isWorkoutActive: active }),
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
      updateNotificationSettings: (settings) =>
        set({ notificationSettings: settings }),
      updateUserProfile: (profile) =>
        set({ userProfile: profile }),
    }),
    {
      name: 'workout-storage',
    }
  )
);