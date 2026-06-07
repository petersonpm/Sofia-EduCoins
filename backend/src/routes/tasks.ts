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
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;

  try {
    let tasks;
    if (role === 'PARENT') {
      // Parents see tasks of all children in their family
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

      // 2. Reset the original active task's status to PENDING immediately
      updatedTask = await prisma.task.update({
        where: { id },
        data: {
          status: 'PENDING',
          completedAt: null,
          approvedAt: null,
        },
      });
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

    // 4. Update gamification: add XP and update streaks (will query APPROVED task clones correctly)
    await addXpToChild(childId, task.xpReward);
    await updateStreak(childId);
    await checkAndUnlockAchievements(childId);

    // 5. Create and send notifications
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

export default router;
