import { useEffect, useState, type ReactNode } from 'react';
import { DragDropContext, Draggable, Droppable, type DropResult } from '@hello-pangea/dnd';
import { ChevronDown, ChevronUp, GripVertical, Minus, Plus, PlusCircle } from 'lucide-react';
import { EditorBar, FullScreen, Group, Row, Segmented } from './ui';
import { MuscleSelect } from './MuscleSelect';
import { useI18n } from '../i18n';
import { useWorkoutStore } from '../store/useWorkoutStore';
import type { Exercise, WorkoutTemplate } from '../types/workout';

type DraftExercise = Omit<Exercise, 'sets'>;

const newExercise = (): DraftExercise => ({
  id: crypto.randomUUID(),
  name: '',
  reps: 10,
  type: 'reps',
  videoUrl: '',
  targetMuscles: [],
  description: '',
});

interface RoutineEditorProps {
  open: boolean;
  onClose: () => void;
  /** Routine to edit; omit to create a new one. */
  template?: WorkoutTemplate;
}

/** Full-screen editor for creating or editing a routine. */
export function RoutineEditor({ open, onClose, template }: RoutineEditorProps) {
  const { t, tp, clock } = useI18n();
  const { addTemplate, updateTemplate } = useWorkoutStore();
  const [name, setName] = useState('');
  const [sets, setSets] = useState(3);
  const [exercises, setExercises] = useState<DraftExercise[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(template?.name ?? '');
    setSets(template?.numberOfSets || 3);
    const list = template ? template.exercises.map((e) => ({ ...e })) : [newExercise()];
    setExercises(list);
    setExpanded(template ? null : list[0].id);
  }, [open, template]);

  const update = (id: string, patch: Partial<DraftExercise>) =>
    setExercises((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));

  const add = () => {
    const exercise = newExercise();
    setExercises((list) => [...list, exercise]);
    setExpanded(exercise.id);
  };

  const remove = (id: string) => setExercises((list) => list.filter((e) => e.id !== id));

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const list = Array.from(exercises);
    const [moved] = list.splice(result.source.index, 1);
    list.splice(result.destination.index, 0, moved);
    setExercises(list);
  };

  const valid = name.trim().length > 0 && exercises.length > 0 && exercises.every((e) => e.name.trim());

  const save = () => {
    if (!valid) return;
    const cleaned = exercises.map((e) => ({ ...e, name: e.name.trim(), reps: Math.max(1, Math.round(e.reps || 1)) }));
    if (template) {
      updateTemplate({ ...template, name: name.trim(), numberOfSets: sets, exercises: cleaned });
    } else {
      addTemplate({ id: crypto.randomUUID(), name: name.trim(), numberOfSets: sets, exercises: cleaned });
    }
    onClose();
  };

  const summary = (e: DraftExercise) => (e.type === 'time' ? clock(e.reps) : tp('session.reps', e.reps));

  return (
    <FullScreen
      open={open}
      onClose={onClose}
      tone="grouped"
      header={
        <EditorBar
          title={template ? t('editor.editTitle') : t('editor.newTitle')}
          onCancel={onClose}
          cancelLabel={t('common.cancel')}
          onSave={save}
          saveLabel={t('common.save')}
          saveDisabled={!valid}
        />
      }
    >
      <div className="px-4">
        <Group label={t('editor.routine')}>
          <Row
            label={t('editor.name')}
            htmlFor="routine-name"
            right={
              <input
                id="routine-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('editor.namePlaceholder')}
                className="w-48 bg-transparent text-right text-[15px] text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
              />
            }
          />
          <Row
            label={t('editor.setsPerExercise')}
            description={tp('editor.totalExercises', exercises.length * sets)}
            right={<Stepper value={sets} min={1} max={10} onChange={setSets} label={t('editor.setsPerExercise')} />}
          />
        </Group>

        <Group label={tp('editor.exercisesCount', exercises.length)} footnote={t('editor.dragHint')}>
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="exercises">
              {(drop) => (
                <div ref={drop.innerRef} {...drop.droppableProps} className="divide-y divide-gray-200/70 dark:divide-white/[0.06]">
                  {exercises.map((exercise, index) => (
                    <Draggable key={exercise.id} draggableId={exercise.id} index={index}>
                      {(drag, snapshot) => (
                        <div
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          className={`${expanded === exercise.id ? 'bg-indigo-50/60 dark:bg-indigo-500/[0.08]' : 'bg-gray-50 dark:bg-gray-900'} ${
                            snapshot.isDragging ? 'shadow-xl' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 px-4 py-3">
                            <span {...drag.dragHandleProps} aria-label={t('editor.dragHandle')} className="cursor-grab text-gray-300 active:cursor-grabbing dark:text-gray-600">
                              <GripVertical className="h-4 w-4" />
                            </span>
                            <span className={`w-4 text-[13px] tabular-nums ${expanded === exercise.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`}>
                              {index + 1}
                            </span>
                            <button
                              onClick={() => setExpanded(expanded === exercise.id ? null : exercise.id)}
                              className="flex min-w-0 flex-1 items-center justify-between gap-3 text-left"
                            >
                              <span className={`truncate text-[15px] ${expanded === exercise.id ? 'font-semibold' : ''} ${exercise.name ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                {exercise.name || t('editor.untitled')}
                              </span>
                              <span className="flex flex-shrink-0 items-center gap-1.5 text-[13px] text-gray-500 dark:text-gray-400">
                                {summary(exercise)}
                                {expanded === exercise.id ? (
                                  <ChevronUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                                )}
                              </span>
                            </button>
                          </div>

                          {expanded === exercise.id && (
                            <div className="ml-11 mr-4 divide-y divide-indigo-100 pb-3 text-[14px] dark:divide-white/[0.06]">
                              <Field label={t('editor.exerciseName')}>
                                <input
                                  value={exercise.name}
                                  onChange={(e) => update(exercise.id, { name: e.target.value })}
                                  placeholder={t('editor.exercisePlaceholder')}
                                  autoFocus={!exercise.name}
                                  className="w-full bg-transparent text-right text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
                                />
                              </Field>
                              <Field label={t('editor.type')}>
                                <Segmented
                                  label={t('editor.type')}
                                  value={exercise.type}
                                  onChange={(type) => update(exercise.id, { type, reps: type === 'time' ? 30 : 10 })}
                                  options={[
                                    { value: 'reps', label: t('editor.typeReps') },
                                    { value: 'time', label: t('editor.typeTime') },
                                  ]}
                                />
                              </Field>
                              <Field label={exercise.type === 'time' ? t('editor.seconds') : t('editor.repetitions')}>
                                <Stepper
                                  value={exercise.reps}
                                  min={1}
                                  max={exercise.type === 'time' ? 3600 : 500}
                                  step={exercise.type === 'time' ? 5 : 1}
                                  onChange={(reps) => update(exercise.id, { reps })}
                                  label={exercise.type === 'time' ? t('editor.seconds') : t('editor.repetitions')}
                                />
                              </Field>
                              <Field label={t('editor.video')}>
                                <input
                                  type="url"
                                  value={exercise.videoUrl ?? ''}
                                  onChange={(e) => update(exercise.id, { videoUrl: e.target.value })}
                                  placeholder="https://youtube.com/…"
                                  className="w-full bg-transparent text-right text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-white"
                                />
                              </Field>
                              <div className="py-2.5">
                                <p className="mb-2 text-gray-600 dark:text-gray-300">{t('editor.muscles')}</p>
                                <MuscleSelect
                                  label={t('editor.muscles')}
                                  value={exercise.targetMuscles}
                                  onChange={(targetMuscles) => update(exercise.id, { targetMuscles })}
                                />
                              </div>
                              <div className="py-2.5">
                                <p className="text-gray-600 dark:text-gray-300">{t('editor.notes')}</p>
                                <textarea
                                  value={exercise.description ?? ''}
                                  onChange={(e) => update(exercise.id, { description: e.target.value })}
                                  placeholder={t('editor.notesPlaceholder')}
                                  rows={2}
                                  className="input mt-2 resize-none"
                                />
                              </div>
                              <div className="pt-2.5">
                                <button onClick={() => remove(exercise.id)} className="text-[14px] font-medium text-red-600 dark:text-red-400">
                                  {t('editor.removeExercise')}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {drop.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
          <button onClick={add} className="flex w-full items-center gap-2 px-4 py-3 text-[15px] font-medium text-indigo-600 dark:text-indigo-400">
            <PlusCircle className="h-5 w-5" strokeWidth={1.75} />
            {t('editor.addExercise')}
          </button>
        </Group>
      </div>
    </FullScreen>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="flex-shrink-0 text-gray-600 dark:text-gray-300">{label}</span>
      <div className="flex min-w-0 flex-1 justify-end">{children}</div>
    </div>
  );
}

function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label: string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  return (
    <span className="flex items-center overflow-hidden rounded-lg border hairline bg-white dark:bg-transparent">
      <button type="button" aria-label={`− ${label}`} onClick={() => onChange(clamp(value - step))} className="px-2.5 py-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.06]">
        <Minus className="h-4 w-4" />
      </button>
      <input
        type="number"
        inputMode="numeric"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(clamp(parseInt(e.target.value, 10) || min))}
        className="w-12 border-x hairline bg-transparent py-1 text-center font-semibold tabular-nums text-gray-900 focus:outline-none dark:text-white"
      />
      <button type="button" aria-label={`+ ${label}`} onClick={() => onChange(clamp(value + step))} className="px-2.5 py-1.5 text-indigo-600 hover:bg-gray-100 dark:text-indigo-400 dark:hover:bg-white/[0.06]">
        <Plus className="h-4 w-4" />
      </button>
    </span>
  );
}
