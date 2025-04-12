import { useState } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Plus, Calendar, Trash2, Play, Edit, Clock } from 'lucide-react';
import { CreateRoutineModal } from '../components/CreateRoutineModal';
import { EditTemplateModal } from '../components/EditTemplateModal';
import { ActiveWorkout } from '../components/ActiveWorkout';
import { WorkoutTemplate, Exercise } from '../types/workout';
import { formatTime } from '../utils/formatTime';

export function Workouts() {
  const { workouts, templates, deleteTemplate, addWorkout } = useWorkoutStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<WorkoutTemplate | null>(null);

  // Create exercises with sets
  const createExercisesWithSets = (template: WorkoutTemplate) => {
    const exercisesWithSets: Exercise[] = [];
    
    // Create a copy of each exercise for each set
    for (let setIndex = 0; setIndex < template.numberOfSets; setIndex++) {
      template.exercises.forEach(exercise => {
        exercisesWithSets.push({
          ...exercise,
          id: `${exercise.id}-set-${setIndex + 1}`, // Create unique ID for each exercise in each set
          name: `${exercise.name} (Set ${setIndex + 1})`, // Add set number to name
          sets: [] // Initialize empty sets array
        });
      });
    }
    
    return exercisesWithSets;
  };

  const handleStartWorkout = (template: WorkoutTemplate) => {
    // Create a copy of the template with expanded exercises based on sets
    const templateWithSets = {
      ...template,
      exercises: createExercisesWithSets(template)
    };
    setActiveTemplate(templateWithSets);
  };

  const handleCompleteWorkout = (duration: number, completionPercentage: number) => {
    if (activeTemplate) {
      const workout = {
        id: crypto.randomUUID(),
        name: activeTemplate.name,
        exercises: activeTemplate.exercises,
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

  // Sort workouts by date (newest first)
  const sortedWorkouts = [...workouts].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

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
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    <p>{template.exercises.length} exercises × {template.numberOfSets || 1} sets</p>
                    <p>Total: {template.exercises.length * (template.numberOfSets || 1)} exercises</p>
                  </div>
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
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
              {sortedWorkouts.map((workout) => (
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