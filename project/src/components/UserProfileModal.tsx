import { useState } from 'react';
import { X, User, Calculator } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  currentProfile?: UserProfile;
}

export interface UserProfile {
  height: number; // in centimeters
  weight: number; // in kilograms
  bmi?: number;
  bmiCategory?: string;
}

export function UserProfileModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentProfile 
}: UserProfileModalProps) {
  const [height, setHeight] = useState(currentProfile?.height?.toString() ?? '');
  const [weight, setWeight] = useState(currentProfile?.weight?.toString() ?? '');

  if (!isOpen) return null;

  const calculateBMI = (heightCm: number, weightKg: number) => {
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  };

  const getBMIColor = (bmi: number) => {
    if (bmi < 18.5) return 'text-blue-600 dark:text-blue-400';
    if (bmi < 25) return 'text-green-600 dark:text-green-400';
    if (bmi < 30) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const currentBMI = height && weight ? calculateBMI(parseFloat(height), parseFloat(weight)) : null;
  const currentCategory = currentBMI ? getBMICategory(currentBMI) : null;

  const handleSave = () => {
    if (!height || !weight) return;
    
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    const bmi = calculateBMI(heightNum, weightNum);
    
    onSave({
      height: heightNum,
      weight: weightNum,
      bmi,
      bmiCategory: getBMICategory(bmi)
    });
    onClose();
  };

  const isValid = height && weight && parseFloat(height) > 0 && parseFloat(weight) > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Profile Information
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Height Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Height (cm)
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Enter your height in centimeters"
              min="100"
              max="250"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Example: 175 cm
            </p>
          </div>

          {/* Weight Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Weight (kg)
            </label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter your weight in kilograms"
              min="30"
              max="200"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white placeholder-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Example: 70.5 kg
            </p>
          </div>

          {/* BMI Calculation Display */}
          {currentBMI && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Calculator className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  BMI Calculation
                </h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">BMI:</span>
                  <span className={`text-lg font-semibold ${getBMIColor(currentBMI)}`}>
                    {currentBMI.toFixed(1)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Category:</span>
                  <span className={`text-sm font-medium ${getBMIColor(currentBMI)}`}>
                    {currentCategory}
                  </span>
                </div>
              </div>
              
              {/* BMI Scale Reference */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  BMI Categories:
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-600 dark:text-blue-400">Underweight</span>
                    <span className="text-gray-500 dark:text-gray-400">&lt; 18.5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600 dark:text-green-400">Normal weight</span>
                    <span className="text-gray-500 dark:text-gray-400">18.5 - 24.9</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-yellow-600 dark:text-yellow-400">Overweight</span>
                    <span className="text-gray-500 dark:text-gray-400">25.0 - 29.9</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">Obese</span>
                    <span className="text-gray-500 dark:text-gray-400">&geq; 30.0</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
              isValid 
                ? 'bg-indigo-600 hover:bg-indigo-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>
  );
}
