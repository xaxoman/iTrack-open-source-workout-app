import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, History, Plus, Sparkles, ArrowRight } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';

export function Home() {
  const navigate = useNavigate();
  const { workouts } = useWorkoutStore();
  const recentWorkouts = workouts.slice(-3).reverse();

  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome to FitTrack
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Track your workouts, achieve your goals
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button
            onClick={() => navigate('/workouts')}
            className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Play className="h-5 w-5 mr-2" />
            Start Workout
          </button>
          <button
            onClick={() => navigate('/workouts')}
            className="flex items-center px-6 py-3 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Routine
          </button>
        </div>
      </section>

      {/* AI Coach */}
      <section
        onClick={() => navigate('/coach')}
        className="group relative overflow-hidden rounded-2xl p-6 sm:p-7 cursor-pointer shadow-sm bg-gradient-to-br from-indigo-600 via-indigo-600 to-purple-600 transition-transform hover:scale-[1.01]"
      >
        {/* decorative glow */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-white">AI Coach</h2>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
                New
              </span>
            </div>
            <p className="mt-0.5 text-sm text-indigo-100">
              Analyze your progress and get a personalized workout — harder, easier, or just fresh.
            </p>
          </div>
          <div className="hidden sm:flex flex-shrink-0 items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-indigo-700 shadow-sm transition-colors group-hover:bg-indigo-50">
            Open Coach
            <ArrowRight className="h-4 w-4" />
          </div>
          <ArrowRight className="h-5 w-5 text-white sm:hidden flex-shrink-0" />
        </div>
      </section>

      <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Workouts
          </h2>
          <button
            onClick={() => navigate('/workouts')}
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center"
          >
            <History className="h-4 w-4 mr-1" />
            View All
          </button>
        </div>
        
        <div className="space-y-4">
          {recentWorkouts.length > 0 ? (
            recentWorkouts.map((workout) => (
              <div
                key={workout.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {workout.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(workout.date).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {workout.exercises.length} exercises
                </span>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              No recent workouts. Start your fitness journey today!
            </p>
          )}
        </div>
      </section>
    </div>
  );
}