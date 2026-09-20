import type { GraphQLContext } from '../context';
import { requireUser } from '../context';

export const activeTimerResolvers = {
  Query: {
    activeTimer: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      return context.prisma.activeTimer.findUnique({
        where: {
          userId: user.id,
        },
      });
    },
  },


  Mutation: {
    startFocusTimer: async (
      _parent: unknown,
      args: {
        taskId?: string;
        durationMinutes: number;
      },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      if (!Number.isInteger(args.durationMinutes)) {
        throw new Error('Duration must be a whole number of minutes');
      }

      if (args.durationMinutes <= 0) {
        throw new Error('Duration must be greater than 0');
      }

      if (args.taskId) {
        const task = await context.prisma.task.findFirst({
          where: {
            id: args.taskId,
            userId: user.id,
          },
        });

        if (!task) {
          throw new Error('Task not found');
        }
      }

      const existingTimer = await context.prisma.activeTimer.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (existingTimer) {
        throw new Error('A timer is already running or paused');
      }

      const durationSeconds = args.durationMinutes * 60;
      const startedAt = new Date();

      const endsAt = new Date(startedAt.getTime() + durationSeconds * 1000);

      return context.prisma.activeTimer.create({
        data: {
          userId: user.id,
          taskId: args.taskId,
          type: 'FOCUS_TIMER',
          status: 'RUNNING',
          durationSeconds,
          elapsedSeconds: 0,
          startedAt,
          endsAt,
        },
      });
    },

    startStopwatch: async (
      _parent: unknown,
      args: {
        taskId?: string;
      },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      if (args.taskId) {
        const task = await context.prisma.task.findFirst({
          where: {
            id: args.taskId,
            userId: user.id,
          },
        });

        if (!task) {
          throw new Error('Task not found');
        }
      }

      const existingTimer = await context.prisma.activeTimer.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (existingTimer) {
        throw new Error('A timer is already running or paused');
      }

      return context.prisma.activeTimer.create({
        data: {
          userId: user.id,
          taskId: args.taskId,
          type: 'STOPWATCH',
          status: 'RUNNING',
          durationSeconds: null,
          elapsedSeconds: 0,
          startedAt: new Date(),
          endsAt: null,
        },
      });
    },

    pauseTimer: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      const timer = await context.prisma.activeTimer.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (!timer) {
        throw new Error('No active timer');
      }

      if (timer.status === 'PAUSED') {
        throw new Error('Timer is already paused');
      }

      const now = new Date();

      const elapsedSinceStart = Math.floor(
        (now.getTime() - timer.startedAt.getTime()) / 1000,
      );

      const totalElapsed = timer.elapsedSeconds + elapsedSinceStart;

      return context.prisma.activeTimer.update({
        where: {
          id: timer.id,
        },
        data: {
          status: 'PAUSED',
          elapsedSeconds: totalElapsed,
          endsAt: null,
        },
      });
    },

    resumeTimer: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      const timer = await context.prisma.activeTimer.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (!timer) {
        throw new Error('No active timer');
      }

      if (timer.status === 'RUNNING') {
        throw new Error('Timer is already running');
      }

      const startedAt = new Date();

      let endsAt: Date | null = null;

      if (timer.type === 'FOCUS_TIMER' && timer.durationSeconds !== null) {
        const remainingSeconds = timer.durationSeconds - timer.elapsedSeconds;

        if (remainingSeconds <= 0) {
          throw new Error('Focus timer has already completed');
        }

        endsAt = new Date(startedAt.getTime() + remainingSeconds * 1000);
      }

      return context.prisma.activeTimer.update({
        where: {
          id: timer.id,
        },
        data: {
          status: 'RUNNING',
          startedAt,
          endsAt,
        },
      });
    },

    saveTimer: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      const timer = await context.prisma.activeTimer.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (!timer) {
        throw new Error('No active timer');
      }

      const now = new Date();

      let elapsedSeconds = timer.elapsedSeconds;

      if (timer.status === 'RUNNING') {
        const currentRunSeconds = Math.floor(
          (now.getTime() - timer.startedAt.getTime()) / 1000,
        );

        elapsedSeconds += currentRunSeconds;
      }

      if (timer.type === 'FOCUS_TIMER' && timer.durationSeconds !== null) {
        elapsedSeconds = Math.min(elapsedSeconds, timer.durationSeconds);
      }

      if (elapsedSeconds <= 0) {
        throw new Error('Cannot save a timer with no elapsed time');
      }

      return context.prisma.$transaction(async (tx) => {
        const session = await tx.timeSession.create({
          data: {
            userId: user.id,
            taskId: timer.taskId,
            type: timer.type,
            startedAt: timer.createdAt,
            endedAt: now,
            duration: elapsedSeconds,
          },
        });

        await tx.activeTimer.delete({
          where: {
            id: timer.id,
          },
        });

        return session;
      });
    },

    cancelTimer: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      const timer = await context.prisma.activeTimer.findUnique({
        where: {
          userId: user.id,
        },
      });

      if (!timer) {
        throw new Error('No active timer');
      }

      await context.prisma.activeTimer.delete({
        where: {
          id: timer.id,
        },
      });

      return true;
    },
  },
};
