import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Calculator } from 'lucide-react';
import type { UserProfile } from '../store/useWorkoutStore';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  currentProfile?: UserProfile;
}

export function UserProfileModal({ 
  isOpen, 
  onClose, 
  onSave, 
  currentProfile 
}: UserProfileModalProps) {
  const [height, setHeight] = useState(currentProfile?.height?.toString() ?? '');
  const [weight, setWeight] = useState(currentProfile?.weight?.toString() ?? '');
  const [age, setAge] = useState(currentProfile?.age?.toString() ?? '');
  const [gender, setGender] = useState<UserProfile['gender'] | ''>(currentProfile?.gender ?? '');
  const [neckCm, setNeckCm] = useState(currentProfile?.neckCm?.toString() ?? '');
  const [waistCm, setWaistCm] = useState(currentProfile?.waistCm?.toString() ?? '');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setHeight(currentProfile?.height?.toString() ?? '');
    setWeight(currentProfile?.weight?.toString() ?? '');
    setAge(currentProfile?.age?.toString() ?? '');
    setGender(currentProfile?.gender ?? '');
    setNeckCm(currentProfile?.neckCm?.toString() ?? '');
    setWaistCm(currentProfile?.waistCm?.toString() ?? '');
  }, [currentProfile, isOpen]);

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

  const calculateBodyFatPercentage = (
    heightCm: number,
    ageYears: number,
    selectedGender: UserProfile['gender'],
    bmi: number,
    waistMeasurement?: number,
    neckMeasurement?: number
  ) => {
    if (waistMeasurement && waistMeasurement > 0) {
      if (selectedGender === 'MALE' && neckMeasurement && neckMeasurement > 0 && waistMeasurement > neckMeasurement) {
        const estimate = 495 /
          (1.0324 - 0.19077 * Math.log10(waistMeasurement - neckMeasurement) + 0.15456 * Math.log10(heightCm)) - 450;

        return {
          percentage: estimate,
          method: 'US Navy estimate',
        };
      }

      const rfmBase = selectedGender === 'MALE' ? 64 : 76;
      const estimate = rfmBase - 20 * (heightCm / waistMeasurement);

      return {
        percentage: estimate,
        method: 'Relative fat mass estimate',
      };
    }

    const sexFactor = selectedGender === 'MALE' ? 1 : 0;
    const estimate = 1.2 * bmi + 0.23 * ageYears - 10.8 * sexFactor - 5.4;

    return {
      percentage: estimate,
      method: 'BMI-based estimate',
    };
  };

  const parsedHeight = parseFloat(height);
  const parsedWeight = parseFloat(weight);
  const parsedAge = parseInt(age, 10);
  const parsedNeckCm = neckCm ? parseFloat(neckCm) : undefined;
  const parsedWaistCm = waistCm ? parseFloat(waistCm) : undefined;

  const hasCoreInputs = parsedHeight > 0 && parsedWeight > 0 && parsedAge > 0 && gender;
  const currentBMI = hasCoreInputs ? calculateBMI(parsedHeight, parsedWeight) : null;
  const currentCategory = currentBMI ? getBMICategory(currentBMI) : null;
  const bodyFatEstimate = currentBMI && gender
    ? calculateBodyFatPercentage(parsedHeight, parsedAge, gender, currentBMI, parsedWaistCm, parsedNeckCm)
    : null;

  const handleSave = () => {
    if (!hasCoreInputs || !gender || !currentBMI) return;
    
    onSave({
      height: parsedHeight,
      weight: parsedWeight,
      age: parsedAge,
      gender,
      neckCm: parsedNeckCm,
      waistCm: parsedWaistCm,
      bmi: currentBMI,
      bmiCategory: getBMICategory(currentBMI),
      bodyFatPercentage: bodyFatEstimate ? Math.max(0, Math.min(100, bodyFatEstimate.percentage)) : undefined,
      bodyFatMethod: bodyFatEstimate?.method,
    });
    onClose();
  };

  const isValid = Boolean(hasCoreInputs);

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-panel max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/[0.07]">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
              Profile Information
            </h2>
          </div>
          <button
            onClick={onClose}
            className="icon-btn"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Height Input */}
          <div>
            <label className="label">
              Height (cm)
            </label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Enter your height in centimeters"
              min="100"
              max="250"
              className="input"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Example: 175 cm
            </p>
          </div>

          {/* Weight Input */}
          <div>
            <label className="label">
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
              className="input"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Example: 70.5 kg
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as UserProfile['gender'])}
                className="input"
              >
                <option value="">Select gender</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
              </select>
            </div>

            <div>
              <label className="label">
                Age
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Enter your age"
                min="10"
                max="120"
                className="input"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Neck (cm)
              </label>
              <input
                type="number"
                value={neckCm}
                onChange={(e) => setNeckCm(e.target.value)}
                placeholder="Optional"
                min="20"
                max="80"
                step="0.1"
                className="input"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Optional. Helps refine body fat estimation.
              </p>
            </div>

            <div>
              <label className="label">
                Waist (cm)
              </label>
              <input
                type="number"
                value={waistCm}
                onChange={(e) => setWaistCm(e.target.value)}
                placeholder="Optional"
                min="40"
                max="200"
                step="0.1"
                className="input"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Optional. Enables body fat percentage estimation.
              </p>
            </div>
          </div>

          {/* BMI Calculation Display */}
          {currentBMI && (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4">
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
                {bodyFatEstimate && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Body Fat %:</span>
                      <span className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                        {Math.max(0, Math.min(100, bodyFatEstimate.percentage)).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Method:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white text-right">
                        {bodyFatEstimate.method}
                      </span>
                    </div>
                  </>
                )}
              </div>
              
              {/* BMI Scale Reference */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/[0.08]">
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

        <div className="flex justify-end space-x-3 p-6 border-t border-gray-100 dark:border-white/[0.07]">
          <button
            onClick={onClose}
            className="btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className="btn-primary"
            
          >
            Save Profile
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
