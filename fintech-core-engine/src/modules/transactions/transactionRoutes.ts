import { Router } from 'express';
import { TransactionController } from './transactionController';

const router = Router();

router.post('/deposit', TransactionController.deposit);
router.post('/transfer', TransactionController.transfer);

export default router;