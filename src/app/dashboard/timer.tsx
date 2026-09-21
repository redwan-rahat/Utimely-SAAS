'use client';

import { useCallback, useEffect, useState } from 'react';
import { graphqlRequest } from '@/lib/graphql-client';

type TimerType = 'FOCUS_TIMER' | 'STOPWATCH';
type TimerStatus = 'RUNNING' | 'PAUSED';

type ActiveTimer = {
  id: string;
  type: TimerType;
  status: TimerStatus;
  taskId: string | null;
  durationSeconds: number | null;
  elapsedSeconds: number;
  startedAt: string;
  runStartedAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ActiveTimerResponse = {
  activeTimer: ActiveTimer | null;
};

type StartFocusResponse = {
  startFocusTimer: ActiveTimer;
};

type StartStopwatchResponse = {
  startStopwatch: ActiveTimer;
};

type PauseResponse = {
  pauseTimer: ActiveTimer;
};

type ResumeResponse = {
  resumeTimer: ActiveTimer;
};

type SaveResponse = {
  saveTimer: {
    id: string;
    type: TimerType;
    duration: number;
    startedAt: string;
    endedAt: string;
  };
};

type CancelResponse = {
  cancelTimer: boolean;
};

const ACTIVE_TIMER_QUERY = `
  query {
    activeTimer {
      id
      type
      status
      taskId
      durationSeconds
      elapsedSeconds
      startedAt
      runStartedAt
      endsAt
      createdAt
      updatedAt
    }
  }
`;

function formatTime(totalSeconds: number) {
  const seconds = Math.max(0, Math.floor(totalSeconds));

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0',
    )}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(
    remainingSeconds,
  ).padStart(2, '0')}`;
}

export function Timer() {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [selectedType, setSelectedType] =
    useState<TimerType>('FOCUS_TIMER');

  const [focusMinutes, setFocusMinutes] = useState(45);
  const [showTime, setShowTime] = useState(false);

  const [displaySeconds, setDisplaySeconds] = useState(45 * 60);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActiveTimer = useCallback(async () => {
    try {
      const data = await graphqlRequest<ActiveTimerResponse>(
        ACTIVE_TIMER_QUERY,
      );

      setActiveTimer(data.activeTimer);

      if (data.activeTimer) {
        setSelectedType(data.activeTimer.type);

        if (data.activeTimer.type === 'FOCUS_TIMER') {
          setShowTime(false);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load timer',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadActiveTimer();
  }, [loadActiveTimer]);

  /*
   * Calculate the displayed timer from the server timestamps.
   *
   * The browser is only responsible for updating what we see.
   * The server remains the source of truth.
   */
  useEffect(() => {
    if (!activeTimer) {
      setDisplaySeconds(
        selectedType === 'FOCUS_TIMER' ? focusMinutes * 60 : 0,
      );
      return;
    }

    const calculateTime = () => {
      if (activeTimer.status === 'PAUSED') {
        if (activeTimer.type === 'FOCUS_TIMER') {
          const remaining =
            (activeTimer.durationSeconds ?? 0) -
            activeTimer.elapsedSeconds;

          setDisplaySeconds(Math.max(0, remaining));
        } else {
          setDisplaySeconds(activeTimer.elapsedSeconds);
        }

        return;
      }

      if (activeTimer.type === 'FOCUS_TIMER') {
        if (!activeTimer.endsAt) return;

        const remaining = Math.max(
          0,
          Math.floor(
            (new Date(activeTimer.endsAt).getTime() - Date.now()) / 1000,
          ),
        );

        setDisplaySeconds(remaining);

        return;
      }

      if (activeTimer.type === 'STOPWATCH') {
        if (!activeTimer.runStartedAt) return;

        const runningSeconds = Math.floor(
          (Date.now() -
            new Date(activeTimer.runStartedAt).getTime()) /
            1000,
        );

        setDisplaySeconds(
          activeTimer.elapsedSeconds + Math.max(0, runningSeconds),
        );
      }
    };

    calculateTime();

    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [activeTimer, focusMinutes, selectedType]);

  /*
   * When a focus timer reaches zero, ask the server for the
   * current timer. The server will finalize the expired timer
   * and return null.
   */
  useEffect(() => {
    if (
      !activeTimer ||
      activeTimer.type !== 'FOCUS_TIMER' ||
      activeTimer.status !== 'RUNNING' ||
      !activeTimer.endsAt
    ) {
      return;
    }

    const remainingMilliseconds =
      new Date(activeTimer.endsAt).getTime() - Date.now();

    const timeout = setTimeout(
      () => {
        loadActiveTimer();
      },
      Math.max(0, remainingMilliseconds + 250),
    );

    return () => clearTimeout(timeout);
  }, [activeTimer, loadActiveTimer]);

  const runAction = async (action: () => Promise<void>) => {
    try {
      setActionLoading(true);
      setError(null);

      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartFocus = async () => {
    await runAction(async () => {
      const data = await graphqlRequest<StartFocusResponse>(
        `
          mutation StartFocusTimer($durationMinutes: Int!) {
            startFocusTimer(durationMinutes: $durationMinutes) {
              id
              type
              status
              taskId
              durationSeconds
              elapsedSeconds
              startedAt
              runStartedAt
              endsAt
              createdAt
              updatedAt
            }
          }
        `,
        {
          durationMinutes: focusMinutes,
        },
      );

      setActiveTimer(data.startFocusTimer);
      setSelectedType('FOCUS_TIMER');
      setShowTime(false);
    });
  };

  const handleStartStopwatch = async () => {
    await runAction(async () => {
      const data = await graphqlRequest<StartStopwatchResponse>(
        `
          mutation {
            startStopwatch {
              id
              type
              status
              taskId
              durationSeconds
              elapsedSeconds
              startedAt
              runStartedAt
              endsAt
              createdAt
              updatedAt
            }
          }
        `,
      );

      setActiveTimer(data.startStopwatch);
      setSelectedType('STOPWATCH');
    });
  };

  const handlePause = async () => {
    await runAction(async () => {
      const data = await graphqlRequest<PauseResponse>(
        `
          mutation {
            pauseTimer {
              id
              type
              status
              taskId
              durationSeconds
              elapsedSeconds
              startedAt
              runStartedAt
              endsAt
              createdAt
              updatedAt
            }
          }
        `,
      );

      setActiveTimer(data.pauseTimer);
    });
  };

  const handleResume = async () => {
    await runAction(async () => {
      const data = await graphqlRequest<ResumeResponse>(
        `
          mutation {
            resumeTimer {
              id
              type
              status
              taskId
              durationSeconds
              elapsedSeconds
              startedAt
              runStartedAt
              endsAt
              createdAt
              updatedAt
            }
          }
        `,
      );

      setActiveTimer(data.resumeTimer);
    });
  };

  const handleSave = async () => {
    await runAction(async () => {
      await graphqlRequest<SaveResponse>(`
        mutation {
          saveTimer {
            id
            type
            duration
            startedAt
            endedAt
          }
        }
      `);

      setActiveTimer(null);
      setShowTime(false);
    });
  };

  const handleCancel = async () => {
    await runAction(async () => {
      await graphqlRequest<CancelResponse>(`
        mutation {
          cancelTimer
        }
      `);

      setActiveTimer(null);
      setShowTime(false);
    });
  };

  const handleTabChange = (type: TimerType) => {
    if (activeTimer) return;

    setSelectedType(type);
    setShowTime(false);

    if (type === 'FOCUS_TIMER') {
      setDisplaySeconds(focusMinutes * 60);
    } else {
      setDisplaySeconds(0);
    }
  };

  const handleFocusMinutesChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const value = Number(event.target.value);

    if (!Number.isInteger(value)) return;

    setFocusMinutes(Math.min(180, Math.max(1, value)));
    setDisplaySeconds(Math.min(180, Math.max(1, value)) * 60);
  };

  const isFocus = selectedType === 'FOCUS_TIMER';
  const isRunning = activeTimer?.status === 'RUNNING';
  const isPaused = activeTimer?.status === 'PAUSED';

  if (loading) {
    return (
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-sm">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Loading timer...
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Timer
        </h2>

        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Track your focus and idle time.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex rounded-[var(--radius-md)] bg-[var(--color-surface)] p-1">
        <button
          type="button"
          disabled={Boolean(activeTimer)}
          onClick={() => handleTabChange('FOCUS_TIMER')}
          className={`flex-1 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition-colors ${
            isFocus
              ? 'bg-[var(--color-background)] text-[var(--color-primary)] shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          } disabled:cursor-not-allowed`}
        >
          Focus Timer
        </button>

        <button
          type="button"
          disabled={Boolean(activeTimer)}
          onClick={() => handleTabChange('STOPWATCH')}
          className={`flex-1 rounded-[var(--radius-sm)] px-4 py-2 text-sm font-medium transition-colors ${
            !isFocus
              ? 'bg-[var(--color-background)] text-[var(--color-primary)] shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          } disabled:cursor-not-allowed`}
        >
          Stopwatch
        </button>
      </div>

      {/* Timer display */}
      <div className="flex min-h-64 flex-col items-center justify-center">
        <div className="text-6xl font-semibold tracking-tight text-[var(--color-text)]">
          {isFocus && activeTimer?.status === 'RUNNING' && !showTime
            ? '••••••'
            : formatTime(displaySeconds)}
        </div>

        {isFocus && activeTimer?.status === 'RUNNING' && (
          <button
            type="button"
            onClick={() => setShowTime((value) => !value)}
            className="mt-4 text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            {showTime ? 'Hide Time' : 'Show Time'}
          </button>
        )}
      </div>

      {/* Focus timer setup */}
      {!activeTimer && isFocus && (
        <div className="mx-auto mb-6 flex max-w-xs items-center gap-3">
          <label
            htmlFor="focus-minutes"
            className="text-sm font-medium text-[var(--color-text-secondary)]"
          >
            Minutes
          </label>

          <input
            id="focus-minutes"
            type="number"
            min={1}
            max={180}
            value={focusMinutes}
            onChange={handleFocusMinutesChange}
            className="w-24 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-center text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3">
        {!activeTimer && isFocus && (
          <button
            type="button"
            onClick={handleStartFocus}
            disabled={actionLoading}
            className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start
          </button>
        )}

        {!activeTimer && !isFocus && (
          <button
            type="button"
            onClick={handleStartStopwatch}
            disabled={actionLoading}
            className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Start
          </button>
        )}

        {isRunning && (
          <button
            type="button"
            onClick={handlePause}
            disabled={actionLoading}
            className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Pause
          </button>
        )}

        {isPaused && (
          <button
            type="button"
            onClick={handleResume}
            disabled={actionLoading}
            className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Resume
          </button>
        )}

        {isPaused && (
          <button
            type="button"
            onClick={handleSave}
            disabled={actionLoading}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
        )}

        {activeTimer && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={actionLoading}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        )}
      </div>

      {error && (
        <p className="mt-5 text-center text-sm text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </section>
  );
}