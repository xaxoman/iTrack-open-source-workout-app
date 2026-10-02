import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Dumbbell, KeyRound, Loader2, RefreshCw, Settings2, Sparkles, Wand2 } from 'lucide-react';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { AICoachOnboardingModal } from '../components/AICoachOnboardingModal';
import { IconButton, PageTitle } from '../components/ui';
import { useI18n } from '../i18n';
import { useUnits } from '../utils/units';
import { equipmentLabel } from '../utils/equipment';
import {
  analyzeTraining,
  generateWorkout,
  toTemplate,
  type CoachContext,
  type CoachDirection,
  type GeneratedWorkout,
} from '../lib/gemini';

/** Minimal, safe markdown rendering (headings, bullets, numbered items, bold). */
function renderMarkdown(text: string): ReactNode[] {
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
  return text.split('\n').map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;
    if (/^#{1,3}\s/.test(trimmed)) {
      return (
        <p key={i} className="mt-3 font-semibold text-gray-900 dark:text-white">
          {inline(trimmed.replace(/^#{1,3}\s/, ''))}
        </p>
      );
    }
    const bullet = trimmed.match(/^([-*]|\d+[.)])\s+(.*)$/);
    if (bullet) {
      return (
        <div key={i} className="flex gap-3">
          <span className="tabular-nums text-gray-400">{/^\d/.test(bullet[1]) ? bullet[1] : '•'}</span>
          <span>{inline(bullet[2])}</span>
        </div>
      );
    }
    return <p key={i}>{inline(trimmed)}</p>;
  });
}

export function Coach() {
  const { t, tp, tx, lang, clock } = useI18n();
  const { unit, format } = useUnits();
  const navigate = useNavigate();
  const { userProfile, equipment, exerciseWeights, templates, workouts, weightLog, aiCoach, aiOnboarded, setAICoachConfig, addTemplate } = useWorkoutStore();

  const [keyInput, setKeyInput] = useState('');
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [direction, setDirection] = useState<CoachDirection>('harder');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedWorkout | null>(null);
  const [customText, setCustomText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const locale = { lang, unit };
  const context: CoachContext = useMemo(
    () => ({
      profile: userProfile,
      equipment,
      exerciseWeights,
      templates,
      recentWorkouts: [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      weightLog,
    }),
    [userProfile, equipment, exerciseWeights, templates, workouts, weightLog]
  );

  const analyze = async () => {
    setError(null);
    setGenerated(null);
    setSaved(false);
    setAnalyzing(true);
    try {
      setAnalysis(await analyzeTraining(aiCoach.apiKey, aiCoach.model, context, aiCoach.thinkingLevel, locale));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('coach.errors.analysis'));
    } finally {
      setAnalyzing(false);
    }
  };

  const generate = async (dir: CoachDirection) => {
    setError(null);
    setSaved(false);
    setDirection(dir);
    setGenerating(true);
    try {
      setGenerated(await generateWorkout(aiCoach.apiKey, aiCoach.model, context, dir, dir === 'custom' ? customText.trim() : undefined, aiCoach.thinkingLevel, locale));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('coach.errors.generation'));
    } finally {
      setGenerating(false);
    }
  };

  const saveTemplate = () => {
    if (!generated) return;
    addTemplate(toTemplate(generated, (kg) => format(kg)));
    setSaved(true);
    toast.success(t('coach.savedToast'));
  };

  const equipmentSummary = equipment.length
    ? equipment
        .map((e) => `${equipmentLabel(tx, e.type)}${e.maxWeight ? ` ≤ ${format(e.maxWeight, 0)}` : ''}`)
        .join(' · ')
    : t('coach.noEquipment');

  const header = (
    <PageTitle
      eyebrow={t('coach.eyebrow')}
      title={t('coach.title')}
      actions={
        <IconButton label={t('nav.settings')} onClick={() => navigate('/settings')}>
          <Settings2 className="h-5 w-5" strokeWidth={1.75} />
        </IconButton>
      }
    />
  );

  if (!aiCoach.apiKey) {
    return (
      <div>
        {header}
        <section className="mt-4 border-t hairline pt-4">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-gray-900 dark:text-white">
            <KeyRound className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            {t('coach.connectTitle')}
          </p>
          <p className="mt-1 text-[14px] leading-relaxed text-gray-500 dark:text-gray-400">
            {t('coach.connectBody')}{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 underline dark:text-indigo-400">
              aistudio.google.com/apikey
            </a>
          </p>
          <div className="mt-4 flex gap-2">
            <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} placeholder="AIza…" aria-label={t('settings.geminiKey')} className="input flex-1 text-[16px]" />
            <button
              onClick={() => {
                setAICoachConfig({ apiKey: keyInput.trim() });
                setKeyInput('');
                toast.success(t('coach.keySaved'));
              }}
              disabled={!keyInput.trim()}
              className="pill-primary"
            >
              {t('coach.saveKey')}
            </button>
          </div>
        </section>
      </div>
    );
  }

  const directions: { value: CoachDirection; label: string }[] = [
    { value: 'harder', label: t('coach.harder') },
    { value: 'easier', label: t('coach.easier') },
    { value: 'maintain', label: t('coach.maintain') },
  ];

  return (
    <div>
      {header}
      <button onClick={() => setOnboardingOpen(true)} className="mt-1 flex items-center gap-2 text-left text-[12px] text-gray-500 dark:text-gray-400">
        <Dumbbell className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.75} />
        <span>
          {aiOnboarded ? equipmentSummary : t('coach.setupPrompt')}{' '}
          <span className="font-medium text-indigo-600 dark:text-indigo-400">{aiOnboarded ? t('common.edit') : t('coach.setUp')}</span>
        </span>
      </button>

      <section className="mt-4 border-t hairline pt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="cap">{t('coach.analysis')}</p>
          {analysis && (
            <button onClick={analyze} disabled={analyzing} className="text-[13px] font-medium text-indigo-600 disabled:opacity-50 dark:text-indigo-400">
              {t('coach.again')}
            </button>
          )}
        </div>
        {analysis ? (
          <div className="mt-2 space-y-1.5 text-[14px] leading-snug text-gray-800 dark:text-gray-200">{renderMarkdown(analysis)}</div>
        ) : (
          <button onClick={analyze} disabled={analyzing} className="pill-dark mt-3 w-full">
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {analyzing ? t('coach.analyzing') : t('coach.analyze')}
          </button>
        )}
      </section>

      {analysis && (
        <section className="mt-5 border-t hairline pt-4">
          <p className="cap">{t('coach.nextWorkout')}</p>
          <div className="mt-2 grid grid-cols-3 overflow-hidden rounded-xl border hairline text-[13px] font-medium" role="radiogroup">
            {directions.map((d, i) => (
              <button
                key={d.value}
                role="radio"
                aria-checked={direction === d.value && generated !== null}
                onClick={() => generate(d.value)}
                disabled={generating}
                className={`py-2 transition-colors ${i ? 'border-l hairline' : ''} ${
                  direction === d.value && (generating || generated)
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.04]'
                }`}
              >
                {generating && direction === d.value ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : d.label}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && customText.trim() && generate('custom')}
              placeholder={t('coach.customPlaceholder')}
              aria-label={t('coach.custom')}
              className="input flex-1 text-[15px]"
            />
            <button onClick={() => generate('custom')} disabled={!customText.trim() || generating} aria-label={t('coach.generate')} className="pill-secondary px-4">
              {generating && direction === 'custom' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            </button>
          </div>

          {generated && (
            <div className="mt-5">
              <div className="flex items-baseline justify-between gap-3">
                <p className="text-[18px] font-semibold text-gray-900 dark:text-white">{generated.name}</p>
                <span className="flex-shrink-0 text-[12px] text-gray-500 dark:text-gray-400">{tp('coach.setsEach', generated.numberOfSets)}</span>
              </div>
              {generated.summary && <p className="mt-1 text-[13px] leading-snug text-gray-500 dark:text-gray-400">{generated.summary}</p>}
              <div className="mt-2">
                {generated.exercises.map((e, i) => (
                  <div key={i} className="border-b border-gray-100 py-2.5 dark:border-white/[0.06]">
                    <div className="grid grid-cols-[1fr_56px_64px] items-baseline text-[14px]">
                      <span className="text-gray-900 dark:text-white">{e.name}</span>
                      <span className="tabular-nums text-gray-500 dark:text-gray-400">× {e.type === 'time' ? clock(e.reps) : e.reps}</span>
                      <span
                        className={`text-right font-semibold tabular-nums ${
                          e.suggestedWeightKg ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-300 dark:text-gray-600'
                        }`}
                      >
                        {e.suggestedWeightKg ? format(e.suggestedWeightKg) : '—'}
                      </span>
                    </div>
                    {e.description && <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400">{e.description}</p>}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={saveTemplate} disabled={saved} className="pill-dark flex-1">
                  {saved ? t('coach.saved') : t('coach.saveTemplate')}
                </button>
                <button onClick={() => generate(direction)} disabled={generating} className="pill-secondary">
                  <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} strokeWidth={1.75} />
                  {t('coach.again')}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {error && <p className="mt-4 rounded-2xl bg-red-50 p-4 text-[14px] text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}

      <AICoachOnboardingModal isOpen={onboardingOpen} onClose={() => setOnboardingOpen(false)} />
    </div>
  );
}
