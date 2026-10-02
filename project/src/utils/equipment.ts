/** Equipment presets. `type` is stored (and sent to the coach) in English; `key` picks the translated label. */
export const EQUIPMENT_PRESETS: { type: string; key: string; weighted: boolean }[] = [
  { type: 'Bodyweight', key: 'bodyweight', weighted: false },
  { type: 'Dumbbells', key: 'dumbbells', weighted: true },
  { type: 'Kettlebell', key: 'kettlebell', weighted: true },
  { type: 'Barbell', key: 'barbell', weighted: true },
  { type: 'Resistance bands', key: 'bands', weighted: false },
  { type: 'Pull-up bar', key: 'pullupBar', weighted: false },
  { type: 'Bench', key: 'bench', weighted: false },
  { type: 'Cable machine', key: 'cable', weighted: true },
];

/** Translated label for a stored equipment type; custom items show as typed. */
export function equipmentLabel(tx: (key: string, fallback: string) => string, type: string): string {
  const preset = EQUIPMENT_PRESETS.find((p) => p.type === type);
  return preset ? tx(`equipment.${preset.key}`, type) : type;
}
