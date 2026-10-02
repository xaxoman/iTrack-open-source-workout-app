import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronUp, ClipboardList, Pencil, Play, Plus, StickyNote, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { ActiveWorkout, type WorkoutResult } from '../components/ActiveWorkout';
import { RoutineEditor } from '../components/RoutineEditor';
import { RoutineNotes } from '../components/RoutineNotes';
import { HistoryCalendar } from '../components/HistoryCalendar';
import { PastWorkout } from '../components/PastWorkout';
import { LogWeightSheet } from '../components/LogWeightSheet';
import { Dialog, IconButton, PageTitle, Tabs } from '../components/ui';
import { useI18n } from '../i18n';
import type { WorkoutTemplate } from '../types/workout';
import { latestWorkout, workoutsForTemplate } from '../utils/workout';

type Tab = 'routines' | 'history';

export function Workouts() {
  const { t, tp, clock, date } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('tab') === 'history' ? 'history' : 'routines';

  const { workouts, templates, routineBookmarks, deleteTemplate, addWorkout, setIsWorkoutActive } = useWorkoutStore();

  const [active, setActive] = useState<WorkoutTemplate | null>(null);
  const [expanded, setExpanded] = useState<string | null>(templates[0]?.id ?? null);
  const [editor, setEditor] = useState<{ template?: WorkoutTemplate } | null>(null);
  const [notesFor, setNotesFor] = useState<WorkoutTemplate | null>(null);
  const [deleteFor, setDeleteFor] = useState<WorkoutTemplate | null>(null);
  const [openWorkoutId, setOpenWorkoutId] = useState<string | null>(null);
  const [weightPrompt, setWeightPrompt] = useState(false);

  const start = (template: WorkoutTemplate) => {
    setNotesFor(null);
    setActive(template);
    setIsWorkoutActive(true);
  };

  // "Start" from the Today screen arrives as navigation state.
  useEffect(() => {
    const state = location.state as { start?: string; create?: boolean } | null;
    if (!state?.start && !state?.create) return;
    if (state.create) setEditor({});
    const template = templates.find((tpl) => tpl.id === state.start);
    if (template) start(template);
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
    // Run once per navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const finish = (template: WorkoutTemplate, result: WorkoutResult) => {
    // A session where nothing was ticked off isn't worth logging.
    if (result.completionPercentage > 0) {
      addWorkout({
        id: crypto.randomUUID(),
        name: template.name,
        templateId: template.id,
        exercises: result.exercises,
        date: result.startedAt,
        duration: result.duration,
        completionPercentage: result.completionPercentage,
        completed: true,
        completedExerciseIds: result.completedExerciseIds,
      });
      setWeightPrompt(true);
    }
    setActive(null);
    setIsWorkoutActive(false);
  };

  const setTab = (next: Tab) => setParams(next === 'history' ? { tab: 'history' } : {}, { replace: true });

  const openWorkout = workouts.find((w) => w.id === openWorkoutId) ?? null;
  const thisMonth = workouts.filter((w) => {
    const d = new Date(w.date);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div>
      <PageTitle
        eyebrow={tab === 'routines' ? tp('workouts.routineCount', templates.length) : tp('workouts.thisMonth', thisMonth)}
        title={t('nav.workouts')}
        actions={
          <IconButton label={t('workouts.newRoutine')} onClick={() => setEditor({})}>
            <Plus className="h-5 w-5" strokeWidth={1.75} />
          </IconButton>
        }
      />
      <div className="mt-3">
        <Tabs
          value={tab}
          onChange={setTab}
          options={[
            { value: 'routines', label: t('workouts.routines') },
            { value: 'history', label: t('workouts.history') },
          ]}
        />
      </div>

      {tab === 'routines' ? (
        templates.length === 0 ? (
          <div className="py-14 text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/[0.06] dark:text-gray-500">
              <ClipboardList className="h-6 w-6" />
            </span>
            <p className="text-[15px] font-medium text-gray-900 dark:text-white">{t('workouts.emptyTitle')}</p>
            <p className="mx-auto mt-1 max-w-xs text-[14px] text-gray-500 dark:text-gray-400">{t('workouts.emptyBody')}</p>
            <button onClick={() => setEditor({})} className="pill-primary mt-5">
              <Plus className="h-4 w-4" />
              {t('workouts.newRoutine')}
            </button>
          </div>
        ) : (
          <div>
            {templates.map((template) => {
              const isOpen = expanded === template.id;
              const last = latestWorkout(workoutsForTemplate(template, workouts));
              const sets = template.numberOfSets || 1;
              const noteCount = (routineBookmarks[template.id] ?? []).length;
              const metaParts = [t('workouts.exercisesTimesSets', { ex: template.exercises.length, sets })];
              if (last) {
                metaParts.push(t('workouts.lastDone', { when: date(last.date, { weekday: 'short', day: 'numeric', month: 'short' }) }));
                metaParts.push(`${Math.round(last.completionPercentage)}%`);
              } else {
                metaParts.push(t('workouts.neverDone'));
              }
              return (
                <div key={template.id} className="border-b hairline py-4">
                  <button
                    onClick={() => setExpanded(isOpen ? null : template.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <p className="text-[17px] font-semibold text-gray-900 dark:text-white">{template.name}</p>
                      <p className="text-[13px] text-gray-500 dark:text-gray-400">{metaParts.join(' · ')}</p>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                    ) : (
                      <ChevronDown className="mt-0.5 h-5 w-5 flex-shrink-0 text-gray-400" />
                    )}
                  </button>
                  {isOpen && (
                    <>
                      <ol className="mt-3 divide-y divide-gray-200/70 rounded-xl bg-gray-50 px-3 dark:divide-white/[0.06] dark:bg-gray-900">
                        {template.exercises.map((exercise, i) => (
                          <li key={exercise.id} className="flex items-center gap-3 py-2 text-[13px]">
                            <span className="w-4 tabular-nums text-gray-400">{i + 1}</span>
                            <span className="flex-1 truncate text-gray-800 dark:text-gray-200">{exercise.name}</span>
                            <span className="tabular-nums text-gray-500 dark:text-gray-400">
                              {exercise.type === 'time' ? clock(exercise.reps) : tp('session.reps', exercise.reps)}
                            </span>
                          </li>
                        ))}
                      </ol>
                      <div className="mt-3 flex items-center gap-2">
                        <button onClick={() => start(template)} className="pill-primary flex-1 py-2.5 text-[14px]">
                          <Play className="h-4 w-4 fill-current" />
                          {t('common.start')}
                        </button>
                        <RoundAction label={t('common.edit')} onClick={() => setEditor({ template })}>
                          <Pencil className="h-4 w-4" strokeWidth={1.75} />
                        </RoundAction>
                        <RoundAction label={t('workouts.notes')} onClick={() => setNotesFor(template)} badge={noteCount}>
                          <StickyNote className="h-4 w-4" strokeWidth={1.75} />
                        </RoundAction>
                        <RoundAction label={t('common.delete')} onClick={() => setDeleteFor(template)}>
                          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                        </RoundAction>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <HistoryCalendar workouts={workouts} onOpen={(w) => setOpenWorkoutId(w.id)} />
      )}

      {active && <ActiveWorkout template={active} onFinish={(result) => finish(active, result)} />}

      <RoutineEditor open={editor !== null} onClose={() => setEditor(null)} template={editor?.template} />
      <RoutineNotes template={notesFor} onClose={() => setNotesFor(null)} onStart={start} />
      <PastWorkout workout={openWorkout} onClose={() => setOpenWorkoutId(null)} />

      <Dialog
        open={deleteFor !== null}
        onClose={() => setDeleteFor(null)}
        title={t('workouts.deleteTitle')}
        actions={
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setDeleteFor(null)} className="pill-secondary py-2.5">
              {t('common.cancel')}
            </button>
            <button
              onClick={() => {
                if (deleteFor) {
                  deleteTemplate(deleteFor.id);
                  toast.success(t('workouts.deleted'));
                }
                setDeleteFor(null);
              }}
              className="pill-danger py-2.5"
            >
              {t('common.delete')}
            </button>
          </div>
        }
      >
        {t('workouts.deleteBody', { name: deleteFor?.name ?? '' })}
      </Dialog>

      <LogWeightSheet open={weightPrompt} onClose={() => setWeightPrompt(false)} title={t('weight.promptTitle')} subtitle={t('weight.promptSubtitle')} />
    </div>
  );
}

function RoundAction({ label, onClick, badge, children }: { label: string; onClick: () => void; badge?: number; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border hairline text-gray-600 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-white/[0.06]"
    >
      {children}
      {badge ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold text-white dark:bg-indigo-500">
          {badge}
        </span>
      ) : null}
    </button>
  );
}
