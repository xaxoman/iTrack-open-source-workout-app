import React, { useRef, useState, useEffect } from 'react';
import { X, ChevronDown, Check, ChevronRight } from 'lucide-react';

interface ExerciseFormProps {
  exercise: {
    name: string;
    reps: number;
    type: 'reps' | 'time';
    videoUrl: string;
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
    <div className={`border dark:border-gray-700 rounded-lg transition-all duration-200 ${isExpanded ? 'p-4' : 'p-3'}`}>
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
            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
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
          className="text-gray-500 hover:text-red-500 dark:text-gray-400 ml-2"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Exercise Name
            </label>
            <input
              type="text"
              value={exercise.name}
              onChange={(e) => onChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Type
              </label>
              <select
                value={exercise.type}
                onChange={(e) => onChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="reps">Repetitions</option>
                <option value="time">Time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {exercise.type === 'reps' ? 'Repetitions' : 'Time (seconds)'}
              </label>
              <input
                type="number"
                min="1"
                value={exercise.reps || 1}
                onChange={handleNumberChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Video URL (YouTube or demonstration link)
            </label>
            <input
              type="url"
              value={exercise.videoUrl}
              onChange={(e) => onChange('videoUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Target Muscles
            </label>
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();  // Prevent toggleExpand from being called
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                className="w-full flex justify-between items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-left focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
                    >
                      {muscle}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Dropdown menu */}
              {isDropdownOpen && (
                <div 
                  className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none"
                  onClick={(e) => e.stopPropagation()}  // Prevent toggleExpand from being called
                >
                  {muscleGroups.map((muscle) => (
                    <div
                      key={muscle}
                      className="flex items-center px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
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