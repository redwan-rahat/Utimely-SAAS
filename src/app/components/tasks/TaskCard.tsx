'use client';

import { useRef, useState } from 'react';
import { graphqlRequest } from '@/lib/graphql-client';

export type TaskCardTag = {
  id: string;
  name: string;
  color: string;
};

export type TaskCardStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PAUSED'
  | 'CANCELLED';

export type TaskCardTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskCardStatus;
  progress: number;
  tags: TaskCardTag[];
  createdAt: string;
  updatedAt: string;
};

export type TaskCardTimeSession = {
  id: string;
  taskId: string | null;
  type: 'FOCUS_TIMER' | 'STOPWATCH' | 'MANUAL';
  startedAt: string;
  endedAt: string;
  duration: number;
  createdAt: string;
};

/* =========================================================
   MUTATIONS
========================================================= */

const UPDATE_TASK_MUTATION = `
  mutation UpdateTask(
    $id: ID!
    $input: UpdateTaskInput!
  ) {
    updateTask(
      id: $id
      input: $input
    ) {
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

const DELETE_TASK_MUTATION = `
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id)
  }
`;

const ADD_MANUAL_TIME_MUTATION = `
  mutation AddManualTime(
    $taskId: ID!
    $minutes: Int!
  ) {
    addManualTime(
      taskId: $taskId
      minutes: $minutes
    ) {
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

const ADD_TAG_MUTATION = `
  mutation AddTag(
    $taskId: ID!
    $tagId: ID!
  ) {
    addTagToTask(
      taskId: $taskId
      tagId: $tagId
    )
  }
`;

const REMOVE_TAG_MUTATION = `
  mutation RemoveTag(
    $taskId: ID!
    $tagId: ID!
  ) {
    removeTagFromTask(
      taskId: $taskId
      tagId: $tagId
    )
  }
`;

const SCHEDULE_TASK_MUTATION = `
  mutation ScheduleTask(
    $taskId: ID!
    $date: String!
  ) {
    scheduleTask(
      taskId: $taskId
      date: $date
    ) {
      id
      date
    }
  }
`;

const UNSCHEDULE_TASK_MUTATION = `
  mutation UnscheduleTask(
    $taskId: ID!
    $date: String!
  ) {
    unscheduleTask(
      taskId: $taskId
      date: $date
    )
  }
`;

/* =========================================================
   HELPERS
========================================================= */

function getProgressColor(progress: number) {
  if (progress < 20) {
    return 'bg-[var(--color-danger)]';
  }

  if (progress < 40) {
    return 'bg-orange-400';
  }

  if (progress < 60) {
    return 'bg-yellow-400';
  }

  if (progress < 80) {
    return 'bg-lime-400';
  }

  return 'bg-[var(--color-success)]';
}

function getStatusLabel(status: TaskCardStatus) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'In Progress';

    case 'COMPLETED':
      return 'Completed';

    case 'PAUSED':
      return 'Paused';

    case 'CANCELLED':
      return 'Cancelled';

    default:
      return 'Planned';
  }
}

function getStatusClass(status: TaskCardStatus) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'bg-blue-50 text-blue-600';

    case 'COMPLETED':
      return 'bg-green-50 text-green-600';

    case 'PAUSED':
      return 'bg-yellow-50 text-yellow-700';

    case 'CANCELLED':
      return 'bg-orange-50 text-orange-600';

    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function formatEntryTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

function formatTotalTime(seconds: number) {
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

/* =========================================================
   PROPS
========================================================= */

type TaskCardProps = {
  task: TaskCardTask;
  tags: TaskCardTag[];
  timeSessions: TaskCardTimeSession[];

  onTaskUpdated: (
    task: TaskCardTask,
  ) => void;

  onTaskDeleted: (
    taskId: string,
  ) => void;

  onSessionAdded: (
    session: TaskCardTimeSession,
  ) => void;

  onError: (
    message: string,
  ) => void;

  currentDate?: string;

  onScheduleChanged: () => void;
};

/* =========================================================
   COMPONENT
========================================================= */

export default function TaskCard({
  task,
  tags,
  timeSessions,
  onTaskUpdated,
  onTaskDeleted,
  onSessionAdded,
  onError,
  currentDate,
  onScheduleChanged,
}: TaskCardProps) {
  /* =======================================================
     EXPAND
  ======================================================= */

  const [
    expanded,
    setExpanded,
  ] = useState(false);

  /* =======================================================
     EDIT TASK
  ======================================================= */

  const [
    editingTask,
    setEditingTask,
  ] = useState(false);

  const [
    editingTitle,
    setEditingTitle,
  ] = useState(task.title);

  const [
    editingDescription,
    setEditingDescription,
  ] = useState(
    task.description ?? '',
  );

  const [
    savingTask,
    setSavingTask,
  ] = useState(false);

  /* =======================================================
     PROGRESS
  ======================================================= */

  const [
    editingProgress,
    setEditingProgress,
  ] = useState(false);

  const [
    progressValue,
    setProgressValue,
  ] = useState(
    String(task.progress),
  );

  const [
    savingProgress,
    setSavingProgress,
  ] = useState(false);

  /* =======================================================
     TIME
  ======================================================= */

  const [
    addingTime,
    setAddingTime,
  ] = useState(false);

  const [
    timeValue,
    setTimeValue,
  ] = useState('');

  const [
    savingTime,
    setSavingTime,
  ] = useState(false);

  const savingTimeRef = useRef(false);

  /* =======================================================
     TAGS
  ======================================================= */

const [
  showAddTags,
  setShowAddTags,
] = useState(false);

const [
  addingTag,
  setAddingTag,
] = useState(false);
  /* =======================================================
     SCHEDULE
  ======================================================= */

  const [
    showSchedule,
    setShowSchedule,
  ] = useState(false);

  const [
    scheduleDate,
    setScheduleDate,
  ] = useState('');

  const [
    scheduling,
    setScheduling,
  ] = useState(false);

  /* =======================================================
     STATUS
  ======================================================= */

  const [
    updatingStatus,
    setUpdatingStatus,
  ] = useState(false);

  /* =======================================================
     DELETE
  ======================================================= */

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  /* =======================================================
     TIME DATA
  ======================================================= */

  const taskSessions =
    timeSessions.filter(
      (session) =>
        session.taskId === task.id,
    );

  const totalSeconds =
    taskSessions.reduce(
      (total, session) =>
        total + session.duration,
      0,
    );

  /* =======================================================
     UPDATE TASK
  ======================================================= */

  async function saveTaskEdit() {
    if (!editingTitle.trim()) {
      onError(
        'Task name cannot be empty.',
      );

      return;
    }

    try {
      setSavingTask(true);
      onError('');

      const result =
        await graphqlRequest<{
          updateTask: TaskCardTask;
        }>(
          UPDATE_TASK_MUTATION,
          {
            id: task.id,
            input: {
              title:
                editingTitle.trim(),
              description:
                editingDescription.trim() ||
                null,
            },
          },
        );

      setEditingTask(false);

      onTaskUpdated(
        result.updateTask,
      );
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'Failed to update task',
      );
    } finally {
      setSavingTask(false);
    }
  }

  /* =======================================================
     SAVE PROGRESS
  ======================================================= */

  async function saveProgress() {
    const value = Number(
      progressValue,
    );

    if (
      !Number.isInteger(value) ||
      value < 0 ||
      value > 100
    ) {
      onError(
        'Progress must be a whole number between 0 and 100.',
      );

      return;
    }

    try {
      setSavingProgress(true);
      onError('');

      const result =
        await graphqlRequest<{
          updateTask: TaskCardTask;
        }>(
          UPDATE_TASK_MUTATION,
          {
            id: task.id,
            input: {
              progress: value,
            },
          },
        );

      setEditingProgress(false);

      onTaskUpdated(
        result.updateTask,
      );
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'Failed to update progress',
      );
    } finally {
      setSavingProgress(false);
    }
  }

  /* =======================================================
     SAVE TIME
  ======================================================= */

  async function saveTime() {
    if (savingTimeRef.current) {
      return;
    }

    const minutes = Number(
      timeValue,
    );

    if (
      !Number.isInteger(minutes) ||
      minutes <= 0
    ) {
      onError(
        'Time must be a positive whole number of minutes.',
      );

      return;
    }

    try {
      savingTimeRef.current = true;
      setSavingTime(true);
      onError('');

      const result =
        await graphqlRequest<{
          addManualTime: TaskCardTimeSession;
        }>(
          ADD_MANUAL_TIME_MUTATION,
          {
            taskId: task.id,
            minutes,
          },
        );

      onSessionAdded(
        result.addManualTime,
      );

      setAddingTime(false);
      setTimeValue('');
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'Failed to add time',
      );
    } finally {
      savingTimeRef.current = false;
      setSavingTime(false);
    }
  }

  /* =======================================================
     DELETE TASK
  ======================================================= */

  async function deleteTask() {
    const confirmed =
      window.confirm(
        'Are you sure you want to delete this task?',
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      onError('');

      const result =
        await graphqlRequest<{
          deleteTask: boolean;
        }>(
          DELETE_TASK_MUTATION,
          {
            id: task.id,
          },
        );

      if (!result.deleteTask) {
        throw new Error(
          'Failed to delete task',
        );
      }

      onTaskDeleted(task.id);
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'Failed to delete task',
      );
    } finally {
      setDeleting(false);
    }
  }

  /* =======================================================
     ADD TAG
  ======================================================= */

  async function addTag(
    tagId: string,
  ) {
    try {
      setAddingTag(true);
      onError('');

      const result =
        await graphqlRequest<{
          addTagToTask: boolean;
        }>(
          ADD_TAG_MUTATION,
          {
            taskId: task.id,
            tagId,
          },
        );

      if (!result.addTagToTask) {
        throw new Error(
          'Failed to add tag',
        );
      }

      const tag = tags.find(
        (item) => item.id === tagId,
      );

      if (tag) {
        onTaskUpdated({
          ...task,
          tags: [
            ...task.tags,
            tag,
          ],
        });
      }
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'Failed to add tag',
      );
    } finally {
      setAddingTag(false);
    }
  }

  /* =======================================================
     REMOVE TAG
  ======================================================= */

  async function removeTag(
    tagId: string,
  ) {
    try {
      setAddingTag(true);
      onError('');

      const result =
        await graphqlRequest<{
          removeTagFromTask: boolean;
        }>(
          REMOVE_TAG_MUTATION,
          {
            taskId: task.id,
            tagId,
          },
        );

      if (!result.removeTagFromTask) {
        throw new Error(
          'Failed to remove tag',
        );
      }

      onTaskUpdated({
        ...task,
        tags: task.tags.filter(
          (tag) =>
            tag.id !== tagId,
        ),
      });
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'Failed to remove tag',
      );
    } finally {
      setAddingTag(false);
    }
  }

  /* =======================================================
     SCHEDULE
  ======================================================= */

  async function scheduleTask() {
    if (!scheduleDate) {
      return;
    }

    try {
      setScheduling(true);
      onError('');

      await graphqlRequest<{
        scheduleTask: {
          id: string;
          date: string;
        };
      }>(
        SCHEDULE_TASK_MUTATION,
        {
          taskId: task.id,
          date: scheduleDate,
        },
      );

      setShowSchedule(false);
      setScheduleDate('');

      onScheduleChanged();
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'Failed to schedule task',
      );
    } finally {
      setScheduling(false);
    }
  }

  async function removeTaskFromDate() {
    try {
      setScheduling(true);
      onError('');

      const result = await graphqlRequest<{
        unscheduleTask: boolean;
      }>(
        UNSCHEDULE_TASK_MUTATION,
        {
          taskId: task.id,
          date: currentDate,
        },
      );

      if (!result.unscheduleTask) {
        throw new Error(
          'Failed to remove task from this date',
        );
      }

      onScheduleChanged();
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'Failed to remove task from this date',
      );
    } finally {
      setScheduling(false);
    }
  }

  /* =======================================================
     PAUSE / RESUME / CANCEL
  ======================================================= */

  async function updateStatus(
    status:
      | 'IN_PROGRESS'
      | 'PAUSED'
      | 'CANCELLED',
  ) {
    try {
      setUpdatingStatus(true);
      onError('');

      const result =
        await graphqlRequest<{
          updateTask: TaskCardTask;
        }>(
          UPDATE_TASK_MUTATION,
          {
            id: task.id,
            input: {
              status,
            },
          },
        );

      onTaskUpdated(
        result.updateTask,
      );
    } catch (error) {
      onError(
        error instanceof Error
          ? error.message
          : 'Failed to update task status',
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  /* =======================================================
     AVAILABLE TAGS
  ======================================================= */

  const availableTags =
    tags.filter(
      (tag) =>
        !task.tags.some(
          (taskTag) =>
            taskTag.id === tag.id,
        ),
    );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-5">

      {/* ===================================================
          EDIT MODE
      =================================================== */}

      {editingTask ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editingTitle}
            onChange={(event) =>
              setEditingTitle(
                event.target.value,
              )
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                saveTaskEdit();
              }

              if (event.key === 'Escape') {
                setEditingTask(false);
              }
            }}
            autoFocus
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
          />

          <textarea
            value={editingDescription}
            onChange={(event) =>
              setEditingDescription(
                event.target.value,
              )
            }
            rows={3}
            className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={saveTaskEdit}
              disabled={savingTask}
              className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
            >
              {savingTask
                ? 'Saving...'
                : 'Save'}
            </button>

            <button
              type="button"
              onClick={() =>
                setEditingTask(false)
              }
              disabled={savingTask}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* =================================================
              HEADER
          ================================================= */}

          <div className="flex items-start justify-between gap-4">

            {/* TITLE + DESCRIPTION */}

            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-[var(--color-text)]">
                {task.title}
              </h3>

              {task.description && (
                <p className="mt-1 text-sm leading-6 text-[var(--color-text-secondary)]">
                  {task.description}
                </p>
              )}
            </div>

            {/* TAGS + STATUS */}

            <div className="flex max-w-[55%] shrink-0 flex-wrap items-center justify-end gap-2">

              {task.tags.map(
                (tag, index) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-2"
                  >
                    {index > 0 && (
                      <span className="text-xs text-[var(--color-text-muted)]">
                        |
                      </span>
                    )}

                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                      }}
                    >
                      {tag.name}
                    </span>
                  </div>
                ),
              )}

              {task.tags.length > 0 && (
                <span className="text-xs text-[var(--color-text-muted)]">
                  |
                </span>
              )}

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${getStatusClass(task.status)}`}
              >
                {getStatusLabel(
                  task.status,
                )}
              </span>
            </div>
          </div>

          {/* =================================================
              PROGRESS
          ================================================= */}

          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_58px] items-center gap-3">

            <div className="min-w-0">
              <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                <div
                  className={`h-full rounded-full transition-all ${getProgressColor(task.progress)}`}
                  style={{
                    width: `${task.progress}%`,
                  }}
                />
              </div>
            </div>

            {editingProgress ? (
              <input
                type="number"
                min="0"
                max="100"
                value={progressValue}
                onChange={(event) =>
                  setProgressValue(
                    event.target.value,
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    saveProgress();
                  }

                  if (event.key === 'Escape') {
                    setEditingProgress(
                      false,
                    );
                  }
                }}
                onBlur={saveProgress}
                autoFocus
                disabled={savingProgress}
                className="w-[58px] rounded-[var(--radius-md)] border border-[var(--color-primary)] bg-[var(--color-background)] px-2 py-1 text-right text-lg font-semibold text-[var(--color-text)] outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingProgress(
                    true,
                  );

                  setProgressValue(
                    String(
                      task.progress,
                    ),
                  );
                }}
                className="w-[58px] text-right text-xl font-semibold leading-none text-[var(--color-text)] hover:text-[var(--color-primary)]"
              >
                {task.progress}%
              </button>
            )}
          </div>

          {/* =================================================
              TIME
          ================================================= */}

          <div className="mt-3 flex items-center justify-between gap-4">

            <div className="flex min-w-0 flex-wrap items-center gap-1.5">

              {taskSessions.map(
                (session) => (
                  <span
                    key={session.id}
                    className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)]"
                  >
                    {formatEntryTime(
                      session.duration,
                    )}
                  </span>
                ),
              )}

              {taskSessions.length ===
                0 && (
                <span className="text-xs text-[var(--color-text-muted)]">
                  No time recorded
                </span>
              )}

              {addingTime ? (
                <input
                  type="number"
                  min="1"
                  value={timeValue}
                  onChange={(event) =>
                    setTimeValue(
                      event.target.value,
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      saveTime();
                    }

                    if (event.key === 'Escape') {
                      setAddingTime(false);
                      setTimeValue('');
                    }
                  }}
                  onBlur={() => {
                    if (timeValue) {
                      saveTime();
                    } else {
                      setAddingTime(false);
                    }
                  }}
                  placeholder="Minutes"
                  autoFocus
                  disabled={savingTime}
                  className="w-24 rounded-[var(--radius-md)] border border-[var(--color-primary)] bg-[var(--color-background)] px-2 py-1 text-xs text-[var(--color-text)] outline-none"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAddingTime(true);
                    setTimeValue('');
                  }}
                  className="rounded-full border border-dashed border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                >
                  + Add time
                </button>
              )}
            </div>

            <span className="shrink-0 text-sm font-semibold text-[var(--color-text)]">
              {formatTotalTime(
                totalSeconds,
              )}
            </span>
          </div>

          {/* =================================================
              EXPAND / COLLAPSE
          ================================================= */}

          <div className="mt-4 border-t border-[var(--color-border)] pt-3">

            <button
              type="button"
              onClick={() =>
                setExpanded(
                  (value) => !value,
                )
              }
              className="flex w-full items-center justify-center gap-2 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
            >
              {expanded
                ? 'Hide details'
                : 'Show details'}

              <span className="text-[10px]">
                {expanded
                  ? '▲'
                  : '▼'}
              </span>
            </button>

            {expanded && (
              <div className="mt-4 space-y-4">

                {/* =================================================
                    ACTIONS
                ================================================= */}

                <div className="relative flex items-center justify-between gap-4 border-t border-[var(--color-border)] pt-4">

                  <div className="flex flex-wrap items-center gap-2">
                    {/* SCHEDULE */}

                    <button
                    type="button"
                    onClick={() =>
                      setShowSchedule(
                        (value) => !value,
                      )
                    }
                    className="font-medium text-blue-600 hover:text-blue-700"
                  >
                    Schedule
                  </button>

                  <span className="text-[var(--color-text-muted)]">
                    •
                  </span>

                  {/* PAUSE / RESUME */}

                  {task.status ===
                  'PAUSED' ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(
                            'IN_PROGRESS',
                          )
                        }
                        disabled={
                          updatingStatus
                        }
                        className="font-medium text-green-600 hover:text-green-700 disabled:opacity-50"
                      >
                        Resume
                      </button>

                      <span className="text-[var(--color-text-muted)]">
                        •
                      </span>
                    </>
                  ) : (
                    task.status !==
                      'COMPLETED' &&
                    task.status !==
                      'CANCELLED' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(
                              'PAUSED',
                            )
                          }
                          disabled={
                            updatingStatus
                          }
                          className="font-medium text-yellow-600 hover:text-yellow-700 disabled:opacity-50"
                        >
                          Pause
                        </button>

                        <span className="text-[var(--color-text-muted)]">
                          •
                        </span>
                      </>
                    )
                  )}

                  {/* REMOVE FROM DATE */}

{currentDate &&
  task.status !== 'COMPLETED' &&
  task.status !== 'CANCELLED' && (
    <>
      <button
        type="button"
        onClick={removeTaskFromDate}
        disabled={scheduling}
        className="font-medium text-gray-600 hover:text-gray-700 disabled:opacity-50"
      >
        Remove
      </button>

      <span className="text-[var(--color-text-muted)]">
        •
      </span>
    </>
  )}

                  {/* CANCEL */}

                  {task.status !==
                    'COMPLETED' &&
                    task.status !==
                      'CANCELLED' && (
                      <button
                        type="button"
                        onClick={() =>
                          updateStatus(
                            'CANCELLED',
                          )
                        }
                        disabled={
                          updatingStatus
                        }
                        className="font-medium text-orange-600 hover:text-orange-700 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}

                  </div>

                  {/* EDIT / DELETE */}

                  <div className="flex shrink-0 items-center gap-2">
                    {/* EDIT */}

                    <button
                      type="button"
                      onClick={() => {
                        setEditingTask(true);
                        setEditingTitle(task.title);
                        setEditingDescription(
                          task.description ?? '',
                        );
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-blue-500 text-white hover:bg-blue-600"
                      aria-label="Edit task"
                      title="Edit task"
                    >
                      <svg
                        viewBox="0 0 20 20"
                        className="h-4 w-4 fill-current"
                        aria-hidden="true"
                      >
                        <path d="M14.69 2.86a2 2 0 0 1 2.83 2.83l-9.9 9.9-4.02 1.19 1.19-4.02 1.19-4.02 9.9-9.9ZM4.2 13.8l-.55 1.85 1.85-.55L4.2 13.8Z" />
                      </svg>
                    </button>

                    {/* DELETE */}

                    <button
                      type="button"
                      onClick={deleteTask}
                      disabled={deleting}
                      className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                      aria-label="Delete task"
                      title="Delete task"
                    >
                      {deleting ? (
                        '...'
                      ) : (
                        <svg
                          viewBox="0 0 20 20"
                          className="h-4 w-4 fill-current"
                          aria-hidden="true"
                        >
                          <path d="M7 2h6l1 2h3v2h-1v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6H3V4h3l1-2Zm0 4v8h2V6H7Zm4 0v8h2V6h-2Z" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* =================================================
                      SCHEDULE POPUP
                  ================================================= */}

                  {showSchedule && (
                    <div className="absolute left-0 top-12 z-30 w-64 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-lg">

                      <p className="mb-3 text-sm font-medium text-[var(--color-text)]">
                        Schedule task
                      </p>

                      <input
                        type="date"
                        value={scheduleDate}
                        onChange={(event) =>
                          setScheduleDate(
                            event.target.value,
                          )
                        }
                        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-blue-500"
                      />

                      <div className="mt-3 flex justify-end gap-2">

                        <button
                          type="button"
                          onClick={() => {
                            setShowSchedule(false);
                            setScheduleDate('');
                          }}
                          className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                        >
                          Close
                        </button>

                        <button
                          type="button"
                          onClick={scheduleTask}
                          disabled={
                            !scheduleDate ||
                            scheduling
                          }
                          className="rounded-[var(--radius-md)] bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {scheduling
                            ? 'Saving...'
                            : 'Schedule'}
                        </button>

                      </div>
                    </div>
                  )}
                </div>

                {/* =================================================
                    TAG MANAGEMENT
                ================================================= */}

                {availableTags.length >
                  0 && (
                  <div className="border-t border-[var(--color-border)] pt-4">

        <button
  type="button"
  onClick={() =>
    setShowAddTags(
      (value) => !value,
    )
  }
  className="text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
>
  {showAddTags
    ? 'Hide tags'
    : '+ Add tag'}
</button>

                    {showAddTags  && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {availableTags.map(
                          (tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              onClick={() =>
                                addTag(
                                  tag.id,
                                )
                              }
                              disabled={
                                addingTag
                              }
                              className="rounded-full border border-[var(--color-border)] px-2.5 py-1 text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-50"
                            >
                              + {tag.name}
                            </button>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* =================================================
                    CURRENT TAGS
                ================================================= */}

                {task.tags.length >
                  0 && (
                  <div className="border-t border-[var(--color-border)] pt-4">

                    <p className="mb-2 text-xs font-medium text-[var(--color-text-secondary)]">
                      Current tags
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {task.tags.map(
                        (tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() =>
                              removeTag(
                                tag.id,
                              )
                            }
                            className="rounded-full px-2.5 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: `${tag.color}20`,
                              color: tag.color,
                            }}
                            title="Click to remove tag"
                          >
                            {tag.name} ×
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                )}


              </div>
            )}
          </div>
        </>
      )}
    </article>
  );
}