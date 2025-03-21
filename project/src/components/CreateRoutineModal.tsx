import React, { useState, useRef, useEffect } from 'react';
import { X, Plus, GripVertical } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { WorkoutTemplate } from '../types/workout';
import { ExerciseForm } from './ExerciseForm';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface CreateRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExerciseData {
  id: string;
  name: string;
  reps: number;
  type: 'reps' | 'time';
  videoUrl: string;
  targetMuscles: string[];
  description: string;
}

export function CreateRoutineModal({ isOpen, onClose }: CreateRoutineModalProps) {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<ExerciseData[]>([]);
  const [numberOfSets, setNumberOfSets] = useState(1);
  const { addTemplate } = useWorkoutStore();
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
        reps: 1,
        type: 'reps',
        videoUrl: '',
        targetMuscles: [],
        description: '',
      },
    ]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const template: WorkoutTemplate = {
      id: crypto.randomUUID(),
      name,
      exercises: exercises.map(({ id, name, reps, type, videoUrl, targetMuscles, description }) => ({
        id,
        name,
        reps,
        type,
        videoUrl,
        targetMuscles,
        description,
      })),
      numberOfSets, // Include the number of sets in the template
    };
    addTemplate(template);
    onClose();
    setName('');
    setExercises([]);
    setNumberOfSets(1);
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
            Create New Routine
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-6">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Routine Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="sets"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Number of Sets
            </label>
            <input
              type="number"
              id="sets"
              min="1"
              max="10"
              value={numberOfSets}
              onChange={(e) => setNumberOfSets(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Each exercise will be repeated for {numberOfSets} {numberOfSets === 1 ? 'set' : 'sets'}
            </p>
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
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {exercises.map((exercise, index) => (
                      <Draggable key={exercise.id} draggableId={exercise.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={index === exercises.length - 1 ? 'ref-last-exercise' : ''}
                          >
                            <div className="bg-white dark:bg-gray-800 rounded-lg mb-4">
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
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
            >
              Create Routine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}