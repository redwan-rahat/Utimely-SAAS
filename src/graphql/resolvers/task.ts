import type { GraphQLContext } from '../context';
import { requireUser } from '../context';
import { TaskStatus } from '@/generated/prisma/client';

export const taskResolvers = {
  Query: {
    tasks: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      return context.prisma.task.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    },

    task: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      return context.prisma.task.findFirst({
        where: {
          id: args.id,
          userId: user.id,
        },
      });
    },
  },

  Mutation: {
    createTask: async (
      _parent: unknown,
      args: {
        input: {
          title: string;
          description?: string;
        };
      },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      return context.prisma.task.create({
        data: {
          userId: user.id,
          title: args.input.title,
          description: args.input.description,
        },
      });
    },

    updateTask: async (
      _parent: unknown,
      args: {
        id: string;
        input: {
          title?: string;
          description?: string;
          progress?: number;
          status?: TaskStatus;
        };
      },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      const existingTask = await context.prisma.task.findFirst({
        where: {
          id: args.id,
          userId: user.id,
        },
      });

      if (!existingTask) {
        throw new Error('Task not found');
      }

      if (
        args.input.progress !== undefined &&
        (args.input.progress < 0 || args.input.progress > 100)
      ) {
        throw new Error('Progress must be between 0 and 100');
      }

      const nextProgress =
        args.input.progress !== undefined
          ? args.input.progress
          : existingTask.progress;

      let nextStatus = args.input.status ?? existingTask.status;

      // 100% progress always means completed
      if (nextProgress === 100) {
        nextStatus = TaskStatus.COMPLETED;
      }

      // If a completed task is reduced below 100%,
      // move it back to in progress.
      else if (
        args.input.progress !== undefined &&
        existingTask.status === TaskStatus.COMPLETED &&
        args.input.status === undefined &&
        nextProgress < 100
      ) {
        nextStatus = TaskStatus.IN_PROGRESS;
      }

      return context.prisma.task.update({
        where: {
          id: args.id,
        },
        data: {
          ...args.input,
          status: nextStatus,
        },
      });
    },

    deleteTask: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      const existingTask = await context.prisma.task.findFirst({
        where: {
          id: args.id,
          userId: user.id,
        },
      });

      if (!existingTask) {
        throw new Error('Task not found');
      }

      await context.prisma.task.delete({
        where: {
          id: args.id,
        },
      });

      return true;
    },
  },
};
