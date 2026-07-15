import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [numberOfSets, setNumberOfSets] = useState(template.numberOfSets || 1);
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
      numberOfSets,
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

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-panel max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 flex items-center justify-between p-4 border-b border-gray-100 dark:border-white/[0.07] rounded-t-2xl">
          <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
            Edit Template
          </h2>
          <button onClick={onClose} className="icon-btn">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-6">
            <label className="label">
              Template Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
            />
          </div>

          <div className="mb-6">
            <label
              htmlFor="edit-sets"
              className="label"
            >
              Number of Sets
            </label>
            <input
              type="number"
              id="edit-sets"
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
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                    {exercises.map((exercise, index) => (
                      <Draggable key={exercise.id} draggableId={exercise.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={index === exercises.length - 1 ? 'ref-last-exercise' : ''}
                          >
                            <div>
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}