import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Sheet } from './ui';
import { useI18n } from '../i18n';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useUnits } from '../utils/units';
import { dayKey } from '../utils/workout';

interface LogWeightSheetProps {
  open: boolean;
  onClose: () => void;
  /** Heading override, e.g. for the post-workout prompt. */
  title?: string;
  subtitle?: string;
}

/** Log body weight for any day (one entry per day). */
export function LogWeightSheet({ open, onClose, title, subtitle }: LogWeightSheetProps) {
  const { t } = useI18n();
  const { unit, fromKg, toKg } = useUnits();
  const { weightLog, addWeightEntry } = useWorkoutStore();
  const lastEntry = weightLog[weightLog.length - 1];

  const [value, setValue] = useState('');
  const [date, setDate] = useState(dayKey(new Date()));

  useEffect(() => {
    if (open) {
      setValue(lastEntry ? String(fromKg(lastEntry.weightKg)) : '');
      setDate(dayKey(new Date()));
    }
    // Only reset when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const parsed = parseFloat(value.replace(',', '.'));
  const kg = Number.isNaN(parsed) ? NaN : toKg(parsed);
  const isValid = kg > 20 && kg < 400 && Boolean(date);

  const save = () => {
    if (!isValid) return;
    addWeightEntry({ id: crypto.randomUUID(), date, weightKg: kg });
    toast.success(t('weight.logged'));
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={title ?? t('weight.logTitle')} subtitle={subtitle ?? t('weight.logSubtitle')}>
      <div className="mt-5 grid grid-cols-2 gap-3 px-6">
        <div>
          <label className="label" htmlFor="weight-value">
            {t('weight.weightIn', { unit })}
          </label>
          <input
            id="weight-value"
            type="number"
            inputMode="decimal"
            step="0.1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="input text-[16px]"
            autoFocus
          />
        </div>
        <div>
          <label className="label" htmlFor="weight-date">
            {t('common.date')}
          </label>
          <input
            id="weight-date"
            type="date"
            value={date}
            max={dayKey(new Date())}
            onChange={(e) => setDate(e.target.value)}
            className="input text-[16px]"
          />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2 px-6">
        <button onClick={onClose} className="pill-secondary">
          {t('common.notNow')}
        </button>
        <button onClick={save} disabled={!isValid} className="pill-primary">
          {t('common.save')}
        </button>
      </div>
    </Sheet>
  );
}
