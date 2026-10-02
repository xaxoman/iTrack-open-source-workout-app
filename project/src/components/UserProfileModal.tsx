import { useEffect, useState } from 'react';
import { Sheet, Segmented } from './ui';
import type { UserProfile } from '../store/useWorkoutStore';
import { useI18n } from '../i18n';
import { useUnits } from '../utils/units';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: UserProfile) => void;
  currentProfile?: UserProfile;
}

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';
export type BodyFatMethod = 'navy' | 'rfm' | 'bmi';

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

/** Stored English labels (older profiles) → method key. */
export function bodyFatMethodKey(method?: string): BodyFatMethod | null {
  if (!method) return null;
  if (/navy/i.test(method)) return 'navy';
  if (/relative|rfm/i.test(method)) return 'rfm';
  if (/bmi/i.test(method)) return 'bmi';
  return null;
}

// Stored values stay in English for compatibility with existing data and the AI coach.
const CATEGORY_LABEL: Record<BmiCategory, string> = {
  underweight: 'Underweight',
  normal: 'Normal weight',
  overweight: 'Overweight',
  obese: 'Obese',
};
const METHOD_LABEL: Record<BodyFatMethod, string> = {
  navy: 'US Navy estimate',
  rfm: 'Relative fat mass estimate',
  bmi: 'BMI-based estimate',
};

function estimateBodyFat(heightCm: number, age: number, gender: UserProfile['gender'], bmi: number, waist?: number, neck?: number) {
  if (waist && waist > 0) {
    if (gender === 'MALE' && neck && neck > 0 && waist > neck) {
      return { percentage: 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(heightCm)) - 450, method: 'navy' as const };
    }
    const base = gender === 'MALE' ? 64 : 76;
    return { percentage: base - 20 * (heightCm / waist), method: 'rfm' as const };
  }
  const sex = gender === 'MALE' ? 1 : 0;
  return { percentage: 1.2 * bmi + 0.23 * age - 10.8 * sex - 5.4, method: 'bmi' as const };
}

/** Height, weight, age and measurements → BMI and an estimated body-fat %. */
export function UserProfileModal({ isOpen, onClose, onSave, currentProfile }: UserProfileModalProps) {
  const { t, number } = useI18n();
  const { unit, fromKg, toKg } = useUnits();
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<UserProfile['gender']>('MALE');
  const [neck, setNeck] = useState('');
  const [waist, setWaist] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setHeight(currentProfile?.height?.toString() ?? '');
    setWeight(currentProfile?.weight ? String(fromKg(currentProfile.weight)) : '');
    setAge(currentProfile?.age?.toString() ?? '');
    setGender(currentProfile?.gender ?? 'MALE');
    setNeck(currentProfile?.neckCm?.toString() ?? '');
    setWaist(currentProfile?.waistCm?.toString() ?? '');
    // Reset only when opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentProfile]);

  const num = (v: string) => parseFloat(v.replace(',', '.'));
  const h = num(height);
  const wKg = weight ? toKg(num(weight)) : NaN;
  const a = parseInt(age, 10);
  const neckCm = neck ? num(neck) : undefined;
  const waistCm = waist ? num(waist) : undefined;
  const valid = h > 0 && wKg > 0 && a > 0;
  const bmi = valid ? wKg / (h / 100) ** 2 : null;
  const fat = bmi ? estimateBodyFat(h, a, gender, bmi, waistCm, neckCm) : null;

  const save = () => {
    if (!valid || !bmi) return;
    onSave({
      height: h,
      weight: wKg,
      age: a,
      gender,
      neckCm,
      waistCm,
      bmi,
      bmiCategory: CATEGORY_LABEL[bmiCategory(bmi)],
      bodyFatPercentage: fat ? Math.max(0, Math.min(100, fat.percentage)) : undefined,
      bodyFatMethod: fat ? METHOD_LABEL[fat.method] : undefined,
    });
    onClose();
  };

  const field = (id: string, label: string, value: string, onChange: (v: string) => void, suffix: string) => (
    <div>
      <label htmlFor={id} className="label">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input pr-12 text-[16px]"
        />
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] text-gray-400">{suffix}</span>
      </div>
    </div>
  );

  return (
    <Sheet open={isOpen} onClose={onClose} title={t('profile.title')} subtitle={t('profile.subtitle')}>
      <div className="mt-5 space-y-4 px-6">
        <div className="flex items-center justify-between">
          <span className="text-[15px] text-gray-900 dark:text-white">{t('profile.sex')}</span>
          <Segmented
            label={t('profile.sex')}
            value={gender}
            onChange={setGender}
            options={[
              { value: 'MALE', label: t('profile.male') },
              { value: 'FEMALE', label: t('profile.female') },
            ]}
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {field('p-height', t('profile.height'), height, setHeight, 'cm')}
          {field('p-weight', t('profile.weight'), weight, setWeight, unit)}
          {field('p-age', t('profile.age'), age, setAge, t('profile.years'))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {field('p-neck', t('profile.neck'), neck, setNeck, 'cm')}
          {field('p-waist', t('profile.waist'), waist, setWaist, 'cm')}
        </div>
        <p className="text-[12px] text-gray-400 dark:text-gray-500">{t('profile.measureHint')}</p>

        {bmi && (
          <div className="grid grid-cols-2 border-y hairline py-3">
            <div>
              <p className="text-[24px] font-semibold tabular-nums text-gray-900 dark:text-white">{number(bmi, 1, 1)}</p>
              <p className="text-[12px] text-gray-500 dark:text-gray-400">
                {t('profile.bmi')} · {t(`profile.bmiCategory.${bmiCategory(bmi)}`)}
              </p>
            </div>
            {fat && (
              <div className="border-l hairline pl-4">
                <p className="text-[24px] font-semibold tabular-nums text-gray-900 dark:text-white">{number(Math.max(0, fat.percentage), 1, 1)}%</p>
                <p className="text-[12px] text-gray-500 dark:text-gray-400">
                  {t('profile.bodyFat')} · {t(`profile.method.${fat.method}`)}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2 px-6">
        <button onClick={onClose} className="pill-secondary">
          {t('common.cancel')}
        </button>
        <button onClick={save} disabled={!valid} className="pill-primary">
          {t('common.save')}
        </button>
      </div>
    </Sheet>
  );
}
