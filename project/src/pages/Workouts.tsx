import React, { useState } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Plus, Calendar, Trash2, Play, Edit, Clock } from 'lucide-react';
import { CreateRoutineModal } from '../components/CreateRoutineModal';
import { EditTemplateModal } from '../components/EditTemplateModal';
import { ActiveWorkout } from '../components/ActiveWorkout';
import { WorkoutTemplate } from '../types/workout';
import { formatTime } from '../utils/formatTime';

export function Workouts() {
  const { workouts, templates, deleteTemplate, addWorkout } = useWorkoutStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<WorkoutTemplate | null>(null);

  const handleStartWorkout = (template: WorkoutTemplate) => {
    setActiveTemplate(template);
  };

  const handleCompleteWorkout = (duration: number, completionPercentage: number) => {
    if (activeTemplate) {
      const workout = {
        id: crypto.randomUUID(),
        name: activeTemplate.name,
        exercises: activeTemplate.exercises.map(ex => ({
          ...ex,
          sets: [],
        })),
        date: new Date().toISOString(),
        duration,
        completionPercentage,
        completed: true,
      };
      addWorkout(workout);
      setActiveTemplate(null);
    }
  };

  if (activeTemplate) {
    return (
      <ActiveWorkout
        name={activeTemplate.name}
        exercises={activeTemplate.exercises}
        onComplete={handleCompleteWorkout}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workouts</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Routine
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Templates
          </h2>
          {templates.length > 0 ? (
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleStartWorkout(template)}
                        className="p-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                        title="Start Workout"
                      >
                        <Play className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setEditingTemplate(template)}
                        className="p-1 text-gray-600 hover:text-gray-700 dark:text-gray-400"
                        title="Edit Template"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="p-1 text-red-600 hover:text-red-700 dark:text-red-400"
                        title="Delete Template"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {template.exercises.length} exercises
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No templates yet. Create one to get started!
            </p>
          )}
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            History
          </h2>
          {workouts.length > 0 ? (
            <div className="space-y-4">
              {workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {workout.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(workout.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTime(workout.duration)}
                    </div>
                    <div>
                      Completed: {Math.round(workout.completionPercentage)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No workout history yet. Start your first workout!
            </p>
          )}
        </section>
      </div>

      <CreateRoutineModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {editingTemplate && (
        <EditTemplateModal
          template={editingTemplate}
          isOpen={true}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
}