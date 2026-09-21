'use client';

import { useEffect, useState } from 'react';
import { graphqlRequest } from '@/lib/graphql-client';

type TaskStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';

type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  progress: number;
};

type ScheduledTask = {
  id: string;
  date: number | string;
  task: Task;
};

type UpcomingScheduledTasksResponse = {
  upcomingScheduledTasks: ScheduledTask[];
};

const UPCOMING_SCHEDULED_TASKS_QUERY = `
  query UpcomingScheduledTasks($limit: Int) {
    upcomingScheduledTasks(limit: $limit) {
      id
      date
      task {
        id
        title
        status
        progress
      }
    }
  }
`;

function toTimestamp(value: number | string) {
  const timestamp =
    typeof value === 'number' ? value : Number(value);

  if (!Number.isFinite(timestamp)) {
    throw new Error(`Invalid scheduled task date: ${value}`);
  }

  return timestamp;
}

function getDateOnly(value: number | string) {
  const timestamp = toTimestamp(value);

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
  }).format(new Date(timestamp));
}

function formatDate(value: number | string) {
  const timestamp = toTimestamp(value);

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Dhaka',
  }).format(new Date(timestamp));
}

function getDateLabel(value: number | string) {
  const dateOnly = getDateOnly(value);

  const today = getDateOnly(Date.now());

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);

  const tomorrow = getDateOnly(tomorrowDate.getTime());

  if (dateOnly === today) {
    return 'Today';
  }

  if (dateOnly === tomorrow) {
    return 'Tomorrow';
  }

  return formatDate(value);
}

function getStatusLabel(status: TaskStatus) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'In Progress';

    case 'COMPLETED':
      return 'Completed';

    default:
      return 'Planned';
  }
}

export function ScheduledTasks() {
  const [scheduledTasks, setScheduledTasks] = useState<
    ScheduledTask[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadScheduledTasks = async () => {
      try {
        setError(null);

        const data =
          await graphqlRequest<UpcomingScheduledTasksResponse>(
            UPCOMING_SCHEDULED_TASKS_QUERY,
            {
              limit: 5,
            },
          );

        setScheduledTasks(data.upcomingScheduledTasks);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load scheduled tasks',
        );
      } finally {
        setLoading(false);
      }
    };

    void loadScheduledTasks();
  }, []);

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">
          Scheduled Tasks
        </h2>

        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Your upcoming scheduled tasks.
        </p>
      </div>

      {loading && (
        <div className="flex min-h-40 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface)]">
          <p className="text-sm text-[var(--color-text-muted)]">
            Loading scheduled tasks...
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

      {!loading && !error && scheduledTasks.length === 0 && (
        <div className="flex min-h-40 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-surface)]">
          <p className="text-sm text-[var(--color-text-muted)]">
            No upcoming scheduled tasks.
          </p>
        </div>
      )}

      {!loading && !error && scheduledTasks.length > 0 && (
        <div className="space-y-3">
          {scheduledTasks.map((scheduledTask) => {
            const dateLabel = getDateLabel(scheduledTask.date);

            return (
              <div
                key={scheduledTask.id}
                className="flex items-center gap-4 rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
              >
                <div className="w-20 shrink-0">
                  <p className="text-xs font-medium text-[var(--color-primary)]">
                    {dateLabel}
                  </p>

                  {dateLabel !== 'Today' &&
                    dateLabel !== 'Tomorrow' && (
                      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                        {formatDate(scheduledTask.date)}
                      </p>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--color-text)]">
                    {scheduledTask.task.title}
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {getStatusLabel(scheduledTask.task.status)}
                    </span>

                    <span className="text-xs text-[var(--color-text-muted)]">
                      {scheduledTask.task.progress}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}