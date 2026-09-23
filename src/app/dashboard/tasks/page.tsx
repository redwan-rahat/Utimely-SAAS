'use client';

import { useEffect, useMemo, useState } from 'react';
import { LuPencil, LuPlus, LuRefreshCw, LuTrash2 } from 'react-icons/lu';
import { graphqlRequest } from '@/lib/graphql-client';
import TaskCard from '@/app/components/tasks/TaskCard';

/* =========================================================
   TYPES
========================================================= */

type Tag = {
  id: string;
  name: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
};

type TaskStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PAUSED'
  | 'CANCELLED';

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

type TimeSession = {
  id: string;
  taskId: string | null;
  type: 'FOCUS_TIMER' | 'STOPWATCH' | 'MANUAL';
  startedAt: string;
  endedAt: string;
  duration: number;
  createdAt: string;
};

type ScheduledTask = {
  id: string;
  date: string;
  task: Task;
};

type TaskTab =
  | 'ALL'
  | 'IN_PROGRESS'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'PAUSED'
  | 'CANCELLED';

/* =========================================================
   QUERIES
========================================================= */

const TASKS_QUERY = `
  query {
    tasks {
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

const TAGS_QUERY = `
  query {
    tags {
      id
      name
      color
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

const ALL_SCHEDULED_TASKS_QUERY = `
  query {
    allScheduledTasks {
      id
      date
      task {
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
  }
`;

/* =========================================================
   TASK MUTATIONS
========================================================= */

const CREATE_TASK_MUTATION = `
  mutation CreateTask($input: CreateTaskInput!) {
    createTask(input: $input) {
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

/* =========================================================
   TAG MUTATIONS
========================================================= */

const CREATE_TAG_MUTATION = `
  mutation CreateTag($input: CreateTagInput!) {
    createTag(input: $input) {
      id
      name
      color
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_TAG_MUTATION = `
  mutation UpdateTag(
    $id: ID!
    $input: UpdateTagInput!
  ) {
    updateTag(
      id: $id
      input: $input
    ) {
      id
      name
      color
      createdAt
      updatedAt
    }
  }
`;

const DELETE_TAG_MUTATION = `
  mutation DeleteTag($id: ID!) {
    deleteTag(id: $id)
  }
`;

/* =========================================================
   HELPERS
========================================================= */

function formatScheduledDate(value: string) {
  if (!value) {
    return 'Invalid date';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

/* =========================================================
   PAGE
========================================================= */

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [timeSessions, setTimeSessions] = useState<TimeSession[]>([]);
  const [scheduledTasks, setScheduledTasks] = useState<
    ScheduledTask[]
  >([]);

  const [activeTab, setActiveTab] =
    useState<TaskTab>('ALL');

  const [selectedTagId, setSelectedTagId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  /* =========================================================
     CREATE TASK
  ========================================================= */

  const [showCreateTask, setShowCreateTask] =
    useState(false);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] =
    useState('');

  const [creatingTask, setCreatingTask] =
    useState(false);

  /* =========================================================
     CREATE TAG
  ========================================================= */

  const [showCreateTag, setShowCreateTag] =
    useState(false);

  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] =
    useState('#6D5DFB');

  const [creatingTag, setCreatingTag] =
    useState(false);

  /* =========================================================
     EDIT TAG
  ========================================================= */

  const [editingTagId, setEditingTagId] =
    useState<string | null>(null);

  const [editingTagName, setEditingTagName] =
    useState('');

  const [editingTagColor, setEditingTagColor] =
    useState('#6D5DFB');

  const [savingTag, setSavingTag] =
    useState(false);

  const [deletingTagId, setDeletingTagId] =
    useState<string | null>(null);

  /* =========================================================
     LOAD DATA
  ========================================================= */

  async function loadData(
    showRefreshState = false,
  ) {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const [
        tasksResult,
        tagsResult,
        timeSessionsResult,
        scheduledResult,
      ] = await Promise.all([
        graphqlRequest<{ tasks: Task[] }>(
          TASKS_QUERY,
        ),

        graphqlRequest<{ tags: Tag[] }>(
          TAGS_QUERY,
        ),

        graphqlRequest<{
          timeSessions: TimeSession[];
        }>(TIME_SESSIONS_QUERY),

        graphqlRequest<{
          allScheduledTasks: ScheduledTask[];
        }>(ALL_SCHEDULED_TASKS_QUERY),
      ]);

      setTasks(tasksResult.tasks);
      setTags(tagsResult.tags);
      setTimeSessions(
        timeSessionsResult.timeSessions,
      );
      setScheduledTasks(
        scheduledResult.allScheduledTasks,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to load tasks',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================================
     CREATE TASK
  ========================================================= */

  function openCreateTask() {
    setTaskTitle('');
    setTaskDescription('');
    setShowCreateTask(true);
  }

  function closeCreateTask() {
    if (creatingTask) {
      return;
    }

    setShowCreateTask(false);
    setTaskTitle('');
    setTaskDescription('');
  }

  async function handleCreateTask(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!taskTitle.trim()) {
      return;
    }

    try {
      setCreatingTask(true);
      setError('');

      const result = await graphqlRequest<{
        createTask: Task;
      }>(
        CREATE_TASK_MUTATION,
        {
          input: {
            title: taskTitle.trim(),
            description:
              taskDescription.trim() || null,
          },
        },
      );

      setTasks((current) => [
        ...current,
        result.createTask,
      ]);

      setShowCreateTask(false);
      setTaskTitle('');
      setTaskDescription('');

      setActiveTab('ALL');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to create task',
      );
    } finally {
      setCreatingTask(false);
    }
  }

  /* =========================================================
     TASK CARD CALLBACKS
  ========================================================= */

  function handleTaskUpdated(
    updatedTask: Task,
  ) {
    setTasks((current) =>
      current.map((task) =>
        task.id === updatedTask.id
          ? updatedTask
          : task,
      ),
    );

    /*
     * ScheduledTask contains the task object too,
     * so keep those copies synchronized.
     */
    setScheduledTasks((current) =>
      current.map((scheduledTask) =>
        scheduledTask.task.id === updatedTask.id
          ? {
              ...scheduledTask,
              task: updatedTask,
            }
          : scheduledTask,
      ),
    );
  }

  function handleTaskDeleted(taskId: string) {
    setTasks((current) =>
      current.filter((task) => task.id !== taskId),
    );

    setScheduledTasks((current) =>
      current.filter(
        (scheduledTask) =>
          scheduledTask.task.id !== taskId,
      ),
    );

    setTimeSessions((current) =>
      current.filter(
        (session) => session.taskId !== taskId,
      ),
    );
  }

  function handleSessionAdded(
    session: TimeSession,
  ) {
    setTimeSessions((current) => [
      ...current,
      session,
    ]);
  }

  function handleScheduleChanged() {
    /*
     * Reload scheduling data because the TaskCard may
     * have added or removed a scheduled occurrence.
     */
    loadData(true);
  }

  /* =========================================================
     TAG CREATE
  ========================================================= */

  async function handleCreateTag(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!tagName.trim()) {
      return;
    }

    try {
      setCreatingTag(true);
      setError('');

      const result = await graphqlRequest<{
        createTag: Tag;
      }>(
        CREATE_TAG_MUTATION,
        {
          input: {
            name: tagName.trim(),
            color: tagColor,
          },
        },
      );

      setTags((current) => [
        ...current,
        result.createTag,
      ]);

      setTagName('');
      setTagColor('#6D5DFB');
      setShowCreateTag(false);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to create tag',
      );
    } finally {
      setCreatingTag(false);
    }
  }

  /* =========================================================
     TAG EDIT
  ========================================================= */

  function startEditTag(tag: Tag) {
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
    setEditingTagColor(tag.color);
  }

  function cancelEditTag() {
    setEditingTagId(null);
    setEditingTagName('');
    setEditingTagColor('#6D5DFB');
  }

  async function handleUpdateTag(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !editingTagId ||
      !editingTagName.trim()
    ) {
      return;
    }

    try {
      setSavingTag(true);
      setError('');

      const result = await graphqlRequest<{
        updateTag: Tag;
      }>(
        UPDATE_TAG_MUTATION,
        {
          id: editingTagId,
          input: {
            name: editingTagName.trim(),
            color: editingTagColor,
          },
        },
      );

      const updatedTag = result.updateTag;

      setTags((current) =>
        current.map((tag) =>
          tag.id === updatedTag.id
            ? updatedTag
            : tag,
        ),
      );

      /*
       * Update the tag inside every task as well,
       * including tasks shown in scheduled occurrences.
       */
      setTasks((current) =>
        current.map((task) => ({
          ...task,
          tags: task.tags.map((tag) =>
            tag.id === updatedTag.id
              ? updatedTag
              : tag,
          ),
        })),
      );

      setScheduledTasks((current) =>
        current.map((scheduledTask) => ({
          ...scheduledTask,
          task: {
            ...scheduledTask.task,
            tags: scheduledTask.task.tags.map(
              (tag) =>
                tag.id === updatedTag.id
                  ? updatedTag
                  : tag,
            ),
          },
        })),
      );

      cancelEditTag();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to update tag',
      );
    } finally {
      setSavingTag(false);
    }
  }

  /* =========================================================
     TAG DELETE
  ========================================================= */

  async function handleDeleteTag(
    tagId: string,
  ) {
    const tag = tags.find(
      (item) => item.id === tagId,
    );

    if (!tag) {
      return;
    }

    const confirmed = window.confirm(
      `Delete the "${tag.name}" tag?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingTagId(tagId);
      setError('');

      const result = await graphqlRequest<{
        deleteTag: boolean;
      }>(
        DELETE_TAG_MUTATION,
        {
          id: tagId,
        },
      );

      if (!result.deleteTag) {
        throw new Error(
          'Failed to delete tag',
        );
      }

      setTags((current) =>
        current.filter(
          (item) => item.id !== tagId,
        ),
      );

      setTasks((current) =>
        current.map((task) => ({
          ...task,
          tags: task.tags.filter(
            (item) => item.id !== tagId,
          ),
        })),
      );

      setScheduledTasks((current) =>
        current.map((scheduledTask) => ({
          ...scheduledTask,
          task: {
            ...scheduledTask.task,
            tags: scheduledTask.task.tags.filter(
              (item) => item.id !== tagId,
            ),
          },
        })),
      );

      if (selectedTagId === tagId) {
        setSelectedTagId(null);
      }

      if (editingTagId === tagId) {
        cancelEditTag();
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to delete tag',
      );
    } finally {
      setDeletingTagId(null);
    }
  }

  /* =========================================================
     TAG FILTER
  ========================================================= */

  function taskMatchesTag(task: Task) {
    if (!selectedTagId) {
      return true;
    }

    return task.tags.some(
      (tag) => tag.id === selectedTagId,
    );
  }

  /* =========================================================
     NORMAL TASKS
  ========================================================= */

  const sortedTasks = useMemo(() => {
    return [...tasks].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() -
        new Date(a.createdAt).getTime(),
    );
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    return sortedTasks.filter(
      taskMatchesTag,
    );
  }, [sortedTasks, selectedTagId]);

  const inProgressTasks = useMemo(() => {
    return filteredTasks.filter(
      (task) =>
        task.status === 'IN_PROGRESS',
    );
  }, [filteredTasks]);

  const completedTasks = useMemo(() => {
    return filteredTasks.filter(
      (task) =>
        task.status === 'COMPLETED',
    );
  }, [filteredTasks]);

  const pausedTasks = useMemo(() => {
    return filteredTasks.filter(
      (task) =>
        task.status === 'PAUSED',
    );
  }, [filteredTasks]);

  const cancelledTasks = useMemo(() => {
    return filteredTasks.filter(
      (task) =>
        task.status === 'CANCELLED',
    );
  }, [filteredTasks]);

  /*
   * All tab's main section excludes completed tasks,
   * because completed tasks are shown in the dedicated
   * Completed section at the bottom.
   */
  const allActiveTasks = useMemo(() => {
    return filteredTasks.filter(
      (task) =>
        task.status !== 'COMPLETED',
    );
  }, [filteredTasks]);

  /* =========================================================
     SCHEDULED TASKS
  ========================================================= */

  const scheduledOccurrences = useMemo(() => {
    return scheduledTasks
      .filter(
        (scheduledTask) =>
          scheduledTask.task.status ===
          'PLANNED',
      )
      .filter((scheduledTask) =>
        taskMatchesTag(scheduledTask.task),
      )
      .sort(
        (a, b) =>
          new Date(
            `${b.date}T00:00:00`,
          ).getTime() -
          new Date(
            `${a.date}T00:00:00`,
          ).getTime(),
      );
  }, [scheduledTasks, selectedTagId]);

  const scheduledGroups = useMemo(() => {
    const groups = new Map<
      string,
      ScheduledTask[]
    >();

    for (const occurrence of scheduledOccurrences) {
      const existing =
        groups.get(occurrence.date) ?? [];

      existing.push(occurrence);

      groups.set(
        occurrence.date,
        existing,
      );
    }

    return Array.from(
      groups.entries(),
    );
  }, [scheduledOccurrences]);

  /* =========================================================
     TAB DATA
  ========================================================= */

  const activeTasksForTab = useMemo(() => {
    switch (activeTab) {
      case 'IN_PROGRESS':
        return inProgressTasks;

      case 'COMPLETED':
        return completedTasks;

      case 'PAUSED':
        return pausedTasks;

      case 'CANCELLED':
        return cancelledTasks;

      default:
        return allActiveTasks;
    }
  }, [
    activeTab,
    allActiveTasks,
    inProgressTasks,
    completedTasks,
    pausedTasks,
    cancelledTasks,
  ]);

  /* =========================================================
     COUNTS
  ========================================================= */

  const counts = {
    ALL: tasks.length,
    IN_PROGRESS: tasks.filter(
      (task) =>
        task.status === 'IN_PROGRESS',
    ).length,
    SCHEDULED: scheduledTasks.filter(
      (scheduledTask) =>
        scheduledTask.task.status ===
        'PLANNED',
    ).length,
    COMPLETED: tasks.filter(
      (task) =>
        task.status === 'COMPLETED',
    ).length,
    PAUSED: tasks.filter(
      (task) =>
        task.status === 'PAUSED',
    ).length,
    CANCELLED: tasks.filter(
      (task) =>
        task.status === 'CANCELLED',
    ).length,
  };

  /* =========================================================
     RENDER TASK CARD
  ========================================================= */

  function renderTaskCard(task: Task) {
    const taskSessions =
      timeSessions.filter(
        (session) =>
          session.taskId === task.id,
      );

    return (
      <TaskCard
        key={task.id}
        task={task}
        tags={tags}
        timeSessions={taskSessions}
        onTaskUpdated={
          handleTaskUpdated
        }
        onTaskDeleted={
          handleTaskDeleted
        }
        onSessionAdded={
          handleSessionAdded
        }
        onError={setError}
        onScheduleChanged={
          handleScheduleChanged
        }
      />
    );
  }

  /* =========================================================
     EMPTY STATE
  ========================================================= */

  function renderEmptyState(
    message: string,
    showAddButton = false,
  ) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-12 text-center shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {message}
        </p>

        {showAddButton && (
          <button
            type="button"
            onClick={openCreateTask}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
          >
            Add your first task
          </button>
        )}
      </div>
    );
  }

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] py-20 text-center text-sm text-[var(--color-text-secondary)] shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        Loading tasks...
      </div>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="space-y-8">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-medium text-[var(--color-primary)]">
            Tasks
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
            Your Tasks
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Manage your tasks and keep track of your progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex shrink-0 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] shadow-sm transition-colors hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LuRefreshCw
            size={16}
            strokeWidth={1.8}
            className={refreshing ? 'animate-spin' : ''}
          />
          {refreshing
            ? 'Refreshing...'
            : 'Refresh'}
        </button>
      </div>

      {/* ===================================================
          ERROR
      =================================================== */}

      {error && (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-[var(--color-danger)] shadow-sm">
          {error}
        </div>
      )}

      {/* ===================================================
          MAIN GRID
      =================================================== */}

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* =================================================
            LEFT: TASKS
        ================================================= */}

        <section className="min-w-0 lg:col-span-2">
          {/* ===============================================
              TABS
          =============================================== */}

          <div className="mb-6 flex items-center gap-2 overflow-x-auto border-b border-[var(--color-border)]">
            {(
              [
                ['ALL', 'All'],
                ['IN_PROGRESS', 'In Progress'],
                ['SCHEDULED', 'Scheduled'],
                ['COMPLETED', 'Completed'],
                ['PAUSED', 'Paused'],
                ['CANCELLED', 'Cancelled'],
              ] as [TaskTab, string][]
            ).map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                onClick={() =>
                  setActiveTab(tab)
                }
                className={`shrink-0 border-b-2 px-3 pb-3 text-sm font-medium ${
                  activeTab === tab
                    ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
                }`}
              >
                {label}
                <span className="ml-1.5 text-xs text-[var(--color-text-muted)]">
                  {counts[tab]}
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={openCreateTask}
              className="ml-auto mb-1 inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              <LuPlus size={15} strokeWidth={1.9} />
              Add Task
            </button>
          </div>

          {/* ===============================================
              CREATE TASK
          =============================================== */}

          {showCreateTask && (
            <form
              onSubmit={handleCreateTask}
              className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]"
            >
              <div className="space-y-4">
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(event) =>
                    setTaskTitle(
                      event.target.value,
                    )
                  }
                  placeholder="Task name"
                  autoFocus
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                />

                <textarea
                  value={taskDescription}
                  onChange={(event) =>
                    setTaskDescription(
                      event.target.value,
                    )
                  }
                  placeholder="Description"
                  rows={3}
                  className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                />

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={
                      closeCreateTask
                    }
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] shadow-sm transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={
                      !taskTitle.trim() ||
                      creatingTask
                    }
                    className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creatingTask
                      ? 'Adding...'
                      : 'Add Task'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ===============================================
              SCHEDULED TAB
          =============================================== */}

          {activeTab === 'SCHEDULED' ? (
            scheduledGroups.length === 0 ? (
              renderEmptyState(
                selectedTagId
                  ? 'No scheduled tasks with this tag.'
                  : 'No scheduled tasks.',
                !selectedTagId,
              )
            ) : (
              <div className="space-y-10">
                {scheduledGroups.map(
                  ([date, occurrences]) => (
                    <section
                      key={date}
                    >
                      <div className="border-b border-[var(--color-border)] pb-4">
                        <h2 className="text-lg font-semibold text-[var(--color-text)]">
                          {formatScheduledDate(
                            date,
                          )}
                        </h2>

                        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                          {occurrences.length}{' '}
                          {occurrences.length ===
                          1
                            ? 'task'
                            : 'tasks'}
                        </p>
                      </div>

                      <div className="mt-6 space-y-4">
                        {occurrences.map(
                          (scheduledTask) =>
                            renderTaskCard(
                              scheduledTask.task,
                            ),
                        )}
                      </div>
                    </section>
                  ),
                )}
              </div>
            )
          ) : activeTab === 'ALL' ? (
            <>
              {/* =========================================
                  ACTIVE TASKS
              ========================================= */}

              <section>
                <div className="border-b border-[var(--color-border)] pb-4">
                  <h2 className="text-lg font-semibold text-[var(--color-text)]">
                    Tasks
                  </h2>

                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Your active tasks, newest first.
                  </p>
                </div>

                <div className="mt-6">
                  {allActiveTasks.length ===
                  0
                    ? renderEmptyState(
                        selectedTagId
                          ? 'No active tasks with this tag.'
                          : 'No active tasks.',
                        !selectedTagId,
                      )
                    : (
                      <div className="space-y-4">
                        {allActiveTasks.map(
                          renderTaskCard,
                        )}
                      </div>
                    )}
                </div>
              </section>

              {/* =========================================
                  COMPLETED
              ========================================= */}

              <section className="mt-10">
                <div className="border-b border-[var(--color-border)] pb-4">
                  <h2 className="text-lg font-semibold text-[var(--color-text)]">
                    Completed (
                    {completedTasks.length})
                  </h2>

                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Tasks you have completed.
                  </p>
                </div>

                <div className="mt-6">
                  {completedTasks.length ===
                  0
                    ? renderEmptyState(
                        selectedTagId
                          ? 'No completed tasks with this tag.'
                          : 'No completed tasks yet.',
                      )
                    : (
                      <div className="space-y-4">
                        {completedTasks.map(
                          renderTaskCard,
                        )}
                      </div>
                    )}
                </div>
              </section>
            </>
          ) : (
            /* =============================================
               STATUS TAB
            ============================================= */

            <section>
              <div className="border-b border-[var(--color-border)] pb-4">
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  {activeTab ===
                    'IN_PROGRESS' &&
                    'In Progress'}
                  {activeTab ===
                    'COMPLETED' &&
                    'Completed'}
                  {activeTab ===
                    'PAUSED' &&
                    'Paused'}
                  {activeTab ===
                    'CANCELLED' &&
                    'Cancelled'}
                </h2>

                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Sorted by creation date, newest first.
                </p>
              </div>

              <div className="mt-6">
                {activeTasksForTab.length ===
                0
                  ? renderEmptyState(
                      selectedTagId
                        ? 'No tasks with this tag.'
                        : 'No tasks found.',
                      !selectedTagId,
                    )
                  : (
                    <div className="space-y-4">
                      {activeTasksForTab.map(
                        renderTaskCard,
                      )}
                    </div>
                  )}
              </div>
            </section>
          )}
        </section>

        {/* =================================================
            RIGHT: TAG SIDEBAR
        ================================================= */}

        <aside className="lg:sticky lg:top-6">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
            {/* =============================================
                TAG HEADER
            ============================================= */}

            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-[var(--color-text)]">
                  Tags
                </h2>

                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  Filter and organize your tasks.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowCreateTag(
                    (value) => !value,
                  )
                }
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] shadow-sm transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
              >
                <LuPlus size={16} strokeWidth={1.8} />
              </button>
            </div>

            {/* =============================================
                CREATE TAG
            ============================================= */}

            {showCreateTag && (
              <form
                onSubmit={handleCreateTag}
                className="mt-5 space-y-3 border-t border-[var(--color-border)] pt-5"
              >
                <input
                  type="text"
                  value={tagName}
                  onChange={(event) =>
                    setTagName(
                      event.target.value,
                    )
                  }
                  placeholder="Tag name"
                  autoFocus
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-light)]"
                />

                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={tagColor}
                    onChange={(event) =>
                      setTagColor(
                        event.target.value,
                      )
                    }
                    className="h-9 w-12 cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]"
                  />

                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Choose color
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={
                    !tagName.trim() ||
                    creatingTag
                  }
                  className="w-full rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 py-2.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingTag
                    ? 'Creating...'
                    : 'Create Tag'}
                </button>
              </form>
            )}

            {/* =============================================
                TAG LIST
            ============================================= */}

            <div className="mt-5 space-y-1">
              {/* ALL */}

              <button
                type="button"
                onClick={() =>
                  setSelectedTagId(null)
                }
                className={`flex w-full items-center justify-between rounded-[var(--radius-md)] px-3 py-2.5 text-left ${
                  selectedTagId === null
                    ? 'bg-[var(--color-primary-light)]'
                    : 'hover:bg-[var(--color-surface)]'
                }`}
              >
                <span className="text-sm font-medium text-[var(--color-text)]">
                  All Tasks
                </span>

                <span className="text-xs text-[var(--color-text-muted)]">
                  {tasks.length}
                </span>
              </button>

              {/* TAGS */}

              {tags.map((tag) => {
                const count =
                  tasks.filter(
                    (task) =>
                      task.tags.some(
                        (taskTag) =>
                          taskTag.id ===
                          tag.id,
                      ),
                  ).length;

                if (
                  editingTagId === tag.id
                ) {
                  return (
                    <form
                      key={tag.id}
                      onSubmit={
                        handleUpdateTag
                      }
                      className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm"
                    >
                      <input
                        type="text"
                        value={
                          editingTagName
                        }
                        onChange={(event) =>
                          setEditingTagName(
                            event.target
                              .value,
                          )
                        }
                        autoFocus
                        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                      />

                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="color"
                          value={
                            editingTagColor
                          }
                          onChange={(event) =>
                            setEditingTagColor(
                              event.target
                                .value,
                            )
                          }
                          className="h-8 w-10 cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]"
                        />

                        <span className="text-xs text-[var(--color-text-secondary)]">
                          Color
                        </span>
                      </div>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="submit"
                          disabled={
                            !editingTagName.trim() ||
                            savingTag
                          }
                          className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {savingTag
                            ? 'Saving...'
                            : 'Save'}
                        </button>

                        <button
                          type="button"
                          onClick={
                            cancelEditTag
                          }
                          disabled={
                            savingTag
                          }
                          className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] shadow-sm transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  );
                }

                return (
                  <div
                    key={tag.id}
                    className={`group flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2.5 ${
                      selectedTagId ===
                      tag.id
                        ? 'bg-[var(--color-primary-light)]'
                        : 'hover:bg-[var(--color-surface-hover)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedTagId(
                          selectedTagId ===
                            tag.id
                            ? null
                            : tag.id,
                        )
                      }
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            tag.color,
                        }}
                      />

                      <span className="truncate text-sm text-[var(--color-text)]">
                        {tag.name}
                      </span>

                      <span className="ml-auto text-xs text-[var(--color-text-muted)]">
                        {count}
                      </span>
                    </button>

                    <div className="ml-2 hidden shrink-0 items-center gap-1 group-hover:flex">
                      <button
                        type="button"
                        onClick={() =>
                          startEditTag(
                            tag,
                          )
                        }
                        className="rounded p-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-background)] hover:text-[var(--color-text)]"
                        aria-label={`Edit ${tag.name}`}
                      >
                        ✎
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteTag(
                            tag.id,
                          )
                        }
                        disabled={
                          deletingTagId ===
                          tag.id
                        }
                        className="rounded p-1 text-xs text-[var(--color-text-muted)] hover:bg-red-50 hover:text-[var(--color-danger)] disabled:opacity-50"
                        aria-label={`Delete ${tag.name}`}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}