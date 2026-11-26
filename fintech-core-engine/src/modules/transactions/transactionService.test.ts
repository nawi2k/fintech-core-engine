import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { TransactionService } from './transactionService';

const mockWalletFindUnique = jest.fn<(...args: any[]) => Promise<any>>();
const mockWalletUpdate = jest.fn<(...args: any[]) => Promise<any>>();
const mockTransactionCreate = jest.fn<(...args: any[]) => Promise<any>>();
const mockLedgerEntryCreate = jest.fn<(...args: any[]) => Promise<any>>();
const mockTransactionFindUnique = jest.fn<(...args: any[]) => Promise<any>>();

const mockTx = {
  wallet: {
    findUnique: mockWalletFindUnique,
    update: mockWalletUpdate,
  },
  transaction: {
    create: mockTransactionCreate,
  },
  ledgerEntry: {
    create: mockLedgerEntryCreate,
  },
};

const mockPrismaTransaction = jest.fn<
  (cb: (tx: typeof mockTx) => Promise<any>) => Promise<any>
>(async (cb) => cb(mockTx));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    $transaction: mockPrismaTransaction,
    transaction: {
      findUnique: mockTransactionFindUnique,
    },
  })),
  Prisma: {
    TransactionClient: class {},
  },
}));

describe('TransactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('rechaza un depósito con monto cero o negativo', async () => {
    await expect(TransactionService.deposit('wallet-1', 0)).rejects.toThrow(
      'El monto del depósito debe ser mayor a cero.'
    );
    await expect(TransactionService.deposit('wallet-1', -500)).rejects.toThrow(
      'El monto del depósito debe ser mayor a cero.'
    );
  });

  test('rechaza transferir a la misma billetera', async () => {
    await expect(
      TransactionService.transfer('wallet-1', 'wallet-1', 1000)
    ).rejects.toThrow('No podés transferir dinero a la misma billetera.');
  });

  test('rechaza transferencia si el saldo es insuficiente', async () => {
    mockTransactionFindUnique.mockResolvedValue(null);
    mockWalletFindUnique
      .mockResolvedValueOnce({ id: 'w-sender', balance: 200, currency: 'ARS', isActive: true })
      .mockResolvedValueOnce({ id: 'w-receiver', balance: 500, currency: 'ARS', isActive: true });

    await expect(
      TransactionService.transfer('w-sender', 'w-receiver', 1000, 'Pago')
    ).rejects.toThrow('Saldo insuficiente.');
  });

  test('devuelve respuesta idempotente si ya existe la idempotencyKey', async () => {
    const existingTx = {
      id: 'tx-123',
      idempotencyKey: 'key-abc-123',
      amount: 2500,
      ledgerEntries: [{ id: 'le-1', entryType: 'DEBIT', amount: 2500 }],
    };
    mockTransactionFindUnique.mockResolvedValue(existingTx);

    const result: any = await TransactionService.transfer(
      'w-sender',
      'w-receiver',
      2500,
      'Reintento',
      'key-abc-123'
    );

    expect(result.idempotentReplay).toBe(true);
    expect(result.transaction.id).toBe('tx-123');
    expect(mockPrismaTransaction).not.toHaveBeenCalled();
  });
});