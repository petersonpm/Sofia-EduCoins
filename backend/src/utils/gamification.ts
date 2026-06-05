import prisma from './db';
import { sendRealTimeNotification } from '../server';

// Levels threshold XP requirements
// Level 1: 0 - 99 XP
// Level 2: 100 - 249 XP (needs +150 XP)
// Level 3: 250 - 499 XP (needs +250 XP)
// Level 4: 500 - 999 XP (needs +500 XP)
// Level 5: 1000+ XP
export const getLevelForXp = (xp: number): { level: number; title: string } => {
  if (xp < 100) return { level: 1, title: 'Aprendiz' };
  if (xp < 250) return { level: 2, title: 'Exploradora' };
  if (xp < 500) return { level: 3, title: 'Heroína das Tarefas' };
  if (xp < 1000) return { level: 4, title: 'Guardiã das Responsabilidades' };
  return { level: 5, title: 'Mestre da Educação Financeira' };
};

/**
 * Adds XP to a child and handles level up logic and notifications.
 */
export const addXpToChild = async (childId: string, xpToAdd: number) => {
  const child = await prisma.user.findUnique({
    where: { id: childId },
  });

  if (!child) return;

  const newXp = child.xp + xpToAdd;
  const currentLevelInfo = getLevelForXp(child.xp);
  const newLevelInfo = getLevelForXp(newXp);

  const levelUp = newLevelInfo.level > currentLevelInfo.level;

  const updatedChild = await prisma.user.update({
    where: { id: childId },
    data: {
      xp: newXp,
      level: newLevelInfo.level,
    },
  });

  if (levelUp) {
    const message = `🎉 Parabéns! Você subiu para o Nível ${newLevelInfo.level} - "${newLevelInfo.title}"!`;
    const notification = await prisma.notification.create({
      data: {
        userId: childId,
        message,
      },
    });

    sendRealTimeNotification(childId, 'notification', notification);
    sendRealTimeNotification(childId, 'level_up', {
      level: newLevelInfo.level,
      title: newLevelInfo.title,
    });
  }

  return updatedChild;
};

/**
 * Updates streak based on last task completion time.
 */
export const updateStreak = async (childId: string) => {
  const child = await prisma.user.findUnique({
    where: { id: childId },
  });

  if (!child) return;

  const now = new Date();
  let newStreak = child.streak;

  if (child.lastStreakAt) {
    const diffMs = now.getTime() - child.lastStreakAt.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours >= 12 && diffHours <= 36) {
      // Completed task the next day (between 12 and 36 hours later)
      newStreak += 1;
    } else if (diffHours > 36) {
      // Too long since last streak, reset to 1
      newStreak = 1;
    }
    // If completed within 12 hours of the last streak update, we keep the streak but don't increment it yet (same day check)
  } else {
    // First time
    newStreak = 1;
  }

  await prisma.user.update({
    where: { id: childId },
    data: {
      streak: newStreak,
      lastStreakAt: now,
    },
  });

  // Check for streak achievement
  if (newStreak === 7) {
    // Add custom notification or check achievements
    const streakNotif = await prisma.notification.create({
      data: {
        userId: childId,
        message: `🔥 Streak Incrível! Você completou tarefas por 7 dias seguidos!`,
      },
    });
    sendRealTimeNotification(childId, 'notification', streakNotif);
  }
};

/**
 * Checks and unlocks achievements for a child based on actions.
 */
export const checkAndUnlockAchievements = async (childId: string) => {
  const completedTasksCount = await prisma.task.count({
    where: {
      assignedToId: childId,
      status: 'APPROVED',
    },
  });

  const wallet = await prisma.wallet.findUnique({
    where: { userId: childId },
  });

  const unlockedIds = new Set(
    (await prisma.userAchievement.findMany({
      where: { userId: childId },
      select: { achievementId: true },
    })).map((ua) => ua.achievementId)
  );

  const achievements = await prisma.achievement.findMany();

  for (const ach of achievements) {
    // If already unlocked, skip
    if (unlockedIds.has(ach.id)) continue;

    let shouldUnlock = false;

    if (ach.badgeKey === 'first_task' && completedTasksCount >= 1) {
      shouldUnlock = true;
    } else if (ach.badgeKey === 'ten_tasks' && completedTasksCount >= 10) {
      shouldUnlock = true;
    } else if (ach.badgeKey === 'fifty_tasks' && completedTasksCount >= 50) {
      shouldUnlock = true;
    } else if (ach.badgeKey === 'saved_100' && wallet && (wallet.totalEarnedReal.toNumber() >= 100 || wallet.balanceReal.toNumber() >= 100)) {
      shouldUnlock = true;
    } else if (ach.badgeKey === 'weekly_reader') {
      // Check if they completed at least 3 reading tasks
      const readingCount = await prisma.task.count({
        where: {
          assignedToId: childId,
          status: 'APPROVED',
          category: 'Leitura',
        },
      });
      if (readingCount >= 3) shouldUnlock = true;
    } else if (ach.badgeKey === 'organization_master') {
      // Check organization tasks completed
      const orgCount = await prisma.task.count({
        where: {
          assignedToId: childId,
          status: 'APPROVED',
          category: 'Organização',
        },
      });
      if (orgCount >= 5) shouldUnlock = true;
    }

    if (shouldUnlock) {
      await prisma.userAchievement.create({
        data: {
          userId: childId,
          achievementId: ach.id,
        },
      });

      const message = `🥇 Conquista Desbloqueada! Você ganhou a medalha: "${ach.name}"!`;
      const notification = await prisma.notification.create({
        data: {
          userId: childId,
          message,
        },
      });

      sendRealTimeNotification(childId, 'notification', notification);
      sendRealTimeNotification(childId, 'achievement_unlocked', ach);
    }
  }
};
