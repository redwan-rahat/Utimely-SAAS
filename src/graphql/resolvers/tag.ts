import type { GraphQLContext } from '../context';
import { requireUser } from '../context';

export const tagResolvers = {
  Query: {
    tags: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      const user = requireUser(context);

      return context.prisma.tag.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          name: 'asc',
        },
      });
    },
  },

  Mutation: {
    createTag: async (
      _parent: unknown,
      args: {
        input: {
          name: string;
          color: string;
        };
      },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      return context.prisma.tag.create({
        data: {
          userId: user.id,
          name: args.input.name,
          color: args.input.color,
        },
      });
    },

    updateTag: async (
      _parent: unknown,
      args: {
        id: string;
        input: {
          name?: string;
          color?: string;
        };
      },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      const existingTag = await context.prisma.tag.findFirst({
        where: {
          id: args.id,
          userId: user.id,
        },
      });

      if (!existingTag) {
        throw new Error('Tag not found');
      }

      return context.prisma.tag.update({
        where: {
          id: args.id,
        },
        data: args.input,
      });
    },

    deleteTag: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      const existingTag = await context.prisma.tag.findFirst({
        where: {
          id: args.id,
          userId: user.id,
        },
      });

      if (!existingTag) {
        throw new Error('Tag not found');
      }

      await context.prisma.tag.delete({
        where: {
          id: args.id,
        },
      });

      return true;
    },

    addTagToTask: async (
      _parent: unknown,
      args: {
        taskId: string;
        tagId: string;
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

      const tag = await context.prisma.tag.findFirst({
        where: {
          id: args.tagId,
          userId: user.id,
        },
      });

      if (!tag) {
        throw new Error('Tag not found');
      }

      const existingTaskTag = await context.prisma.taskTag.findUnique({
        where: {
          taskId_tagId: {
            taskId: task.id,
            tagId: tag.id,
          },
        },
      });

      if (existingTaskTag) {
        throw new Error('Tag is already assigned to this task');
      }

      await context.prisma.taskTag.create({
        data: {
          taskId: task.id,
          tagId: tag.id,
        },
      });

      return true;
    },

    removeTagFromTask: async (
      _parent: unknown,
      args: {
        taskId: string;
        tagId: string;
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

      const tag = await context.prisma.tag.findFirst({
        where: {
          id: args.tagId,
          userId: user.id,
        },
      });

      if (!tag) {
        throw new Error('Tag not found');
      }

      await context.prisma.taskTag.delete({
        where: {
          taskId_tagId: {
            taskId: task.id,
            tagId: tag.id,
          },
        },
      });

      return true;
    },
  },
};
