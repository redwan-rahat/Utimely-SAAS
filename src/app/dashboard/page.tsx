'use client';

import { TodayTasks } from '../components/today-tasks';
import { ScheduledTasks } from '../components/scheduled-tasks';
import { TodayTime } from '../components/today-time';
import { Timer } from './timer';

export default function DashboardPage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-medium text-[var(--color-primary)]">
            Dashboard
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
            Good morning
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Stay focused and make progress on what matters today.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
        >
          Refresh
        </button>
      </div>

      {/* Top Grid: Timer 2/3 + Today's Time 1/3 */}
    <div className="grid items-stretch gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Timer />
      </div>

     <div className="lg:col-span-1">
      <TodayTime />
      </div>
      </div>

      {/* Bottom Grid: Today's Tasks 1/2 + Scheduled Tasks 1/2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TodayTasks />

        <ScheduledTasks />
      </div>
    </div>
  );
}