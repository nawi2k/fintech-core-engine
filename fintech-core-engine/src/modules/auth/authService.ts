import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_super_segura_fintech';

export class AuthService {
  
  // Registro de nuevo usuario + Creación automática de su billetera (Wallet)
  public static async register(email: string, pass: string, fullName: string) {
    // 1. Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('El correo electrónico ya se encuentra registrado.');
    }

    // 2. Hashear la contraseña de forma segura (con salt rounds = 10)
    const hashedPassword = await bcrypt.hash(pass, 10);

    // 3. Transacción atómica: Crear usuario y su billetera por defecto con saldo 0.00
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        wallet: {
          create: {
            balance: 0.00,
            currency: 'ARS',
          }
        }
      },
      include: {
        wallet: true // Traemos la billetera creada en la misma respuesta
      }
    });

    // Ocultar la contraseña antes de retornar el objeto
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  // Inicio de sesión (Login)
  public static async login(email: string, pass: string) {
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { wallet: true }
    });

    if (!user) {
      throw new Error('Credenciales inválidas.');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(pass, user.password);
    if (!isPasswordValid) {
      throw new Error('Credenciales inválidas.');
    }

    // Generar Token JWT de acceso (expira en 24 horas)
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const { password, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }
}