import type { GraphQLContext } from '../context';
import { requireUser } from '../context';

export const calendarColorRuleResolvers = {
  Query: {
    calendarColorRules: async (
      _parent: unknown,
      _args: unknown,
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      return context.prisma.calendarColorRule.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          thresholdMinutes: 'asc',
        },
      });
    },
  },

  Mutation: {
    createCalendarColorRule: async (
      _parent: unknown,
      args: {
        input: {
          thresholdMinutes: number;
          color: string;
        };
      },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      if (!Number.isInteger(args.input.thresholdMinutes)) {
        throw new Error('Threshold must be a whole number of minutes');
      }

      if (args.input.thresholdMinutes <= 0) {
        throw new Error('Threshold must be greater than 0');
      }

      if (!/^#[0-9A-Fa-f]{6}$/.test(args.input.color)) {
        throw new Error('Color must be a valid hex color');
      }

      const existing = await context.prisma.calendarColorRule.findFirst({
        where: {
          userId: user.id,
          thresholdMinutes: args.input.thresholdMinutes,
        },
      });

      if (existing) {
        throw new Error('A filter with this threshold already exists');
      }

      return context.prisma.calendarColorRule.create({
        data: {
          userId: user.id,
          thresholdMinutes: args.input.thresholdMinutes,
          color: args.input.color,
        },
      });
    },

    updateCalendarColorRule: async (
      _parent: unknown,
      args: {
        id: string;
        input: {
          thresholdMinutes?: number;
          color?: string;
        };
      },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      const rule = await context.prisma.calendarColorRule.findFirst({
        where: {
          id: args.id,
          userId: user.id,
        },
      });

      if (!rule) {
        throw new Error('Calendar filter not found');
      }

      if (
        args.input.thresholdMinutes !== undefined &&
        (!Number.isInteger(args.input.thresholdMinutes) ||
          args.input.thresholdMinutes <= 0)
      ) {
        throw new Error('Threshold must be a positive whole number');
      }

      if (
        args.input.color !== undefined &&
        !/^#[0-9A-Fa-f]{6}$/.test(args.input.color)
      ) {
        throw new Error('Color must be a valid hex color');
      }

      if (args.input.thresholdMinutes !== undefined) {
        const duplicate =
          await context.prisma.calendarColorRule.findFirst({
            where: {
              userId: user.id,
              thresholdMinutes: args.input.thresholdMinutes,
              NOT: {
                id: args.id,
              },
            },
          });

        if (duplicate) {
          throw new Error('A filter with this threshold already exists');
        }
      }

      return context.prisma.calendarColorRule.update({
        where: {
          id: rule.id,
        },
        data: {
          thresholdMinutes: args.input.thresholdMinutes,
          color: args.input.color,
        },
      });
    },

    deleteCalendarColorRule: async (
      _parent: unknown,
      args: { id: string },
      context: GraphQLContext,
    ) => {
      const user = requireUser(context);

      const rule = await context.prisma.calendarColorRule.findFirst({
        where: {
          id: args.id,
          userId: user.id,
        },
      });

      if (!rule) {
        throw new Error('Calendar filter not found');
      }

      await context.prisma.calendarColorRule.delete({
        where: {
          id: rule.id,
        },
      });

      return true;
    },
  },
};