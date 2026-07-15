import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Sparkles,
  Dumbbell,
  KeyRound,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  Wand2,
  Save,
  RefreshCw,
} from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { AICoachOnboardingModal } from '../components/AICoachOnboardingModal';
import {
  analyzeTraining,
  generateWorkout,
  toTemplate,
  type CoachContext,
  type CoachDirection,
  type GeneratedWorkout,
} from '../lib/gemini';

/** Minimal, safe markdown rendering (headings, bullets, bold) — no HTML injection. */
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;

    const inline = (s: string) =>
      s.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={j} className="font-semibold text-gray-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={j}>{part}</span>
        )
      );

    if (/^#{1,3}\s/.test(trimmed)) {
      const content = trimmed.replace(/^#{1,3}\s/, '');
      return (
        <h4 key={i} className="mt-3 mb-1 font-semibold text-gray-900 dark:text-white">
          {inline(content)}
        </h4>
      );
    }
    if (/^[-*]\s/.test(trimmed)) {
      return (
        <li key={i} className="ml-5 list-disc text-gray-700 dark:text-gray-300">
          {inline(trimmed.replace(/^[-*]\s/, ''))}
        </li>
      );
    }
    return (
      <p key={i} className="text-gray-700 dark:text-gray-300">
        {inline(trimmed)}
      </p>
    );
  });
}

export function Coach() {
  const {
    userProfile,
    equipment,
    exerciseWeights,
    templates,
    workouts,
    aiCoach,
    aiOnboarded,
    setAICoachConfig,
    addTemplate,
  } = useWorkoutStore();

  const [keyInput, setKeyInput] = useState('');
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState<CoachDirection | null>(null);
  const [generated, setGenerated] = useState<GeneratedWorkout | null>(null);
  const [lastDirection, setLastDirection] = useState<CoachDirection | null>(null);
  const [customText, setCustomText] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const hasKey = Boolean(aiCoach.apiKey);

  const context: CoachContext = useMemo(
    () => ({
      profile: userProfile,
      equipment,
      exerciseWeights,
      templates,
      recentWorkouts: [...workouts].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    }),
    [userProfile, equipment, exerciseWeights, templates, workouts]
  );

  const runAnalyze = async () => {
    setError(null);
    setGenerated(null);
    setSaved(false);
    setAnalyzing(true);
    try {
      const result = await analyzeTraining(aiCoach.apiKey, aiCoach.model, context, aiCoach.thinkingLevel);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const runGenerate = async (direction: CoachDirection, custom?: string) => {
    setError(null);
    setSaved(false);
    setGenerating(direction);
    setLastDirection(direction);
    try {
      const result = await generateWorkout(
        aiCoach.apiKey,
        aiCoach.model,
        context,
        direction,
        custom,
        aiCoach.thinkingLevel
      );
      setGenerated(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setGenerating(null);
    }
  };

  const handleSaveTemplate = () => {
    if (!generated) return;
    addTemplate(toTemplate(generated));
    setSaved(true);
    toast.success('Workout saved to your templates');
  };

  // --- No API key yet ---
  if (!hasKey) {
    return (
      <div className="space-y-6">
        <Header />
        <div className="card p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <KeyRound className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">Connect Gemini</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            The AI Coach uses Google Gemini. Paste your own API key — it's stored only on this device.
            Get one free at{' '}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-indigo-600 dark:text-indigo-400 underline"
            >
              aistudio.google.com/apikey
            </a>
            .
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="AIza..."
              className="input flex-1"
            />
            <button
              onClick={() => {
                setAICoachConfig({ apiKey: keyInput.trim() });
                setKeyInput('');
                toast.success('Gemini key saved');
              }}
              disabled={!keyInput.trim()}
              className="btn-primary"
            >
              Save key
            </button>
          </div>
          <p className="text-xs text-gray-400">
            You can also manage this later in <Link to="/settings" className="underline">Settings</Link>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header />

      {/* Equipment / weights status */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Dumbbell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Equipment & weights</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {aiOnboarded
                ? `${equipment.length} item${equipment.length !== 1 ? 's' : ''}, ${
                    Object.keys(exerciseWeights).length
                  } weight${Object.keys(exerciseWeights).length !== 1 ? 's' : ''} set`
                : 'Not set up yet'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setOnboardingOpen(true)}
          className="link"
        >
          {aiOnboarded ? 'Edit' : 'Set up'}
        </button>
      </div>

      {/* Analyze */}
      <div className="card p-6 space-y-4">
        {!aiOnboarded && (
          <div className="rounded-xl border border-amber-200/70 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-300">
            Tip: set up your equipment and current weights first so suggestions are realistic.
          </div>
        )}

        <button
          onClick={runAnalyze}
          disabled={analyzing}
          className="btn-primary w-full py-3"
        >
          {analyzing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          <span>{analyzing ? 'Analyzing your training…' : 'Analyze my training'}</span>
        </button>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        {analysis && (
          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4 space-y-1 text-sm">
            {renderMarkdown(analysis)}
          </div>
        )}

        {/* Direction choices appear once we have an analysis */}
        {analysis && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Where do you want to take it next?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <DirectionButton
                icon={<TrendingUp className="h-4 w-4" />}
                label="Harder"
                busy={generating === 'harder'}
                onClick={() => runGenerate('harder')}
              />
              <DirectionButton
                icon={<TrendingDown className="h-4 w-4" />}
                label="Slight downgrade"
                busy={generating === 'easier'}
                onClick={() => runGenerate('easier')}
              />
              <DirectionButton
                icon={<Minus className="h-4 w-4" />}
                label="Maintain"
                busy={generating === 'maintain'}
                onClick={() => runGenerate('maintain')}
              />
            </div>

            {!showCustom ? (
              <button
                onClick={() => setShowCustom(true)}
                className="link flex items-center gap-1"
              >
                <Wand2 className="h-4 w-4" /> Something custom…
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="e.g. focus on upper body, 30 min max, no jumping"
                  className="input flex-1"
                />
                <button
                  onClick={() => runGenerate('custom', customText.trim())}
                  disabled={!customText.trim() || generating === 'custom'}
                  className="btn-primary"
                >
                  {generating === 'custom' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  Generate
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Generated workout */}
      {generated && (
        <div className="card p-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">{generated.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{generated.summary}</p>
            </div>
            {lastDirection && (
              <button
                onClick={() => runGenerate(lastDirection, customText.trim() || undefined)}
                disabled={generating !== null}
                title="Regenerate"
                className="icon-btn flex-shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            {generated.numberOfSets} sets per exercise
          </div>

          <div className="divide-y dark:divide-gray-700">
            {generated.exercises.map((e, i) => (
              <div key={i} className="py-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{e.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {generated.numberOfSets} × {e.type === 'time' ? `${e.reps}s` : `${e.reps} reps`}
                    {e.targetMuscles?.length ? ` · ${e.targetMuscles.join(', ')}` : ''}
                  </p>
                  {e.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{e.description}</p>
                  )}
                </div>
                {typeof e.suggestedWeightKg === 'number' && e.suggestedWeightKg > 0 && (
                  <span className="flex-shrink-0 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {e.suggestedWeightKg} kg
                  </span>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveTemplate}
            disabled={saved}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-emerald-600/20 transition-colors hover:bg-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-offset-gray-950"
          >
            <Save className="h-4 w-4" />
            {saved ? 'Saved to templates' : 'Save as template'}
          </button>
        </div>
      )}

      <AICoachOnboardingModal isOpen={onboardingOpen} onClose={() => setOnboardingOpen(false)} />
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center space-x-3">
      <span className="icon-chip h-11 w-11 rounded-2xl"><Sparkles className="h-5 w-5" /></span>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">AI Coach</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Personalized analysis and workouts powered by Gemini.
        </p>
      </div>
    </div>
  );
}

function DirectionButton({
  icon,
  label,
  busy,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  busy: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm shadow-gray-950/[0.03] transition-colors hover:border-indigo-400 hover:text-indigo-600 disabled:pointer-events-none disabled:opacity-50 dark:border-white/10 dark:bg-gray-900 dark:text-gray-200 dark:shadow-none dark:hover:border-indigo-400/50 dark:hover:text-indigo-300"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : icon}
      {label}
    </button>
  );
}
