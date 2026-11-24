import { Response } from 'express';
import { TransactionService } from './transactionService';
import { WalletService } from '../wallets/walletService';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

export class TransactionController {
  public static async deposit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { walletId, amount, description } = req.body;

      if (!walletId || amount === undefined) {
        res.status(400).json({ error: 'Se requieren walletId y amount.' });
        return;
      }

      const wallet = await WalletService.getWalletById(walletId);
      if (req.user?.role !== 'ADMIN' && wallet.userId !== req.user?.userId) {
        res.status(403).json({ error: 'No tenés permiso para operar sobre esta billetera.' });
        return;
      }

      const result = await TransactionService.deposit(walletId, Number(amount), description);
      res.status(201).json({
        message: 'Depósito realizado con éxito.',
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        error: error.message || 'Error al procesar el depósito.',
      });
    }
  }

  public static async transfer(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { senderWalletId, receiverWalletId, amount, description, idempotencyKey } = req.body;
      const headerKey = req.header('Idempotency-Key') || idempotencyKey;

      if (!senderWalletId || !receiverWalletId || amount === undefined) {
        res.status(400).json({
          error: 'Se requieren senderWalletId, receiverWalletId y amount.',
        });
        return;
      }

      const senderWallet = await WalletService.getWalletById(senderWalletId);
      if (req.user?.role !== 'ADMIN' && senderWallet.userId !== req.user?.userId) {
        res.status(403).json({
          error: 'No tenés permiso para enviar fondos desde la billetera de origen.',
        });
        return;
      }

      const result = await TransactionService.transfer(
        senderWalletId,
        receiverWalletId,
        Number(amount),
        description,
        headerKey
      );

      res.status(result.idempotentReplay ? 200 : 201).json({
        message: result.idempotentReplay
          ? 'Transacción ya procesada previamente (respuesta idempotente).'
          : 'Transferencia completada con éxito.',
        data: result,
      });
    } catch (error: any) {
      res.status(error.statusCode || 400).json({
        error: error.message || 'Error al procesar la transferencia.',
      });
    }
  }
}