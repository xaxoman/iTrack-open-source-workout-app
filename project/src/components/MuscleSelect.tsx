import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useI18n } from '../i18n';
import { ALL_MUSCLES, MUSCLE_GROUPS, muscleKey } from '../utils/muscles';

interface MuscleSelectProps {
  value: string[];
  onChange: (muscles: string[]) => void;
  label: string;
}

/** Multi-select dropdown of muscle groups, grouped by body area, with search. */
export function MuscleSelect({ value, onChange, label }: MuscleSelectProps) {
  const { t, muscle } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  // Close when tapping anywhere else.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const selectedKeys = useMemo(() => new Set(value.map(muscleKey)), [value]);
  const isSelected = (name: string) => selectedKeys.has(muscleKey(name));
  // Values not in the list (custom or AI-generated) stay visible so they can be removed.
  const custom = value.filter((v) => !ALL_MUSCLES.some((m) => muscleKey(m) === muscleKey(v)));

  const toggle = (name: string) =>
    onChange(isSelected(name) ? value.filter((v) => muscleKey(v) !== muscleKey(name)) : [...value, name]);

  const q = query.trim().toLowerCase();
  const matches = (name: string) => !q || muscle(name).toLowerCase().includes(q) || name.toLowerCase().includes(q);
  const groups = [
    ...MUSCLE_GROUPS.map((g) => ({ id: g.id, label: t(`muscleGroups.${g.id}`), muscles: g.muscles.filter(matches) })),
    ...(custom.length ? [{ id: 'custom', label: t('muscleGroups.custom'), muscles: custom.filter(matches) }] : []),
  ].filter((g) => g.muscles.length > 0);

  return (
    <div ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={label}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-white px-3.5 py-2.5 text-left text-[14px] transition-colors dark:bg-gray-800/60 ${
          open ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200 dark:border-white/10'
        }`}
      >
        <span className={`min-w-0 truncate ${value.length ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
          {value.length ? value.map(muscle).join(', ') : t('editor.selectMuscles')}
        </span>
        <span className="flex flex-shrink-0 items-center gap-1.5">
          {value.length > 0 && (
            <span className="rounded-full bg-indigo-600 px-1.5 text-[11px] font-semibold text-white dark:bg-indigo-500">{value.length}</span>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="mt-1.5 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg shadow-gray-950/5 dark:border-white/10 dark:bg-gray-900">
          <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2 dark:border-white/[0.06]">
            <Search className="h-4 w-4 flex-shrink-0 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('editor.searchMuscles')}
              aria-label={t('editor.searchMuscles')}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
            />
            {value.length > 0 && (
              <button type="button" onClick={() => onChange([])} className="flex items-center gap-1 text-[12px] font-medium text-gray-500 hover:text-red-600 dark:text-gray-400">
                <X className="h-3.5 w-3.5" />
                {t('editor.clearMuscles')}
              </button>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto overscroll-contain py-1" role="listbox" aria-multiselectable="true" aria-label={label}>
            {groups.length === 0 && <p className="px-3 py-3 text-[13px] text-gray-400">{t('editor.noMuscleMatch')}</p>}
            {groups.map((g) => (
              <div key={g.id}>
                <p className="cap px-3 pb-1 pt-2.5">{g.label}</p>
                {g.muscles.map((m) => {
                  const on = isSelected(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      role="option"
                      aria-selected={on}
                      onClick={() => toggle(m)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-[14px] transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                    >
                      <span
                        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md ${
                          on ? 'bg-indigo-600 text-white dark:bg-indigo-500' : 'border-[1.5px] border-gray-300 dark:border-white/20'
                        }`}
                      >
                        {on && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <span className={on ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}>{muscle(m)}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 p-2 dark:border-white/[0.06]">
            <button type="button" onClick={() => setOpen(false)} className="w-full rounded-lg py-2 text-[14px] font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-500/10">
              {t('editor.done')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
