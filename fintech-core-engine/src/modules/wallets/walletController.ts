import { Request, Response } from 'express';
import { WalletService } from './walletService';

export class WalletController {
  public static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const wallet = await WalletService.getWalletById(id);
      res.status(200).json({
        message: 'Billetera obtenida con éxito.',
        data: wallet,
      });
    } catch (error: any) {
      res.status(404).json({
        error: error.message || 'Error al obtener la billetera.',
      });
    }
  }

  public static async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { isActive } = req.body;

      if (typeof isActive !== 'boolean') {
        res.status(400).json({
          error: 'El campo isActive debe ser un booleano (true o false).',
        });
        return;
      }

      const updated = await WalletService.setActiveStatus(id, isActive);
      res.status(200).json({
        message: `Estado de la billetera actualizado a ${isActive ? 'ACTIVA' : 'INACTIVA'}.`,
        data: updated,
      });
    } catch (error: any) {
      res.status(400).json({
        error: error.message || 'Error al actualizar el estado de la billetera.',
      });
    }
  }
}
