import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-panel max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/[0.07] rounded-t-2xl">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
            Create New Routine
          </h2>
          <button
            onClick={onClose}
            className="icon-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-6">
            <label
              htmlFor="name"
              className="label"
            >
              Routine Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder='Enter routine name'
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="sets"
              className="label"
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
              className="input"
              required
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Each exercise will be repeated for {numberOfSets} {numberOfSets === 1 ? 'set' : 'sets'}
            </p>
          </div>

          <div className="mb-6">
            <div className="sticky top-[65px] bg-white dark:bg-gray-900 z-10 flex justify-between items-center py-4">
              <h3 className="text-base font-semibold tracking-tight text-gray-900 dark:text-white">Exercises</h3>
              <button
                type="button"
                onClick={addExercise}
                className="btn-primary px-3 py-1.5 text-sm"
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
                            ref={index === exercises.length - 1 ? lastExerciseRef : provided.innerRef}
                            {...provided.draggableProps}
                            className="mb-3"
                          >
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
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>

          <div className="sticky bottom-0 bg-white dark:bg-gray-900 flex justify-end space-x-3 border-t border-gray-100 dark:border-white/[0.07] py-4">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
            >
              Create Routine
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}