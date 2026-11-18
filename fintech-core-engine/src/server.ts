import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

// Cargar variables de entorno del archivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON en las peticiones HTTP
app.use(express.json());

// Ruta de estado (Health Check) para verificar que el core está vivo
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ONLINE',
    service: 'Fintech Core Engine',
    timestamp: new Date(),
  });
});

// Arrancar el servidor
app.listen(PORT, () => {
  console.log(`🚀 [FINTECH CORE] Servidor corriendo exitosamente en el puerto ${PORT}`);
});