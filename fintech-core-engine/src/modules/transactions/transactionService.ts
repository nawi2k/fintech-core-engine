import { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '../../middleware/errorMiddleware';

const prisma = new PrismaClient();

export class TransactionService {
  public static async deposit(walletId: string, amount: number, description?: string) {
    if (amount <= 0) {
      throw new AppError('El monto del depósito debe ser mayor a cero.', 400);
    }

    const safeAmount = Number(amount.toFixed(2));

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const wallet = await tx.wallet.findUnique({ where: { id: walletId } });

      if (!wallet) {
        throw new AppError('La billetera de destino no existe.', 404);
      }

      if (!wallet.isActive) {
        throw new AppError('La billetera se encuentra inactiva.', 400);
      }

      const updatedWallet = await tx.wallet.update({
        where: { id: walletId },
        data: {
          balance: {
            increment: safeAmount,
          },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          receiverWalletId: walletId,
          amount: safeAmount,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          description: description || 'Depósito en cuenta',
        },
      });

      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          transactionId: transaction.id,
          walletId,
          entryType: 'CREDIT',
          amount: safeAmount,
        },
      });

      return { wallet: updatedWallet, transaction, ledgerEntry };
    });
  }

  public static async transfer(
    senderWalletId: string,
    receiverWalletId: string,
    amount: number,
    description?: string,
    idempotencyKey?: string
  ) {
    if (senderWalletId === receiverWalletId) {
      throw new AppError('No podés transferir dinero a la misma billetera.', 400);
    }

    if (amount <= 0) {
      throw new AppError('El monto de la transferencia debe ser mayor a cero.', 400);
    }

    if (idempotencyKey) {
      const existingTx = await prisma.transaction.findUnique({
        where: { idempotencyKey },
        include: { ledgerEntries: true },
      });

      if (existingTx) {
        return {
          transaction: existingTx,
          ledgerEntries: existingTx.ledgerEntries,
          idempotentReplay: true,
        };
      }
    }

    const safeAmount = Number(amount.toFixed(2));

    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const senderWallet = await tx.wallet.findUnique({ where: { id: senderWalletId } });
      const receiverWallet = await tx.wallet.findUnique({ where: { id: receiverWalletId } });

      if (!senderWallet || !receiverWallet) {
        throw new AppError('Una de las billeteras involucradas no existe.', 404);
      }

      if (!senderWallet.isActive || !receiverWallet.isActive) {
        throw new AppError('Una de las billeteras se encuentra inactiva.', 400);
      }

      if (Number(senderWallet.balance) < safeAmount) {
        throw new AppError(
          `Saldo insuficiente. Disponible: ${senderWallet.balance.toString()} ${senderWallet.currency}`,
          400
        );
      }

      const updatedSender = await tx.wallet.update({
        where: { id: senderWalletId },
        data: {
          balance: {
            decrement: safeAmount,
          },
        },
      });

      const updatedReceiver = await tx.wallet.update({
        where: { id: receiverWalletId },
        data: {
          balance: {
            increment: safeAmount,
          },
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          idempotencyKey: idempotencyKey || null,
          senderWalletId,
          receiverWalletId,
          amount: safeAmount,
          type: 'TRANSFER',
          status: 'COMPLETED',
          description: description || 'Transferencia entre billeteras',
        },
      });

      const debitEntry = await tx.ledgerEntry.create({
        data: {
          transactionId: transaction.id,
          walletId: senderWalletId,
          entryType: 'DEBIT',
          amount: safeAmount,
        },
      });

      const creditEntry = await tx.ledgerEntry.create({
        data: {
          transactionId: transaction.id,
          walletId: receiverWalletId,
          entryType: 'CREDIT',
          amount: safeAmount,
        },
      });

      return {
        transaction,
        ledgerEntries: [debitEntry, creditEntry],
        senderBalance: updatedSender.balance,
        receiverBalance: updatedReceiver.balance,
        idempotentReplay: false,
      };
    });
  }
}