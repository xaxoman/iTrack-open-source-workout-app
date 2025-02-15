import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, History, Plus } from 'lucide-react';
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