/**
 * Muscles a routine can target. Names are stored in English (as in older data
 * and for the AI coach) and translated for display via `muscles.<Key>`.
 */
export const MUSCLE_GROUPS: { id: 'chest' | 'back' | 'arms' | 'core' | 'legs' | 'other'; muscles: string[] }[] = [
  { id: 'chest', muscles: ['Chest', 'Upper Chest', 'Lower Chest', 'Shoulders', 'Front Delts', 'Side Delts', 'Rear Delts'] },
  { id: 'back', muscles: ['Back', 'Lats', 'Traps', 'Rhomboids', 'Upper Back', 'Lower Back', 'Neck'] },
  { id: 'arms', muscles: ['Biceps', 'Triceps', 'Forearms'] },
  { id: 'core', muscles: ['Core', 'Abs', 'Obliques', 'Serratus'] },
  { id: 'legs', muscles: ['Legs', 'Glutes', 'Quadriceps', 'Hamstrings', 'Adductors', 'Abductors', 'Hip Flexors', 'Calves', 'Tibialis'] },
  { id: 'other', muscles: ['Full Body', 'Cardio'] },
];

export const ALL_MUSCLES = MUSCLE_GROUPS.flatMap((g) => g.muscles);

/** Comparison key: letters only, lower case ("Hip Flexors" → "hipflexors"). */
export const muscleKey = (name: string) => name.replace(/[^A-Za-zÀ-ÿ]/g, '').toLowerCase();

/** Body-map regions drawn by <MuscleMap> (MuscleMap's muscle groups; deltoids split by view). */
export const BODY_REGIONS = [
  'chest',
  'frontDelts',
  'rearDelts',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'obliques',
  'quads',
  'adductors',
  'hamstrings',
  'glutes',
  'calves',
  'tibialis',
  'traps',
  'upperBack',
  'lowerBack',
  'neck',
] as const;
export type BodyRegion = (typeof BODY_REGIONS)[number];

const REGIONS_BY_MUSCLE: Record<string, readonly BodyRegion[]> = {
  chest: ['chest'],
  upperchest: ['chest'],
  lowerchest: ['chest'],
  shoulders: ['frontDelts', 'rearDelts'],
  frontdelts: ['frontDelts'],
  sidedelts: ['frontDelts', 'rearDelts'],
  reardelts: ['rearDelts'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearms'],
  back: ['upperBack', 'traps', 'lowerBack'],
  lats: ['upperBack'],
  traps: ['traps'],
  rhomboids: ['upperBack'],
  upperback: ['upperBack', 'traps'],
  lowerback: ['lowerBack'],
  neck: ['neck'],
  core: ['abs', 'obliques'],
  abs: ['abs'],
  obliques: ['obliques'],
  serratus: ['obliques'],
  legs: ['quads', 'hamstrings', 'glutes', 'calves'],
  glutes: ['glutes'],
  quadriceps: ['quads'],
  quads: ['quads'],
  hamstrings: ['hamstrings'],
  adductors: ['adductors'],
  abductors: ['glutes'],
  hipflexors: ['quads'],
  calves: ['calves'],
  tibialis: ['tibialis'],
  fullbody: BODY_REGIONS,
  // Italian names typed by hand.
  petto: ['chest'],
  spalle: ['frontDelts', 'rearDelts'],
  bicipiti: ['biceps'],
  tricipiti: ['triceps'],
  avambracci: ['forearms'],
  schiena: ['upperBack', 'traps', 'lowerBack'],
  dorsali: ['upperBack'],
  trapezi: ['traps'],
  lombari: ['lowerBack'],
  collo: ['neck'],
  addominali: ['abs'],
  obliqui: ['obliques'],
  gambe: ['quads', 'hamstrings', 'glutes', 'calves'],
  glutei: ['glutes'],
  quadricipiti: ['quads'],
  femorali: ['hamstrings'],
  adduttori: ['adductors'],
  polpacci: ['calves'],
};

/** Regions a muscle name lights up on the body map (empty for e.g. Cardio). */
export function regionsFor(muscle: string): readonly BodyRegion[] {
  return REGIONS_BY_MUSCLE[muscleKey(muscle)] ?? [];
}
