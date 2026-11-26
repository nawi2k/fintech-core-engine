import { Router } from 'express';
import { TransactionController } from './transactionController';
import { authMiddleware } from '../../middleware/authMiddleware';
import { validateBody } from '../../middleware/validateMiddleware';
import { depositSchema, transferSchema } from './transactionSchema';

const router = Router();

router.use(authMiddleware);

router.post('/deposit', validateBody(depositSchema), TransactionController.deposit);
router.post('/transfer', validateBody(transferSchema), TransactionController.transfer);

export default router;