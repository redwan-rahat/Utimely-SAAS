'use client';

import { useEffect, useState } from 'react';
import { graphqlRequest } from '@/lib/graphql-client';

type TaskStatus = 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';

type Tag = {
  id: string;
  name: string;
  color: string;
};

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  progress: number;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
};

type TasksForDateResponse = {
  tasksForDate: Task[];
};

const TASKS_FOR_DATE_QUERY = `
  query TasksForDate($date: String!) {
    tasksForDate(date: $date) {
      id
      title
      description
      status
      progress
      tags {
        id
        name
        color
      }
      createdAt
      updatedAt
    }
  }
`;

function getTodayDate() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
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

export function TodayTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setError(null);

        const data = await graphqlRequest<TasksForDateResponse>(
          TASKS_FOR_DATE_QUERY,
          {
            date: getTodayDate(),
          },
        );

        setTasks(data.tasksForDate);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load today&apos;s tasks',
        );
      } finally {
        setLoading(false);
      }
    };

    void loadTasks();
  }, []);

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-[-0.3px] text-[var(--color-text)]">
            Today&apos;s Tasks
          </h2>

          <p className="mt-1.5 text-base text-[var(--color-text-secondary)]">
            Tasks scheduled for today.
          </p>
        </div>

        {!loading && !error && (
          <span className="rounded-full bg-[var(--color-primary-light)] px-2.5 py-1 text-xs font-medium text-[var(--color-primary)]">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex min-h-40 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-background)]">
          <p className="text-sm text-[var(--color-text-muted)]">
            Loading tasks...
          </p>
        </div>
      )}

      {error && (
        <div className="flex min-h-40 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-background)]">
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
        </div>
      )}

      {!loading && !error && tasks.length === 0 && (
        <div className="flex min-h-40 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-background)]">
          <p className="text-sm text-[var(--color-text-muted)]">
            No tasks scheduled for today.
          </p>
        </div>
      )}

      {!loading && !error && tasks.length > 0 && (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 h-4 w-4 shrink-0 rounded border border-[var(--color-border-hover)]" />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="font-medium text-[var(--color-text)]">
                      {task.title}
                    </h3>

                    <span className="shrink-0 text-xs font-medium text-[var(--color-text-secondary)]">
                      {task.progress}%
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-[var(--color-text-secondary)]">
                      {getStatusLabel(task.status)}
                    </span>

                    {task.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="rounded-full px-2 py-0.5 text-xs font-medium"
                        style={{
                          backgroundColor: `${tag.color}18`,
                          color: tag.color,
                        }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                      style={{
                        width: `${task.progress}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}