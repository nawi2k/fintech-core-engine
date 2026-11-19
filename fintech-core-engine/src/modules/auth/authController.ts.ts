import { Request, Response } from 'express';
import { AuthService } from './authService';

export class AuthController {
  public static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, fullName } = req.body;

      if (!email || !password || !fullName) {
        res.status(400).json({
          error: 'Datos incompletos: se requieren email, password y fullName.',
        });
        return;
      }

      const user = await AuthService.register(email, password, fullName);
      res.status(201).json({
        message: 'Usuario y billetera creados con éxito.',
        data: user,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Error al registrar el usuario.',
      });
    }
  }

  public static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          error: 'Credenciales incompletas: se requieren email y password.',
        });
        return;
      }

      const session = await AuthService.login(email, password);
      res.status(200).json({
        message: 'Inicio de sesión exitoso.',
        data: session,
      });
    } catch (error: any) {
      res.status(401).json({
        error: error.message || 'Error al iniciar sesión.',
      });
    }
  }
}