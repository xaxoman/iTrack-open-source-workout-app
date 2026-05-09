import { useMemo } from 'react';
import { LineChart as LineChartIcon, Calendar, TrendingUp, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useWorkoutStore } from '../store/useWorkoutStore';
import type { Workout } from '../types/workout';
import { formatTime } from '../utils/formatTime';

interface CompletionTrendPoint {
  label: string;
  completion: number;
  trackedWorkouts: number;
  trend: number | null;
}

function getLatestWorkoutsByName(periodWorkouts: Workout[]) {
  const latestByName = new Map<string, Workout>();

  periodWorkouts.forEach((workout) => {
    const existingWorkout = latestByName.get(workout.name);

    if (!existingWorkout || new Date(workout.date).getTime() > new Date(existingWorkout.date).getTime()) {
      latestByName.set(workout.name, workout);
    }
  });

  return Array.from(latestByName.values());
}

function buildCompletionTrendData(
  points: Array<Omit<CompletionTrendPoint, 'trend'>>
): CompletionTrendPoint[] {
  return points.map((point, index) => ({
    ...point,
    trend: index === 0 ? null : point.completion - points[index - 1].completion,
  }));
}

export function Progress() {
  const { workouts } = useWorkoutStore();

  // Calculate real statistics from workout data
  const stats = useMemo(() => {
    if (!workouts.length) {
      return {
        thisMonth: 0,
        totalWorkouts: 0,
        averageDuration: 0,
        averageCompletion: 0,
        streak: 0,
        weeklyData: [],
        monthlyData: [],
        completionData: [],
        mostActiveDay: 'No data'
      };
    }

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    // Filter workouts for this month
    const thisMonthWorkouts = workouts.filter(workout => {
      const workoutDate = new Date(workout.date);
      return workoutDate.getMonth() === thisMonth && workoutDate.getFullYear() === thisYear;
    });

    // Calculate average duration
    const averageDuration = workouts.reduce((sum, workout) => sum + workout.duration, 0) / workouts.length;

    // Calculate average completion percentage
    const averageCompletion = workouts.reduce((sum, workout) => sum + workout.completionPercentage, 0) / workouts.length;

    // Calculate streak (consecutive days with workouts)
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i++) { // Check last 30 days
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() - i);
      
      const hasWorkout = sortedWorkouts.some(workout => {
        const workoutDate = new Date(workout.date);
        workoutDate.setHours(0, 0, 0, 0);
        return workoutDate.getTime() === checkDate.getTime();
      });

      if (hasWorkout) {
        streak++;
      } else if (i > 0) { // Don't break on first day if no workout today
        break;
      }
    }

    // Generate weekly completion trend for the last 8 weeks using the latest completion per workout name.
    const weeklyData = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekWorkouts = workouts.filter(workout => {
        const workoutDate = new Date(workout.date);
        return workoutDate >= weekStart && workoutDate <= weekEnd;
      });

      const latestWeekWorkouts = getLatestWorkoutsByName(weekWorkouts);
      const averageWeekCompletion = latestWeekWorkouts.length
        ? latestWeekWorkouts.reduce((sum, workout) => sum + workout.completionPercentage, 0) / latestWeekWorkouts.length
        : 0;

      weeklyData.push({
        label: `Week ${8 - i}`,
        completion: averageWeekCompletion,
        trackedWorkouts: latestWeekWorkouts.length,
      });
    }

    // Generate monthly completion trend for the last 6 months using the latest completion per workout name.
    const monthlyData = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date();
      monthDate.setMonth(monthDate.getMonth() - i);
      const month = monthDate.getMonth();
      const year = monthDate.getFullYear();

      const monthWorkouts = workouts.filter(workout => {
        const workoutDate = new Date(workout.date);
        return workoutDate.getMonth() === month && workoutDate.getFullYear() === year;
      });

      const latestMonthWorkouts = getLatestWorkoutsByName(monthWorkouts);
      const averageMonthCompletion = latestMonthWorkouts.length
        ? latestMonthWorkouts.reduce((sum, workout) => sum + workout.completionPercentage, 0) / latestMonthWorkouts.length
        : 0;

      monthlyData.push({
        label: monthNames[month],
        completion: averageMonthCompletion,
        trackedWorkouts: latestMonthWorkouts.length,
      });
    }

    // Completion percentage distribution
    const completionRanges = [
      { range: '0-25%', count: 0, color: '#ef4444' },
      { range: '26-50%', count: 0, color: '#f97316' },
      { range: '51-75%', count: 0, color: '#eab308' },
      { range: '76-100%', count: 0, color: '#22c55e' }
    ];

    workouts.forEach(workout => {
      if (workout.completionPercentage <= 25) completionRanges[0].count++;
      else if (workout.completionPercentage <= 50) completionRanges[1].count++;
      else if (workout.completionPercentage <= 75) completionRanges[2].count++;
      else completionRanges[3].count++;
    });

    // Find most active day of the week
    const dayCount = [0, 0, 0, 0, 0, 0, 0]; // Sunday to Saturday
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    workouts.forEach(workout => {
      const day = new Date(workout.date).getDay();
      dayCount[day]++;
    });

    const mostActiveDayIndex = dayCount.indexOf(Math.max(...dayCount));
    const mostActiveDay = dayNames[mostActiveDayIndex];

    return {
      thisMonth: thisMonthWorkouts.length,
      totalWorkouts: workouts.length,
      averageDuration,
      averageCompletion,
      streak,
      weeklyData: buildCompletionTrendData(weeklyData),
      monthlyData: buildCompletionTrendData(monthlyData),
      completionData: completionRanges,
      mostActiveDay
    };
  }, [workouts]);

  if (workouts.length === 0) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progress</h1>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 shadow-sm text-center">
          <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Workout Data Yet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Start completing workouts to see your progress statistics, trends, and achievements here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Progress</h1>

      {/* Main Statistics Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              This Month
            </h2>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {stats.thisMonth}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {stats.thisMonth === 1 ? 'Workout completed' : 'Workouts completed'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Streak
            </h2>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.streak}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {stats.streak === 1 ? 'Day in a row' : 'Days in a row'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-center space-x-2 mb-4">
            <LineChartIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Avg. Completion
            </h2>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">
            {Math.round(stats.averageCompletion)}%
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Average completion rate</p>
        </div>
      </div>

      {/* Secondary Statistics */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Total Workouts:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.totalWorkouts}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Average Duration:</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatTime(stats.averageDuration)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Most Active Day:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.mostActiveDay}</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Completion Rate Distribution
          </h3>
          <div className="space-y-3">
            {stats.completionData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="text-gray-600 dark:text-gray-400">{item.range}</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {item.count} {item.count === 1 ? 'workout' : 'workouts'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Weekly Completion Trend
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Latest completion percentage recorded for each workout routine in that week.
          </p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="label" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  className="text-xs"
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${Math.round(value)}%`, 'Latest completion avg.']}
                  labelFormatter={(label, payload) => {
                    const point = payload?.[0]?.payload as CompletionTrendPoint | undefined;

                    if (!point) {
                      return label;
                    }

                    const trendText = point.trend === null
                      ? 'Starting point'
                      : `${point.trend >= 0 ? '+' : ''}${Math.round(point.trend)} pts vs previous week`;

                    return `${label} | ${point.trackedWorkouts} workout${point.trackedWorkouts === 1 ? '' : 's'} | ${trendText}`;
                  }}
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg, #374151)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--tooltip-text, white)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="completion"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Monthly Completion Trend
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Latest completion percentage recorded for each workout routine in that month.
          </p>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="label" 
                  className="text-xs"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  className="text-xs"
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`${Math.round(value)}%`, 'Latest completion avg.']}
                  labelFormatter={(label, payload) => {
                    const point = payload?.[0]?.payload as CompletionTrendPoint | undefined;

                    if (!point) {
                      return label;
                    }

                    const trendText = point.trend === null
                      ? 'Starting point'
                      : `${point.trend >= 0 ? '+' : ''}${Math.round(point.trend)} pts vs previous month`;

                    return `${label} | ${point.trackedWorkouts} workout${point.trackedWorkouts === 1 ? '' : 's'} | ${trendText}`;
                  }}
                  contentStyle={{
                    backgroundColor: 'var(--tooltip-bg, #374151)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--tooltip-text, white)'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="completion"
                  stroke="#059669"
                  strokeWidth={3}
                  dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}