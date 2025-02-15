import React from 'react';
import { LineChart as LineChartIcon, Calendar, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useWorkoutStore } from '../store/useWorkoutStore';

export function Progress() {
  const { workouts } = useWorkoutStore();

  // Sample data - in a real app, you'd process workout data to create these stats
  const monthlyData = [
    { month: 'Jan', workouts: 12 },
    { month: 'Feb', workouts: 15 },
    { month: 'Mar', workouts: 18 },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progress</h1>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              This Month
            </h2>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {workouts.length}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total workouts</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Streak
            </h2>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">5</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Days in a row</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <LineChartIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Progress
            </h2>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">+15%</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">From last month</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Workout Frequency
        </h2>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="workouts"
                stroke="#4f46e5"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}