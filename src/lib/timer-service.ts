import { prisma } from './prisma';

export async function finalizeFocusTimer(timerId: string) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const timer = await tx.activeTimer.findUnique({
      where: {
        id: timerId,
      },
    });

    if (!timer) {
      return null;
    }

    if (
      timer.type !== 'FOCUS_TIMER' ||
      timer.status !== 'RUNNING' ||
      !timer.endsAt ||
      !timer.runStartedAt ||
      timer.durationSeconds === null
    ) {
      return null;
    }

    if (timer.endsAt.getTime() > now.getTime()) {
      return null;
    }

    const session = await tx.timeSession.create({
      data: {
        userId: timer.userId,
        taskId: timer.taskId,
        type: 'FOCUS_TIMER',
        startedAt: timer.startedAt,
        endedAt: timer.endsAt,
        duration: timer.durationSeconds,
      },
    });

    await tx.activeTimer.delete({
      where: {
        id: timer.id,
      },
    });

    return session;
  });
}