import React, { useRef, useState, useEffect } from 'react';
import { X, ChevronDown, Check, ChevronRight } from 'lucide-react';

interface ExerciseFormProps {
  exercise: {
    name: string;
    reps: number;
    type: 'reps' | 'time';
    videoUrl?: string;
    targetMuscles: string[];
    description: string;
  };
  onChange: (field: string, value: string | string[] | number) => void;
  onRemove: () => void;
}

export function ExerciseForm({ exercise, onChange, onRemove }: ExerciseFormProps) {
  const muscleGroups = [
    'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps',
    'Legs', 'Core', 'Glutes', 'Calves', 'Forearms'
  ];
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? 1 : Math.max(1, parseInt(e.target.value, 10));
    onChange('reps', value);
  };

  const toggleMuscleSelection = (muscle: string) => {
    const isSelected = exercise.targetMuscles.includes(muscle);
    const newMuscles = isSelected
      ? exercise.targetMuscles.filter(m => m !== muscle)
      : [...exercise.targetMuscles, muscle];
    
    onChange('targetMuscles', newMuscles);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Create a summary of the exercise
  const exerciseSummary = () => {
    const parts = [];
    
    if (exercise.type === 'reps') {
      parts.push(`${exercise.reps} reps`);
    } else {
      parts.push(`${exercise.reps} seconds`);
    }
    
    if (exercise.targetMuscles.length > 0) {
      parts.push(exercise.targetMuscles.join(', '));
    }
    
    return parts.join(' • ');
  };

  return (
    <div className={`rounded-xl border border-gray-200/70 bg-white dark:border-white/[0.08] dark:bg-gray-900 transition-all duration-200 ${isExpanded ? 'p-4' : 'p-3'}`}>
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={toggleExpand}
      >
        <div className="flex items-center flex-1">
          {isExpanded ? 
            <ChevronDown className="h-5 w-5 text-gray-500 mr-2" /> : 
            <ChevronRight className="h-5 w-5 text-gray-500 mr-2" />
          }
          <div>
            <h3 className="text-base font-medium text-gray-900 dark:text-white truncate">
              {exercise.name || 'Untitled Exercise'}
            </h3>
            {!isExpanded && exercise.name && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {exerciseSummary()}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();  // Prevent toggleExpand from being called
            onRemove();
          }}
          className="ml-2 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 mt-4">
          <div>
            <label className="label">
              Exercise Name
            </label>
            <input
              type="text"
              value={exercise.name}
              onChange={(e) => onChange('name', e.target.value)}
              className="input"
              placeholder='e.g., "Push Up"'
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">
                Type
              </label>
              <select
                value={exercise.type}
                onChange={(e) => onChange('type', e.target.value)}
                className="input"
              >
                <option value="reps">Repetitions</option>
                <option value="time">Time</option>
              </select>
            </div>
            <div>
              <label className="label">
                {exercise.type === 'reps' ? 'Repetitions' : 'Time (seconds)'}
              </label>
              <input
                type="number"
              
                value={exercise.reps || 1}
                onChange={handleNumberChange}
                className="input"
                required
              />
            </div>
          </div>
          <div>
            <label className="label">
              Video or GIF URL (YouTube or image link)
            </label>
            <input
              type="url"
              value={exercise.videoUrl || ''}
              onChange={(e) => onChange('videoUrl', e.target.value)}
              className="input"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="label">
              Target Muscles
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();  // Prevent toggleExpand from being called
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                className="input flex justify-between items-center text-left"
              >
                <span className="text-gray-700 dark:text-gray-300">
                  {exercise.targetMuscles.length === 0 
                    ? 'Select muscles' 
                    : `${exercise.targetMuscles.length} muscle${exercise.targetMuscles.length > 1 ? 's' : ''} selected`}
                </span>
                <ChevronDown className="h-5 w-5 text-gray-400" />
              </button>
              
              {/* Selected muscles badges */}
              {exercise.targetMuscles.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {exercise.targetMuscles.map(muscle => (
                    <span 
                      key={muscle} 
                      className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div 
                  className="absolute z-10 mt-1.5 w-full rounded-xl border border-gray-200/70 bg-white py-1 shadow-xl shadow-gray-950/10 dark:border-white/10 dark:bg-gray-900 max-h-60 overflow-auto focus:outline-none"
                  onClick={(e) => e.stopPropagation()}  // Prevent toggleExpand from being called
                >
                  {muscleGroups.map((muscle) => (
                    <div
                      key={muscle}
                      className="flex items-center px-4 py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => toggleMuscleSelection(muscle)}
                    >
                      <div className={`flex h-5 items-center ${exercise.targetMuscles.includes(muscle) ? 'text-indigo-600' : 'text-transparent'}`}>
                        <Check className="h-4 w-4" />
                      </div>
                      <span className="ml-3 text-gray-900 dark:text-gray-100">{muscle}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}