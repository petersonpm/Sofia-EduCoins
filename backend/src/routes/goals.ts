import { Router, Response } from 'express';
import prisma from '../utils/db';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { sendRealTimeNotification } from '../server';

const router = Router();

/**
 * @openapi
 * /api/goals:
 *   get:
 *     summary: Lista as metas/sonhos da criança
 *     tags: [Metas]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;

  try {
    let childId = userId;
    if (role === 'PARENT') {
      const childIdParam = req.query.childId as string;
      if (!childIdParam) {
        return res.status(400).json({ error: 'Parâmetro childId é obrigatório para pais.' });
      }
      childId = childIdParam;

      const childUser = await prisma.user.findUnique({ where: { id: childId } });
      const familyAdminId = req.user?.parentId || req.user?.id;
      if (!childUser || childUser.parentId !== familyAdminId) {
        return res.status(403).json({ error: 'Acesso negado: Criança não pertence ao seu grupo familiar.' });
      }
    }

    if (!childId) {
      return res.status(400).json({ error: 'Usuário não identificado.' });
    }

    const goals = await prisma.goal.findMany({
      where: { childId },
      orderBy: { createdAt: 'desc' },
    });

    return res.json(goals);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/goals:
 *   post:
 *     summary: Cria uma nova meta/sonho
 *     tags: [Metas]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { title, targetCoins = 0, targetReal = 0, type, childId: childIdParam } = req.body;
  const userId = req.user?.id;
  const role = req.user?.role;

  if (!title || !type) {
    return res.status(400).json({ error: 'Título e tipo (COINS ou REAL_MONEY) são obrigatórios.' });
  }

  try {
    let childId = userId;
    if (role === 'PARENT') {
      if (!childIdParam) {
        return res.status(400).json({ error: 'Parâmetro childId é obrigatório para pais.' });
      }
      childId = childIdParam;

      const childUser = await prisma.user.findUnique({ where: { id: childId } });
      const familyAdminId = req.user?.parentId || req.user?.id;
      if (!childUser || childUser.parentId !== familyAdminId) {
        return res.status(403).json({ error: 'Acesso negado: Criança não pertence ao seu grupo familiar.' });
      }
    }

    if (!childId) {
      return res.status(400).json({ error: 'Usuário não identificado.' });
    }

    const goal = await prisma.goal.create({
      data: {
        title,
        targetCoins: parseInt(targetCoins.toString()),
        targetReal: parseFloat(targetReal.toString()),
        type,
        childId,
        completed: false,
      },
    });

    return res.status(201).json(goal);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/goals/{id}/deposit:
 *   post:
 *     summary: Deposita moedas ou dinheiro em uma meta (Poupança)
 *     tags: [Metas]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/deposit', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { amount } = req.body;
  const userId = req.user?.id;
  const role = req.user?.role;

  if (role === 'PARENT') {
    return res.status(403).json({ error: 'Apenas a própria criança pode depositar em seus sonhos.' });
  }

  if (!amount || parseFloat(amount.toString()) <= 0) {
    return res.status(400).json({ error: 'O valor do depósito deve ser maior que zero.' });
  }

  try {
    const goal = await prisma.goal.findUnique({
      where: { id },
    });

    if (!goal || goal.childId !== userId) {
      return res.status(404).json({ error: 'Meta não encontrada ou não pertence a você.' });
    }

    if (goal.completed) {
      return res.status(400).json({ error: 'Esta meta já foi alcançada!' });
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      return res.status(404).json({ error: 'Carteira não encontrada.' });
    }

    let updatedGoal;
    if (goal.type === 'COINS') {
      const depositAmount = parseInt(amount.toString());
      if (wallet.balanceCoins < depositAmount) {
        return res.status(400).json({ error: 'Você não tem EduCoins suficientes na carteira.' });
      }

      // Update wallet balance and goal savings
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balanceCoins: wallet.balanceCoins - depositAmount,
          totalSpentCoins: wallet.totalSpentCoins + depositAmount, // mark as "saved/spent"
        },
      });

      const newCurrentCoins = goal.currentCoins + depositAmount;
      const isCompleted = newCurrentCoins >= goal.targetCoins;

      updatedGoal = await prisma.goal.update({
        where: { id },
        data: {
          currentCoins: newCurrentCoins,
          completed: isCompleted,
        },
      });
    } else {
      const depositAmount = parseFloat(amount.toString());
      if (wallet.balanceReal.toNumber() < depositAmount) {
        return res.status(400).json({ error: 'Você não tem saldo suficiente na carteira.' });
      }

      // Update wallet balance and goal savings
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balanceReal: wallet.balanceReal.toNumber() - depositAmount,
          totalSpentReal: wallet.totalSpentReal.toNumber() + depositAmount,
        },
      });

      const newCurrentReal = parseFloat(goal.currentReal.toString()) + depositAmount;
      const isCompleted = newCurrentReal >= parseFloat(goal.targetReal.toString());

      updatedGoal = await prisma.goal.update({
        where: { id },
        data: {
          currentReal: newCurrentReal,
          completed: isCompleted,
        },
      });
    }

    // If completed, trigger a celebration notification
    if (updatedGoal.completed) {
      const completionMessage = `🌟 Incrível! Você realizou o seu sonho: "${goal.title}"! Parabéns por economizar! 🎉`;
      const notification = await prisma.notification.create({
        data: {
          userId: userId!,
          message: completionMessage,
        },
      });

      sendRealTimeNotification(userId!, 'notification', notification);
      sendRealTimeNotification(userId!, 'goal_completed', updatedGoal);
    }

    return res.json({
      message: updatedGoal.completed ? 'Parabéns! Meta alcançada!' : 'Depósito realizado com sucesso!',
      goal: updatedGoal,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
