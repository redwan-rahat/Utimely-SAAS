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

    // The timer may have been paused, cancelled,
    // manually saved, or otherwise changed.
    if (
      timer.type !== 'FOCUS_TIMER' ||
      timer.status !== 'RUNNING' ||
      !timer.endsAt
    ) {
      return null;
    }

    // The job should only complete the timer
    // when its actual end time has arrived.
    if (timer.endsAt.getTime() > now.getTime()) {
      return null;
    }

    const durationSeconds = timer.durationSeconds;

    if (durationSeconds === null) {
      return null;
    }

    const session = await tx.timeSession.create({
      data: {
        userId: timer.userId,
        taskId: timer.taskId,
        type: 'FOCUS_TIMER',
        startedAt: timer.createdAt,
        endedAt: now,
        duration: durationSeconds,
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