import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { EditorBar, FullScreen, Group, Switch } from './ui';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { selectWeightableExercises } from '../lib/gemini';
import { useI18n } from '../i18n';
import { useUnits } from '../utils/units';
import type { EquipmentItem } from '../types/workout';
import { EQUIPMENT_PRESETS } from '../utils/equipment';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}


interface PresetState {
  selected: boolean;
  maxWeight: string;
}

/** Equipment and current working weights the AI coach plans around. */
export function AICoachOnboardingModal({ isOpen, onClose, onSaved }: Props) {
  const { t, tx } = useI18n();
  const { unit, fromKg, toKg } = useUnits();
  const { templates, equipment, exerciseWeights, aiCoach, updateEquipment, updateExerciseWeights, setAiOnboarded } = useWorkoutStore();

  // Candidates come only from current routines, cleaned of "(Set N)" and de-duplicated.
  const candidateNames = useMemo(() => {
    const seen = new Map<string, string>();
    templates.forEach((tpl) =>
      tpl.exercises.forEach((e) => {
        const name = e.name.replace(/\s*\(set\s*\d+\)\s*$/i, '').trim();
        if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
      })
    );
    return Array.from(seen.values());
  }, [templates]);

  const [presets, setPresets] = useState<Record<string, PresetState>>({});
  const [customItems, setCustomItems] = useState<{ type: string; maxWeight: string }[]>([]);
  const [weights, setWeights] = useState<Record<string, string>>({});
  const [weightable, setWeightable] = useState<string[] | null>(null);
  const [filtering, setFiltering] = useState(false);
  const [filterNote, setFilterNote] = useState<string | null>(null);

  // Ask Gemini which exercises can meaningfully take a weight.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setFilterNote(null);
    if (candidateNames.length === 0) {
      setWeightable([]);
      return;
    }
    if (!aiCoach.apiKey) {
      setWeightable(candidateNames);
      setFilterNote(t('onboarding.noKeyFilter'));
      return;
    }
    setFiltering(true);
    setWeightable(null);
    selectWeightableExercises(aiCoach.apiKey, aiCoach.model, candidateNames, aiCoach.thinkingLevel)
      .then((list) => {
        if (!cancelled) setWeightable(list);
      })
      .catch(() => {
        if (!cancelled) {
          setWeightable(candidateNames);
          setFilterNote(t('onboarding.filterFailed'));
        }
      })
      .finally(() => {
        if (!cancelled) setFiltering(false);
      });
    return () => {
      cancelled = true;
    };
    // t is stable per language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, candidateNames, aiCoach.apiKey, aiCoach.model, aiCoach.thinkingLevel]);

  // Prefill from stored equipment and weights (kg → display unit).
  useEffect(() => {
    if (!isOpen) return;
    const presetTypes = new Set(EQUIPMENT_PRESETS.map((p) => p.type));
    const nextPresets: Record<string, PresetState> = {};
    EQUIPMENT_PRESETS.forEach((p) => {
      nextPresets[p.type] = { selected: false, maxWeight: '' };
    });
    const nextCustom: { type: string; maxWeight: string }[] = [];
    equipment.forEach((item) => {
      const max = item.maxWeight ? String(fromKg(item.maxWeight)) : '';
      if (presetTypes.has(item.type)) nextPresets[item.type] = { selected: true, maxWeight: max };
      else nextCustom.push({ type: item.type, maxWeight: max });
    });
    setPresets(nextPresets);
    setCustomItems(nextCustom);
    const nextWeights: Record<string, string> = {};
    candidateNames.forEach((name) => {
      nextWeights[name] = exerciseWeights[name] != null ? String(fromKg(exerciseWeights[name])) : '';
    });
    setWeights(nextWeights);
    // Re-prefill only when opened or the source data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, equipment, exerciseWeights, candidateNames]);

  const parseKg = (value: string) => {
    const n = parseFloat(value.replace(',', '.'));
    return !Number.isNaN(n) && n > 0 ? toKg(n) : undefined;
  };

  const save = () => {
    const items: EquipmentItem[] = [];
    EQUIPMENT_PRESETS.forEach((p) => {
      const st = presets[p.type];
      if (st?.selected) items.push({ id: crypto.randomUUID(), type: p.type, maxWeight: p.weighted ? parseKg(st.maxWeight) : undefined });
    });
    customItems.forEach((c) => {
      const type = c.type.trim();
      if (type) items.push({ id: crypto.randomUUID(), type, maxWeight: parseKg(c.maxWeight) });
    });
    const parsedWeights: Record<string, number> = {};
    Object.entries(weights).forEach(([name, val]) => {
      const kg = parseKg(val);
      if (kg !== undefined) parsedWeights[name] = kg;
    });
    updateEquipment(items);
    updateExerciseWeights(parsedWeights);
    setAiOnboarded(true);
    onSaved?.();
    onClose();
  };

  const weightInput = (value: string, onChange: (v: string) => void, label: string) => (
    <span className="flex items-center gap-1.5">
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="0.5"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        placeholder="—"
        className="w-20 rounded-lg bg-white px-2.5 py-1 text-right text-[15px] text-gray-900 ring-1 ring-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white dark:ring-white/10"
      />
      <span className="text-[13px] text-gray-400">{unit}</span>
    </span>
  );

  return (
    <FullScreen
      open={isOpen}
      onClose={onClose}
      tone="grouped"
      z="z-[75]"
      header={<EditorBar title={t('onboarding.title')} onCancel={onClose} cancelLabel={t('common.cancel')} onSave={save} saveLabel={t('common.save')} />}
    >
      <div className="px-4">
        <p className="mt-2 px-2 text-[14px] text-gray-500 dark:text-gray-400">{t('onboarding.intro')}</p>

        <Group label={t('onboarding.equipment')}>
          {EQUIPMENT_PRESETS.map((p) => {
            const st = presets[p.type] ?? { selected: false, maxWeight: '' };
            return (
              <div key={p.type} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="text-[15px] text-gray-900 dark:text-white">{tx(`equipment.${p.key}`, p.type)}</span>
                <span className="flex items-center gap-3">
                  {p.weighted &&
                    st.selected &&
                    weightInput(
                      st.maxWeight,
                      (v) => setPresets((prev) => ({ ...prev, [p.type]: { ...prev[p.type], maxWeight: v } })),
                      t('onboarding.maxWeight')
                    )}
                  <Switch
                    checked={st.selected}
                    onChange={(on) => setPresets((prev) => ({ ...prev, [p.type]: { ...prev[p.type], selected: on } }))}
                    label={tx(`equipment.${p.key}`, p.type)}
                  />
                </span>
              </div>
            );
          })}
          {customItems.map((c, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
              <input
                value={c.type}
                onChange={(e) => setCustomItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, type: e.target.value } : it)))}
                placeholder={t('onboarding.otherPlaceholder')}
                className="min-w-0 flex-1 bg-transparent text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
              />
              {weightInput(c.maxWeight, (v) => setCustomItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, maxWeight: v } : it))), t('onboarding.maxWeight'))}
              <button
                onClick={() => setCustomItems((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label={t('common.remove')}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setCustomItems((prev) => [...prev, { type: '', maxWeight: '' }])}
            className="flex w-full items-center gap-2 px-4 py-3 text-[15px] font-medium text-indigo-600 dark:text-indigo-400"
          >
            <Plus className="h-4 w-4" />
            {t('onboarding.addOther')}
          </button>
        </Group>

        <Group label={t('onboarding.workingWeights')} footnote={filterNote ?? t('onboarding.workingWeightsHint')}>
          {candidateNames.length === 0 ? (
            <p className="px-4 py-3 text-[14px] text-gray-500 dark:text-gray-400">{t('onboarding.noExercises')}</p>
          ) : filtering || weightable === null ? (
            <p className="flex items-center gap-2 px-4 py-3 text-[14px] text-gray-500 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              <Sparkles className="h-4 w-4 text-indigo-500" />
              {t('onboarding.filtering')}
            </p>
          ) : weightable.length === 0 ? (
            <p className="px-4 py-3 text-[14px] text-gray-500 dark:text-gray-400">{t('onboarding.noneWeightable')}</p>
          ) : (
            weightable.map((name) => (
              <div key={name} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="truncate text-[15px] text-gray-900 dark:text-white" title={name}>
                  {name}
                </span>
                {weightInput(weights[name] ?? '', (v) => setWeights((prev) => ({ ...prev, [name]: v })), name)}
              </div>
            ))
          )}
        </Group>
      </div>
    </FullScreen>
  );
}
