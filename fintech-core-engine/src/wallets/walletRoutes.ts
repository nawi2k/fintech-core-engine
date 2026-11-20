import { Router } from 'express';
import { WalletController } from './walletController';

const router = Router();

router.get('/:id', WalletController.getById);
router.patch('/:id/status', WalletController.updateStatus);

export default router;