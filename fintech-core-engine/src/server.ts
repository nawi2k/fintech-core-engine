import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import authRoutes from './modules/auth/authRoutes';
import transactionRoutes from './modules/transactions/transactionRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Rutas de módulos
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'Fintech Core Engine',
    timestamp: new Date(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 [FINTECH CORE] Servidor corriendo exitosamente en el puerto ${PORT}`);
});