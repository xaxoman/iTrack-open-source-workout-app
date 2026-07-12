import type {
  Workout,
  WorkoutTemplate,
  EquipmentItem,
} from '../types/workout';
import type { UserProfile } from '../store/useWorkoutStore';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** The direction the user wants their training to move. */
export type CoachDirection = 'harder' | 'easier' | 'maintain' | 'custom';

/** Reasoning effort for Gemini 3 models. */
export type ThinkingLevel = 'low' | 'high';

export interface CoachContext {
  profile: UserProfile | null;
  equipment: EquipmentItem[];
  exerciseWeights: Record<string, number>;
  templates: WorkoutTemplate[];
  /** Most recent completed sessions, newest first. */
  recentWorkouts: Workout[];
}

/** A workout the AI proposes, shaped so it can be saved as a template. */
export interface GeneratedWorkout {
  name: string;
  summary: string;
  numberOfSets: number;
  exercises: {
    name: string;
    type: 'reps' | 'time';
    reps: number;
    targetMuscles: string[];
    suggestedWeightKg?: number;
    description?: string;
  }[];
}

class GeminiError extends Error {}

async function callGemini(
  apiKey: string,
  model: string,
  prompt: string,
  jsonSchema?: Record<string, unknown>,
  thinkingLevel?: ThinkingLevel
): Promise<string> {
  if (!apiKey) throw new GeminiError('No Gemini API key set. Add one in Settings.');

  const generationConfig: Record<string, unknown> = { temperature: 0.7 };
  if (jsonSchema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = jsonSchema;
  }
  // thinkingLevel is a Gemini 3 feature; only send it for those models so we
  // don't 400 on older ones.
  if (thinkingLevel && /gemini-3/i.test(model)) {
    generationConfig.thinkingConfig = { thinkingLevel };
  }

  let res: Response;
  try {
    res = await fetch(
      `${API_BASE}/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig,
        }),
      }
    );
  } catch {
    throw new GeminiError('Network error reaching Gemini. Check your connection.');
  }

  if (!res.ok) {
    let detail = `${res.status} ${res.statusText}`;
    try {
      const body = await res.json();
      detail = body?.error?.message || detail;
    } catch {
      /* keep default detail */
    }
    if (res.status === 400 || res.status === 403) {
      throw new GeminiError(
        `Gemini rejected the request: ${detail}. Double-check your API key and model name.`
      );
    }
    if (res.status === 404) {
      throw new GeminiError(
        `Model "${model}" isn't available for your API key (it may be retired). Set a current model in Settings, e.g. "gemini-flash-latest".`
      );
    }
    if (res.status === 429) {
      throw new GeminiError(
        `Gemini quota exceeded for "${model}". Google's free tier doesn't include this model — switch to a free model like "gemini-flash-latest" in Settings, or enable billing on your API key.`
      );
    }
    throw new GeminiError(`Gemini error: ${detail}`);
  }

  const data = await res.json();
  const text: string | undefined =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ??
    undefined;

  if (!text) {
    const blockReason = data?.promptFeedback?.blockReason;
    throw new GeminiError(
      blockReason ? `Gemini blocked the response (${blockReason}).` : 'Gemini returned an empty response.'
    );
  }
  return text;
}

/** Human-readable snapshot of everything the coach reasons over. */
function buildContextBlock(ctx: CoachContext): string {
  const { profile, equipment, exerciseWeights, templates, recentWorkouts } = ctx;

  const profileText = profile
    ? [
        `- Gender: ${profile.gender}`,
        `- Age: ${profile.age}`,
        `- Height: ${profile.height} cm`,
        `- Weight: ${profile.weight} kg`,
        profile.bmi ? `- BMI: ${profile.bmi.toFixed(1)} (${profile.bmiCategory ?? ''})` : '',
        typeof profile.bodyFatPercentage === 'number'
          ? `- Body fat: ${profile.bodyFatPercentage.toFixed(1)}% (${profile.bodyFatMethod ?? ''})`
          : '',
        profile.neckCm ? `- Neck: ${profile.neckCm} cm` : '',
        profile.waistCm ? `- Waist: ${profile.waistCm} cm` : '',
      ]
        .filter(Boolean)
        .join('\n')
    : '- No personal profile provided.';

  const equipmentText = equipment.length
    ? equipment
        .map(
          (e) =>
            `- ${e.type}${e.maxWeight ? ` (max ${e.maxWeight} kg)` : ''}${
              e.notes ? ` — ${e.notes}` : ''
            }`
        )
        .join('\n')
    : '- No equipment specified (assume bodyweight only).';

  const weightsText = Object.keys(exerciseWeights).length
    ? Object.entries(exerciseWeights)
        .map(([name, w]) => `- ${name}: ${w} kg`)
        .join('\n')
    : '- No current working weights provided.';

  const templatesText = templates.length
    ? templates
        .map((t) => {
          const exs = t.exercises
            .map(
              (e) =>
                `    • ${e.name} — ${e.type === 'time' ? `${e.reps}s` : `${e.reps} reps`}${
                  e.targetMuscles?.length ? ` [${e.targetMuscles.join(', ')}]` : ''
                }`
            )
            .join('\n');
          return `- "${t.name}" (${t.numberOfSets} sets each):\n${exs}`;
        })
        .join('\n')
    : '- No saved workout templates.';

  const historyText = recentWorkouts.length
    ? recentWorkouts
        .slice(0, 10)
        .map((w) => {
          const mins = Math.round(w.duration / 60);
          return `- ${new Date(w.date).toLocaleDateString()} — "${w.name}": ${Math.round(
            w.completionPercentage
          )}% completed, ${mins} min`;
        })
        .join('\n')
    : '- No completed workouts logged yet.';

  return `## Personal profile
${profileText}

## Available equipment
${equipmentText}

## Current working weights
${weightsText}

## Saved workout templates
${templatesText}

## Recent sessions (newest first)
${historyText}`;
}

/**
 * Step 1 — analyze the user's data and return a concise, markdown-formatted
 * assessment plus a recommendation, without generating a full workout yet.
 */
export async function analyzeTraining(
  apiKey: string,
  model: string,
  ctx: CoachContext,
  thinkingLevel?: ThinkingLevel
): Promise<string> {
  const prompt = `You are an experienced, encouraging strength & conditioning coach.
Analyze the trainee's data below and write a concise assessment in markdown.

Cover, briefly:
1. What their profile and recent training suggest (consistency, completion rates, session length, volume).
2. Whether they seem ready to progress, should hold steady, or should ease off — and why.
3. Any imbalances, gaps, or risks you notice given their equipment and current weights.
4. End with a one-line question inviting them to choose a direction (harder / slight downgrade / maintain / something custom).

Keep it under ~200 words. Do not invent data that isn't provided. Use kg for weights.

${buildContextBlock(ctx)}`;

  return callGemini(apiKey, model, prompt, undefined, thinkingLevel);
}

/**
 * Step 2 — given the chosen direction, generate a concrete workout the user
 * can save as a template. Returns strongly-typed JSON.
 */
export async function generateWorkout(
  apiKey: string,
  model: string,
  ctx: CoachContext,
  direction: CoachDirection,
  customRequest?: string,
  thinkingLevel?: ThinkingLevel
): Promise<GeneratedWorkout> {
  const directionText: Record<CoachDirection, string> = {
    harder: 'Progress the training — make it more challenging (more volume, intensity, or harder variations), while staying safe and realistic for their equipment and current weights.',
    easier: 'Apply a slight downgrade — reduce intensity/volume a bit for recovery or to rebuild consistency, without losing the training effect.',
    maintain: 'Keep roughly the same difficulty — refresh the workout to maintain their current level and add variety.',
    custom: `Follow this specific request from the trainee: "${customRequest ?? ''}"`,
  };

  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      summary: { type: 'string', description: 'One or two sentences explaining the plan.' },
      numberOfSets: { type: 'integer', description: 'Sets performed for each exercise (2-5 typical).' },
      exercises: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['reps', 'time'] },
            reps: { type: 'integer', description: 'Reps, or seconds if type is "time".' },
            targetMuscles: { type: 'array', items: { type: 'string' } },
            suggestedWeightKg: { type: 'number', description: 'Working weight in kg, 0 for bodyweight.' },
            description: { type: 'string', description: 'Short cue or note (optional).' },
          },
          required: ['name', 'type', 'reps', 'targetMuscles'],
        },
      },
    },
    required: ['name', 'summary', 'numberOfSets', 'exercises'],
  };

  const prompt = `You are an experienced strength & conditioning coach.
Design ONE workout for the trainee based on their data below.

Direction: ${directionText[direction]}

Rules:
- Only use exercises that fit the trainee's available equipment.
- Suggested weights must respect their equipment's max weight and current working weights (progress gradually, ~2.5–5 kg or ~5-10% steps for "harder").
- Use "time" type (reps = seconds) for holds/carries/cardio; otherwise "reps".
- Give a sensible single numberOfSets for the whole workout.
- Bodyweight exercises use suggestedWeightKg = 0.
- Return ONLY the JSON described by the schema.

${buildContextBlock(ctx)}`;

  const raw = await callGemini(apiKey, model, prompt, schema, thinkingLevel);

  let parsed: GeneratedWorkout;
  try {
    parsed = JSON.parse(raw) as GeneratedWorkout;
  } catch {
    throw new GeminiError('Gemini returned malformed workout data. Try again.');
  }

  if (!parsed.exercises?.length) {
    throw new GeminiError('Gemini did not return any exercises. Try again.');
  }
  // Normalize/guard the values.
  parsed.numberOfSets = Math.min(Math.max(Math.round(parsed.numberOfSets || 3), 1), 8);
  parsed.exercises = parsed.exercises.map((e) => ({
    ...e,
    type: e.type === 'time' ? 'time' : 'reps',
    reps: Math.max(1, Math.round(e.reps || 1)),
    targetMuscles: Array.isArray(e.targetMuscles) ? e.targetMuscles : [],
  }));

  return parsed;
}

/**
 * Given a list of exercise names, return only the ones where tracking an added
 * working weight is meaningful (loaded lifts + commonly-weighted bodyweight
 * moves like push-ups/pull-ups), filtering out mobility/warm-up/cardio drills
 * (leg swings, ankle rolls, arm circles, …). Returns a subset of the input,
 * verbatim. Falls back to the full list on any parsing failure.
 */
export async function selectWeightableExercises(
  apiKey: string,
  model: string,
  exercises: string[],
  thinkingLevel?: ThinkingLevel
): Promise<string[]> {
  if (exercises.length === 0) return [];

  const schema = { type: 'array', items: { type: 'string' } };
  const prompt = `From the exercise list below, return ONLY the ones where tracking an added/external working weight makes sense.

Include:
- Loaded movements (dumbbell / kettlebell / barbell / cable / machine presses, rows, curls, squats, lunges, deadlifts, hip thrusts, calf raises, etc.).
- Bodyweight STRENGTH movements that people commonly load with a weight vest, plate, or dumbbell (push-ups, pull-ups, chin-ups, dips, squats, lunges, etc.).

Exclude:
- Mobility, warm-up, stretching, balance, or cardio drills where a "working weight" is meaningless (leg swings, arm circles, ankle rolls, arch body rocks, windshield wipers, jogging, jumping jacks, mountain climbers, light holds, etc.).

Return a JSON array of the EXACT strings from the input (verbatim — do not rename, translate, reword, or invent exercises).

Exercise list:
${exercises.map((e) => `- ${e}`).join('\n')}`;

  let raw: string;
  try {
    raw = await callGemini(apiKey, model, prompt, schema, thinkingLevel);
  } catch {
    return exercises; // network/model error — don't block onboarding
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return exercises;
  }
  if (!Array.isArray(parsed)) return exercises;

  // Guard against hallucinated names: keep only inputs the model selected,
  // matched case-insensitively, preserving the original input order.
  const selected = new Set(parsed.map((x) => String(x).trim().toLowerCase()));
  const result = exercises.filter((e) => selected.has(e.trim().toLowerCase()));
  return result.length ? result : exercises;
}

/** Convert an AI-generated workout into a saveable WorkoutTemplate. */
export function toTemplate(gen: GeneratedWorkout): WorkoutTemplate {
  return {
    id: crypto.randomUUID(),
    name: gen.name,
    numberOfSets: gen.numberOfSets,
    exercises: gen.exercises.map((e) => {
      const weightNote =
        typeof e.suggestedWeightKg === 'number' && e.suggestedWeightKg > 0
          ? `Suggested weight: ${e.suggestedWeightKg} kg`
          : '';
      const description = [e.description, weightNote].filter(Boolean).join(' — ');
      return {
        id: crypto.randomUUID(),
        name: e.name,
        reps: e.reps,
        type: e.type,
        targetMuscles: e.targetMuscles,
        description: description || undefined,
      };
    }),
  };
}
