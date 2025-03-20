import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, GripVertical } from 'lucide-react';
import { WorkoutTemplate } from '../types/workout';
import { ExerciseForm } from './ExerciseForm';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface EditTemplateModalProps {
  template: WorkoutTemplate;
  isOpen: boolean;
  onClose: () => void;
}

export function EditTemplateModal({ template, isOpen, onClose }: EditTemplateModalProps) {
  const [name, setName] = useState(template.name);
  const [exercises, setExercises] = useState(template.exercises);
  const { updateTemplate } = useWorkoutStore();
  const lastExerciseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (lastExerciseRef.current) {
      lastExerciseRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [exercises.length]);

  if (!isOpen) return null;

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        id: crypto.randomUUID(),
        name: '',
        reps: 0,
        type: 'reps',
        videoUrl: '',
        targetMuscles: [],
        description: '',
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTemplate({
      ...template,
      name,
      exercises,
    });
    onClose();
  };

  const updateExercise = (id: string, field: string, value: string | string[] | number) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    );
  };

  const removeExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(exercises);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setExercises(items);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 z-10 flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Edit Template
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
              required
            />
          </div>

          <div className="mb-6">
            <div className="sticky top-[73px] bg-white dark:bg-gray-800 z-10 flex justify-between items-center py-4 px-6 shadow-sm">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Exercises</h3>
              <button
                type="button"
                onClick={addExercise}
                className="flex items-center px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Exercise
              </button>
            </div>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="exercises">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {exercises.map((exercise, index) => (
                      <Draggable key={exercise.id} draggableId={exercise.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={index === exercises.length - 1 ? 'ref-last-exercise' : ''}
                          >
                            <div className="bg-white dark:bg-gray-800 rounded-lg">
                              <div className="flex items-start">
                                <div
                                  {...provided.dragHandleProps}
                                  className="p-4 cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="h-5 w-5 text-gray-400" />
                                </div>
                                <div className="flex-1">
                                  <ExerciseForm
                                    exercise={exercise}
                                    onChange={(field, value) => updateExercise(exercise.id, field, value)}
                                    onRemove={() => removeExercise(exercise.id)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          <div className="sticky bottom-0 bg-white dark:bg-gray-800 flex justify-end space-x-3 border-t dark:border-gray-700 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}