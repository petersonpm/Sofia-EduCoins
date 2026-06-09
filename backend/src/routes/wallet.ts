import { Router, Response } from 'express';
import prisma from '../utils/db';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * @openapi
 * /api/wallet:
 *   get:
 *     summary: Obtém os dados da carteira e o histórico de transações
 *     tags: [Carteira]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;
  const role = req.user?.role;

  try {
    // Determine the child's ID (if parent, we require a childId query param)
    let childId = userId;
    if (role === 'PARENT') {
      const childIdParam = req.query.childId as string;
      if (!childIdParam) {
        return res.status(400).json({ error: 'Parâmetro childId é obrigatório para pais.' });
      }
      childId = childIdParam;
    }

    if (!childId) {
      return res.status(400).json({ error: 'Usuário não identificado.' });
    }

    // Fetch the wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: childId },
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Carteira não encontrada.' });
    }

    // Compilar histórico de transações (Ganhos de tarefas e Gastos aprovados)
    const approvedTasks = await prisma.task.findMany({
      where: {
        assignedToId: childId,
        status: 'APPROVED',
      },
      select: {
        id: true,
        title: true,
        rewardCoins: true,
        rewardReal: true,
        approvedAt: true,
      },
    });

    const approvedExpenses = await prisma.expense.findMany({
      where: {
        childId,
        status: 'APPROVED',
      },
      select: {
        id: true,
        description: true,
        valueCoins: true,
        valueReal: true,
        createdAt: true,
      },
    });

    // Format incomes
    const incomes = approvedTasks.map((task) => ({
      id: task.id,
      description: `Tarefa Concluída: ${task.title}`,
      type: 'INCOME',
      valueCoins: task.rewardCoins,
      valueReal: parseFloat(task.rewardReal.toString()),
      date: task.approvedAt || new Date(),
    }));

    // Format expenses
    const expenses = approvedExpenses.map((expense) => ({
      id: expense.id,
      description: `Compra/Resgate: ${expense.description}`,
      type: 'EXPENSE',
      valueCoins: expense.valueCoins,
      valueReal: parseFloat(expense.valueReal.toString()),
      date: expense.createdAt,
    }));

    // Merge and sort by date descending
    const transactions = [...incomes, ...expenses].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return res.json({
      wallet: {
        balanceCoins: wallet.balanceCoins,
        balanceReal: parseFloat(wallet.balanceReal.toString()),
        totalEarnedCoins: wallet.totalEarnedCoins,
        totalEarnedReal: parseFloat(wallet.totalEarnedReal.toString()),
        totalSpentCoins: wallet.totalSpentCoins,
        totalSpentReal: parseFloat(wallet.totalSpentReal.toString()),
      },
      transactions,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/wallet/adjust:
 *   patch:
 *     summary: (Pais) Ajusta diretamente o saldo da carteira de um filho
 *     tags: [Carteira]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/adjust', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const role = req.user?.role;
  const { childId, balanceCoins, balanceReal } = req.body;

  // Only parents can adjust wallet balances
  if (role !== 'PARENT') {
    return res.status(403).json({ error: 'Apenas responsáveis podem ajustar saldos.' });
  }

  if (!childId) {
    return res.status(400).json({ error: 'childId é obrigatório.' });
  }

  try {
    // Verify the child exists and is a CHILD role
    const child = await prisma.user.findFirst({
      where: { id: childId, role: 'CHILD' },
    });

    if (!child) {
      return res.status(404).json({ error: 'Criança não encontrada.' });
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: childId } });
    if (!wallet) {
      return res.status(404).json({ error: 'Carteira não encontrada.' });
    }

    const updateData: any = {};
    if (balanceCoins !== undefined && balanceCoins !== null) {
      updateData.balanceCoins = Math.max(0, parseInt(balanceCoins, 10) || 0);
    }
    if (balanceReal !== undefined && balanceReal !== null) {
      updateData.balanceReal = Math.max(0, parseFloat(balanceReal) || 0);
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'Nenhum valor para atualizar. Informe balanceCoins e/ou balanceReal.' });
    }

    const updated = await prisma.wallet.update({
      where: { userId: childId },
      data: updateData,
    });

    return res.json({
      message: 'Saldo ajustado com sucesso!',
      balanceCoins: updated.balanceCoins,
      balanceReal: parseFloat(updated.balanceReal.toString()),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
