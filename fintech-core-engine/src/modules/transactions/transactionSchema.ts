import { z } from 'zod';

export const depositSchema = z.object({
  walletId: z.string().uuid('walletId debe ser un UUID válido.'),
  amount: z.coerce.number().positive('El monto debe ser mayor a cero.'),
  description: z.string().max(255).optional(),
});

export const transferSchema = z.object({
  senderWalletId: z.string().uuid('senderWalletId debe ser un UUID válido.'),
  receiverWalletId: z.string().uuid('receiverWalletId debe ser un UUID válido.'),
  amount: z.coerce.number().positive('El monto debe ser mayor a cero.'),
  description: z.string().max(255).optional(),
  idempotencyKey: z.string().min(8).max(128).optional(),
});