import { Router, Response } from 'express';
import prisma from '../utils/db';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * GET /api/jars
 * Lists the child's budgeting jars. If none exist, automatically initializes the 4 standard jars.
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

    let jars = await prisma.jar.findMany({
      where: { childId },
      orderBy: { createdAt: 'asc' },
    });

    // Auto-initialize default jars if none exist
    if (jars.length === 0) {
      const defaultJars = [
        { name: 'Gastos Diários', icon: 'ShoppingBag', color: 'amber', purpose: 'SPEND', childId },
        { name: 'Poupança / Futuro', icon: 'PiggyBank', color: 'emerald', purpose: 'SAVE', childId },
        { name: 'Ajudar / Doar', icon: 'Heart', color: 'rose', purpose: 'GIVE', childId },
        { name: 'Investimento / Poupar', icon: 'TrendingUp', color: 'indigo', purpose: 'INVEST', childId },
      ];

      await prisma.jar.createMany({
        data: defaultJars,
      });

      jars = await prisma.jar.findMany({
        where: { childId },
        orderBy: { createdAt: 'asc' },
      });
    }

    return res.json(jars);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/jars
 * Creates a custom jar for the child.
 */
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { name, icon, color, childId: childIdParam } = req.body;
  const userId = req.user?.id;
  const role = req.user?.role;

  if (!name || !icon || !color) {
    return res.status(400).json({ error: 'Nome, ícone e cor são campos obrigatórios.' });
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

    const jar = await prisma.jar.create({
      data: {
        name,
        icon,
        color,
        purpose: 'CUSTOM',
        childId,
        currentCoins: 0,
        currentReal: 0,
      },
    });

    return res.status(201).json(jar);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/jars/transfer
 * Transfers funds (Moedas or Real) between main wallet and a jar, or between jars.
 */
router.post('/transfer', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { from, to, amount, type } = req.body; // from: 'wallet' | jarId, to: 'wallet' | jarId
  const userId = req.user?.id;
  const role = req.user?.role;

  if (role === 'PARENT') {
    return res.status(403).json({ error: 'Apenas a própria criança pode realizar transferências de saldos.' });
  }

  if (!from || !to || !amount || !type) {
    return res.status(400).json({ error: 'Campos from, to, amount e type são obrigatórios.' });
  }

  const transferVal = parseFloat(amount.toString());
  if (transferVal <= 0) {
    return res.status(400).json({ error: 'O valor da transferência deve ser maior que zero.' });
  }

  if (from === to) {
    return res.status(400).json({ error: 'A origem e o destino da transferência devem ser diferentes.' });
  }

  try {
    const wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      return res.status(404).json({ error: 'Carteira não encontrada.' });
    }

    // 1. Verify balances and update source
    if (from === 'wallet') {
      if (type === 'COINS') {
        const coinAmount = parseInt(amount.toString());
        if (wallet.balanceCoins < coinAmount) {
          return res.status(400).json({ error: 'EduCoins insuficientes na carteira principal.' });
        }
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            balanceCoins: wallet.balanceCoins - coinAmount,
            totalSpentCoins: wallet.totalSpentCoins + coinAmount,
          },
        });
      } else {
        if (wallet.balanceReal.toNumber() < transferVal) {
          return res.status(400).json({ error: 'Saldo em dinheiro insuficiente na carteira principal.' });
        }
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            balanceReal: wallet.balanceReal.toNumber() - transferVal,
            totalSpentReal: wallet.totalSpentReal.toNumber() + transferVal,
          },
        });
      }
    } else {
      // Transferring from a jar
      const jar = await prisma.jar.findUnique({ where: { id: from } });
      if (!jar || jar.childId !== userId) {
        return res.status(404).json({ error: 'Caixinha de origem não encontrada ou inválida.' });
      }

      if (type === 'COINS') {
        const coinAmount = parseInt(amount.toString());
        if (jar.currentCoins < coinAmount) {
          return res.status(400).json({ error: 'EduCoins insuficientes na caixinha de origem.' });
        }
        await prisma.jar.update({
          where: { id: from },
          data: { currentCoins: jar.currentCoins - coinAmount },
        });
      } else {
        const currentRealVal = parseFloat(jar.currentReal.toString());
        if (currentRealVal < transferVal) {
          return res.status(400).json({ error: 'Saldo insuficiente na caixinha de origem.' });
        }
        await prisma.jar.update({
          where: { id: from },
          data: { currentReal: currentRealVal - transferVal },
        });
      }
    }

    // 2. Update target
    if (to === 'wallet') {
      if (type === 'COINS') {
        const coinAmount = parseInt(amount.toString());
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            balanceCoins: wallet.balanceCoins + coinAmount,
            totalSpentCoins: Math.max(0, wallet.totalSpentCoins - coinAmount),
          },
        });
      } else {
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: {
            balanceReal: wallet.balanceReal.toNumber() + transferVal,
            totalSpentReal: Math.max(0, wallet.totalSpentReal.toNumber() - transferVal),
          },
        });
      }
    } else {
      // Transferring to a jar
      const jar = await prisma.jar.findUnique({ where: { id: to } });
      if (!jar || jar.childId !== userId) {
        return res.status(404).json({ error: 'Caixinha de destino não encontrada ou inválida.' });
      }

      if (type === 'COINS') {
        const coinAmount = parseInt(amount.toString());
        await prisma.jar.update({
          where: { id: to },
          data: { currentCoins: jar.currentCoins + coinAmount },
        });
      } else {
        const currentRealVal = parseFloat(jar.currentReal.toString());
        await prisma.jar.update({
          where: { id: to },
          data: { currentReal: currentRealVal + transferVal },
        });
      }
    }

    return res.json({ message: 'Transferência concluída com sucesso!' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/jars/:id
 * Deletes the budgeting jar and refunds any saved balances back to the child's wallet.
 */
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const role = req.user?.role;

  try {
    const jar = await prisma.jar.findUnique({ where: { id } });
    if (!jar) {
      return res.status(404).json({ error: 'Caixinha não encontrada.' });
    }

    if (role === 'CHILD' && jar.childId !== userId) {
      return res.status(403).json({ error: 'Acesso negado: Esta caixinha não pertence a você.' });
    }
    if (role === 'PARENT') {
      const childUser = await prisma.user.findUnique({ where: { id: jar.childId } });
      const familyAdminId = req.user?.parentId || req.user?.id;
      if (!childUser || childUser.parentId !== familyAdminId) {
        return res.status(403).json({ error: 'Acesso negado: Criança não pertence ao seu grupo familiar.' });
      }
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: jar.childId } });
    if (!wallet) {
      return res.status(404).json({ error: 'Carteira do usuário não encontrada.' });
    }

    // Refund balances
    if (jar.currentCoins > 0) {
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balanceCoins: wallet.balanceCoins + jar.currentCoins,
          totalSpentCoins: Math.max(0, wallet.totalSpentCoins - jar.currentCoins),
        },
      });
    }

    const currentRealVal = parseFloat(jar.currentReal.toString());
    if (currentRealVal > 0) {
      await prisma.wallet.update({
        where: { id: wallet.id },
        data: {
          balanceReal: wallet.balanceReal.toNumber() + currentRealVal,
          totalSpentReal: Math.max(0, wallet.totalSpentReal.toNumber() - currentRealVal),
        },
      });
    }

    await prisma.jar.delete({ where: { id } });

    return res.json({ message: 'Caixinha excluída com sucesso e economias estornadas para a carteira!' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
