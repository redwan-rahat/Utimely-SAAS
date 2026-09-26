'use client';

import { useEffect, useMemo, useState } from 'react';
import { graphqlRequest } from '@/lib/graphql-client';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

type Task = {
  id: string;
  status:
    | 'PLANNED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'PAUSED'
    | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
};

type TimeSession = {
  id: string;
  taskId: string | null;
  type: 'FOCUS_TIMER' | 'STOPWATCH' | 'MANUAL';
  startedAt: string;
  endedAt: string;
  duration: number;
  createdAt: string;
};

const TASKS_QUERY = `
  query {
    tasks {
      id
      status
      createdAt
      updatedAt
    }
  }
`;

const TIME_SESSIONS_QUERY = `
  query {
    timeSessions {
      id
      taskId
      type
      startedAt
      endedAt
      duration
      createdAt
    }
  }
`;

/* =========================================================
   HELPERS
========================================================= */

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getDhakaDate(value: string | Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
  }).format(new Date(value));
}

function getDateKey(
  year: number,
  month: number,
  day: number,
) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(
    day,
  ).padStart(2, '0')}`;
}

function getDaysInMonth(
  year: number,
  month: number,
) {
  return new Date(
    year,
    month + 1,
    0,
  ).getDate();
}

function formatTotalTime(seconds: number) {
  const totalMinutes = Math.floor(seconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
}

function formatBarTime(seconds: number) {
  const hours = seconds / 3600;

  if (hours < 1) {
    return `${Math.round(seconds / 60)}m`;
  }

  return `${hours.toFixed(1)}h`;
}

/* =========================================================
   PAGE
========================================================= */

export default function AnalyticsPage() {
  const today = new Date();

  const [selectedYear, setSelectedYear] = useState(
    today.getFullYear(),
  );

  const [selectedMonth, setSelectedMonth] = useState(
    today.getMonth(),
  );

  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeSessions, setTimeSessions] = useState<
    TimeSession[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  /* =======================================================
     LOAD DATA
  ======================================================= */

  async function loadData(showLoading = true) {
    try {
      if (showLoading) {
        setLoading(true);
      }

      setError('');

      const [
        tasksResult,
        sessionsResult,
      ] = await Promise.all([
        graphqlRequest<{
          tasks: Task[];
        }>(TASKS_QUERY),

        graphqlRequest<{
          timeSessions: TimeSession[];
        }>(TIME_SESSIONS_QUERY),
      ]);

      setTasks(tasksResult.tasks);

      setTimeSessions(
        sessionsResult.timeSessions,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load analytics',
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* =======================================================
     REFRESH
  ======================================================= */

  async function handleRefresh() {
    setIsRefreshing(true);

    try {
      await loadData(false);
    } finally {
      setIsRefreshing(false);
    }
  }

  /* =======================================================
     MONTH NAVIGATION
  ======================================================= */

  function goToPreviousMonth() {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(
        (current) => current - 1,
      );
    } else {
      setSelectedMonth(
        (current) => current - 1,
      );
    }
  }

  function goToNextMonth() {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(
        (current) => current + 1,
      );
    } else {
      setSelectedMonth(
        (current) => current + 1,
      );
    }
  }

  /* =======================================================
     MONTH DATA
  ======================================================= */

  const daysInMonth = getDaysInMonth(
    selectedYear,
    selectedMonth,
  );

  const monthStart = new Date(
    selectedYear,
    selectedMonth,
    1,
  );

  const monthEnd = new Date(
    selectedYear,
    selectedMonth + 1,
    1,
  );

  /* =======================================================
     CHART DATA
  ======================================================= */

  const chartData = useMemo(() => {
    const days = [];

    for (
      let day = 1;
      day <= daysInMonth;
      day++
    ) {
      const dateKey = getDateKey(
        selectedYear,
        selectedMonth,
        day,
      );

      const seconds = timeSessions
        .filter(
          (session) =>
            getDhakaDate(
              session.startedAt,
            ) === dateKey,
        )
        .reduce(
          (total, session) =>
            total + session.duration,
          0,
        );

      days.push({
        day,
        dateKey,
        seconds,
        hours: seconds / 3600,
      });
    }

    return days;
  }, [
    timeSessions,
    selectedYear,
    selectedMonth,
    daysInMonth,
  ]);

  /* =======================================================
     CHART SCALE
  ======================================================= */

  const maxRecordedHours = Math.max(
    ...chartData.map(
      (item) => item.hours,
    ),
    0,
  );

  const chartMaxHours =
    maxRecordedHours <= 1
      ? 1
      : Math.ceil(maxRecordedHours);

  const gridHours = Array.from(
    {
      length: chartMaxHours + 1,
    },
    (_, index) => index,
  );

  /* =======================================================
     MONTH SUMMARY
  ======================================================= */

  const totalMonthSeconds = useMemo(() => {
    return chartData.reduce(
      (total, item) =>
        total + item.seconds,
      0,
    );
  }, [chartData]);

  const totalTasksCreated = useMemo(() => {
    return tasks.filter((task) => {
      const createdDate = new Date(
        task.createdAt,
      );

      return (
        createdDate >= monthStart &&
        createdDate < monthEnd
      );
    }).length;
  }, [
    tasks,
    selectedYear,
    selectedMonth,
  ]);

  /*
   * With the current Task model, there is no separate
   * completedAt field. We use updatedAt as the best
   * available approximation for when a task became
   * completed.
   */

  const totalTasksCompleted = useMemo(() => {
    return tasks.filter((task) => {
      if (task.status !== 'COMPLETED') {
        return false;
      }

      const updatedDate = new Date(
        task.updatedAt,
      );

      return (
        updatedDate >= monthStart &&
        updatedDate < monthEnd
      );
    }).length;
  }, [
    tasks,
    selectedYear,
    selectedMonth,
  ]);

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
        Loading analytics...
      </div>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="space-y-8">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-medium text-[var(--color-primary)]">
            Analytics
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
            Your productivity
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            A simple overview of your work and task
            progress.
          </p>
        </div>

        {/* REFRESH */}

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex shrink-0 hover:cursor-pointer h-9 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm font-medium text-[var(--color-text-secondary)] shadow-sm transition-colors hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-60"
          aria-label="Refresh analytics"
        >
          <RefreshCw
            size={16}
            strokeWidth={1.8}
            className={
              isRefreshing
                ? 'animate-spin'
                : ''
            }
          />

          <span className="inline">
            Refresh
          </span>
        </button>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* =================================================
          WORK HOURS CHART
      ================================================= */}

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">
              Work hours
            </h2>

            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              Time recorded throughout{' '}
              {MONTH_NAMES[selectedMonth]}.
            </p>
          </div>

          {/* MONTH SELECTOR */}

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={goToPreviousMonth}
              className="flex h-9 w-9 hover:cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-secondary)] shadow-sm transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
              aria-label="Previous month"
            >
              <ChevronLeft
                size={17}
                strokeWidth={1.8}
              />
            </button>

            <div className="min-w-[150px] text-center">
              <p className="text-sm font-semibold text-[var(--color-text)]">
                {MONTH_NAMES[selectedMonth]}{' '}
                {selectedYear}
              </p>
            </div>

            <button
              type="button"
              onClick={goToNextMonth}
              className="flex h-9 w-9 hover:cursor-pointer items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text-secondary)] shadow-sm transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
              aria-label="Next month"
            >
              <ChevronRight
                size={17}
                strokeWidth={1.8}
              />
            </button>
          </div>
        </div>

        {/* CHART */}

        <div className="mt-8 overflow-x-auto">
          <div
            className="relative"
            style={{
              minWidth:
                daysInMonth * 34 + 55,
            }}
          >
            {/* Y AXIS + CHART */}

            <div className="flex">
              {/* Y AXIS */}

              <div className="relative w-10 shrink-0">
                <div
                  className="relative"
                  style={{
                    height: '300px',
                  }}
                >
                  {gridHours.map(
                    (hour) => {
                      const bottom =
                        (hour /
                          chartMaxHours) *
                        100;

                      return (
                        <span
                          key={hour}
                          className="absolute right-2 -translate-y-1/2 text-[10px] text-[var(--color-text-muted)]"
                          style={{
                            bottom: `${bottom}%`,
                          }}
                        >
                          {hour}h
                        </span>
                      );
                    },
                  )}
                </div>
              </div>

              {/* BAR CHART */}

              <div className="relative min-w-0 flex-1">
                {/* HORIZONTAL GRID */}

                <div
                  className="pointer-events-none absolute inset-x-0 top-0"
                  style={{
                    height: '300px',
                  }}
                >
                  {gridHours.map(
                    (hour) => {
                      const bottom =
                        (hour /
                          chartMaxHours) *
                        100;

                      return (
                        <div
                          key={hour}
                          className="absolute inset-x-0 border-t border-[var(--color-border)]"
                          style={{
                            bottom: `${bottom}%`,
                          }}
                        />
                      );
                    },
                  )}
                </div>

                {/* BARS */}

                <div
                  className="relative flex items-end"
                  style={{
                    height: '300px',
                  }}
                >
                  {chartData.map(
                    (item) => {
                      const height =
                        item.hours === 0
                          ? 0
                          : (item.hours /
                              chartMaxHours) *
                            100;

                      return (
                        <div
                          key={item.dateKey}
                          className="flex h-full flex-1 flex-col items-center justify-end"
                        >
                          {/* VALUE */}

                          <div className="mb-2 h-4 text-center text-[10px] font-medium text-[var(--color-text-secondary)]">
                            {item.seconds > 0
                              ? formatBarTime(
                                  item.seconds,
                                )
                              : ''}
                          </div>

                          {/* BAR */}

                          <div className="flex h-[calc(100%-16px)] w-full items-end justify-center">
                            <div
                              className="w-5 rounded-t-[var(--radius-sm)] bg-[var(--color-primary)] transition-all duration-300 sm:w-6"
                              style={{
                                height: `${height}%`,
                                minHeight:
                                  item.hours >
                                  0
                                    ? '3px'
                                    : '0',
                              }}
                            />
                          </div>

                          {/* DAY */}

                          <div className="mt-3 h-4 text-[10px] font-medium text-[var(--color-text-muted)]">
                            {item.day}
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>

                {/* X AXIS */}

                <div className="border-t border-[var(--color-border)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="grid gap-4 sm:grid-cols-3">
        {/* HOURS */}

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Total hours worked
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            {formatTotalTime(
              totalMonthSeconds,
            )}
          </p>

          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {MONTH_NAMES[selectedMonth]}{' '}
            {selectedYear}
          </p>
        </div>

        {/* CREATED */}

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Total tasks created
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            {totalTasksCreated}
          </p>

          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {MONTH_NAMES[selectedMonth]}{' '}
            {selectedYear}
          </p>
        </div>

        {/* COMPLETED */}

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Total tasks completed
          </p>

          <p className="mt-2 text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            {totalTasksCompleted}
          </p>

          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            {MONTH_NAMES[selectedMonth]}{' '}
            {selectedYear}
          </p>
        </div>
      </div>
    </div>
  );
}