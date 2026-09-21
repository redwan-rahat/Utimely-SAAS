'use client';

import { useEffect, useState } from 'react';
import { graphqlRequest } from '@/lib/graphql-client';

type TimeSessionType = 'FOCUS_TIMER' | 'STOPWATCH' | 'MANUAL';

type TimeSession = {
  id: string;
  type: TimeSessionType;
  startedAt: string;
  endedAt: string;
  duration: number;
  createdAt: string;
};

type TimeSessionsResponse = {
  timeSessions: TimeSession[];
};

const TIME_SESSIONS_QUERY = `
  query {
    timeSessions {
      id
      type
      startedAt
      endedAt
      duration
      createdAt
    }
  }
`;

function isToday(dateString: string) {
  const sessionDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
  }).format(new Date(dateString));

  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
  }).format(new Date());

  return sessionDate === today;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

export function TodayTime() {
  const [sessions, setSessions] = useState<TimeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTimeSessions = async () => {
      try {
        setError(null);

        const data = await graphqlRequest<TimeSessionsResponse>(
          TIME_SESSIONS_QUERY,
        );

        const todaySessions = data.timeSessions.filter(
          (session) =>
            isToday(session.startedAt) &&
            (session.type === 'FOCUS_TIMER' ||
              session.type === 'STOPWATCH'),
        );

        setSessions(todaySessions);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load today&apos;s time',
        );
      } finally {
        setLoading(false);
      }
    };

    void loadTimeSessions();
  }, []);

  const focusSessions = sessions.filter(
    (session) => session.type === 'FOCUS_TIMER',
  );

  const stopwatchSessions = sessions.filter(
    (session) => session.type === 'STOPWATCH',
  );

  return (
   <section className="h-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Today&apos;s Time
        </h2>

        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Your focus and stopwatch sessions today.
        </p>
      </div>

      {loading && (
        <div className="flex min-h-40 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface)]">
          <p className="text-sm text-[var(--color-text-muted)]">
            Loading time...
          </p>
        </div>
      )}

      {error && (
        <div className="flex min-h-40 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface)]">
          <p className="text-sm text-[var(--color-danger)]">
            {error}
          </p>
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div className="flex min-h-40 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface)]">
          <p className="text-sm text-[var(--color-text-muted)]">
            No time recorded today.
          </p>
        </div>
      )}

      {!loading && !error && sessions.length > 0 && (
      <div className="max-h-[420px] space-y-6 overflow-y-auto overflow-x-hidden pr-2">
          {/* Focus Timer */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-[var(--color-text)]">
                Focus Timer
              </h3>

              <span className="text-xs text-[var(--color-text-muted)]">
                {focusSessions.length} session
                {focusSessions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {focusSessions.length > 0 ? (
              <div className="space-y-2">
                {focusSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2.5"
                  >
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      Focus
                    </span>

                    <span className="text-sm font-medium text-[var(--color-text)]">
                      {formatDuration(session.duration)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                No focus sessions today.
              </p>
            )}
          </div>

          {/* Stopwatch */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-[var(--color-text)]">
                Stopwatch
              </h3>

              <span className="text-xs text-[var(--color-text-muted)]">
                {stopwatchSessions.length} session
                {stopwatchSessions.length !== 1 ? 's' : ''}
              </span>
            </div>

            {stopwatchSessions.length > 0 ? (
              <div className="space-y-2">
                {stopwatchSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2.5"
                  >
                    <span className="text-sm text-[var(--color-text-secondary)]">
                      Stopwatch
                    </span>

                    <span className="text-sm font-medium text-[var(--color-text)]">
                      {formatDuration(session.duration)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">
                No stopwatch sessions today.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}