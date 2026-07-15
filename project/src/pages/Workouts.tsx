import { useState } from 'react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { Plus, Calendar, Trash2, Play, Edit, Clock, ClipboardList, History as HistoryIcon } from 'lucide-react';
import { CreateRoutineModal } from '../components/CreateRoutineModal';
import { EditTemplateModal } from '../components/EditTemplateModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { ActiveWorkout } from '../components/ActiveWorkout';
import { WorkoutTemplate, Exercise } from '../types/workout';
import { formatTime } from '../utils/formatTime';

export function Workouts() {
  const { workouts, templates, deleteTemplate, addWorkout, setIsWorkoutActive } = useWorkoutStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<(WorkoutTemplate & { exercises: Exercise[] }) | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    isOpen: boolean;
    templateId: string | null;
    templateName: string;
  }>({
    isOpen: false,
    templateId: null,
    templateName: ''
  });

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
    setIsWorkoutActive(true);
  };

  const handleDeleteClick = (template: WorkoutTemplate) => {
    setDeleteConfirmModal({
      isOpen: true,
      templateId: template.id,
      templateName: template.name
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmModal.templateId) {
      deleteTemplate(deleteConfirmModal.templateId);
    }
    setDeleteConfirmModal({
      isOpen: false,
      templateId: null,
      templateName: ''
    });
  };

  const handleCancelDelete = () => {
    setDeleteConfirmModal({
      isOpen: false,
      templateId: null,
      templateName: ''
    });
  };

  const handleCompleteWorkout = (duration: number, completionPercentage: number) => {
    if (activeTemplate) {
      // Only log workouts with actual progress. A 0% workout (quit before
      // completing any exercise) shouldn't clutter the history or skew stats.
      if (completionPercentage > 0) {
        const workout = {
          id: crypto.randomUUID(),
          name: activeTemplate.name,
          exercises: activeTemplate.exercises, // These already have sets from createExercisesWithSets
          date: new Date().toISOString(),
          duration,
          completionPercentage,
          completed: true,
        };
        addWorkout(workout);
      }
      setActiveTemplate(null);
      setIsWorkoutActive(false);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Workouts</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Create Routine
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <section className="card p-6">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-4">
            Templates
          </h2>
          {templates.length > 0 ? (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-xl border border-gray-200/70 p-4 transition-colors hover:border-gray-300 dark:border-white/[0.07] dark:hover:border-white/[0.14]"
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {template.name}
                    </h3>
                    <div className="flex flex-shrink-0 gap-1">
                      <button
                        onClick={() => handleStartWorkout(template)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-indigo-600 transition-colors hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
                        title="Start Workout"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingTemplate(template)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                        title="Edit Template"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(template)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                        title="Delete Template"
                      >
                        <Trash2 className="h-4 w-4" />
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
            <div className="py-8 text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                <ClipboardList className="h-6 w-6" />
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No templates yet. Create one to get started!
              </p>
            </div>
          )}
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white mb-4">
            History
          </h2>
          {workouts.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
              {sortedWorkouts.map((workout) => (
                <div
                  key={workout.id}
                  className="rounded-xl border border-gray-200/70 p-4 dark:border-white/[0.07]"
                >
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate">
                      {workout.name}
                    </h3>
                    <div className="flex flex-shrink-0 items-center text-sm text-gray-500 dark:text-gray-400">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(workout.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {formatTime(workout.duration)}
                    </div>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                      {Math.round(workout.completionPercentage)}% completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                <HistoryIcon className="h-6 w-6" />
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No workout history yet. Start your first workout!
              </p>
            </div>
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

      <ConfirmDeleteModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        message={`Do you really want to delete the workout "${deleteConfirmModal.templateName}"?`}
      />
    </div>
  );
}