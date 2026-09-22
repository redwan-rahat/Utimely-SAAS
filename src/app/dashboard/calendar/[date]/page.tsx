'use client';

import { useEffect, useState } from 'react';
import { graphqlRequest } from '@/lib/graphql-client';
import TaskCard from '@/app/components/tasks/TaskCard';

type Tag = {
  id: string;
  name: string;
  color: string;
  createdAt?: string;
  updatedAt?: string;
};

type TaskStatus =
  'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';

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

/* =========================================================
   QUERIES
========================================================= */

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
   TASK MUTATIONS
========================================================= */

const CREATE_TASK_MUTATION = `
  mutation CreateTask(
    $input: CreateTaskInput!
  ) {
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
    }
  }
`;

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

/* =========================================================
   TAG MUTATIONS
========================================================= */

const CREATE_TAG_MUTATION = `
  mutation CreateTag(
    $input: CreateTagInput!
  ) {
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

/* =========================================================
   SCHEDULE MUTATIONS
========================================================= */

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

function formatDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

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

function getStatusLabel(status: TaskStatus) {
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

function getTomorrowDate(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`);

  date.setDate(date.getDate() + 1);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/* =========================================================
   PAGE
========================================================= */

export default function CalendarDayPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const [date, setDate] = useState('');

  const [tasks, setTasks] = useState<Task[]>([]);

  const [tags, setTags] = useState<Tag[]>([]);

  const [timeSessions, setTimeSessions] = useState<TimeSession[]>([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState('');

  /* =======================================================
     TAG FILTER
  ======================================================= */

  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  /* =======================================================
     CREATE TAG
  ======================================================= */

  const [showCreateTag, setShowCreateTag] = useState(false);

  const [tagName, setTagName] = useState('');

  const [tagColor, setTagColor] = useState('#6D5DFB');

  const [creatingTag, setCreatingTag] = useState(false);

  /* =======================================================
     EDIT TAG
  ======================================================= */

  const [editingTagId, setEditingTagId] = useState<string | null>(null);

  const [editingTagName, setEditingTagName] = useState('');

  const [editingTagColor, setEditingTagColor] = useState('#6D5DFB');

  const [savingTag, setSavingTag] = useState(false);

  const [deletingTagId, setDeletingTagId] = useState<string | null>(null);

  /* =======================================================
     ADD TASK
  ======================================================= */

  const [showAddTask, setShowAddTask] = useState(false);

  const [addTaskMode, setAddTaskMode] = useState<'CREATE' | 'EXISTING'>(
    'CREATE',
  );

  const [newTaskTitle, setNewTaskTitle] = useState('');

  const [newTaskDescription, setNewTaskDescription] = useState('');

  const [allTasks, setAllTasks] = useState<Task[]>([]);

  const [addingTask, setAddingTask] = useState(false);

  /* =======================================================
     LOAD DAY
  ======================================================= */

  async function loadDay(
    selectedDate: string,
    options?: {
      showRefresh?: boolean;
    },
  ) {
    try {
      if (options?.showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');

      const [tasksResult, tagsResult, sessionsResult] = await Promise.all([
        graphqlRequest<{
          tasksForDate: Task[];
        }>(TASKS_FOR_DATE_QUERY, {
          date: selectedDate,
        }),

        graphqlRequest<{
          tags: Tag[];
        }>(TAGS_QUERY),

        graphqlRequest<{
          timeSessions: TimeSession[];
        }>(TIME_SESSIONS_QUERY),
      ]);

      setTasks(tasksResult.tasksForDate);

      setTags(tagsResult.tags);

      setTimeSessions(sessionsResult.timeSessions);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load day');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /* =======================================================
     INITIALIZE
  ======================================================= */

  useEffect(() => {
    async function initialize() {
      const resolvedParams = await params;

      const selectedDate = resolvedParams.date;

      setDate(selectedDate);

      await loadDay(selectedDate);
    }

    initialize();
  }, [params]);

  /* =======================================================
     FILTER TASKS
  ======================================================= */

  const inProgressTasks = tasks
    .filter(
      (task) =>
        task.status !== 'COMPLETED' &&
        task.status !== 'CANCELLED' &&
        task.status !== 'PAUSED',
    )
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const completedTasks = tasks
    .filter((task) => task.status === 'COMPLETED')
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  const visibleInProgressTasks = selectedTagId
    ? inProgressTasks.filter((task) =>
        task.tags.some((tag) => tag.id === selectedTagId),
      )
    : inProgressTasks;

  const visibleCompletedTasks = selectedTagId
    ? completedTasks.filter((task) =>
        task.tags.some((tag) => tag.id === selectedTagId),
      )
    : completedTasks;

  /* =======================================================
     REFRESH
  ======================================================= */

  async function handleRefresh() {
    if (!date || refreshing) {
      return;
    }

    await loadDay(date, {
      showRefresh: true,
    });
  }

  /* =======================================================
     ADD TASK
  ======================================================= */

  async function openAddTask() {
    try {
      setError('');

      const result = await graphqlRequest<{
        tasks: Task[];
      }>(TASKS_QUERY);

      setAllTasks(result.tasks);

      setAddTaskMode('CREATE');
      setShowAddTask(true);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load tasks');
    }
  }

  function closeAddTask() {
    setShowAddTask(false);
    setNewTaskTitle('');
    setNewTaskDescription('');
    setAddTaskMode('CREATE');
  }

  async function handleCreateAndScheduleTask(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!newTaskTitle.trim()) {
      setError('Task name cannot be empty.');

      return;
    }

    if (!date) {
      return;
    }

    try {
      setAddingTask(true);
      setError('');

      const createResult = await graphqlRequest<{
        createTask: Task;
      }>(CREATE_TASK_MUTATION, {
        input: {
          title: newTaskTitle.trim(),
          description: newTaskDescription.trim() || null,
        },
      });

      // New tasks created from Today's Tasks
      // should immediately be In Progress.
      await graphqlRequest<{
        updateTask: Task;
      }>(UPDATE_TASK_MUTATION, {
        id: createResult.createTask.id,
        input: {
          status: 'IN_PROGRESS',
        },
      });

      await graphqlRequest<{
        scheduleTask: {
          id: string;
          date: string;
        };
      }>(SCHEDULE_TASK_MUTATION, {
        taskId: createResult.createTask.id,
        date,
      });

      closeAddTask();

      await loadDay(date);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add task');
    } finally {
      setAddingTask(false);
    }
  }

  async function handleScheduleExistingTask(taskId: string) {
    if (!date) {
      return;
    }

    try {
      setAddingTask(true);
      setError('');

      // Change the existing task to IN_PROGRESS
      await graphqlRequest<{
        updateTask: Task;
      }>(UPDATE_TASK_MUTATION, {
        id: taskId,
        input: {
          status: 'IN_PROGRESS',
        },
      });

      // Then schedule it for today
      await graphqlRequest<{
        scheduleTask: {
          id: string;
          date: string;
        };
      }>(SCHEDULE_TASK_MUTATION, {
        taskId,
        date,
      });

      closeAddTask();

      await loadDay(date);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to schedule task',
      );
    } finally {
      setAddingTask(false);
    }
  }

  const existingTaskIds = new Set(tasks.map((task) => task.id));

  const availableTasks = allTasks
    .filter((task) => !existingTaskIds.has(task.id))
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

  /* =======================================================
     TASK UPDATE
  ======================================================= */

  function handleTaskUpdated(updatedTask: Task) {
    setTasks((current) =>
      current.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
    );
  }

  function handleTaskDeleted(taskId: string) {
    setTasks((current) => current.filter((task) => task.id !== taskId));

    setTimeSessions((current) =>
      current.filter((session) => session.taskId !== taskId),
    );
  }

  function handleSessionAdded(session: TimeSession) {
    setTimeSessions((current) => [...current, session]);
  }

  /* =======================================================
     TAGS
  ======================================================= */

  async function handleCreateTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!tagName.trim()) {
      return;
    }

    try {
      setCreatingTag(true);
      setError('');

      const result = await graphqlRequest<{
        createTag: Tag;
      }>(CREATE_TAG_MUTATION, {
        input: {
          name: tagName.trim(),
          color: tagColor,
        },
      });

      setTags((current) => [...current, result.createTag]);

      setTagName('');
      setTagColor('#6D5DFB');
      setShowCreateTag(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create tag');
    } finally {
      setCreatingTag(false);
    }
  }

  function startEditTag(tag: Tag) {
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
    setEditingTagColor(tag.color);
    setShowCreateTag(false);
  }

  function cancelEditTag() {
    setEditingTagId(null);
    setEditingTagName('');
    setEditingTagColor('#6D5DFB');
  }

  async function handleUpdateTag(tagId: string) {
    if (!editingTagName.trim()) {
      setError('Tag name cannot be empty.');

      return;
    }

    try {
      setSavingTag(true);
      setError('');

      const result = await graphqlRequest<{
        updateTag: Tag;
      }>(UPDATE_TAG_MUTATION, {
        id: tagId,
        input: {
          name: editingTagName.trim(),
          color: editingTagColor,
        },
      });

      const updatedTag = result.updateTag;

      setTags((current) =>
        current.map((tag) => (tag.id === tagId ? updatedTag : tag)),
      );

      setTasks((current) =>
        current.map((task) => ({
          ...task,
          tags: task.tags.map((tag) => (tag.id === tagId ? updatedTag : tag)),
        })),
      );

      cancelEditTag();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update tag');
    } finally {
      setSavingTag(false);
    }
  }

  async function handleDeleteTag(tagId: string) {
    const tag = tags.find((item) => item.id === tagId);

    if (!tag) {
      return;
    }

    const confirmed = window.confirm(`Delete the "${tag.name}" tag?`);

    if (!confirmed) {
      return;
    }

    try {
      setDeletingTagId(tagId);
      setError('');

      const result = await graphqlRequest<{
        deleteTag: boolean;
      }>(DELETE_TAG_MUTATION, {
        id: tagId,
      });

      if (!result.deleteTag) {
        throw new Error('Failed to delete tag');
      }

      setTags((current) => current.filter((item) => item.id !== tagId));

      setTasks((current) =>
        current.map((task) => ({
          ...task,
          tags: task.tags.filter((item) => item.id !== tagId),
        })),
      );

      if (selectedTagId === tagId) {
        setSelectedTagId(null);
      }

      if (editingTagId === tagId) {
        cancelEditTag();
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete tag');
    } finally {
      setDeletingTagId(null);
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  if (loading) {
    return (
      <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
        Loading day...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ===================================================
          HEADER
      =================================================== */}

      <div>
        {/* BACK BUTTON */}
        <button
          type="button"
          onClick={() => {
            window.location.href = '/dashboard/calendar';
          }}
          className="mb-6 inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)]"
        >
          ← Back to Calendar
        </button>

        {/* DATE + REFRESH */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="mb-1 text-sm font-medium text-[var(--color-primary)]">
              Calendar
            </p>

            <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
              {date ? formatDate(date) : ''}
            </h1>

            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Tasks planned for this day.
            </p>
          </div>

          {/* REFRESH */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex shrink-0 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className={refreshing ? 'animate-spin' : ''}>↻</span>

            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ===================================================
          DAY CONTENT
      =================================================== */}

      <div className="grid items-start gap-8 border-t border-[var(--color-border)] pt-8 lg:grid-cols-3">
        {/* =================================================
            LEFT: TASKS
        ================================================= */}

        <div className="min-w-0 lg:col-span-2">
          {/* ===============================================
              IN PROGRESS
          =============================================== */}

          <section>
            <div className="flex items-end justify-between gap-4 border-b border-[var(--color-border)] pb-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  In Progress ({inProgressTasks.length})
                </h2>

                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Tasks that still need attention.
                </p>
              </div>

              {/* ADD TASK */}
              <button
                type="button"
                onClick={openAddTask}
                className="shrink-0 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3.5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                + Add Task
              </button>
            </div>

            <div className="mt-6">
              {visibleInProgressTasks.length === 0 ? (
                <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] px-6 py-12 text-center">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {selectedTagId
                      ? 'No tasks with this tag.'
                      : 'No tasks in progress.'}
                  </p>

                  {!selectedTagId && (
                    <button
                      type="button"
                      onClick={openAddTask}
                      className="mt-4 text-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                      Add your first task
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {visibleInProgressTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      tags={tags}
                      timeSessions={timeSessions}
                      onTaskUpdated={handleTaskUpdated}
                      onTaskDeleted={handleTaskDeleted}
                      onSessionAdded={handleSessionAdded}
                      onError={setError}
                      currentDate={date}
                      onScheduleChanged={() => loadDay(date)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ===============================================
              COMPLETED
          =============================================== */}

          <section className="mt-10">
            <div className="border-b border-[var(--color-border)] pb-4">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                Completed ({completedTasks.length})
              </h2>

              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Tasks you finished today.
              </p>
            </div>

            <div className="mt-6">
              {visibleCompletedTasks.length === 0 ? (
                <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] px-6 py-12 text-center">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {selectedTagId
                      ? 'No completed tasks with this tag.'
                      : 'No completed tasks yet.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {visibleCompletedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      tags={tags}
                      timeSessions={timeSessions}
                      onTaskUpdated={handleTaskUpdated}
                      onTaskDeleted={handleTaskDeleted}
                      onSessionAdded={handleSessionAdded}
                      onError={setError}
                      currentDate={date}
                      onScheduleChanged={() => loadDay(date)}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* =================================================
            RIGHT: TAGS
        ================================================= */}

        <TagSidebar
          tags={tags}
          tasks={tasks}
          selectedTagId={selectedTagId}
          setSelectedTagId={setSelectedTagId}
          showCreateTag={showCreateTag}
          setShowCreateTag={setShowCreateTag}
          tagName={tagName}
          setTagName={setTagName}
          tagColor={tagColor}
          setTagColor={setTagColor}
          creatingTag={creatingTag}
          onCreateTag={handleCreateTag}
          editingTagId={editingTagId}
          editingTagName={editingTagName}
          setEditingTagName={setEditingTagName}
          editingTagColor={editingTagColor}
          setEditingTagColor={setEditingTagColor}
          savingTag={savingTag}
          onStartEdit={startEditTag}
          onCancelEdit={cancelEditTag}
          onUpdateTag={handleUpdateTag}
          deletingTagId={deletingTagId}
          onDeleteTag={handleDeleteTag}
        />
      </div>

      {/* ===================================================
          ADD TASK MODAL
      =================================================== */}

      {showAddTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 px-4">
          <div className="w-full max-w-lg rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-6 shadow-xl">
            {/* HEADER */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text)]">
                  Add Task
                </h2>

                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  Add a task to {date ? formatDate(date) : 'this day'}.
                </p>
              </div>

              <button
                type="button"
                onClick={closeAddTask}
                className="text-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              >
                ×
              </button>
            </div>

            {/* MODE TABS */}
            <div className="mt-6 flex rounded-[var(--radius-md)] bg-[var(--color-surface)] p-1">
              <button
                type="button"
                onClick={() => setAddTaskMode('CREATE')}
                className={`flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium ${
                  addTaskMode === 'CREATE'
                    ? 'bg-[var(--color-background)] text-[var(--color-text)] shadow-sm'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                Create New
              </button>

              <button
                type="button"
                onClick={() => setAddTaskMode('EXISTING')}
                className={`flex-1 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-medium ${
                  addTaskMode === 'EXISTING'
                    ? 'bg-[var(--color-background)] text-[var(--color-text)] shadow-sm'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                Existing Task
              </button>
            </div>

            {/* CREATE */}
            {addTaskMode === 'CREATE' && (
              <form
                onSubmit={handleCreateAndScheduleTask}
                className="mt-6 space-y-4"
              >
                <div>
                  <label
                    htmlFor="new-task-title"
                    className="mb-2 block text-sm font-medium text-[var(--color-text)]"
                  >
                    Task name
                  </label>

                  <input
                    id="new-task-title"
                    type="text"
                    value={newTaskTitle}
                    onChange={(event) => setNewTaskTitle(event.target.value)}
                    placeholder="What do you need to do?"
                    autoFocus
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-task-description"
                    className="mb-2 block text-sm font-medium text-[var(--color-text)]"
                  >
                    Description
                  </label>

                  <textarea
                    id="new-task-description"
                    value={newTaskDescription}
                    onChange={(event) =>
                      setNewTaskDescription(event.target.value)
                    }
                    rows={4}
                    placeholder="Add some details..."
                    className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2.5 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeAddTask}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!newTaskTitle.trim() || addingTask}
                    className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {addingTask ? 'Adding...' : 'Add Task'}
                  </button>
                </div>
              </form>
            )}

            {/* EXISTING */}
            {addTaskMode === 'EXISTING' && (
              <div className="mt-6">
                {availableTasks.length === 0 ? (
                  <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-5 py-8 text-center">
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      There are no other tasks available to schedule.
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="mb-3 text-xs text-[var(--color-text-secondary)]">
                      Choose a task that has not already been scheduled for this
                      day.
                    </p>

                    <div className="max-h-72 space-y-2 overflow-y-auto">
                      {availableTasks.map((task) => (
                        <button
                          key={task.id}
                          type="button"
                          disabled={addingTask}
                          onClick={() => handleScheduleExistingTask(task.id)}
                          className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] p-3 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-[var(--color-text)]">
                                {task.title}
                              </p>

                              {task.description && (
                                <p className="mt-1 truncate text-xs text-[var(--color-text-secondary)]">
                                  {task.description}
                                </p>
                              )}
                            </div>

                            <span className="shrink-0 text-xs text-[var(--color-text-muted)]">
                              {task.progress}%
                            </span>
                          </div>

                          {task.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {task.tags.map((tag) => (
                                <span
                                  key={tag.id}
                                  className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                                  style={{
                                    backgroundColor: `${tag.color}20`,
                                    color: tag.color,
                                  }}
                                >
                                  {tag.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="mt-5 flex justify-end">
                      <button
                        type="button"
                        onClick={closeAddTask}
                        className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================================================
   TAG SIDEBAR
========================================================= */

type TagSidebarProps = {
  tags: Tag[];
  tasks: Task[];
  selectedTagId: string | null;

  setSelectedTagId: (id: string | null) => void;

  showCreateTag: boolean;

  setShowCreateTag: (value: boolean) => void;

  tagName: string;

  setTagName: (value: string) => void;

  tagColor: string;

  setTagColor: (value: string) => void;

  creatingTag: boolean;

  onCreateTag: (event: React.FormEvent<HTMLFormElement>) => void;

  editingTagId: string | null;

  editingTagName: string;

  setEditingTagName: (value: string) => void;

  editingTagColor: string;

  setEditingTagColor: (value: string) => void;

  savingTag: boolean;

  onStartEdit: (tag: Tag) => void;

  onCancelEdit: () => void;

  onUpdateTag: (tagId: string) => void;

  deletingTagId: string | null;

  onDeleteTag: (tagId: string) => void;
};

function TagSidebar({
  tags,
  tasks,
  selectedTagId,
  setSelectedTagId,
  showCreateTag,
  setShowCreateTag,
  tagName,
  setTagName,
  tagColor,
  setTagColor,
  creatingTag,
  onCreateTag,
  editingTagId,
  editingTagName,
  setEditingTagName,
  editingTagColor,
  setEditingTagColor,
  savingTag,
  onStartEdit,
  onCancelEdit,
  onUpdateTag,
  deletingTagId,
  onDeleteTag,
}: TagSidebarProps) {
  return (
    <aside className="lg:sticky lg:top-6">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-5">
        {/* HEADER */}

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
            onClick={() => setShowCreateTag((value) => !value)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border)] text-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
          >
            +
          </button>
        </div>

        {/* CREATE TAG */}

        {showCreateTag && (
          <form
            onSubmit={onCreateTag}
            className="mt-5 space-y-3 border-t border-[var(--color-border)] pt-5"
          >
            <input
              type="text"
              value={tagName}
              onChange={(event) => setTagName(event.target.value)}
              placeholder="Tag name"
              autoFocus
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
            />

            <div className="flex items-center gap-2">
              <input
                type="color"
                value={tagColor}
                onChange={(event) => setTagColor(event.target.value)}
                className="h-9 w-12 cursor-pointer rounded border border-[var(--color-border)]"
              />

              <span className="text-xs text-[var(--color-text-secondary)]">
                Choose color
              </span>
            </div>

            <button
              type="submit"
              disabled={!tagName.trim() || creatingTag}
              className="w-full rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
            >
              {creatingTag ? 'Creating...' : 'Create Tag'}
            </button>
          </form>
        )}

        {/* TAG LIST */}

        <div className="mt-5 space-y-1">
          {/* ALL */}

          <button
            type="button"
            onClick={() => setSelectedTagId(null)}
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

          {tags.map((tag) => {
            const count = tasks.filter((task) =>
              task.tags.some((taskTag) => taskTag.id === tag.id),
            ).length;

            const isEditing = editingTagId === tag.id;

            const isDeleting = deletingTagId === tag.id;

            if (isEditing) {
              return (
                <div
                  key={tag.id}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                >
                  <input
                    type="text"
                    value={editingTagName}
                    onChange={(event) => setEditingTagName(event.target.value)}
                    autoFocus
                    className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                  />

                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="color"
                      value={editingTagColor}
                      onChange={(event) =>
                        setEditingTagColor(event.target.value)
                      }
                      className="h-8 w-10 cursor-pointer rounded border border-[var(--color-border)]"
                    />

                    <span className="text-xs text-[var(--color-text-secondary)]">
                      Color
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => onUpdateTag(tag.id)}
                      disabled={savingTag}
                      className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                    >
                      {savingTag ? 'Saving...' : 'Save'}
                    </button>

                    <button
                      type="button"
                      onClick={onCancelEdit}
                      disabled={savingTag}
                      className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={tag.id}
                className={`group flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2.5 ${
                  selectedTagId === tag.id
                    ? 'bg-[var(--color-primary-light)]'
                    : 'hover:bg-[var(--color-surface)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    setSelectedTagId(selectedTagId === tag.id ? null : tag.id)
                  }
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: tag.color,
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
                    onClick={() => onStartEdit(tag)}
                    disabled={isDeleting}
                    className="rounded p-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-background)] hover:text-[var(--color-text)] disabled:opacity-50"
                    title="Edit tag"
                    aria-label="Edit tag"
                  >
                    ✎
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteTag(tag.id)}
                    disabled={isDeleting}
                    className="rounded p-1 text-xs text-[var(--color-text-muted)] hover:bg-[var(--color-background)] hover:text-[var(--color-danger)] disabled:opacity-50"
                    title="Delete tag"
                    aria-label="Delete tag"
                  >
                    {isDeleting ? '...' : '🗑'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
