import { Router, Response } from 'express';
import prisma from '../utils/db';
import { authenticateToken, requireParent, requireChild } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { addXpToChild, updateStreak, checkAndUnlockAchievements } from '../utils/gamification';
import { sendRealTimeNotification } from '../server';

const router = Router();

/**
 * @openapi
 * /api/tasks:
 *   get:
 *     summary: Retorna a lista de tarefas do usuário
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de tarefas obtida com sucesso
 */
// Helper function to safely reset daily tasks.
// Keeps the oldest task record (original) and resets it to PENDING.
// Deletes any other completed/rejected records (clones) from the day.
async function resetDailyTasksForChildren(childIds: string[], forceAll: boolean = false) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Fetch all daily tasks that are not approved, ordered by creation date (oldest first)
  const dailyTasks = await prisma.task.findMany({
    where: {
      assignedToId: { in: childIds },
      isDaily: true,
      status: { in: ['PENDING', 'COMPLETED', 'REJECTED'] },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by child + title + category to identify duplicates/clones of the same daily task
  const groups: Record<string, typeof dailyTasks> = {};
  for (const task of dailyTasks) {
    const key = `${task.assignedToId}-${task.title.trim().toLowerCase()}-${task.category.trim().toLowerCase()}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(task);
  }

  const idsToDelete: string[] = [];
  const idsToReset: string[] = [];
  const tasksToCreate: any[] = [];

  for (const key in groups) {
    const instances = groups[key];
    const original = instances[0]; // The oldest one (original task template)

    // Original task gets reset to PENDING if it was COMPLETED/REJECTED and is stale (or if forced)
    if (original.status === 'COMPLETED' || original.status === 'REJECTED') {
      const isStale = original.completedAt && new Date(original.completedAt) < todayStart;
      if (forceAll || isStale) {
        // Clonar para preservar o histórico da tentativa do dia anterior
        tasksToCreate.push({
          title: original.title,
          description: original.description,
          category: original.category,
          difficulty: original.difficulty,
          status: original.status,
          isDaily: true,
          rewardType: original.rewardType,
          rewardCoins: original.rewardCoins,
          rewardReal: original.rewardReal,
          xpReward: original.xpReward,
          completedAt: original.completedAt,
          approvedAt: original.approvedAt,
          createdById: original.createdById,
          assignedToId: original.assignedToId,
          deadline: original.deadline,
        });
        idsToReset.push(original.id);
      }
    }

    // All subsequent instances with status COMPLETED, REJECTED, or PENDING are clones created by repetitions.
    // PENDING clones (ghosts) are deleted immediately. COMPLETED/REJECTED clones are only deleted if forcing a fresh day start.
    for (let i = 1; i < instances.length; i++) {
      const clone = instances[i];
      if (clone.status === 'COMPLETED' || clone.status === 'REJECTED' || clone.status === 'PENDING') {
        if (clone.status === 'PENDING') {
          // A PENDING clone is a duplicate ghost, delete it immediately
          idsToDelete.push(clone.id);
        } else {
          if (forceAll) {
            idsToDelete.push(clone.id);
          }
        }
      }
    }
  }

  if (tasksToCreate.length > 0) {
    await prisma.task.createMany({
      data: tasksToCreate,
    });
  }

  if (idsToReset.length > 0) {
    await prisma.task.updateMany({
      where: { id: { in: idsToReset } },
      data: {
        status: 'PENDING',
        completedAt: null,
        approvedAt: null,
      },
    });
  }

  if (idsToDelete.length > 0) {
    await prisma.task.deleteMany({
      where: { id: { in: idsToDelete } },
    });
  }

  return { resetCount: idsToReset.length, deletedCount: idsToDelete.length };
}

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;

  try {
    let childIdsForReset: string[] = [];
    if (role === 'PARENT') {
      const familyAdminId = req.user?.parentId || req.user?.id;
      const children = await prisma.user.findMany({
        where: { parentId: familyAdminId },
        select: { id: true },
      });
      childIdsForReset = children.map((c) => c.id);
    } else {
      childIdsForReset = [userId!];
    }

    if (childIdsForReset.length > 0) {
      // Auto-reset stale daily tasks on every fetch:
      // Resets the original tasks to PENDING and deletes duplicate clones.
      await resetDailyTasksForChildren(childIdsForReset, false);
    }

    let tasks;
    if (role === 'PARENT') {
      const familyAdminId = req.user?.parentId || req.user?.id;
      tasks = await prisma.task.findMany({
        where: {
          assignedTo: {
            parentId: familyAdminId,
          },
        },
        include: {
          assignedTo: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Children see tasks assigned to them
      tasks = await prisma.task.findMany({
        where: { assignedToId: userId },
        include: {
          createdBy: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return res.json(tasks);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/tasks/report:
 *   get:
 *     summary: Retorna relatorio de desempenho de um filho (Apenas Pais)
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 */
router.get('/report', authenticateToken, requireParent, async (req: AuthenticatedRequest, res: Response) => {
  const { childId } = req.query;

  if (!childId || typeof childId !== 'string') {
    return res.status(400).json({ error: 'childId e obrigatorio.' });
  }

  try {
    const child = await prisma.user.findUnique({
      where: { id: childId },
      include: { wallet: true },
    });

    if (!child) return res.status(404).json({ error: 'Crianca nao encontrada.' });

    // Count total approved tasks (fast count query)
    const totalApproved = await prisma.task.count({
      where: { assignedToId: childId, status: 'APPROVED' },
    });

    const now = new Date();
    const startOfToday = new Date(now); startOfToday.setHours(0,0,0,0);
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0,0,0,0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOf30Days = new Date(now); startOf30Days.setDate(now.getDate() - 30);

    // Only fetch recent approved tasks from the last 30 days
    const recentApprovedTasks = await prisma.task.findMany({
      where: {
        assignedToId: childId,
        status: 'APPROVED',
        approvedAt: { gte: startOf30Days },
      },
      orderBy: { approvedAt: 'desc' },
    });

    const thisWeek = recentApprovedTasks.filter(t => t.approvedAt && new Date(t.approvedAt) >= startOfWeek);
    const thisMonth = recentApprovedTasks.filter(t => t.approvedAt && new Date(t.approvedAt) >= startOfMonth);
    const last30 = recentApprovedTasks;

    // Category breakdown (last 30 days)
    const categoryMap: Record<string, { count: number; coins: number; real: number; xp: number }> = {};
    last30.forEach(t => {
      if (!categoryMap[t.category]) categoryMap[t.category] = { count: 0, coins: 0, real: 0, xp: 0 };
      categoryMap[t.category].count++;
      categoryMap[t.category].coins += t.rewardCoins;
      categoryMap[t.category].real += t.rewardReal.toNumber();
      categoryMap[t.category].xp += t.xpReward;
    });

    // Daily activity for the last 14 days (heatmap data)
    const dailyActivity: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i); d.setHours(0,0,0,0);
      const key = d.toISOString().split('T')[0];
      dailyActivity[key] = 0;
    }
    recentApprovedTasks.forEach(t => {
      if (!t.approvedAt) return;
      const key = new Date(t.approvedAt).toISOString().split('T')[0];
      if (dailyActivity[key] !== undefined) dailyActivity[key]++;
    });

    const streak = (child.wallet as any)?.streak || 0;

    // Actionable recommendations based on task history
    const recommendations: string[] = [];

    // 1. Streak check
    if (streak === 0) {
      recommendations.push("A sequência diária está zerada. Que tal propor uma tarefa simples hoje para recuperar a animação?");
    } else if (streak >= 3) {
      recommendations.push(`🔥 Excelente! Sequência de ${streak} dias de tarefas ativos. Continue incentivando essa consistência.`);
    }

    // 2. Weekly volume check
    if (thisWeek.length === 0) {
      recommendations.push("Nenhuma tarefa foi aprovada esta semana. Que tal incentivar a criança a retomar a rotina de deveres?");
    } else if (thisWeek.length < 3) {
      recommendations.push("A consistência de deveres nesta semana está um pouco baixa. Propor metas menores ou aumentar os elogios pode ajudar.");
    }

    // 3. Category coverage check (last 30 days)
    const standardCategories = ["Estudos", "Organização", "Higiene", "Leitura", "Atividades físicas", "Responsabilidade"];
    const completedCategories = last30.map(t => t.category.trim().toLowerCase());
    
    const inactiveCats = standardCategories.filter(cat => 
      !completedCategories.some(cc => cc.includes(cat.toLowerCase().slice(0, 5)))
    );

    if (inactiveCats.length > 0) {
      const formattedCats = inactiveCats.slice(0, 2).map(c => `"${c}"`).join(" e ");
      recommendations.push(`Foco em novos hábitos: A criança não realizou tarefas em ${formattedCats} nos últimos 30 dias.`);
    }

    // 4. Rejection check (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const rejectedCount = await prisma.task.count({
      where: {
        assignedToId: childId,
        status: 'REJECTED',
        completedAt: { gte: sevenDaysAgo }
      }
    });

    if (rejectedCount > 0) {
      recommendations.push(`Atenção: A criança teve ${rejectedCount} tarefa(s) recusada(s) ou para refazer nos últimos 7 dias. Converse para ver se há alguma dúvida.`);
    }

    return res.json({
      child: { id: child.id, name: child.name, xp: (child.wallet as any)?.xp || 0, level: (child.wallet as any)?.level || 1, streak },
      wallet: {
        balanceCoins: (child.wallet as any)?.balanceCoins || 0,
        balanceReal: parseFloat(((child.wallet as any)?.balanceReal || 0).toString()),
        totalEarnedCoins: (child.wallet as any)?.totalEarnedCoins || 0,
        totalEarnedReal: parseFloat(((child.wallet as any)?.totalEarnedReal || 0).toString()),
      },
      summary: {
        totalApproved,
        thisWeek: {
          count: thisWeek.length,
          coins: thisWeek.reduce((s, t) => s + t.rewardCoins, 0),
          real: thisWeek.reduce((s, t) => s + t.rewardReal.toNumber(), 0),
          xp: thisWeek.reduce((s, t) => s + t.xpReward, 0),
        },
        thisMonth: {
          count: thisMonth.length,
          coins: thisMonth.reduce((s, t) => s + t.rewardCoins, 0),
          real: thisMonth.reduce((s, t) => s + t.rewardReal.toNumber(), 0),
          xp: thisMonth.reduce((s, t) => s + t.xpReward, 0),
        },
      },
      categoryBreakdown: Object.entries(categoryMap)
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.count - a.count),
      dailyActivity,
      recommendations,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/tasks:
 *   post:
 *     summary: Cria uma nova tarefa (Apenas Pais)
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - category
 *               - difficulty
 *               - rewardType
 *               - assignedToId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               difficulty:
 *                 type: string
 *               rewardType:
 *                 type: string
 *               rewardCoins:
 *                 type: integer
 *               rewardReal:
 *                 type: number
 *               xpReward:
 *                 type: integer
 *               assignedToId:
 *                 type: string
 *               deadline:
 *                 type: string
 *                 format: date-time
 */
router.post('/', authenticateToken, requireParent, async (req: AuthenticatedRequest, res: Response) => {
  const {
    title,
    description,
    category,
    difficulty,
    rewardType,
    rewardCoins = 0,
    rewardReal = 0,
    xpReward = 10,
    assignedToId,
    deadline,
    isDaily = true,
  } = req.body;
  const parentId = req.user?.id;

  if (!title || !category || !difficulty || !rewardType || !assignedToId || !parentId) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        category,
        difficulty,
        rewardType,
        rewardCoins: parseInt(rewardCoins.toString()),
        rewardReal: parseFloat(rewardReal.toString()),
        xpReward: parseInt(xpReward.toString()),
        assignedToId,
        createdById: parentId,
        deadline: deadline ? new Date(deadline) : null,
        status: 'PENDING',
        isDaily: isDaily === true || isDaily === 'true',
      },
    });

    // Notify child in real-time
    const notification = await prisma.notification.create({
      data: {
        userId: assignedToId,
        message: `📢 Nova tarefa criada pelo papai/mamãe: "${title}". Vale ${rewardCoins} moedas e R$ ${rewardReal}!`,
      },
    });

    sendRealTimeNotification(assignedToId, 'notification', notification);
    sendRealTimeNotification(assignedToId, 'task_created', task);

    return res.status(201).json(task);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/tasks/{id}:
 *   put:
 *     summary: Atualiza uma tarefa existente (Apenas Pais)
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authenticateToken, requireParent, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { title, description, category, difficulty, rewardType, rewardCoins, rewardReal, xpReward, deadline, isDaily } = req.body;

  try {
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingTask.title,
        description: description !== undefined ? description : existingTask.description,
        category: category !== undefined ? category : existingTask.category,
        difficulty: difficulty !== undefined ? difficulty : existingTask.difficulty,
        rewardType: rewardType !== undefined ? rewardType : existingTask.rewardType,
        rewardCoins: rewardCoins !== undefined ? parseInt(rewardCoins.toString()) : existingTask.rewardCoins,
        rewardReal: rewardReal !== undefined ? parseFloat(rewardReal.toString()) : existingTask.rewardReal,
        xpReward: xpReward !== undefined ? parseInt(xpReward.toString()) : existingTask.xpReward,
        deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : existingTask.deadline,
        isDaily: isDaily !== undefined ? (isDaily === true || isDaily === 'true') : existingTask.isDaily,
      },
    });

    return res.json(updatedTask);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/tasks/{id}:
 *   delete:
 *     summary: Exclui uma tarefa (Apenas Pais)
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authenticateToken, requireParent, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    await prisma.task.delete({ where: { id } });
    return res.json({ message: 'Tarefa excluída com sucesso.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/tasks/{id}/complete:
 *   post:
 *     summary: Marca uma tarefa como concluída (Apenas Crianças)
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/complete', authenticateToken, requireChild, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const childId = req.user?.id;

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignedTo: true },
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    if (task.assignedToId !== childId) {
      return res.status(403).json({ error: 'Você só pode concluir tarefas atribuídas a você.' });
    }

    if (task.status === 'APPROVED') {
      return res.status(400).json({ error: 'Esta tarefa já foi aprovada.' });
    }

    // isDaily + COMPLETED: cria clone para nova submissão do dia
    if (task.isDaily && task.status === 'COMPLETED') {
      const clone = await prisma.task.create({
        data: {
          title: task.title,
          description: task.description,
          category: task.category,
          difficulty: task.difficulty,
          status: 'COMPLETED',
          isDaily: true,
          rewardType: task.rewardType,
          rewardCoins: task.rewardCoins,
          rewardReal: task.rewardReal,
          xpReward: task.xpReward,
          completedAt: new Date(),
          createdById: task.createdById,
          assignedToId: task.assignedToId,
          deadline: task.deadline,
        },
      });

      const parentId = task.createdById;
      const cloneNotif = await prisma.notification.create({
        data: {
          userId: parentId,
          message: task.assignedTo.name + ' fez a tarefa novamente: ' + task.title + '. Clique para aprovar!',
        },
      });

      sendRealTimeNotification(parentId, 'notification', cloneNotif);
      sendRealTimeNotification(parentId, 'task_completed', clone);

      return res.json({ message: 'Ótimo! Nova entrega registrada para aprovação.', task: clone });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Notify parent in real-time
    const parentId = task.createdById;
    const notification = await prisma.notification.create({
      data: {
        userId: parentId,
        message: `✅ ${task.assignedTo.name} marcou a tarefa "${task.title}" como concluída! Clique para aprovar.`,
      },
    });

    sendRealTimeNotification(parentId, 'notification', notification);
    sendRealTimeNotification(parentId, 'task_completed', updatedTask);

    return res.json({ message: 'Tarefa marcada como concluída! Aguarde a aprovação do papai/mamãe.', task: updatedTask });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/tasks/{id}/approve:
 *   post:
 *     summary: Aprova a conclusão de uma tarefa (Apenas Pais)
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/approve', authenticateToken, requireParent, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignedTo: true },
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    const familyAdminId = req.user?.parentId || req.user?.id;
    if (task.assignedTo.parentId !== familyAdminId) {
      return res.status(403).json({ error: 'Você não tem permissão para gerenciar esta tarefa.' });
    }

    if (task.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Esta tarefa ainda não foi marcada como concluída pela criança.' });
    }

    let updatedTask;
    if (task.isDaily) {
      // 1. Clone/duplicate the task in the database as an APPROVED history record
      await prisma.task.create({
        data: {
          title: task.title,
          description: task.description,
          category: task.category,
          difficulty: task.difficulty,
          status: 'APPROVED',
          isDaily: true,
          rewardType: task.rewardType,
          rewardCoins: task.rewardCoins,
          rewardReal: task.rewardReal,
          xpReward: task.xpReward,
          completedAt: task.completedAt || new Date(),
          approvedAt: new Date(),
          createdById: task.createdById,
          assignedToId: task.assignedToId,
          deadline: task.deadline,
        },
      });

      // 2. Check if this task is the oldest (original template) record for this child, title, and category
      const oldestTask = await prisma.task.findFirst({
        where: {
          assignedToId: task.assignedToId,
          title: task.title,
          category: task.category,
          isDaily: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (oldestTask && oldestTask.id === id) {
        // This is the original task record, reset it to PENDING so it can be completed again
        updatedTask = await prisma.task.update({
          where: { id },
          data: {
            status: 'PENDING',
            completedAt: null,
            approvedAt: null,
          },
        });
      } else {
        // This is a clone task record. Since we already duplicated it as APPROVED, we can delete this COMPLETED clone.
        await prisma.task.delete({
          where: { id },
        });
        updatedTask = oldestTask || task; // fallback
      }
    } else {
      // One-off task: just update the original task status to APPROVED directly
      updatedTask = await prisma.task.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedAt: new Date(),
        },
      });
    }

    const childId = task.assignedToId;

    // 3. Update child's wallet
    const wallet = await prisma.wallet.findUnique({ where: { userId: childId } });
    if (wallet) {
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balanceCoins: wallet.balanceCoins + task.rewardCoins,
          balanceReal: wallet.balanceReal.toNumber() + task.rewardReal.toNumber(),
          totalEarnedCoins: wallet.totalEarnedCoins + task.rewardCoins,
          totalEarnedReal: wallet.totalEarnedReal.toNumber() + task.rewardReal.toNumber(),
        },
      });
    }

    // 4. Update gamification and notifications in the background to ensure instantaneous response times
    (async () => {
      try {
        await addXpToChild(childId, task.xpReward);
        await updateStreak(childId);
        await checkAndUnlockAchievements(childId);

        const childNotifMessage = `🎉 Parabéns! Sua tarefa "${task.title}" foi aprovada! Você ganhou +${task.rewardCoins} moedas, R$ ${task.rewardReal.toFixed(2)} e +${task.xpReward} XP!`;
        const notification = await prisma.notification.create({
          data: {
            userId: childId,
            message: childNotifMessage,
          },
        });

        sendRealTimeNotification(childId, 'notification', notification);
        sendRealTimeNotification(childId, 'task_approved', {
          task: updatedTask,
          xpReward: task.xpReward,
          rewardCoins: task.rewardCoins,
          rewardReal: task.rewardReal,
        });
      } catch (err) {
        console.error('Erro ao processar gamificação e notificações em background:', err);
      }
    })();

    return res.json({ message: 'Tarefa aprovada com sucesso! Recompensas creditadas.', task: updatedTask });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/tasks/{id}/reject:
 *   post:
 *     summary: Rejeita a conclusão de uma tarefa (Apenas Pais)
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/reject', authenticateToken, requireParent, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const task = await prisma.task.findUnique({
      where: { id },
      include: { assignedTo: true },
    });

    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada.' });
    }

    const familyAdminId = req.user?.parentId || req.user?.id;
    if (task.assignedTo.parentId !== familyAdminId) {
      return res.status(403).json({ error: 'Você não tem permissão para gerenciar esta tarefa.' });
    }

    if (task.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Esta tarefa não está pendente de aprovação.' });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        status: 'REJECTED',
      },
    });

    const childId = task.assignedToId;
    const childNotifMessage = `⚠️ A tarefa "${task.title}" precisa ser revisada. Dá uma olhada e tente de novo!`;
    const notification = await prisma.notification.create({
      data: {
        userId: childId,
        message: childNotifMessage,
      },
    });

    sendRealTimeNotification(childId, 'notification', notification);
    sendRealTimeNotification(childId, 'task_rejected', updatedTask);

    return res.json({ message: 'Tarefa rejeitada. A criança foi notificada para refazer.', task: updatedTask });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/tasks/reset-daily:
 *   post:
 *     summary: Reinicia as tarefas diárias para o próximo dia (Apenas Pais)
 *     tags: [Tarefas]
 *     security:
 *       - bearerAuth: []
 */
router.post('/reset-daily', authenticateToken, requireParent, async (req: AuthenticatedRequest, res: Response) => {
  const familyAdminId = req.user?.parentId || req.user?.id;
  const { childId } = req.body; // Optional: reset for a specific child only

  try {
    // Find all children in this family
    const whereChildren: any = { parentId: familyAdminId };
    if (childId) whereChildren.id = childId;

    const children = await prisma.user.findMany({
      where: whereChildren,
      select: { id: true },
    });

    const childIds = children.map((c) => c.id);

    if (childIds.length === 0) {
      return res.status(404).json({ error: 'Nenhum filho encontrado nesta família.' });
    }

    // Call the helper to reset and delete duplicate clones (forcing reset for today as well)
    const resetResult = await resetDailyTasksForChildren(childIds, true);

    return res.json({
      message: `Dia reiniciado com sucesso! ${resetResult.resetCount} tarefa(s) resetada(s) para PENDENTE. ${resetResult.deletedCount} repetição(ões) de clones removida(s).`,
      resetCount: resetResult.resetCount,
      deletedCount: resetResult.deletedCount,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
