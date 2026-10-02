import type { ReactNode } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Dumbbell, Home, LineChart, Settings, Sparkles } from 'lucide-react';
import { useI18n } from '../i18n';

export function Layout() {
  const { t } = useI18n();

  const tabs = [
    { to: '/', icon: Home, label: t('nav.today') },
    { to: '/workouts', icon: Dumbbell, label: t('nav.workouts') },
    { to: '/progress', icon: LineChart, label: t('nav.progress') },
    { to: '/settings', icon: Settings, label: t('nav.settings') },
  ];

  return (
    <div className="min-h-screen bg-white transition-colors dark:bg-gray-950">
      {/* Wide screens: slim top bar. Coach sits here; on phones it opens from Today. */}
      <nav className="sticky top-0 z-40 hidden border-b hairline bg-white/90 backdrop-blur dark:bg-gray-950/90 md:block">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <NavLink to="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <Dumbbell className="h-4 w-4" />
            </span>
            <span className="font-semibold tracking-tight text-gray-900 dark:text-white">iTrack</span>
          </NavLink>
          <div className="flex items-center gap-1">
            {[...tabs.slice(0, 3), { to: '/coach', icon: Sparkles, label: t('nav.coach') }, tabs[3]].map((tab) => (
              <TopLink key={tab.to} to={tab.to}>
                {tab.label}
              </TopLink>
            ))}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-5 pb-32 pt-safe md:pb-16">
        <div className="pt-4 md:pt-8">
          <Outlet />
        </div>
      </main>

      {/* Phones: bottom tab bar with a hairline indicator on the active tab. */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t hairline bg-white/95 px-3 pb-safe backdrop-blur dark:bg-gray-950/95 md:hidden">
        <div className="flex">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center gap-1 pb-2 pt-3 text-[10.5px] font-medium transition-colors ${
                  isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute top-0 h-[2px] w-8 rounded-full bg-indigo-600 dark:bg-indigo-400" />}
                  <Icon className="h-[21px] w-[21px]" strokeWidth={isActive ? 2.1 : 1.75} />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

function TopLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `rounded-full px-3 py-1.5 text-[14px] font-medium transition-colors ${
          isActive
            ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-950'
            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
        }`
      }
    >
      {children}
    </NavLink>
  );
}
