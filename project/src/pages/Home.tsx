import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, History, Plus, Sparkles, ArrowRight, Dumbbell } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';

export function Home() {
  const navigate = useNavigate();
  const { workouts } = useWorkoutStore();
  const recentWorkouts = workouts.slice(-3).reverse();

  return (
    <div className="space-y-6">
      <section className="text-center py-10 sm:py-14">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-gray-900 dark:text-white mb-4">
          Welcome to FitTrack
        </h1>
        <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 mb-8">
          Track your workouts, achieve your goals
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => navigate('/workouts')}
            className="btn-primary px-6 py-3"
          >
            <Play className="h-5 w-5" />
            Start Workout
          </button>
          <button
            onClick={() => navigate('/workouts')}
            className="btn-secondary px-6 py-3"
          >
            <Plus className="h-5 w-5" />
            Create Routine
          </button>
        </div>
      </section>

      {/* AI Coach */}
      <section
        onClick={() => navigate('/coach')}
        className="group relative overflow-hidden rounded-2xl p-6 sm:p-7 cursor-pointer bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-600/20 transition-transform hover:scale-[1.01]"
      >
        {/* decorative glow */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-white">AI Coach</h2>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                New
              </span>
            </div>
            <p className="mt-0.5 text-sm text-indigo-100">
              Analyze your progress and get a personalized workout — harder, easier, or just fresh.
            </p>
          </div>
          <div className="hidden sm:flex flex-shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm transition-colors group-hover:bg-indigo-50">
            Open Coach
            <ArrowRight className="h-4 w-4" />
          </div>
          <ArrowRight className="h-5 w-5 text-white sm:hidden flex-shrink-0" />
        </div>
      </section>

      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
            Recent Workouts
          </h2>
          <button
            onClick={() => navigate('/workouts')}
            className="link flex items-center gap-1.5"
          >
            <History className="h-4 w-4" />
            View All
          </button>
        </div>

        {recentWorkouts.length > 0 ? (
          <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {recentWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="icon-chip">
                    <Dumbbell className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {workout.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(workout.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="flex-shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {workout.exercises.length} exercises
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
              <Dumbbell className="h-6 w-6" />
            </span>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No recent workouts. Start your fitness journey today!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
