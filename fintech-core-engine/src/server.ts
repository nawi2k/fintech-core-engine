import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/authRoutes';
import transactionRoutes from './modules/transactions/transactionRoutes';
import walletRoutes from './modules/wallets/walletRoutes';
import { errorMiddleware } from './middleware/errorMiddleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rutas de módulos
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/wallets', walletRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'Fintech Core Engine',
    timestamp: new Date(),
  });
});

// Ruta no encontrada (404)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    statusCode: 404,
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// Middleware centralizado de manejo de errores
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`🚀 [FINTECH CORE] Servidor corriendo exitosamente en el puerto ${PORT}`);
});