import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { ChevronRight, Languages, Play, RefreshCw, Smartphone } from 'lucide-react';
import toast from 'react-hot-toast';
import { useWorkoutStore } from '../store/useWorkoutStore';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationSettingsModal, DAY_IDS } from '../components/NotificationSettingsModal';
import { UserProfileModal } from '../components/UserProfileModal';
import { AuthModal } from '../components/AuthModal';
import { AICoachOnboardingModal } from '../components/AICoachOnboardingModal';
import { Group, OptionRow, PageTitle, Row, Segmented, Sheet, Switch } from '../components/ui';
import { isSupabaseConfigured } from '../lib/supabase';
import { getSyncableData } from '../lib/cloudSync';
import { useI18n, resolveLang, systemLang, type LanguagePref } from '../i18n';
import { useUnits } from '../utils/units';
import { previewSound, type RestSound } from '../utils/sound';

const LANGUAGES: { value: LanguagePref; flag: string; native: string }[] = [
  { value: 'en', flag: '🇬🇧', native: 'English' },
  { value: 'it', flag: '🇮🇹', native: 'Italiano' },
];

export function Settings() {
  const { t, tp, weekdays, number, date } = useI18n();
  const { format } = useUnits();
  const {
    darkMode,
    toggleDarkMode,
    notificationSettings,
    updateNotificationSettings,
    userProfile,
    updateUserProfile,
    importData,
    aiCoach,
    aiOnboarded,
    equipment,
    language,
    setLanguage,
    weightUnit,
    setWeightUnit,
    restSound,
    setRestSound,
    restVibrate,
    setRestVibrate,
    autoBackup,
    setAutoBackup,
  } = useWorkoutStore();
  const { user, storageMode, syncing, lastSyncedAt, setStorageMode, syncNow } = useAuthStore();

  const [sheet, setSheet] = useState<null | 'language' | 'sound' | 'storage' | 'coach' | 'profile' | 'reminders' | 'auth' | 'equipment'>(null);
  const close = () => setSheet(null);

  const languageLabel = (pref: LanguagePref) =>
    pref === 'system' ? t('settings.systemDefault') : LANGUAGES.find((l) => l.value === pref)?.native ?? pref;

  const profileSummary = userProfile
    ? [`${number(userProfile.height, 0)} cm`, format(userProfile.weight), userProfile.bmi ? `${t('profile.bmi')} ${number(userProfile.bmi, 1, 1)}` : '']
        .filter(Boolean)
        .join(' · ')
    : t('settings.notSet');

  const shortDays = weekdays('short');
  const remindersSummary = notificationSettings.enabled
    ? `${DAY_IDS.filter((d) => notificationSettings.days.includes(d))
        .map((d) => shortDays[DAY_IDS.indexOf(d)].replace('.', ''))
        .join(', ')} · ${notificationSettings.time}`
    : t('settings.off');

  const soundLabel = (s: RestSound) => t(`sound.${s}`);

  const storageSummary =
    storageMode === 'supabase'
      ? user
        ? syncing
          ? t('auth.syncing')
          : lastSyncedAt
            ? t('settings.syncedAt', { time: date(lastSyncedAt, { hour: '2-digit', minute: '2-digit' }) })
            : t('settings.cloud')
        : t('settings.cloudSignIn')
      : t('settings.thisDevice');

  const chooseStorage = (mode: 'local' | 'supabase') => {
    if (mode === 'supabase' && (!isSupabaseConfigured || !user)) {
      setSheet('auth');
      return;
    }
    setStorageMode(mode);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(getSyncableData(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `itrack-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        importData(JSON.parse(e.target?.result as string));
        toast.success(t('settings.importDone'));
      } catch (error) {
        console.error('Import failed:', error);
        toast.error(t('settings.importFailed'));
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div>
      <PageTitle title={t('nav.settings')} />

      <Group label={t('settings.profile')}>
        <Row label={t('settings.body')} value={profileSummary} onClick={() => setSheet('profile')} />
      </Group>

      <Group label={t('settings.general')}>
        <Row label={t('settings.language')} value={languageLabel(language)} onClick={() => setSheet('language')} />
        <Row
          label={t('settings.units')}
          right={
            <Segmented
              label={t('settings.units')}
              value={weightUnit}
              onChange={setWeightUnit}
              options={[
                { value: 'kg', label: 'kg' },
                { value: 'lb', label: 'lb' },
              ]}
            />
          }
        />
        <Row label={t('settings.darkMode')} right={<Switch checked={darkMode} onChange={toggleDarkMode} label={t('settings.darkMode')} />} />
      </Group>

      <Group label={t('settings.workout')} footnote={t('settings.soundFootnote')}>
        <Row label={t('settings.reminders')} value={remindersSummary} onClick={() => setSheet('reminders')} />
        <Row label={t('settings.restSound')} value={soundLabel(restSound)} onClick={() => setSheet('sound')} />
        <Row label={t('settings.vibrate')} right={<Switch checked={restVibrate} onChange={setRestVibrate} label={t('settings.vibrate')} />} />
      </Group>

      <Group label={t('settings.data')}>
        <Row label={t('settings.storage')} value={storageSummary} onClick={() => setSheet('storage')} />
        {Capacitor.isNativePlatform() && (
          <Row
            label={t('settings.autoBackup')}
            description={t('settings.autoBackupHint')}
            right={<Switch checked={autoBackup} onChange={setAutoBackup} label={t('settings.autoBackup')} />}
          />
        )}
        <Row label={t('settings.export')} value="JSON" onClick={exportData} />
        <Row
          label={t('settings.import')}
          htmlFor="import-file"
          value={t('settings.chooseFile')}
          right={<ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300 dark:text-gray-600" />}
        />
        <input id="import-file" type="file" accept=".json,application/json" onChange={importFile} className="hidden" />
      </Group>

      <Group label={t('settings.coach')} footnote={t('settings.coachFootnote')}>
        <Row label={t('settings.geminiKey')} value={aiCoach.apiKey ? t('settings.keySaved') : t('settings.notSet')} onClick={() => setSheet('coach')} />
        <Row label={t('settings.model')} value={`${aiCoach.model} · ${t(`settings.reasoning${aiCoach.thinkingLevel === 'high' ? 'High' : 'Low'}`)}`} onClick={() => setSheet('coach')} />
        <Row
          label={t('settings.equipment')}
          value={aiOnboarded ? tp('settings.equipmentItems', equipment.length) : t('settings.notSet')}
          onClick={() => setSheet('equipment')}
        />
      </Group>

      <p className="mt-8 text-center text-[12px] text-gray-400 dark:text-gray-500">{t('settings.footer')}</p>

      {/* Language */}
      <Sheet open={sheet === 'language'} onClose={close} title={t('settings.language')} subtitle={t('settings.languageHint')}>
        <div className="mt-3 divide-y divide-gray-100 border-y border-gray-100 dark:divide-white/[0.06] dark:border-white/[0.06]">
          <OptionRow
            selected={language === 'system'}
            onSelect={() => setLanguage('system')}
            leading={<Smartphone className="h-5 w-5 text-gray-400" strokeWidth={1.75} />}
            label={t('settings.systemDefault')}
            description={t('settings.currently', { lang: languageLabel(systemLang()) })}
          />
          {LANGUAGES.map((l) => (
            <OptionRow
              key={l.value}
              selected={language === l.value}
              onSelect={() => setLanguage(l.value)}
              leading={<span className="text-[22px] leading-none">{l.flag}</span>}
              label={l.native}
              description={resolveLang(language) !== l.value ? t(`settings.lang.${l.value as 'en' | 'it'}`) : undefined}
            />
          ))}
        </div>
        <p className="mx-6 mt-3 flex items-center gap-1.5 text-[13px] text-gray-500 dark:text-gray-400">
          <Languages className="h-4 w-4 text-indigo-600 dark:text-indigo-400" strokeWidth={1.75} />
          {t('settings.helpTranslate')}{' '}
          <a href="https://github.com/xaxoman/iTrack-open-source-workout-app" target="_blank" rel="noreferrer" className="font-medium text-indigo-600 dark:text-indigo-400">
            GitHub
          </a>
        </p>
      </Sheet>

      {/* Rest sound */}
      <Sheet open={sheet === 'sound'} onClose={close} title={t('settings.restSound')} subtitle={t('settings.soundFootnote')}>
        <div className="mt-3 divide-y divide-gray-100 border-y border-gray-100 dark:divide-white/[0.06] dark:border-white/[0.06]">
          {(['beep', 'chime', 'off'] as RestSound[]).map((s) => (
            <OptionRow
              key={s}
              selected={restSound === s}
              onSelect={() => {
                setRestSound(s);
                previewSound(s);
              }}
              label={soundLabel(s)}
              trailing={
                s !== 'off' ? (
                  <button
                    onClick={() => previewSound(s)}
                    aria-label={t('settings.preview', { sound: soundLabel(s) })}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300"
                  >
                    <Play className="h-3.5 w-3.5 translate-x-[1px] fill-current" />
                  </button>
                ) : undefined
              }
            />
          ))}
        </div>
      </Sheet>

      {/* Storage */}
      <Sheet open={sheet === 'storage'} onClose={close} title={t('settings.storage')} subtitle={t('settings.storageHint')}>
        <div className="mt-3 divide-y divide-gray-100 border-y border-gray-100 dark:divide-white/[0.06] dark:border-white/[0.06]">
          <OptionRow selected={storageMode === 'local'} onSelect={() => chooseStorage('local')} label={t('settings.thisDevice')} description={t('settings.thisDeviceHint')} />
          <OptionRow selected={storageMode === 'supabase'} onSelect={() => chooseStorage('supabase')} label={t('settings.cloud')} description={t('settings.cloudHint')} />
        </div>
        {storageMode === 'supabase' && (
          <div className="mt-4 flex flex-wrap gap-2 px-6">
            {user && (
              <button onClick={() => syncNow().catch(() => {})} disabled={syncing} className="pill-secondary py-2 text-[14px]">
                <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? t('auth.syncing') : t('auth.syncNow')}
              </button>
            )}
            <button onClick={() => setSheet('auth')} className="pill-secondary py-2 text-[14px]">
              {user ? t('settings.manageAccount') : t('settings.signInToSync')}
            </button>
          </div>
        )}
      </Sheet>

      <CoachSheet open={sheet === 'coach'} onClose={close} />

      <NotificationSettingsModal isOpen={sheet === 'reminders'} onClose={close} onSave={updateNotificationSettings} currentSettings={notificationSettings} />
      <UserProfileModal isOpen={sheet === 'profile'} onClose={close} onSave={updateUserProfile} currentProfile={userProfile ?? undefined} />
      <AuthModal isOpen={sheet === 'auth'} onClose={close} />
      <AICoachOnboardingModal isOpen={sheet === 'equipment'} onClose={close} />
    </div>
  );
}

/** Gemini key, model and reasoning level (stored only on this device). */
function CoachSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useI18n();
  const { aiCoach, setAICoachConfig } = useWorkoutStore();
  const [key, setKey] = useState(aiCoach.apiKey);
  const [model, setModel] = useState(aiCoach.model);
  const [level, setLevel] = useState<'low' | 'high'>(aiCoach.thinkingLevel);

  const [lastOpen, setLastOpen] = useState(false);
  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      setKey(aiCoach.apiKey);
      setModel(aiCoach.model);
      setLevel(aiCoach.thinkingLevel);
    }
  }

  const save = () => {
    setAICoachConfig({ apiKey: key.trim(), model: model.trim() || 'gemini-3.5-flash', thinkingLevel: level });
    toast.success(t('settings.coachSaved'));
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose} title={t('settings.coach')} subtitle={t('settings.coachFootnote')}>
      <div className="mt-5 space-y-4 px-6">
        <div>
          <label htmlFor="gemini-key" className="label">
            {t('settings.geminiKey')}
          </label>
          <input id="gemini-key" type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="AIza…" autoComplete="off" className="input text-[16px]" />
          <p className="mt-1.5 text-[12px] text-gray-400">
            {t('settings.getKey')}{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" className="text-indigo-600 underline dark:text-indigo-400">
              aistudio.google.com/apikey
            </a>
          </p>
        </div>
        <div>
          <label htmlFor="gemini-model" className="label">
            {t('settings.model')}
          </label>
          <input id="gemini-model" value={model} onChange={(e) => setModel(e.target.value)} placeholder="gemini-3.5-flash" className="input text-[16px]" />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[15px] text-gray-900 dark:text-white">{t('settings.reasoning')}</span>
          <Segmented
            label={t('settings.reasoning')}
            value={level}
            onChange={setLevel}
            options={[
              { value: 'high', label: t('settings.reasoningHigh') },
              { value: 'low', label: t('settings.reasoningLow') },
            ]}
          />
        </div>
        <p className="text-[12px] text-gray-400">{t('settings.reasoningHint')}</p>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2 px-6">
        <button onClick={onClose} className="pill-secondary">
          {t('common.cancel')}
        </button>
        <button onClick={save} className="pill-primary">
          {t('common.save')}
        </button>
      </div>
    </Sheet>
  );
}
