import { Router, Response } from 'express';
import prisma from '../utils/db';
import { authenticateToken, requireParent, requireChild } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { sendRealTimeNotification } from '../server';

const router = Router();

/**
 * @openapi
 * /api/expenses/requests:
 *   get:
 *     summary: Lista as solicitações de gastos/recompensas
 *     tags: [Gastos]
 *     security:
 *       - bearerAuth: []
 */
router.get('/requests', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;

  try {
    let expenses;
    if (role === 'PARENT') {
      // Parents see expenses of all children they are responsible for
      const familyAdminId = req.user?.parentId || req.user?.id;
      expenses = await prisma.expense.findMany({
        where: {
          child: {
            parentId: familyAdminId,
          },
        },
        include: {
          child: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Children see their own requested expenses
      expenses = await prisma.expense.findMany({
        where: { childId: userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return res.json(expenses);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/expenses/request:
 *   post:
 *     summary: Criança solicita uma compra ou resgate de recompensa (Apenas Crianças)
 *     tags: [Gastos]
 *     security:
 *       - bearerAuth: []
 */
router.post('/request', authenticateToken, requireChild, async (req: AuthenticatedRequest, res: Response) => {
  const { description, valueCoins = 0, valueReal = 0, type } = req.body;
  const childId = req.user?.id;
  const parentId = req.user?.parentId;

  if (!description || !type) {
    return res.status(400).json({ error: 'Descrição e tipo (COINS ou REAL_MONEY) são obrigatórios.' });
  }

  if (!parentId) {
    return res.status(400).json({ error: 'Você precisa estar vinculado a um pai/responsável para solicitar resgates.' });
  }

  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId: childId } });
    if (!wallet) {
      return res.status(404).json({ error: 'Carteira não encontrada.' });
    }

    // Check balance beforehand
    if (type === 'COINS' && wallet.balanceCoins < parseInt(valueCoins.toString())) {
      return res.status(400).json({ error: 'Você não tem EduCoins suficientes para este resgate.' });
    }
    if (type === 'REAL_MONEY' && wallet.balanceReal.toNumber() < parseFloat(valueReal.toString())) {
      return res.status(400).json({ error: 'Você não tem saldo em dinheiro suficiente para este resgate.' });
    }

    const expense = await prisma.expense.create({
      data: {
        description,
        valueCoins: parseInt(valueCoins.toString()),
        valueReal: parseFloat(valueReal.toString()),
        type,
        childId: childId!,
        status: 'PENDING',
      },
    });

    // Notify parent in real-time
    const childName = req.user?.name;
    const notificationMessage = `🛍️ ${childName} solicitou um resgate: "${description}". Valor: ${type === 'COINS' ? `${valueCoins} Moedas` : `R$ ${parseFloat(valueReal.toString()).toFixed(2)}`}. Clique para aprovar.`;

    const notification = await prisma.notification.create({
      data: {
        userId: parentId,
        message: notificationMessage,
      },
    });

    sendRealTimeNotification(parentId, 'notification', notification);
    sendRealTimeNotification(parentId, 'expense_requested', expense);

    return res.status(201).json({
      message: 'Solicitação de resgate enviada com sucesso! Aguarde a aprovação do papai/mamãe.',
      expense,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/expenses/{id}/approve:
 *   post:
 *     summary: Aprova uma solicitação de gasto/resgate (Apenas Pais)
 *     tags: [Gastos]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/approve', authenticateToken, requireParent, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        child: {
          include: {
            wallet: true,
          },
        },
      },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Solicitação de resgate não encontrada.' });
    }

    const familyAdminId = req.user?.parentId || req.user?.id;
    if (expense.child.parentId !== familyAdminId) {
      return res.status(403).json({ error: 'Você não tem permissão para aprovar resgates desta criança.' });
    }

    if (expense.status !== 'PENDING') {
      return res.status(400).json({ error: 'Este resgate já foi processado (aprovado ou rejeitado).' });
    }

    const wallet = expense.child.wallet;
    if (!wallet) {
      return res.status(404).json({ error: 'Carteira da criança não encontrada.' });
    }

    // Double check balance again before deducting
    if (expense.type === 'COINS') {
      if (wallet.balanceCoins < expense.valueCoins) {
        return res.status(400).json({ error: 'A criança não tem moedas suficientes para este resgate no momento.' });
      }

      // Deduct from wallet
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balanceCoins: wallet.balanceCoins - expense.valueCoins,
          totalSpentCoins: wallet.totalSpentCoins + expense.valueCoins,
        },
      });
    } else {
      const valueRealNum = parseFloat(expense.valueReal.toString());
      if (parseFloat(wallet.balanceReal.toString()) < valueRealNum) {
        return res.status(400).json({ error: 'A criança não tem saldo em dinheiro suficiente para este resgate no momento.' });
      }

      // Deduct from wallet
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balanceReal: parseFloat(wallet.balanceReal.toString()) - valueRealNum,
          totalSpentReal: parseFloat(wallet.totalSpentReal.toString()) + valueRealNum,
        },
      });
    }

    // Update status
    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        status: 'APPROVED',
      },
    });

    // Notify child
    const childId = expense.childId;
    const notificationMessage = `🎉 Eba! Papai/Mamãe aprovou seu pedido: "${expense.description}"! Divirta-se!`;
    const notification = await prisma.notification.create({
      data: {
        userId: childId,
        message: notificationMessage,
      },
    });

    sendRealTimeNotification(childId, 'notification', notification);
    sendRealTimeNotification(childId, 'expense_approved', updatedExpense);

    return res.json({ message: 'Resgate aprovado com sucesso e saldo debitado!', expense: updatedExpense });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/expenses/{id}/reject:
 *   post:
 *     summary: Rejeita uma solicitação de gasto/resgate (Apenas Pais)
 *     tags: [Gastos]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:id/reject', authenticateToken, requireParent, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: { child: true },
    });

    if (!expense) {
      return res.status(404).json({ error: 'Solicitação de resgate não encontrada.' });
    }

    const familyAdminId = req.user?.parentId || req.user?.id;
    if (expense.child.parentId !== familyAdminId) {
      return res.status(403).json({ error: 'Você não tem permissão para rejeitar resgates desta criança.' });
    }

    if (expense.status !== 'PENDING') {
      return res.status(400).json({ error: 'Este resgate já foi processado.' });
    }

    const updatedExpense = await prisma.expense.update({
      where: { id },
      data: {
        status: 'REJECTED',
      },
    });

    // Notify child
    const childId = expense.childId;
    const notificationMessage = `⚠️ Seu pedido: "${expense.description}" foi recusado pelo papai/mamãe. Converse com eles.`;
    const notification = await prisma.notification.create({
      data: {
        userId: childId,
        message: notificationMessage,
      },
    });

    sendRealTimeNotification(childId, 'notification', notification);
    sendRealTimeNotification(childId, 'expense_rejected', updatedExpense);

    return res.json({ message: 'Resgate rejeitado com sucesso.', expense: updatedExpense });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
