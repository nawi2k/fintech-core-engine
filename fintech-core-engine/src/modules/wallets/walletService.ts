import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class WalletService {
  public static async getWalletById(walletId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { id: walletId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        sentTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        receivedTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });

    if (!wallet) {
      throw new Error('La billetera solicitada no existe.');
    }

    return wallet;
  }

  public static async getWalletByUserId(userId: string) {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error('El usuario no tiene una billetera asociada.');
    }

    return wallet;
  }

  public static async setActiveStatus(walletId: string, isActive: boolean) {
    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });

    if (!wallet) {
      throw new Error('La billetera no existe.');
    }

    return await prisma.wallet.update({
      where: { id: walletId },
      data: { isActive },
    });
  }
}
