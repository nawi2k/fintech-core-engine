import { Request, Response } from 'express';
import { TransactionService } from './transactionService';

export class TransactionController {
  public static async deposit(req: Request, res: Response): Promise<void> {
    try {
      const { walletId, amount, description } = req.body;

      if (!walletId || amount === undefined) {
        res.status(400).json({ error: 'Se requieren walletId y amount.' });
        return;
      }

      const result = await TransactionService.deposit(walletId, Number(amount), description);
      res.status(201).json({
        message: 'Depósito realizado con éxito.',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al procesar el depósito.' });
    }
  }

  public static async transfer(req: Request, res: Response): Promise<void> {
    try {
      const { senderWalletId, receiverWalletId, amount, description } = req.body;

      if (!senderWalletId || !receiverWalletId || amount === undefined) {
        res.status(400).json({
          error: 'Se requieren senderWalletId, receiverWalletId y amount.',
        });
        return;
      }

      const result = await TransactionService.transfer(
        senderWalletId,
        receiverWalletId,
        Number(amount),
        description
      );

      res.status(201).json({
        message: 'Transferencia completada con éxito.',
        data: result,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al procesar la transferencia.' });
    }
  }
}