import { createSchema } from 'graphql-yoga';
import type { GraphQLContext } from './context';
import { requireUser } from './context';
import { taskResolvers } from './resolvers/task';
import { tagResolvers } from './resolvers/tag';
import { scheduledTaskResolvers } from './resolvers/scheduled-task';
import { timeSessionResolvers } from './resolvers/time-session';
import { activeTimerResolvers } from './resolvers/active-timer';
import { calendarColorRuleResolvers } from './resolvers/calendar-color-rules';

export const schema = createSchema<GraphQLContext>({
  typeDefs: /* GraphQL */ `
    enum TaskStatus {
      PLANNED
      IN_PROGRESS
      COMPLETED
      PAUSED
      CANCELLED
    }

    enum TimeSessionType {
      FOCUS_TIMER
      STOPWATCH
      MANUAL
    }

    enum ActiveTimerStatus {
      RUNNING
      PAUSED
    }

    type User {
      id: ID!
      name: String!
      email: String!
    }

    type Tag {
      id: ID!
      name: String!
      color: String!
      createdAt: String!
      updatedAt: String!
    }

    type Task {
      id: ID!
      title: String!
      description: String
      status: TaskStatus!
      progress: Int!
      tags: [Tag!]!
      createdAt: String!
      updatedAt: String!
    }

    type ScheduledTask {
      id: ID!
      date: String!
      task: Task!
    }

    type MonthlyScheduledTask {
      date: String!
      task: Task!
    }

    type TimeSession {
      id: ID!
      taskId: ID
      type: TimeSessionType!
      startedAt: String!
      endedAt: String!
      duration: Int!
      createdAt: String!
    }

    type ActiveTimer {
      id: ID!
      type: TimeSessionType!
      status: ActiveTimerStatus!
      taskId: ID
      durationSeconds: Int
      elapsedSeconds: Int!
      startedAt: String!
      runStartedAt: String
      endsAt: String
      createdAt: String!
      updatedAt: String!
    }

    input CreateTaskInput {
      title: String!
      description: String
    }

    input UpdateTaskInput {
      title: String
      description: String
      progress: Int
      status: TaskStatus
    }

    input CreateTagInput {
      name: String!
      color: String!
    }

    input UpdateTagInput {
      name: String
      color: String
    }

    type Query {
      me: User

      tasks: [Task!]!
      task(id: ID!): Task

      tags: [Tag!]!

      tasksForDate(date: String!): [Task!]!
      tasksForMonth(year: Int!, month: Int!): [MonthlyScheduledTask!]!
      upcomingScheduledTasks(limit: Int): [ScheduledTask!]!
      allScheduledTasks: [ScheduledTask!]!

      taskTimeSessions(taskId: ID!): [TimeSession!]!
      taskTotalTime(taskId: ID!): Int!

      activeTimer: ActiveTimer
      timeSessions: [TimeSession!]!
      timeSummary: TimeSummary!
      calendarColorRules: [CalendarColorRule!]!
    }

    type Mutation {
      createTask(input: CreateTaskInput!): Task!
      updateTask(id: ID!, input: UpdateTaskInput!): Task!
      deleteTask(id: ID!): Boolean!

      createTag(input: CreateTagInput!): Tag!
      updateTag(id: ID!, input: UpdateTagInput!): Tag!
      deleteTag(id: ID!): Boolean!

      addTagToTask(taskId: ID!, tagId: ID!): Boolean!
      removeTagFromTask(taskId: ID!, tagId: ID!): Boolean!

      scheduleTask(taskId: ID!, date: String!): ScheduledTask!
      unscheduleTask(taskId: ID!, date: String!): Boolean!

      addManualTime(taskId: ID!, minutes: Int!): TimeSession!
      deleteTimeSession(id: ID!): Boolean!

      startFocusTimer(taskId: ID, durationMinutes: Int!): ActiveTimer!

      startStopwatch(taskId: ID): ActiveTimer!

      pauseTimer: ActiveTimer!
      resumeTimer: ActiveTimer!

      saveTimer: TimeSession!
      cancelTimer: Boolean!
      createCalendarColorRule(
        input: CreateCalendarColorRuleInput!
      ): CalendarColorRule!

      updateCalendarColorRule(
        id: ID!
        input: UpdateCalendarColorRuleInput!
      ): CalendarColorRule!

      deleteCalendarColorRule(id: ID!): Boolean!
    }

    type TimeSummary {
      focusSeconds: Int!
      stopwatchSeconds: Int!
      manualSeconds: Int!
      totalSeconds: Int!
    }

    type CalendarColorRule {
      id: ID!
      thresholdMinutes: Int!
      color: String!
      createdAt: String!
      updatedAt: String!
    }

    input CreateCalendarColorRuleInput {
      thresholdMinutes: Int!
      color: String!
    }

    input UpdateCalendarColorRuleInput {
      thresholdMinutes: Int
      color: String
    }
  `,

  resolvers: {
    Query: {
      me: (_parent, _args, context) => {
        return requireUser(context);
      },

      ...taskResolvers.Query,
      ...tagResolvers.Query,
      ...scheduledTaskResolvers.Query,
      ...timeSessionResolvers.Query,
      ...activeTimerResolvers.Query,
      ...calendarColorRuleResolvers.Query,

      allScheduledTasks: async (
        _parent: unknown,
        _args: unknown,
        context: GraphQLContext,
      ) => {
        const user = requireUser(context);

        const scheduledTasks = await context.prisma.scheduledTask.findMany({
          where: {
            userId: user.id,
          },
          include: {
            task: true,
          },
          orderBy: [{ date: 'desc' }, { createdAt: 'asc' }],
        });

        return scheduledTasks.map((scheduledTask) => ({
          id: scheduledTask.id,
          date: scheduledTask.date.toISOString().slice(0, 10),
          task: scheduledTask.task,
        }));
      },
      
    },

    Mutation: {
      ...taskResolvers.Mutation,
      ...tagResolvers.Mutation,
      ...scheduledTaskResolvers.Mutation,
      ...timeSessionResolvers.Mutation,
      ...activeTimerResolvers.Mutation,
      ...calendarColorRuleResolvers.Mutation,
    },

    Task: {
      tags: async (
        task: { id: string },
        _args: unknown,
        context: GraphQLContext,
      ) => {
        return context.prisma.tag.findMany({
          where: {
            taskTags: {
              some: {
                taskId: task.id,
              },
            },
          },
        });
      },

      createdAt: (task: { createdAt: Date }) => task.createdAt.toISOString(),

      updatedAt: (task: { updatedAt: Date }) => task.updatedAt.toISOString(),
    },

    Tag: {
      createdAt: (tag: { createdAt: Date }) => tag.createdAt.toISOString(),

      updatedAt: (tag: { updatedAt: Date }) => tag.updatedAt.toISOString(),
    },

    TimeSession: {
      startedAt: (session: { startedAt: Date }) =>
        session.startedAt.toISOString(),

      endedAt: (session: { endedAt: Date }) => session.endedAt.toISOString(),

      createdAt: (session: { createdAt: Date }) =>
        session.createdAt.toISOString(),
    },

    ActiveTimer: {
      startedAt: (timer: { startedAt: Date }) => timer.startedAt.toISOString(),

      runStartedAt: (timer: { runStartedAt: Date | null }) =>
        timer.runStartedAt?.toISOString() ?? null,

      endsAt: (timer: { endsAt: Date | null }) =>
        timer.endsAt?.toISOString() ?? null,

      createdAt: (timer: { createdAt: Date }) => timer.createdAt.toISOString(),

      updatedAt: (timer: { updatedAt: Date }) => timer.updatedAt.toISOString(),
    },
  },
});
