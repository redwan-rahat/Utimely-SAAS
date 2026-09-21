import type { GraphQLContext } from '../context';
import { requireUser } from '../context';

function parseCalendarDate(date: string) {
  const parsed = new Date(`${date}T00:00:00.000Z`);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date. Use YYYY-MM-DD.');
  }

  return parsed;
}

export const scheduledTaskResolvers = {
  Query: {
    tasksForDate: async (
      _parent: unknown,
      args: { date: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);
      const date = parseCalendarDate(args.date);

      const scheduledTasks = await context.prisma.scheduledTask.findMany({
        where: {
          userId: user.id,
          date,
        },
        include: {
          task: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return scheduledTasks.map((scheduledTask) => scheduledTask.task);
    },

    tasksForMonth: async (
      _parent: unknown,
      args: { year: number; month: number },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      if (args.month < 1 || args.month > 12) {
        throw new Error('Month must be between 1 and 12.');
      }

      const startDate = new Date(
        Date.UTC(args.year, args.month - 1, 1),
      );

      const endDate = new Date(
        Date.UTC(args.year, args.month, 1),
      );

      const scheduledTasks = await context.prisma.scheduledTask.findMany({
        where: {
          userId: user.id,
          date: {
            gte: startDate,
            lt: endDate,
          },
        },
        include: {
          task: true,
        },
        orderBy: [
          {
            date: 'asc',
          },
          {
            createdAt: 'asc',
          },
        ],
      });

      return scheduledTasks.map((scheduledTask) => ({
        date: scheduledTask.date.toISOString().slice(0, 10),
        task: scheduledTask.task,
      }));
    },

    upcomingScheduledTasks: async (
  _parent: unknown,
  args: { limit?: number },
  context: GraphQLContext,
) => {
  const user = requireUser(context);

  const limit = args.limit ?? 5;

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new Error('Limit must be a positive whole number');
  }

  const today = new Date();

  const startOfToday = new Date(
    Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate(),
    ),
  );

  return context.prisma.scheduledTask.findMany({
    where: {
      userId: user.id,
      date: {
        gte: startOfToday,
      },
    },
    include: {
      task: true,
    },
    orderBy: {
      date: 'asc',
    },
    take: limit,
  });
    },

  },

  Mutation: {
    scheduleTask: async (
      _parent: unknown,
      args: {
        taskId: string;
        date: string;
      },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      const task = await context.prisma.task.findFirst({
        where: {
          id: args.taskId,
          userId: user.id,
        },
      });

      if (!task) {
        throw new Error('Task not found');
      }

      const date = parseCalendarDate(args.date);

      const existingSchedule =
        await context.prisma.scheduledTask.findUnique({
          where: {
            taskId_date: {
              taskId: task.id,
              date,
            },
          },
        });

      if (existingSchedule) {
        throw new Error('Task is already scheduled for this date');
      }

      return context.prisma.scheduledTask.create({
        data: {
          userId: user.id,
          taskId: task.id,
          date,
        },
        include: {
          task: true,
        },
      });
    },

    unscheduleTask: async (
      _parent: unknown,
      args: {
        taskId: string;
        date: string;
      },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      const task = await context.prisma.task.findFirst({
        where: {
          id: args.taskId,
          userId: user.id,
        },
      });

      if (!task) {
        throw new Error('Task not found');
      }

      const date = parseCalendarDate(args.date);

      const scheduledTask =
        await context.prisma.scheduledTask.findFirst({
          where: {
            taskId: task.id,
            userId: user.id,
            date,
          },
        });

      if (!scheduledTask) {
        throw new Error('Task is not scheduled for this date');
      }

      await context.prisma.scheduledTask.delete({
        where: {
          id: scheduledTask.id,
        },
      });

      return true;
    },
  },

  ScheduledTask: {
  date: (scheduledTask: { date: Date }) =>
    scheduledTask.date.toISOString(),
},


};