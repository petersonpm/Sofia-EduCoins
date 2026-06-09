import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth';
import taskRoutes from './routes/tasks';
import walletRoutes from './routes/wallet';
import goalRoutes from './routes/goals';
import expenseRoutes from './routes/expenses';
import shopRoutes from './routes/shop';
import notificationRoutes from './routes/notifications';
import jarRoutes from './routes/jars';

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
}));
app.use(express.json());

// Swagger Documentation Setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sofia EduCoins API',
      version: '1.0.0',
      description: 'API REST para a plataforma de tarefas e educação financeira Sofia EduCoins',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Servidor Local',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'], // support both ts (dev) and js (prod) files
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Base Route
app.get('/', (_req, res) => {
  res.json({
    message: 'Welcome to Sofia EduCoins API',
    docs: '/api-docs',
    version: '1.0.0',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/jars', jarRoutes);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor',
  });
});

export default app;
