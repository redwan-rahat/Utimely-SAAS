import type { GraphQLContext } from '../context';
import { requireUser } from '../context';

export const timeSessionResolvers = {
  Query: {
    taskTimeSessions: async (
      _parent: unknown,
      args: { taskId: string },
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

      return context.prisma.timeSession.findMany({
        where: {
          taskId: task.id,
          userId: user.id,
        },
        orderBy: {
          startedAt: 'desc',
        },
      });
    },

    taskTotalTime: async (
      _parent: unknown,
      args: { taskId: string },
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

      const result = await context.prisma.timeSession.aggregate({
        where: {
          taskId: task.id,
          userId: user.id,
        },
        _sum: {
          duration: true,
        },
      });

      return result._sum.duration ?? 0;
    },

    timeSessions: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      return context.prisma.timeSession.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          startedAt: 'desc',
        },
      });
    },

    timeSummary: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      const sessions = await context.prisma.timeSession.groupBy({
        by: ['type'],
        where: {
          userId: user.id,
        },
        _sum: {
          duration: true,
        },
      });

      let focusSeconds = 0;
      let stopwatchSeconds = 0;
      let manualSeconds = 0;

      for (const session of sessions) {
        const duration = session._sum.duration ?? 0;

        if (session.type === 'FOCUS_TIMER') {
          focusSeconds = duration;
        }

        if (session.type === 'STOPWATCH') {
          stopwatchSeconds = duration;
        }

        if (session.type === 'MANUAL') {
          manualSeconds = duration;
        }
      }

      return {
        focusSeconds,
        stopwatchSeconds,
        manualSeconds,
        totalSeconds: focusSeconds + stopwatchSeconds + manualSeconds,
      };
    },
  },

  Mutation: {
    addManualTime: async (
      _parent: unknown,
      args: {
        taskId: string;
        minutes: number;
      },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      if (args.minutes <= 0) {
        throw new Error('Minutes must be greater than 0');
      }

      if (!Number.isInteger(args.minutes)) {
        throw new Error('Minutes must be a whole number');
      }

      const task = await context.prisma.task.findFirst({
        where: {
          id: args.taskId,
          userId: user.id,
        },
      });

      if (!task) {
        throw new Error('Task not found');
      }

      const now = new Date();

      const startedAt = new Date(now.getTime() - args.minutes * 60 * 1000);

      return context.prisma.timeSession.create({
        data: {
          userId: user.id,
          taskId: task.id,
          type: 'MANUAL',
          startedAt,
          endedAt: now,
          duration: args.minutes * 60,
        },
      });
    },

    deleteTimeSession: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      const session = await context.prisma.timeSession.findFirst({
        where: {
          id: args.id,
          userId: user.id,
        },
      });

      if (!session) {
        throw new Error('Time session not found');
      }

      await context.prisma.timeSession.delete({
        where: {
          id: session.id,
        },
      });

      return true;
    },
  },
};
