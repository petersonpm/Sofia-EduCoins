import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/db';
import { authenticateToken, requireParent } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sofia_super_secret_key_123!';

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Registra um novo pai/responsável
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pai cadastrado com sucesso
 *       400:
 *         description: E-mail já cadastrado
 */
router.post('/register', async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'PARENT',
      },
    });

    // Initialize Parent Wallet (just in case, default empty)
    await prisma.wallet.create({
      data: {
        userId: user.id,
        balanceCoins: 0,
        balanceReal: 0.0,
      },
    });

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/register-child:
 *   post:
 *     summary: Registra um filho (Apenas pais)
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Filho cadastrado com sucesso
 *       403:
 *         description: Não autorizado
 */
router.post('/register-child', authenticateToken, requireParent, async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password } = req.body;
  const parentId = req.user?.parentId || req.user?.id;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Este e-mail de login para criança já existe.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const child = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CHILD',
        parentId,
        avatarConfig: JSON.stringify({
          hair: 'default',
          clothes: 'default',
          accessory: 'none',
          mascot: 'none'
        }),
      },
    });

    // Initialize Child Wallet
    await prisma.wallet.create({
      data: {
        userId: child.id,
        balanceCoins: 0,
        balanceReal: 0.0,
      },
    });

    return res.status(201).json({
      message: 'Filho cadastrado com sucesso!',
      child: {
        id: child.id,
        name: child.name,
        email: child.email,
        role: child.role,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/register-co-parent:
 *   post:
 *     summary: Registra outro responsável/co-pai (Apenas Responsáveis)
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 */
router.post('/register-co-parent', authenticateToken, requireParent, async (req: AuthenticatedRequest, res: Response) => {
  const { name, email, password } = req.body;
  const mainParentId = req.user?.parentId || req.user?.id;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Este e-mail de login já está em uso.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const coParent = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'PARENT',
        parentId: mainParentId,
      },
    });

    // Initialize Co-Parent Wallet
    await prisma.wallet.create({
      data: {
        userId: coParent.id,
        balanceCoins: 0,
        balanceReal: 0.0,
      },
    });

    return res.status(201).json({
      message: 'Responsável cadastrado com sucesso!',
      coParent: {
        id: coParent.id,
        name: coParent.name,
        email: coParent.email,
        role: coParent.role,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login unificado (Pais e Crianças)
 *     tags: [Autenticação]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Autenticado com sucesso
 *       401:
 *         description: Credenciais inválidas
 */
router.post('/login', async (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        wallet: true,
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, parentId: user.parentId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        parentId: user.parentId,
        xp: user.xp,
        level: user.level,
        streak: user.streak,
        avatarConfig: user.avatarConfig,
        wallet: user.wallet,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Retorna informações do usuário atual baseado no JWT
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do usuário
 */
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallet: true,
        children: {
          include: {
            wallet: true,
          },
        },
        achievements: {
          include: {
            achievement: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Don't send passwords back
    const { password, ...userWithoutPassword } = user;

    // If co-parent, manually populate children from main parent
    if (user.role === 'PARENT' && user.parentId) {
      const familyChildren = await prisma.user.findMany({
        where: { parentId: user.parentId, role: 'CHILD' },
        include: {
          wallet: true,
        },
      });
      (userWithoutPassword as any).children = familyChildren;
    }

    return res.status(200).json(userWithoutPassword);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/child/{id}:
 *   put:
 *     summary: Atualiza os dados de uma criança (Apenas Responsáveis)
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 */
router.put('/child/:id', authenticateToken, requireParent, async (req: AuthenticatedRequest, res: Response) => {
  const childId = req.params.id;
  const parentId = req.user?.parentId || req.user?.id;
  const { name, email, password } = req.body;

  try {
    // Verify that the child exists and belongs to this parent
    const child = await prisma.user.findFirst({
      where: { id: childId, parentId, role: 'CHILD' }
    });

    if (!child) {
      return res.status(404).json({ error: 'Criança não encontrada ou não pertence a esta família.' });
    }

    // If email is changing, check if it's already taken
    if (email && email !== child.email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Este e-mail de login já está em uso.' });
      }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedChild = await prisma.user.update({
      where: { id: childId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        xp: true,
        level: true,
        avatarConfig: true
      }
    });

    return res.status(200).json({
      message: 'Dados da criança atualizados com sucesso!',
      child: updatedChild
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

/**
 * @openapi
 * /api/auth/child/{id}:
 *   delete:
 *     summary: Exclui a conta de uma criança (Apenas Responsáveis)
 *     tags: [Autenticação]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/child/:id', authenticateToken, requireParent, async (req: AuthenticatedRequest, res: Response) => {
  const childId = req.params.id;
  const parentId = req.user?.parentId || req.user?.id;

  try {
    // Verify that the child exists and belongs to this parent
    const child = await prisma.user.findFirst({
      where: { id: childId, parentId, role: 'CHILD' }
    });

    if (!child) {
      return res.status(404).json({ error: 'Criança não encontrada ou não pertence a esta família.' });
    }

    // 1. Manually delete tasks assigned to the child (avoid FK block)
    await prisma.task.deleteMany({
      where: {
        OR: [
          { assignedToId: childId },
          { createdById: childId }
        ]
      }
    });

    // 2. Delete child user (Prisma cascade onDelete deletes wallet, goals, expenses, achievements, notifications)
    await prisma.user.delete({
      where: { id: childId }
    });

    return res.status(200).json({
      message: 'Conta da criança excluída com sucesso!'
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
