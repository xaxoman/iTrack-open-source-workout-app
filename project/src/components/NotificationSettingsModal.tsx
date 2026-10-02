import { useEffect, useState } from 'react';
import { Sheet, Switch } from './ui';
import type { NotificationSettings } from '../store/useWorkoutStore';
import { useI18n } from '../i18n';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: NotificationSettings) => void;
  currentSettings?: NotificationSettings;
}

/** Stored day ids, Monday-first to match the localized weekday labels. */
export const DAY_IDS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/** Workout reminders: on/off, which days, what time. */
export function NotificationSettingsModal({ isOpen, onClose, onSave, currentSettings }: NotificationSettingsModalProps) {
  const { t, weekdays } = useI18n();
  const [enabled, setEnabled] = useState(true);
  const [days, setDays] = useState<string[]>([]);
  const [time, setTime] = useState('18:00');

  useEffect(() => {
    if (!isOpen) return;
    setEnabled(currentSettings?.enabled ?? true);
    setDays(currentSettings?.days ?? ['monday', 'wednesday', 'friday']);
    setTime(currentSettings?.time ?? '18:00');
  }, [isOpen, currentSettings]);

  const labels = weekdays('short');

  const save = () => {
    onSave({ enabled, days, time });
    onClose();
  };

  return (
    <Sheet open={isOpen} onClose={onClose} title={t('reminders.title')} subtitle={t('reminders.subtitle')}>
      <div className="mt-5 px-6">
        <div className="flex items-center justify-between">
          <span className="text-[15px] text-gray-900 dark:text-white">{t('reminders.enabled')}</span>
          <Switch checked={enabled} onChange={setEnabled} label={t('reminders.enabled')} />
        </div>
        <div className={enabled ? '' : 'pointer-events-none opacity-40'}>
          <p className="cap mt-5">{t('reminders.days')}</p>
          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {DAY_IDS.map((id, i) => {
              const on = days.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setDays(on ? days.filter((d) => d !== id) : [...days, id])}
                  className={`rounded-xl py-2 text-[12px] font-medium capitalize transition-colors ${
                    on ? 'bg-indigo-600 text-white dark:bg-indigo-500' : 'bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300'
                  }`}
                >
                  {labels[i].replace('.', '')}
                </button>
              );
            })}
          </div>
          <label htmlFor="reminder-time" className="cap mt-5 block">
            {t('reminders.time')}
          </label>
          <input id="reminder-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input mt-2 text-[16px]" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2 px-6">
        <button onClick={onClose} className="pill-secondary">
          {t('common.cancel')}
        </button>
        <button onClick={save} className="pill-primary">
          {t('common.save')}
        </button>
      </div>
    </Sheet>
  );
}
