'use client';

import { LuRefreshCw } from 'react-icons/lu';
import { useState } from 'react';

import { TodayTasks } from '../components/dashboard/today-tasks';
import { ScheduledTasks } from '../components/dashboard/scheduled-tasks';
import { TodayTime } from '../components/dashboard/today-time';
import { Timer } from './timer';

export default function DashboardPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.location.reload();
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="mb-1 text-sm font-medium text-[var(--color-primary)]">
            Dashboard
          </p>

          <h1 className="text-3xl font-semibold leading-[1.1] tracking-[-0.4px] text-[var(--color-text)] sm:text-[34px]">
            Good morning
          </h1>

          <p className="mt-2 text-base text-[var(--color-text-secondary)]">
            Stay focused and make progress on what matters today.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] shadow-sm transition-colors hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <LuRefreshCw
            size={16}
            strokeWidth={1.8}
            className={isRefreshing ? 'animate-spin' : ''}
          />
          Refresh
        </button>
      </div>

      {/* Top Grid */}
      <div className="grid items-stretch gap-6 lg:grid-cols-3">
        <div className="h-full lg:col-span-2">
          <Timer />
        </div>

        <div className="h-full lg:col-span-1">
          <TodayTime />
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TodayTasks />
        <ScheduledTasks />
      </div>
    </div>
  );
}