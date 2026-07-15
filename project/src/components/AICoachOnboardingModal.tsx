import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Dumbbell, Plus, Trash2, Weight, Loader2, Sparkles } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { selectWeightableExercises } from '../lib/gemini';
import type { EquipmentItem } from '../types/workout';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const EQUIPMENT_PRESETS: { type: string; weighted: boolean }[] = [
  { type: 'Bodyweight', weighted: false },
  { type: 'Dumbbells', weighted: true },
  { type: 'Kettlebell', weighted: true },
  { type: 'Barbell', weighted: true },
  { type: 'Resistance bands', weighted: false },
  { type: 'Pull-up bar', weighted: false },
  { type: 'Bench', weighted: false },
  { type: 'Cable machine', weighted: true },
];

interface PresetState {
  selected: boolean;
  maxWeight: string;
}

export function AICoachOnboardingModal({ isOpen, onClose, onSaved }: Props) {
  const {
    templates,
    equipment,
    exerciseWeights,
    aiCoach,
    updateEquipment,
    updateExerciseWeights,
    setAiOnboarded,
  } = useWorkoutStore();

  // Candidate exercises come ONLY from the user's current routines (templates),
  // not from old logged sessions — so exercises from routines they no longer do
  // don't show up. Names are cleaned of any "(Set N)" suffix and de-duplicated.
  const candidateNames = useMemo(() => {
    const seen = new Map<string, string>(); // lowercase -> original casing
    templates.forEach((t) =>
      t.exercises.forEach((e) => {
        const name = e.name.replace(/\s*\(set\s*\d+\)\s*$/i, '').trim();
        if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
      })
    );
    return Array.from(seen.values());
  }, [templates]);

  const [presets, setPresets] = useState<Record<string, PresetState>>({});
  const [customItems, setCustomItems] = useState<{ type: string; maxWeight: string }[]>([]);
  const [weights, setWeights] = useState<Record<string, string>>({});
  // AI-filtered subset of candidateNames that can actually take a weight.
  const [weightable, setWeightable] = useState<string[] | null>(null);
  const [filtering, setFiltering] = useState(false);
  const [filterNote, setFilterNote] = useState<string | null>(null);

  // Ask Gemini which exercises are meaningfully weightable when the modal opens.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    setFilterNote(null);
    if (candidateNames.length === 0) {
      setWeightable([]);
      return;
    }
    if (!aiCoach.apiKey) {
      setWeightable(candidateNames); // no key — fall back to the full list
      setFilterNote('Add a Gemini key to auto-filter to weightable exercises.');
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
          setFilterNote('Could not auto-filter — showing all exercises.');
        }
      })
      .finally(() => {
        if (!cancelled) setFiltering(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, candidateNames, aiCoach.apiKey, aiCoach.model, aiCoach.thinkingLevel]);

  useEffect(() => {
    if (!isOpen) return;

    // Prefill presets + custom items from stored equipment.
    const presetTypes = new Set(EQUIPMENT_PRESETS.map((p) => p.type));
    const nextPresets: Record<string, PresetState> = {};
    EQUIPMENT_PRESETS.forEach((p) => {
      nextPresets[p.type] = { selected: false, maxWeight: '' };
    });
    const nextCustom: { type: string; maxWeight: string }[] = [];
    equipment.forEach((item) => {
      if (presetTypes.has(item.type)) {
        nextPresets[item.type] = {
          selected: true,
          maxWeight: item.maxWeight ? String(item.maxWeight) : '',
        };
      } else {
        nextCustom.push({ type: item.type, maxWeight: item.maxWeight ? String(item.maxWeight) : '' });
      }
    });
    setPresets(nextPresets);
    setCustomItems(nextCustom);

    const nextWeights: Record<string, string> = {};
    candidateNames.forEach((name) => {
      nextWeights[name] = exerciseWeights[name] != null ? String(exerciseWeights[name]) : '';
    });
    setWeights(nextWeights);
  }, [isOpen, equipment, exerciseWeights, candidateNames]);

  if (!isOpen) return null;

  const togglePreset = (type: string) =>
    setPresets((prev) => ({
      ...prev,
      [type]: { ...prev[type], selected: !prev[type]?.selected },
    }));

  const setPresetWeight = (type: string, value: string) =>
    setPresets((prev) => ({ ...prev, [type]: { ...prev[type], maxWeight: value } }));

  const handleSave = () => {
    const items: EquipmentItem[] = [];
    EQUIPMENT_PRESETS.forEach((p) => {
      const st = presets[p.type];
      if (st?.selected) {
        const maxWeight = p.weighted && st.maxWeight ? parseFloat(st.maxWeight) : undefined;
        items.push({ id: crypto.randomUUID(), type: p.type, maxWeight: maxWeight && maxWeight > 0 ? maxWeight : undefined });
      }
    });
    customItems.forEach((c) => {
      const type = c.type.trim();
      if (!type) return;
      const maxWeight = c.maxWeight ? parseFloat(c.maxWeight) : undefined;
      items.push({ id: crypto.randomUUID(), type, maxWeight: maxWeight && maxWeight > 0 ? maxWeight : undefined });
    });

    const parsedWeights: Record<string, number> = {};
    Object.entries(weights).forEach(([name, val]) => {
      const num = parseFloat(val);
      if (!Number.isNaN(num) && num >= 0) parsedWeights[name] = num;
    });

    updateEquipment(items);
    updateExerciseWeights(parsedWeights);
    setAiOnboarded(true);
    onSaved?.();
    onClose();
  };

  const inputClass = 'input';

  return createPortal(
    <div className="modal-overlay">
      <div className="modal-panel max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/[0.07]">
          <div className="flex items-center space-x-2">
            <Dumbbell className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">Your equipment & weights</h2>
          </div>
          <button
            onClick={onClose}
            className="icon-btn"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The coach uses this to make realistic suggestions. You can update it anytime.
          </p>

          {/* Equipment */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              What equipment do you have?
            </h3>
            <div className="space-y-2">
              {EQUIPMENT_PRESETS.map((p) => {
                const st = presets[p.type] ?? { selected: false, maxWeight: '' };
                return (
                  <div
                    key={p.type}
                    className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                      st.selected
                        ? 'border-indigo-500 bg-indigo-50/70 dark:border-indigo-400/60 dark:bg-indigo-500/10'
                        : 'border-gray-200 hover:border-gray-300 dark:border-white/[0.08] dark:hover:border-white/[0.16]'
                    }`}
                  >
                    <label className="flex items-center gap-2 flex-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={st.selected}
                        onChange={() => togglePreset(p.type)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800"
                      />
                      <span className="text-sm text-gray-900 dark:text-white">{p.type}</span>
                    </label>
                    {p.weighted && st.selected && (
                      <div className="flex items-center gap-1">
                        <Weight className="h-4 w-4 text-gray-400" />
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={st.maxWeight}
                          onChange={(e) => setPresetWeight(p.type, e.target.value)}
                          placeholder="max kg"
                          className="input w-24 px-2 py-1 text-sm"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Custom equipment */}
            {customItems.map((c, i) => (
              <div key={i} className="flex items-center gap-2 mt-2">
                <input
                  value={c.type}
                  onChange={(e) =>
                    setCustomItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, type: e.target.value } : it)))
                  }
                  placeholder="Other equipment"
                  className={inputClass}
                />
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={c.maxWeight}
                  onChange={(e) =>
                    setCustomItems((prev) =>
                      prev.map((it, idx) => (idx === i ? { ...it, maxWeight: e.target.value } : it))
                    )
                  }
                  placeholder="max kg"
                  className="input w-28 px-2 py-2 text-sm"
                />
                <button
                  onClick={() => setCustomItems((prev) => prev.filter((_, idx) => idx !== i))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => setCustomItems((prev) => [...prev, { type: '', maxWeight: '' }])}
              className="link mt-2 flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add other equipment
            </button>
          </div>

          {/* Current weights per exercise (AI-filtered to weightable moves) */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              Current working weight per exercise
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              The weight you currently use. Leave blank for bodyweight or unknown.
              {filterNote && <span className="block mt-1 text-amber-600 dark:text-amber-400">{filterNote}</span>}
            </p>

            {candidateNames.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No exercises found yet — create a workout routine first and the coach will ask about it.
              </p>
            ) : filtering || weightable === null ? (
              <div className="flex items-center gap-2 py-4 text-sm text-gray-500 dark:text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <Sparkles className="h-4 w-4 text-indigo-500" />
                Finding weightable exercises…
              </div>
            ) : weightable.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                None of your current exercises need a weight — they look like bodyweight or mobility work.
              </p>
            ) : (
              <div className="space-y-2">
                {weightable.map((name) => (
                  <div key={name} className="flex items-center gap-3">
                    <span className="flex-1 text-sm text-gray-900 dark:text-white truncate" title={name}>
                      {name}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={weights[name] ?? ''}
                      onChange={(e) => setWeights((prev) => ({ ...prev, [name]: e.target.value }))}
                      placeholder="kg"
                      className="input w-24 px-2 py-1 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
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
            className="btn-primary"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
