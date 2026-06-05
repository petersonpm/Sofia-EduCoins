import { Router, Response } from 'express';
import prisma from '../utils/db';
import { authenticateToken, requireChild } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * @openapi
 * /api/shop:
 *   get:
 *     summary: Lista todos os itens disponíveis na loja de avatares
 *     tags: [Loja]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const items = await prisma.avatarShopItem.findMany();
    return res.json(items);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/shop/purchase/{itemId}:
 *   post:
 *     summary: Criança compra um item da loja com EduCoins (Apenas Crianças)
 *     tags: [Loja]
 *     security:
 *       - bearerAuth: []
 */
router.post('/purchase/:itemId', authenticateToken, requireChild, async (req: AuthenticatedRequest, res: Response) => {
  const { itemId } = req.params;
  const childId = req.user?.id;

  try {
    const item = await prisma.avatarShopItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado na loja.' });
    }

    const child = await prisma.user.findUnique({ where: { id: childId } });
    if (!child) {
      return res.status(404).json({ error: 'Perfil de usuário não encontrado.' });
    }

    // Parse child avatar config
    let config = {
      equipped: { hair: 'default', clothes: 'default', accessory: 'none', mascot: 'none' },
      inventory: { hair: ['default'], clothes: ['default'], accessory: ['none'], mascot: ['none'] }
    };

    try {
      if (child.avatarConfig && child.avatarConfig !== '{}') {
        const parsed = JSON.parse(child.avatarConfig);
        if (parsed.equipped && parsed.inventory) {
          config = parsed;
        }
      }
    } catch (e) {
      console.warn('Erro ao decodificar config do avatar, usando padrão.');
    }

    const categoryKey = item.category.toLowerCase() as 'hair' | 'clothes' | 'accessory' | 'mascot';
    
    // Check if child already owns this item
    if (config.inventory[categoryKey] && config.inventory[categoryKey].includes(item.assetKey)) {
      return res.status(400).json({ error: 'Você já comprou este item!' });
    }

    // Check balance
    const wallet = await prisma.wallet.findUnique({ where: { userId: childId } });
    if (!wallet || wallet.balanceCoins < item.price) {
      return res.status(400).json({ error: `Você não tem EduCoins suficientes. Este item custa ${item.price} Moedas.` });
    }

    // Deduct coins from wallet
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        balanceCoins: wallet.balanceCoins - item.price,
        totalSpentCoins: wallet.totalSpentCoins + item.price,
      },
    });

    // Add item to child inventory
    if (!config.inventory[categoryKey]) {
      config.inventory[categoryKey] = ['default'];
    }
    config.inventory[categoryKey].push(item.assetKey);

    // Save updated avatar config
    const updatedUser = await prisma.user.update({
      where: { id: childId },
      data: {
        avatarConfig: JSON.stringify(config),
      },
      select: {
        id: true,
        name: true,
        avatarConfig: true,
      },
    });

    return res.json({
      message: `Você comprou "${item.name}" com sucesso!`,
      avatarConfig: updatedUser.avatarConfig,
      balanceCoins: wallet.balanceCoins - item.price,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/shop/equip:
 *   post:
 *     summary: Equipa um item de avatar comprado (Apenas Crianças)
 *     tags: [Loja]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - category
 *               - assetKey
 *             properties:
 *               category:
 *                 type: string
 *               assetKey:
 *                 type: string
 */
router.post('/equip', authenticateToken, requireChild, async (req: AuthenticatedRequest, res: Response) => {
  const { category, assetKey } = req.body;
  const childId = req.user?.id;

  if (!category || !assetKey) {
    return res.status(400).json({ error: 'Categoria e assetKey são obrigatórios.' });
  }

  const categoryKey = category.toLowerCase() as 'hair' | 'clothes' | 'accessory' | 'mascot';

  try {
    const child = await prisma.user.findUnique({ where: { id: childId } });
    if (!child) {
      return res.status(404).json({ error: 'Perfil de usuário não encontrado.' });
    }

    let config = {
      equipped: { hair: 'default', clothes: 'default', accessory: 'none', mascot: 'none' },
      inventory: { hair: ['default'], clothes: ['default'], accessory: ['none'], mascot: ['none'] }
    };

    if (child.avatarConfig) {
      config = JSON.parse(child.avatarConfig);
    }

    // Verify if child owns the item in inventory
    const ownsItem = config.inventory[categoryKey] && config.inventory[categoryKey].includes(assetKey);
    const isDefault = assetKey === 'default' || assetKey === 'none';

    if (!ownsItem && !isDefault) {
      return res.status(400).json({ error: 'Você precisa comprar este item antes de equipar.' });
    }

    // Equip item
    config.equipped[categoryKey] = assetKey;

    const updatedUser = await prisma.user.update({
      where: { id: childId },
      data: {
        avatarConfig: JSON.stringify(config),
      },
      select: {
        id: true,
        name: true,
        avatarConfig: true,
      },
    });

    return res.json({
      message: 'Avatar atualizado com sucesso!',
      avatarConfig: updatedUser.avatarConfig,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
