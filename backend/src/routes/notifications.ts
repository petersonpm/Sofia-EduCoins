import { Router, Response } from 'express';
import prisma from '../utils/db';
import { authenticateToken } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();

/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: Lista as notificações do usuário atual
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit to 20 recent
    });

    return res.json(notifications);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/notifications/read:
 *   put:
 *     summary: Marca todas as notificações do usuário como lidas
 *     tags: [Notificações]
 *     security:
 *       - bearerAuth: []
 */
router.put('/read', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });

    return res.json({ message: 'Todas as notificações foram marcadas como lidas.' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
