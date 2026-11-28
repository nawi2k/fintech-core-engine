import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { TransactionService } from './transactionService';

const mockWalletFindUnique = jest.fn<(...args: any[]) => Promise<any>>();
const mockWalletUpdate = jest.fn<(...args: any[]) => Promise<any>>();
const mockTransactionCreate = jest.fn<(...args: any[]) => Promise<any>>();
const mockTransactionFindUnique = jest.fn<(...args: any[]) => Promise<any>>();
const mockLedgerEntryCreate = jest.fn<(...args: any[]) => Promise<any>>();
const mockPrismaTransaction = jest.fn<(...args: any[]) => Promise<any>>();

jest.mock('@prisma/client', () => ({
  Prisma: {},
  PrismaClient: jest.fn(() => ({
    $transaction: (...args: any[]) => mockPrismaTransaction(...args),
    wallet: {
      findUnique: (...args: any[]) => mockWalletFindUnique(...args),
      update: (...args: any[]) => mockWalletUpdate(...args),
    },
    transaction: {
      create: (...args: any[]) => mockTransactionCreate(...args),
      findUnique: (...args: any[]) => mockTransactionFindUnique(...args),
    },
    ledgerEntry: {
      create: (...args: any[]) => mockLedgerEntryCreate(...args),
    },
  })),
}));

describe('TransactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockPrismaTransaction.mockImplementation(async (callback: (tx: any) => Promise<any>) => {
      const txClient = {
        wallet: {
          findUnique: mockWalletFindUnique,
          update: mockWalletUpdate,
        },
        transaction: {
          create: mockTransactionCreate,
          findUnique: mockTransactionFindUnique,
        },
        ledgerEntry: {
          create: mockLedgerEntryCreate,
        },
      };
      return callback(txClient);
    });
  });

  describe('deposit', () => {
    it('debería acreditar saldo, crear la transacción y registrar el asiento CREDIT', async () => {
      const walletId = '11111111-1111-4111-8111-111111111111';
      const amount = 500;

      mockWalletFindUnique.mockResolvedValue({
        id: walletId,
        userId: 'user-1',
        balance: 1000,
        currency: 'ARS',
        isActive: true,
      });

      mockWalletUpdate.mockResolvedValue({
        id: walletId,
        userId: 'user-1',
        balance: 1500,
        currency: 'ARS',
        isActive: true,
      });

      const createdTx = {
        id: 'tx-deposit-1',
        type: 'DEPOSIT',
        amount,
        status: 'COMPLETED',
        receiverWalletId: walletId,
      };
      mockTransactionCreate.mockResolvedValue(createdTx);
      mockLedgerEntryCreate.mockResolvedValue({
        id: 'ledger-1',
        transactionId: createdTx.id,
        walletId,
        entryType: 'CREDIT',
        amount,
      });

      const result = await TransactionService.deposit(walletId, amount, 'Carga inicial');

      expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
      expect(mockWalletUpdate).toHaveBeenCalledTimes(1);
      expect(mockTransactionCreate).toHaveBeenCalledTimes(1);
      expect(mockLedgerEntryCreate).toHaveBeenCalledTimes(1);
      expect(result.ledgerEntry.entryType).toBe('CREDIT');
    });
  });

  describe('transfer', () => {
    it('debería transferir saldo de forma atómica y generar asientos DEBIT y CREDIT', async () => {
      const senderWalletId = '11111111-1111-4111-8111-111111111111';
      const receiverWalletId = '22222222-2222-4222-8222-222222222222';
      const amount = 250;

      mockTransactionFindUnique.mockResolvedValue(null);

      mockWalletFindUnique
        .mockResolvedValueOnce({
          id: senderWalletId,
          userId: 'user-sender',
          balance: 1000,
          currency: 'ARS',
          isActive: true,
        })
        .mockResolvedValueOnce({
          id: receiverWalletId,
          userId: 'user-receiver',
          balance: 300,
          currency: 'ARS',
          isActive: true,
        });

      mockWalletUpdate
        .mockResolvedValueOnce({
          id: senderWalletId,
          balance: 750,
        })
        .mockResolvedValueOnce({
          id: receiverWalletId,
          balance: 550,
        });

      mockTransactionCreate.mockResolvedValue({
        id: 'tx-transfer-1',
        type: 'TRANSFER',
        amount,
        status: 'COMPLETED',
        senderWalletId,
        receiverWalletId,
      });

      mockLedgerEntryCreate
        .mockResolvedValueOnce({ id: 'ledger-debit', entryType: 'DEBIT', amount })
        .mockResolvedValueOnce({ id: 'ledger-credit', entryType: 'CREDIT', amount });

      const result = await TransactionService.transfer(
        senderWalletId,
        receiverWalletId,
        amount,
        'Pago transferencia',
        'idem-key-123456'
      );

      expect(mockPrismaTransaction).toHaveBeenCalledTimes(1);
      expect(mockWalletUpdate).toHaveBeenCalledTimes(2);
      expect(mockTransactionCreate).toHaveBeenCalledTimes(1);
      expect(mockLedgerEntryCreate).toHaveBeenCalledTimes(2);
      expect(result.idempotentReplay).toBe(false);
    });

    it('debería rechazar una transferencia si la billetera origen no tiene saldo suficiente', async () => {
      const senderWalletId = '11111111-1111-4111-8111-111111111111';
      const receiverWalletId = '22222222-2222-4222-8222-222222222222';

      mockTransactionFindUnique.mockResolvedValue(null);

      mockWalletFindUnique
        .mockResolvedValueOnce({
          id: senderWalletId,
          userId: 'user-sender',
          balance: 100,
          currency: 'ARS',
          isActive: true,
        })
        .mockResolvedValueOnce({
          id: receiverWalletId,
          userId: 'user-receiver',
          balance: 300,
          currency: 'ARS',
          isActive: true,
        });

      await expect(
        TransactionService.transfer(
          senderWalletId,
          receiverWalletId,
          500,
          'Saldo insuficiente'
        )
      ).rejects.toThrow('Saldo insuficiente');

      expect(mockWalletUpdate).not.toHaveBeenCalled();
      expect(mockTransactionCreate).not.toHaveBeenCalled();
    });
  });
});