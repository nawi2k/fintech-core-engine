# Fintech Core Engine

API REST modular para la gestión de billeteras virtuales y procesamiento de transacciones financieras atómicas, desarrollada con **Node.js**, **Express**, **TypeScript** y **Prisma ORM** sobre **PostgreSQL**.

## Características principales

- **Autenticación y Autorización (JWT):** Protección de rutas mediante middleware Bearer (`authMiddleware`) y validación estricta de titularidad de cuentas (un usuario solo puede operar sobre sus propias billeteras, salvo rol `ADMIN`).
- **Transacciones Atómicas (`prisma.$transaction`):** Ejecución todo-o-nada en depósitos y transferencias entre cuentas para evitar inconsistencias de saldo ante fallos parciales.
- **Libro Mayor de Doble Partida (`LedgerEntry`):** Cada operación genera asientos contables inmutables (`DEBIT` y `CREDIT`) vinculados a la transacción para trazabilidad y auditoría.
- **Idempotencia en Transferencias (`Idempotency-Key`):** Soporte para claves de idempotencia por cabecera HTTP o cuerpo de petición para evitar débitos duplicados ante reintentos de red.
- **Validación de Esquemas y Errores Centralizados:** Validación de entrada con **Zod** (`validateMiddleware`) y manejo uniforme de excepciones de dominio mediante `AppError` y `errorMiddleware`.
- **Testing Unitario:** Cobertura de reglas críticas de negocio con **Jest** y **ts-jest**.

## Estructura del proyecto

```text
fintech-core-engine/
├── prisma/
│   └── schema.prisma            # Modelos User, Wallet, Transaction y LedgerEntry
├── src/
│   ├── middleware/
│   │   ├── authMiddleware.ts    # Verificación de JWT y adjunción de req.user
│   │   ├── errorMiddleware.ts   # Clase AppError y manejador global HTTP
│   │   └── validateMiddleware.ts# Validación de payloads con Zod
│   ├── modules/
│   │   ├── auth/                # Registro, login y emisión de tokens
│   │   ├── transactions/        # Depósitos, transferencias, idempotencia y tests
│   │   └── wallets/             # Consulta y activación/desactivación de billeteras
│   └── server.ts                # Configuración de Express y montaje de rutas!
├── jest.config.js
├── package.json
└── tsconfig.json