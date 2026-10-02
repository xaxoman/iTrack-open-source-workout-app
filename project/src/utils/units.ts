import { useWorkoutStore } from '../store/useWorkoutStore';
import { useI18n } from '../i18n';

export type WeightUnit = 'kg' | 'lb';

const LB_PER_KG = 2.20462262;

/** Weights are always stored in kg; convert for display. */
export function kgToUnit(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kg * LB_PER_KG;
}

/** Convert a value the user typed in their unit back to kg for storage. */
export function unitToKg(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : value / LB_PER_KG;
}

/** Store kg with two decimals so kg → lb → kg round-trips stay stable. */
export function roundKg(kg: number): number {
  return Math.round(kg * 100) / 100;
}

/** Display helpers bound to the user's unit and locale. */
export function useUnits() {
  const unit = useWorkoutStore((s) => s.weightUnit);
  const { number } = useI18n();

  return {
    unit,
    /** kg → user's unit, rounded to one decimal (for inputs and charts). */
    fromKg: (kg: number) => Math.round(kgToUnit(kg, unit) * 10) / 10,
    /** User's unit → kg, ready to store. */
    toKg: (value: number) => roundKg(unitToKg(value, unit)),
    /** "75.4 kg" / "166.2 lb", localized decimal separator. */
    format: (kg: number, digits = 1) => `${number(kgToUnit(kg, unit), digits)} ${unit}`,
    /** Number only, localized: "75,4". */
    formatValue: (kg: number, digits = 1) => number(kgToUnit(kg, unit), digits),
  };
}
