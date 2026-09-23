'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react';
import { graphqlRequest } from '@/lib/graphql-client';

type TimeSession = {
  id: string;
  taskId: string | null;
  type: 'FOCUS_TIMER' | 'STOPWATCH' | 'MANUAL';
  startedAt: string;
  endedAt: string;
  duration: number;
  createdAt: string;
};

type CalendarFilter = {
  id: string;
  thresholdMinutes: number;
  color: string;
  createdAt: string;
  updatedAt: string;
};

type CalendarTask = {
  id: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
};

type MonthlyScheduledTask = {
  date: string;
  task: {
    id: string;
    title: string;
    status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED' | 'CANCELLED';
    progress: number;
  };
};

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

const TASKS_QUERY = `
  query {
    tasks {
      id
      status
    }
  }
`;

const CALENDAR_FILTERS_QUERY = `
  query {
    calendarColorRules {
      id
      thresholdMinutes
      color
      createdAt
      updatedAt
    }
  }
`;

const MONTH_TASKS_QUERY = `
  query TasksForMonth(
    $year: Int!
    $month: Int!
  ) {
    tasksForMonth(
      year: $year
      month: $month
    ) {
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

const CREATE_CALENDAR_FILTER_MUTATION = `
  mutation CreateCalendarColorRule(
    $input: CreateCalendarColorRuleInput!
  ) {
    createCalendarColorRule(input: $input) {
      id
      thresholdMinutes
      color
      createdAt
      updatedAt
    }
  }
`;

const UPDATE_CALENDAR_FILTER_MUTATION = `
  mutation UpdateCalendarColorRule(
    $id: ID!
    $input: UpdateCalendarColorRuleInput!
  ) {
    updateCalendarColorRule(
      id: $id
      input: $input
    ) {
      id
      thresholdMinutes
      color
      createdAt
      updatedAt
    }
  }
`;

const DELETE_CALENDAR_FILTER_MUTATION = `
  mutation DeleteCalendarColorRule($id: ID!) {
    deleteCalendarColorRule(id: $id)
  }
`;

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

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const DEFAULT_TIME_FILTERS = [
  { thresholdMinutes: 60, color: '#D4D4D8' },
  { thresholdMinutes: 120, color: '#EF4444' },
  { thresholdMinutes: 180, color: '#8B5CF6' },
  { thresholdMinutes: 240, color: '#3B82F6' },
  { thresholdMinutes: 300, color: '#86EFAC' },
] as const;

function getDateKey(date: Date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, '0');

  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(
    2,
    '0',
  )}`;
}

function formatMinutes(minutes: number) {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);

  const remaining = minutes % 60;

  if (remaining === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remaining}m`;
}

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);

  const startingDay = (firstDay.getDay() + 6) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];

  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  return days;
}

function getApplicableFilter(
  minutes: number,
  filters: Array<{
    thresholdMinutes: number;
    color: string;
  }>,
) {
  let applicable: CalendarFilter | null = null;

  for (const filter of filters) {
    if (minutes >= filter.thresholdMinutes) {
      if (
        !applicable ||
        filter.thresholdMinutes > applicable.thresholdMinutes
      ) {
        applicable = filter;
      }
    }
  }

  return applicable;
}

export default function CalendarPage() {
  const today = new Date();

  const [currentDate, setCurrentDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const [sessions, setSessions] = useState<TimeSession[]>([]);

  const [tasks, setTasks] = useState<CalendarTask[]>([]);

  const [filters, setFilters] = useState<CalendarFilter[]>([]);

  const [scheduledTasks, setScheduledTasks] = useState<MonthlyScheduledTask[]>(
    [],
  );

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [selectedFilterId, setSelectedFilterId] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);

  const [showFilterForm, setShowFilterForm] = useState(false);

  const [editingFilterId, setEditingFilterId] = useState<string | null>(null);

  const [filterHours, setFilterHours] = useState('');

  const [filterColor, setFilterColor] = useState('#6D5DFB');

  const [savingFilter, setSavingFilter] = useState(false);

  const [deletingFilterId, setDeletingFilterId] = useState<string | null>(null);

  async function loadCalendarData() {
    try {
      setLoading(true);
      setError('');

      const year = currentDate.getFullYear();

      const month = currentDate.getMonth() + 1;

      const [sessionsResult, tasksResult, filtersResult, monthlyTasksResult] =
        await Promise.all([
          graphqlRequest<{
            timeSessions: TimeSession[];
          }>(TIME_SESSIONS_QUERY),

          graphqlRequest<{
            tasks: CalendarTask[];
          }>(TASKS_QUERY),

          graphqlRequest<{
            calendarColorRules: CalendarFilter[];
          }>(CALENDAR_FILTERS_QUERY),

          graphqlRequest<{
            tasksForMonth: MonthlyScheduledTask[];
          }>(MONTH_TASKS_QUERY, {
            year,
            month,
          }),
        ]);

      setSessions(sessionsResult.timeSessions);

      setTasks(tasksResult.tasks);

      setFilters(filtersResult.calendarColorRules);

      setScheduledTasks(monthlyTasksResult.tasksForMonth);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to load calendar data',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCalendarData();
  }, [currentDate]);

  const sortedFilters = useMemo(() => {
    return [...filters].sort((a, b) => a.thresholdMinutes - b.thresholdMinutes);
  }, [filters]);

  // Default filters are frontend-only. Custom filters from the database
  // override a default filter when they use the same threshold.
  const displayFilters = useMemo(() => {
    const rules = new Map<
      number,
      {
        thresholdMinutes: number;
        color: string;
        id?: string;
        isDefault: boolean;
      }
    >();

    for (const filter of DEFAULT_TIME_FILTERS) {
      rules.set(filter.thresholdMinutes, {
        thresholdMinutes: filter.thresholdMinutes,
        color: filter.color,
        isDefault: true,
      });
    }

    for (const filter of filters) {
      rules.set(filter.thresholdMinutes, {
        thresholdMinutes: filter.thresholdMinutes,
        color: filter.color,
        id: filter.id,
        isDefault: false,
      });
    }

    return Array.from(rules.values()).sort(
      (a, b) => a.thresholdMinutes - b.thresholdMinutes,
    );
  }, [filters]);

  // Default calendar colors are frontend-only. If a saved custom
  // filter uses the same threshold, it overrides the default color.
  const calendarFilters = useMemo(() => {
    const rules = new Map<
      number,
      {
        thresholdMinutes: number;
        color: string;
      }
    >(
      DEFAULT_TIME_FILTERS.map((filter) => [
        filter.thresholdMinutes,
        {
          thresholdMinutes: filter.thresholdMinutes,
          color: filter.color,
        },
      ]),
    );

    for (const filter of filters) {
      rules.set(filter.thresholdMinutes, {
        thresholdMinutes: filter.thresholdMinutes,
        color: filter.color,
      });
    }

    return Array.from(rules.values()).sort(
      (a, b) => a.thresholdMinutes - b.thresholdMinutes,
    );
  }, [filters]);

  /*
   * Calculate daily calendar time.
   *
   * IMPORTANT:
   * - Only MANUAL sessions count.
   * - FOCUS_TIMER is ignored.
   * - STOPWATCH is ignored.
   * - Manual time belonging to PAUSED or
   *   CANCELLED tasks is ignored.
   */
  const dailyTotals = useMemo(() => {
    const totals = new Map<string, number>();

    const taskStatusMap = new Map(tasks.map((task) => [task.id, task.status]));

    for (const session of sessions) {
      // Calendar only uses manually logged time.
      if (session.type !== 'MANUAL') {
        continue;
      }

      // Manual time must belong to a task.
      if (!session.taskId) {
        continue;
      }

      const taskStatus = taskStatusMap.get(session.taskId);

      // If the task no longer exists,
      // don't count the session.
      if (!taskStatus) {
        continue;
      }

      // Paused and cancelled tasks do not
      // contribute to calendar time.
      if (taskStatus === 'PAUSED' || taskStatus === 'CANCELLED') {
        continue;
      }

      const date = new Date(session.startedAt);

      const key = getDateKey(date);

      totals.set(key, (totals.get(key) ?? 0) + session.duration);
    }

    return totals;
  }, [sessions, tasks]);

  /*
   * Group scheduled tasks by date.
   *
   * PAUSED and CANCELLED tasks are not shown
   * inside calendar cells.
   */
  const tasksByDate = useMemo(() => {
    const grouped = new Map<string, MonthlyScheduledTask[]>();

    for (const scheduledTask of scheduledTasks) {
      if (
        scheduledTask.task.status === 'PAUSED' ||
        scheduledTask.task.status === 'CANCELLED'
      ) {
        continue;
      }

      const key = scheduledTask.date;

      const existing = grouped.get(key) ?? [];

      grouped.set(key, [...existing, scheduledTask]);
    }

    return grouped;
  }, [scheduledTasks]);

  const calendarDays = useMemo(
    () => getCalendarDays(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate],
  );

  const selectedFilter = displayFilters.find(
    (filter) =>
      (filter.id ?? `default-${filter.thresholdMinutes}`) === selectedFilterId,
  );

  function previousMonth() {
    setCurrentDate(
      (current) => new Date(current.getFullYear(), current.getMonth() - 1, 1),
    );
  }

  function nextMonth() {
    setCurrentDate(
      (current) => new Date(current.getFullYear(), current.getMonth() + 1, 1),
    );
  }

  function goToToday() {
    const now = new Date();

    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  function openAddFilter() {
    setEditingFilterId(null);
    setFilterHours('');
    setFilterColor('#6D5DFB');
    setShowFilterForm(true);
    setError('');
  }

  function openEditFilter(filter: CalendarFilter) {
    setEditingFilterId(filter.id);

    setFilterHours(String(filter.thresholdMinutes / 60));

    setFilterColor(filter.color);

    setShowFilterForm(true);
    setError('');
  }

  function closeFilterForm() {
    setShowFilterForm(false);
    setEditingFilterId(null);
    setFilterHours('');
    setFilterColor('#6D5DFB');
  }

  async function handleSaveFilter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const hours = Number(filterHours);

    if (!Number.isInteger(hours) || hours <= 0) {
      setError('Threshold must be a positive whole number of hours.');

      return;
    }

    const thresholdMinutes = hours * 60;

    const duplicateExists = filters.some(
      (filter) =>
        filter.id !== editingFilterId &&
        filter.thresholdMinutes === thresholdMinutes,
    );

    if (duplicateExists) {
      setError('A filter with this threshold already exists.');

      return;
    }

    try {
      setSavingFilter(true);
      setError('');

      if (editingFilterId) {
        const result = await graphqlRequest<{
          updateCalendarColorRule: CalendarFilter;
        }>(UPDATE_CALENDAR_FILTER_MUTATION, {
          id: editingFilterId,
          input: {
            thresholdMinutes,
            color: filterColor,
          },
        });

        setFilters((current) =>
          current.map((filter) =>
            filter.id === editingFilterId
              ? result.updateCalendarColorRule
              : filter,
          ),
        );
      } else {
        const result = await graphqlRequest<{
          createCalendarColorRule: CalendarFilter;
        }>(CREATE_CALENDAR_FILTER_MUTATION, {
          input: {
            thresholdMinutes,
            color: filterColor,
          },
        });

        setFilters((current) => [...current, result.createCalendarColorRule]);
      }

      closeFilterForm();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : editingFilterId
            ? 'Failed to update filter'
            : 'Failed to create filter',
      );
    } finally {
      setSavingFilter(false);
    }
  }

  async function handleDeleteFilter(filterId: string) {
    const confirmed = window.confirm('Delete this time filter?');

    if (!confirmed) {
      return;
    }

    try {
      setDeletingFilterId(filterId);
      setError('');

      const result = await graphqlRequest<{
        deleteCalendarColorRule: boolean;
      }>(DELETE_CALENDAR_FILTER_MUTATION, {
        id: filterId,
      });

      if (!result.deleteCalendarColorRule) {
        throw new Error('Failed to delete filter');
      }

      setFilters((current) =>
        current.filter((filter) => filter.id !== filterId),
      );

      if (selectedFilterId === filterId) {
        setSelectedFilterId(null);
      }

      if (editingFilterId === filterId) {
        closeFilterForm();
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : 'Failed to delete filter',
      );
    } finally {
      setDeletingFilterId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-medium text-[var(--color-primary)]">
            Calendar
          </p>

          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)] sm:text-3xl">
            {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h1>

          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Plan your days and see how much time you spent.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowFilters((value) => !value)}
          className="flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-[15px] font-medium text-[var(--color-text-secondary)] shadow-sm transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)]"
        >
          <SlidersHorizontal size={17} strokeWidth={1.8} />

          <span className="sm:hidden">{showFilters ? 'Close' : 'Filters'}</span>

          <span className="hidden sm:inline">
            {showFilters ? 'Close Filters' : 'Time Filters'}
          </span>
        </button>
      </div>

      {/* FILTER PANEL */}
      {showFilters && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)] p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-text)]">
                Time Filters
              </h2>

              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                Manage custom colors for daily time totals.
              </p>
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                Default colors start at 1h and increase through 5h+.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddFilter}
              className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-white"
            >
              + Add Filter
            </button>
          </div>

          {showFilterForm && (
            <form
              onSubmit={handleSaveFilter}
              className="mt-5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">
                  {editingFilterId ? 'Edit Time Filter' : 'Add Time Filter'}
                </h3>

                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  Set the minimum amount of tracked time required for this
                  color.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <div>
                  <label
                    htmlFor="filter-hours"
                    className="mb-2 block text-xs font-medium text-[var(--color-text)]"
                  >
                    Threshold
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      id="filter-hours"
                      type="number"
                      min="1"
                      step="1"
                      value={filterHours}
                      onChange={(event) => setFilterHours(event.target.value)}
                      placeholder="8"
                      autoFocus
                      className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)]"
                    />

                    <span className="whitespace-nowrap text-sm text-[var(--color-text-secondary)]">
                      hours+
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="filter-color"
                    className="mb-2 block text-xs font-medium text-[var(--color-text)]"
                  >
                    Color
                  </label>

                  <input
                    id="filter-color"
                    type="color"
                    value={filterColor}
                    onChange={(event) => setFilterColor(event.target.value)}
                    className="h-9 w-14 cursor-pointer rounded border border-[var(--color-border)] bg-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeFilterForm}
                    className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-background)]"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={!filterHours || savingFilter}
                    className="rounded-[var(--radius-md)] bg-[var(--color-primary)] px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {savingFilter
                      ? editingFilterId
                        ? 'Saving...'
                        : 'Adding...'
                      : editingFilterId
                        ? 'Save Changes'
                        : 'Add'}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {sortedFilters.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">
                No custom time filters yet. Add your first filter above.
              </p>
            ) : (
              sortedFilters.map((filter) => {
                const isDeleting = deletingFilterId === filter.id;

                return (
                  <div
                    key={filter.id}
                    className="flex items-center gap-2 rounded-full border border-[var(--color-border)] px-3 py-1.5"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        backgroundColor: filter.color,
                      }}
                    />

                    <span className="text-xs font-medium text-[var(--color-text)]">
                      {formatMinutes(filter.thresholdMinutes)}+
                    </span>

                    <button
                      type="button"
                      onClick={() => openEditFilter(filter)}
                      disabled={isDeleting}
                      className="ml-1 flex h-7 w-7 items-center justify-center rounded-md text-blue-500 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Edit filter"
                      title="Edit filter"
                    >
                      <Pencil size={15} strokeWidth={2} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteFilter(filter.id)}
                      disabled={isDeleting}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-red-500 transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Delete filter"
                      title="Delete filter"
                    >
                      {isDeleting ? (
                        '...'
                      ) : (
                        <Trash2 size={15} strokeWidth={2} />
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[var(--color-border)] pb-px">
        <button
          type="button"
          onClick={() => setSelectedFilterId(null)}
          className={`shrink-0 border-b-2 px-3 pb-3 text-sm font-medium ${
            selectedFilterId === null
              ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
              : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          All
        </button>

        {displayFilters.map((filter) => {
          const filterKey = filter.id ?? `default-${filter.thresholdMinutes}`;
          const isSelected = selectedFilterId === filterKey;

          return (
            <button
              key={filterKey}
              type="button"
              onClick={() => setSelectedFilterId(isSelected ? null : filterKey)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3 pb-3 text-sm font-medium ${
                isSelected
                  ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: filter.color,
                }}
              />
              {formatMinutes(filter.thresholdMinutes)}+
            </button>
          );
        })}
      </div>

      {/* CALENDAR */}
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-background)]">
        {/* MONTH CONTROLS */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3 sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={previousMonth}
            className="flex items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-2 text-[15px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
            aria-label="Previous month"
          >
            <ChevronLeft size={19} strokeWidth={1.8} />
            <span>{MONTH_NAMES[(currentDate.getMonth() + 11) % 12]}</span>
          </button>

          <button
            type="button"
            onClick={goToToday}
            className="hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[14px] font-medium text-[var(--color-text-secondary)] shadow-sm transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text)] sm:block"
          >
            Show Today
          </button>

          <button
            type="button"
            onClick={nextMonth}
            className="flex items-center gap-2 rounded-[var(--radius-md)] px-2.5 py-2 text-[15px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
            aria-label="Next month"
          >
            <span>{MONTH_NAMES[(currentDate.getMonth() + 1) % 12]}</span>
            <ChevronRight size={19} strokeWidth={1.8} />
          </button>
        </div>

        {/* WEEKDAYS */}
        <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-1.5 py-2 text-center text-[10px] font-medium text-[var(--color-text-muted)] sm:px-3 sm:py-3 sm:text-xs"
            >
              {day}
            </div>
          ))}
        </div>

        {/* DAYS */}
        {loading ? (
          <div className="py-20 text-center text-sm text-[var(--color-text-secondary)]">
            Loading calendar...
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return (
                  <div
                    key={`empty-${index}`}
                    className="min-h-[90px] border-b border-r border-[var(--color-border)] bg-[var(--color-surface)] sm:min-h-[160px]"
                  />
                );
              }

              const dateKey = formatDateKey(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                day,
              );

              const totalSeconds = dailyTotals.get(dateKey) ?? 0;

              const totalMinutes = Math.floor(totalSeconds / 60);

              const applicableFilter = getApplicableFilter(
                totalMinutes,
                calendarFilters,
              );

              const matchesSelectedFilter =
                !selectedFilter ||
                totalMinutes >= selectedFilter.thresholdMinutes;

              const date = new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                day,
              );

              const isToday = getDateKey(date) === getDateKey(today);

              const dayTasks = tasksByDate.get(dateKey) ?? [];

              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={!matchesSelectedFilter}
                  onClick={() => {
                    window.location.href = `/dashboard/calendar/${dateKey}`;
                  }}
                  style={
                    applicableFilter
                      ? {
                          backgroundColor: applicableFilter.color,
                        }
                      : undefined
                  }
                  className={`group relative flex min-h-[92px] flex-col gap-2 border-b border-r border-[var(--color-border)] p-1.5 text-left transition-all sm:min-h-[160px] sm:p-3 ${
                    matchesSelectedFilter
                      ? 'hover:brightness-95'
                      : 'cursor-not-allowed opacity-25'
                  }`}
                >
                  {/* DAY HEADER */}
                  <div className="flex flex-col md:flex-row  items-start justify-between gap-4 md:gap-2">
                    {/* DATE */}
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium sm:h-7 sm:w-7 sm:text-sm ${
                        isToday
                          ? 'bg-[var(--color-primary)] text-white'
                          : applicableFilter
                            ? 'bg-white/90 text-[var(--color-text)] shadow-sm backdrop-blur-sm'
                            : 'text-[var(--color-text)]'
                      }`}
                    >
                      {day}
                    </span>

                    {/* TOTAL MANUAL TIME */}
                    {totalMinutes > 0 && (
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold sm:px-2 sm:py-1 sm:text-xs ${
                          applicableFilter
                            ? 'bg-white/90 text-[var(--color-text)] shadow-sm backdrop-blur-sm'
                            : 'text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {formatMinutes(totalMinutes)}
                      </span>
                    )}
                  </div>

                  {/* TASKS - hidden on phones to keep the calendar compact */}
                  {/* TASKS - show max 2 tasks */}
                  {dayTasks.length > 0 && (
                    <div className="mt-3 hidden min-h-0 flex-1 flex-col gap-1.5 sm:flex">
                      {dayTasks.slice(0, 2).map((scheduledTask) => (
                        <div
                          key={scheduledTask.task.id}
                          className={`truncate rounded-md px-2 py-1.5 text-xs shadow-sm ${
                            applicableFilter
                              ? 'bg-white/90 text-[var(--color-text-secondary)] backdrop-blur-sm'
                              : 'bg-white/70 text-[var(--color-text-secondary)]'
                          }`}
                        >
                          <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />

                          {scheduledTask.task.title}
                        </div>
                      ))}

                      {dayTasks.length > 2 && (
                        <div
                          className={`rounded-md px-2 py-1 text-[10px] font-medium ${
                            applicableFilter
                              ? 'bg-white/80 text-[var(--color-text-secondary)]'
                              : 'text-[var(--color-text-muted)]'
                          }`}
                        >
                          +{dayTasks.length - 2}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ERROR */}
      {error && (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
}
