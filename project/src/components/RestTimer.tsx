import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Vibrate, Volume2, VolumeX } from 'lucide-react';
import { useI18n } from '../i18n';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { playEnd, playTick, vibrate, type RestSound } from '../utils/sound';

const REST_SECONDS = 60;

interface RestTimerProps {
  onDone: () => void;
  /** "Lateral Raise · 15" — shown under the countdown. */
  nextLabel?: string;
}

/** Rest countdown in a bottom sheet over the session. */
export function RestTimer({ onDone, nextLabel }: RestTimerProps) {
  const { t, clock } = useI18n();
  const { restSound, restVibrate, setRestSound, setRestVibrate } = useWorkoutStore();
  const [endAt, setEndAt] = useState(() => Date.now() + REST_SECONDS * 1000);
  const [left, setLeft] = useState(REST_SECONDS);
  const [total, setTotal] = useState(REST_SECONDS);
  const lastSound = useRef<Exclude<RestSound, 'off'>>(restSound === 'off' ? 'beep' : restSound);
  const finished = useRef(false);
  const lastLeft = useRef(REST_SECONDS);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (restSound !== 'off') lastSound.current = restSound;
  }, [restSound]);

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      if (remaining !== lastLeft.current) {
        lastLeft.current = remaining;
        if (remaining > 0 && remaining <= 3) playTick(restSound);
        setLeft(remaining);
      }
      if (remaining === 0 && !finished.current) {
        finished.current = true;
        clearInterval(id);
        playEnd(restSound);
        if (restVibrate) vibrate([300, 120, 300]);
        doneRef.current();
      }
    }, 200);
    return () => clearInterval(id);
  }, [endAt, restSound, restVibrate]);

  const adjust = (delta: number) => {
    const next = Math.max(0, left + delta);
    setEndAt(Date.now() + next * 1000);
    lastLeft.current = next;
    setLeft(next);
    if (next > total) setTotal(next);
  };

  const skip = () => {
    if (finished.current) return;
    finished.current = true;
    doneRef.current();
  };

  const soundOn = restSound !== 'off';
  const progress = total > 0 ? ((total - left) / total) * 100 : 100;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={t('rest.title')}>
      <div className="absolute inset-0 animate-fade-in bg-gray-950/30" />
      <div className="absolute inset-x-0 bottom-0 animate-slide-up rounded-t-[28px] bg-white px-6 pb-safe pt-3 shadow-2xl dark:bg-gray-900 md:inset-x-auto md:left-1/2 md:w-[460px] md:-translate-x-1/2">
        <div className="mx-auto h-1 w-9 rounded-full bg-gray-200 dark:bg-white/15" />
        <div className="mt-4 flex items-center justify-between">
          <p className="cap">{t('rest.title')}</p>
          <div className="flex gap-1.5">
            <Chip on={soundOn} onClick={() => setRestSound(soundOn ? 'off' : lastSound.current)} label={t('rest.sound')}>
              {soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            </Chip>
            <Chip on={restVibrate} onClick={() => setRestVibrate(!restVibrate)} label={t('rest.vibrate')}>
              <Vibrate className="h-3.5 w-3.5" />
            </Chip>
          </div>
        </div>

        <p className="mt-2 text-[96px] font-semibold leading-none tabular-nums tracking-[-.04em] text-gray-900 dark:text-white" aria-live="polite">
          {clock(left)}
        </p>
        <div className="mt-4 h-1.5 rounded-full bg-gray-100 dark:bg-white/10">
          <div className="h-1.5 rounded-full bg-indigo-600 transition-[width] dark:bg-indigo-400" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-1.5 flex justify-between gap-3 text-[11px] text-gray-400 dark:text-gray-500">
          <span>0:00</span>
          {nextLabel && (
            <span className="truncate">
              {t('rest.next')} <b className="font-medium text-gray-700 dark:text-gray-200">{nextLabel}</b>
            </span>
          )}
          <span>{clock(total)}</span>
        </div>

        <div className="mb-6 mt-5 grid grid-cols-3 gap-2">
          <button onClick={() => adjust(-10)} className="pill-secondary px-2">
            {t('rest.minus10')}
          </button>
          <button onClick={skip} className="pill-primary px-2">
            {t('rest.skip')}
          </button>
          <button onClick={() => adjust(10)} className="pill-secondary px-2">
            {t('rest.plus10')}
          </button>
        </div>
      </div>
    </div>
  );
}

function Chip({ on, onClick, label, children }: { on: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium transition-colors ${
        on
          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300'
          : 'bg-gray-100 text-gray-400 line-through dark:bg-white/[0.06] dark:text-gray-500'
      }`}
    >
      {children}
      {label}
    </button>
  );
}
