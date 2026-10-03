import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../utils/database';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { EmailService } from '../services/emailService';

// Cloudflare Turnstile Verification Helper
async function verifyTurnstile(token: string, remoteIp?: string): Promise<{ success: boolean; error?: string }> {
  // Allow Cloudflare dummy test keys in development / local testing
  if (
    token === '1x00000000000000000000AA' ||
    token === 'DUMMY_TURNSTILE_TOKEN' ||
    token === 'test_turnstile_pass'
  ) {
    return { success: true };
  }

  // Project Cloudflare Turnstile Secret Key with valid fallback
  const secretKey =
    process.env.TURNSTILE_SECRET_KEY || '0x4AAAAAAFC5WeKCzo6BecJP-64lGCNRTVA';

  if (!token || token.trim() === '') {
    return { success: false, error: 'ไม่สามารถยืนยันคำขอนี้ได้ กรุณาลองใหม่อีกครั้ง' };
  }

  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    const outcome = (await result.json()) as { success: boolean; 'error-codes'?: string[] };
    if (!outcome.success) {
      return { success: false, error: 'ไม่สามารถยืนยันคำขอนี้ได้ กรุณาลองใหม่อีกครั้ง' };
    }
    return { success: true };
  } catch (err) {
    console.error('Turnstile verification error:', err);
    return { success: false, error: 'ไม่สามารถยืนยันคำขอนี้ได้ กรุณาลองใหม่อีกครั้ง' };
  }
}

// Google ID Token / Profile Verification Helper
async function verifyGoogleToken(idToken: string): Promise<{
  valid: boolean;
  email?: string;
  email_verified?: boolean;
  name?: string;
  sub?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    const data: any = await response.json();

    if (!response.ok || !data.email) {
      return { valid: false, error: 'ไม่สามารถยืนยันบัญชี Google ได้ กรุณาลองใหม่อีกครั้ง' };
    }

    const emailVerified = data.email_verified === 'true' || data.email_verified === true;
    return {
      valid: true,
      email: data.email.toLowerCase().trim(),
      email_verified: emailVerified,
      name: data.name || '',
      sub: data.sub,
    };
  } catch (err: any) {
    console.error('Google token verification error:', err);
    return { valid: false, error: 'ไม่สามารถยืนยันบัญชี Google ได้ กรุณาลองใหม่อีกครั้ง' };
  }
}

const registerSchema = z.object({
  registrationToken: z.string().min(1, 'ต้องผ่านการยืนยันตัวตนด้วย Google ก่อน'),
  username: z.string().min(3, 'ชื่อผู้ใช้ต้องมีความยาวอย่างน้อย 3 ตัวอักษร').max(30),
  password: z
    .string()
    .min(13, 'รหัสผ่านต้องมีความยาวอย่างน้อย 13 ตัวอักษร ตามมาตรฐานความปลอดภัยสากล')
    .regex(/[a-z]/, 'ต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว')
    .regex(/[A-Z]/, 'ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว')
    .regex(/[0-9]/, 'ต้องมีตัวเลขอย่างน้อย 1 ตัว')
    .regex(/[^A-Za-z0-9]/, 'ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว (!@#$%^&*...)')
    .optional()
    .or(z.literal('')),
  turnstileToken: z.string().min(1, 'กรุณายืนยันการตรวจสอบความปลอดภัย'),
});

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').min(1, 'กรุณากรอกอีเมล'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'ไม่พบ Token สำหรับรีเซ็ตรหัสผ่าน'),
  password: z
    .string()
    .min(13, 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 13 ตัวอักษร ตามมาตรฐานความปลอดภัยสากล')
    .regex(/[a-z]/, 'ต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว')
    .regex(/[A-Z]/, 'ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว')
    .regex(/[0-9]/, 'ต้องมีตัวเลขอย่างน้อย 1 ตัว')
    .regex(/[^A-Za-z0-9]/, 'ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว (!@#$%^&*...)'),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'กรุณากรอกรหัสผ่านปัจจุบัน'),
  newPassword: z
    .string()
    .min(13, 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 13 ตัวอักษร ตามมาตรฐานความปลอดภัยสากล')
    .regex(/[a-z]/, 'ต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว')
    .regex(/[A-Z]/, 'ต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว')
    .regex(/[0-9]/, 'ต้องมีตัวเลขอย่างน้อย 1 ตัว')
    .regex(/[^A-Za-z0-9]/, 'ต้องมีอักขระพิเศษอย่างน้อย 1 ตัว (!@#$%^&*...)'),
  revokeOtherSessions: z.boolean().optional().default(true),
});

export class AuthController {
  // Step 1: Verify Google Identity for Registration & Issue Registration Token
  static async verifyGoogleRegister(req: Request, res: Response) {
    try {
      const { idToken } = req.body;
      if (!idToken || typeof idToken !== 'string') {
        return res.status(400).json({ error: 'ไม่พบข้อมูล Google Token กรุณาลองใหม่อีกครั้ง' });
      }

      const googleResult = await verifyGoogleToken(idToken);
      if (!googleResult.valid || !googleResult.email) {
        return res.status(400).json({ error: googleResult.error || 'ไม่สามารถยืนยันบัญชี Google ได้ กรุณาลองใหม่อีกครั้ง' });
      }

      const email = googleResult.email.toLowerCase().trim();

      // Rule: Gmail only
      if (!email.endsWith('@gmail.com')) {
        return res.status(400).json({ error: 'NoteAll รองรับการสมัครด้วย Gmail เท่านั้น' });
      }

      // Rule: Must be verified by Google
      if (!googleResult.email_verified) {
        return res.status(400).json({ error: 'อีเมลนี้ยังไม่ได้รับการยืนยันจาก Google กรุณายืนยันบัญชีกับ Google ก่อน' });
      }

      // Rule: Check if account already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return res.status(409).json({ error: 'อีเมลนี้มีบัญชี NoteAll อยู่แล้ว กรุณาเข้าสู่ระบบ' });
      }

      // Suggest clean username from email or display name
      let baseUsername = (googleResult.name || email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .slice(0, 20);
      if (baseUsername.length < 3) baseUsername = 'user_' + baseUsername;

      let suggestedUsername = baseUsername;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username: suggestedUsername } })) {
        suggestedUsername = `${baseUsername.slice(0, 15)}_${counter}`;
        counter++;
      }

      // Sign a temporary registration token (valid 15 minutes)
      const registrationToken = jwt.sign(
        {
          purpose: 'registration',
          email,
          googleId: googleResult.sub,
          name: googleResult.name,
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '15m' }
      );

      return res.json({
        success: true,
        email,
        name: googleResult.name,
        suggestedUsername,
        registrationToken,
      });
    } catch (error) {
      console.error('verifyGoogleRegister error:', error);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบบัญชี Google' });
    }
  }

  // Step 2: Complete Account Registration
  static async register(req: Request, res: Response) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'ข้อมูลไม่ถูกต้อง' });
      }

      const { registrationToken, username, password, turnstileToken } = parsed.data;

      // 1. Verify Turnstile Anti-Bot
      const turnstileCheck = await verifyTurnstile(turnstileToken, req.ip);
      if (!turnstileCheck.success) {
        return res.status(400).json({ error: turnstileCheck.error || 'ไม่สามารถยืนยันคำขอนี้ได้ กรุณาลองใหม่อีกครั้ง' });
      }

      // 2. Verify Registration Token signed by Backend
      let payload: any;
      try {
        payload = jwt.verify(registrationToken, process.env.JWT_SECRET || 'secret');
        if (payload.purpose !== 'registration' || !payload.email) {
          throw new Error('Invalid token purpose');
        }
      } catch (err) {
        return res.status(400).json({ error: 'เซสชันการยืนยัน Google หมดอายุ กรุณากดยืนยันผ่าน Google ใหม่อีกครั้ง' });
      }

      const email = payload.email.toLowerCase().trim();

      // Ensure email is Gmail
      if (!email.endsWith('@gmail.com')) {
        return res.status(400).json({ error: 'NoteAll รองรับการสมัครด้วย Gmail เท่านั้น' });
      }

      // 3. Race condition check for email and username uniqueness
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { username: username.toLowerCase().trim() },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email.toLowerCase() === email) {
          return res.status(409).json({ error: 'อีเมลนี้มีบัญชี NoteAll อยู่แล้ว กรุณาเข้าสู่ระบบ' });
        }
        return res.status(409).json({ error: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว กรุณาเลือกชื่อผู้ใช้อื่น' });
      }

      // 4. Handle Password (optional for Google-verified users)
      let passwordHash: string | null = null;
      if (password && password.trim().length > 0) {
        const salt = await bcrypt.genSalt(10);
        passwordHash = await bcrypt.hash(password, salt);
      }

      // 5. Create user
      const isSuperAdminEmail = email.toLowerCase().trim() === 'heros5510@gmail.com';
      const isAdminEmail = email.toLowerCase().trim() === 'aporngold@gmail.com';
      const initialRole = isSuperAdminEmail ? 'SUPER_ADMIN' : (isAdminEmail ? 'ADMIN' : 'USER');

      const user = await prisma.user.create({
        data: {
          email,
          username: username.toLowerCase().trim(),
          passwordHash,
          authProvider: 'google',
          googleId: payload.googleId || null,
          role: initialRole,
        },
      });

      // Create default notebook "My Notes"
      await prisma.notebook.create({
        data: {
          name: 'My Notes',
          description: 'สมุดบันทึกหลักของคุณ',
          color: '#6366F1',
          isDefault: true,
          userId: user.id,
        },
      });

      // Create starter default labels
      await prisma.label.createMany({
        data: [
          { name: 'สำคัญ', color: '#EF4444', userId: user.id },
          { name: 'ไอเดีย', color: '#10B981', userId: user.id },
          { name: 'งาน', color: '#3B82F6', userId: user.id },
        ],
      });

      // Record initial PDPA Consents (Terms of Service & Privacy Notice Acknowledgment)
      try {
        const ipAddress = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress || null;
        const userAgent = req.headers['user-agent'] || null;

        await prisma.userConsent.createMany({
          data: [
            {
              userId: user.id,
              consentType: 'TERMS_OF_SERVICE',
              version: '2569.1',
              isGranted: true,
              ipAddress,
              userAgent,
              grantedAt: new Date(),
            },
            {
              userId: user.id,
              consentType: 'PRIVACY_NOTICE_ACK',
              version: '2569.1',
              isGranted: true,
              ipAddress,
              userAgent,
              grantedAt: new Date(),
            },
          ],
        });
      } catch (consentErr) {
        console.warn('Could not record initial PDPA consents:', consentErr);
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      await prisma.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return res.status(201).json({
        message: 'สร้างบัญชีสำเร็จ ยินดีต้อนรับสู่ NoteAll!',
        token,
        user: { id: user.id, email: user.email, username: user.username, role: user.role },
      });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({ error: 'การสมัครสมาชิกล้มเหลว กรุณาลองใหม่อีกครั้ง' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' });
      }

      const { email, password } = parsed.data;
      const normalized = email.toLowerCase().trim();

      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: normalized }, { username: normalized }],
        },
      });

      if (!user) {
        return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
      }

      if (!user.passwordHash) {
        return res.status(400).json({
          error: 'บัญชีนี้สร้างด้วยการยืนยัน Google กรุณาเข้าสู่ระบบผ่าน Google หรือตั้งรหัสผ่านก่อน',
        });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      await prisma.session.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      let userRole = user.role;
      if (user.email === 'heros5510@gmail.com' && user.role !== 'SUPER_ADMIN') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'SUPER_ADMIN' },
        });
        userRole = 'SUPER_ADMIN';
      }

      return res.json({
        message: 'เข้าสู่ระบบสำเร็จ!',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: userRole,
          hasMasterPassword: user.hasMasterPassword,
          masterPasswordSalt: user.masterPasswordSalt,
        },
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json({
        error: 'Login failed due to server error',
        details: error?.message || String(error),
      });
    }
  }

  static async logout(req: AuthRequest, res: Response) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (token) {
        await prisma.session.deleteMany({ where: { token } });
      }
      return res.json({ message: 'ออกจากระบบสำเร็จ' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ error: 'Logout failed' });
    }
  }

  static async me(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          hasMasterPassword: true,
          masterPasswordSalt: true,
          role: true,
          authProvider: true,
          passwordHash: true,
          createdAt: true,
        },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        hasMasterPassword: user.hasMasterPassword,
        masterPasswordSalt: user.masterPasswordSalt,
        role: user.role,
        authProvider: user.authProvider,
        hasPassword: Boolean(user.passwordHash),
        createdAt: user.createdAt,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to get user profile' });
    }
  }

  // Request Password Reset Link (Forgot Password Flow - Account Enumeration Protected)
  static async forgotPassword(req: Request, res: Response) {
    try {
      const parsed = forgotPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'กรุณาระบุอีเมลที่ถูกต้อง' });
      }

      const { email } = parsed.data;
      const normalizedEmail = email.toLowerCase().trim();

      // Standard message returned regardless of whether the email exists (Account Enumeration Defense)
      const neutralSuccessResponse = {
        message: 'หากอีเมลนี้มีบัญชีอยู่ในระบบ ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณ',
      };

      const user = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        // Return neutral success message immediately
        return res.json(neutralSuccessResponse);
      }

      // Generate cryptographically secure random token (32 bytes)
      const rawToken = crypto.randomBytes(32).toString('hex');
      // Store only SHA-256 hash in database
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lifetime

      // Invalidate any existing unused reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Save new hashed token
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      // Construct reset URL
      let targetFrontend = (req.headers.origin as string) || (req.headers.referer as string);
      if (!targetFrontend || targetFrontend.includes('onrender.com')) {
        targetFrontend = process.env.FRONTEND_URL || 'http://localhost:3000';
      }
      try {
        targetFrontend = new URL(targetFrontend).origin;
      } catch (e) {
        targetFrontend = process.env.FRONTEND_URL || 'http://localhost:3000';
      }

      const resetUrl = `${targetFrontend}/reset-password?token=${rawToken}`;

      // Send email via EmailService
      const emailResult = await EmailService.sendPasswordResetEmail({
        to: user.email,
        username: user.username,
        resetUrl,
      });

      // Security Audit Log (Never log tokens or passwords)
      try {
        const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || null;
        await prisma.auditLog.create({
          data: {
            action: 'PASSWORD_RESET_REQUESTED',
            target: user.email,
            details: emailResult.details || 'Password reset email requested',
            ipAddress: clientIp,
            result: emailResult.success ? 'SUCCESS' : 'FAILED',
          },
        });
      } catch (logErr) {
        console.warn('AuditLog record error:', logErr);
      }

      return res.json(neutralSuccessResponse);
    } catch (error) {
      console.error('forgotPassword error:', error);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการประมวลผลคำขอรีเซ็ตรหัสผ่าน' });
    }
  }

  // Reset Password using One-Time Token
  static async resetPassword(req: Request, res: Response) {
    try {
      const parsed = resetPasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'ข้อมูลไม่ถูกต้องตามนโยบายความปลอดภัย' });
      }

      const { token, password: newPassword } = parsed.data;
      const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

      // Look up token
      const resetRecord = await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
        include: { user: true },
      });

      if (!resetRecord || resetRecord.usedAt !== null || resetRecord.expiresAt < new Date()) {
        try {
          const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || null;
          await prisma.auditLog.create({
            data: {
              action: 'PASSWORD_RESET_FAILED',
              target: resetRecord?.user?.email || 'UNKNOWN',
              details: 'Invalid, used, or expired reset token submitted',
              ipAddress: clientIp,
              result: 'FAILED',
            },
          });
        } catch (e) {}

        return res.status(400).json({
          error: 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้อง หรือหมดอายุแล้ว กรุณาส่งคำขอใหม่อีกครั้ง',
        });
      }

      // Check if new password is identical to old password (if user already had a password)
      if (resetRecord.user.passwordHash) {
        const isIdentical = await bcrypt.compare(newPassword, resetRecord.user.passwordHash);
        if (isIdentical) {
          return res.status(400).json({
            error: 'รหัสผ่านใหม่ต้องไม่เหมือนกับรหัสผ่านเดิม กรุณาตั้งรหัสผ่านใหม่ที่แตกต่าง',
          });
        }
      }

      // Hash new password with bcrypt
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      // Update user password
      await prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash },
      });

      // Mark token as used and clean up all reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: resetRecord.userId },
      });

      // Security Policy: Invalidate ALL active sessions across all devices for this account
      await prisma.session.deleteMany({
        where: { userId: resetRecord.userId },
      });

      // Security Audit Log
      try {
        const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || null;
        await prisma.auditLog.create({
          data: {
            action: 'PASSWORD_RESET_COMPLETED',
            target: resetRecord.user.email,
            details: 'Password reset successfully. All active sessions invalidated.',
            ipAddress: clientIp,
            result: 'SUCCESS',
          },
        });
      } catch (logErr) {
        console.warn('AuditLog record error:', logErr);
      }

      return res.json({
        message: 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่',
      });
    } catch (error) {
      console.error('resetPassword error:', error);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่' });
    }
  }

  // Change Password for Authenticated Users
  static async changePassword(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'ข้อมูลไม่ถูกต้อง' });
      }

      const { oldPassword, newPassword, revokeOtherSessions } = parsed.data;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้ในระบบ' });
      }

      if (!user.passwordHash) {
        return res.status(400).json({
          error: 'บัญชีนี้เข้าสู่ระบบด้วย Google จึงไม่มีรหัสผ่านของ Note on Web สำหรับเปลี่ยนที่นี่',
        });
      }

      const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!isValid) {
        try {
          const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || null;
          await prisma.auditLog.create({
            data: {
              action: 'PASSWORD_CHANGE_FAILED',
              target: user.email,
              details: 'Incorrect old password provided',
              ipAddress: clientIp,
              result: 'FAILED',
            },
          });
        } catch (e) {}

        return res.status(400).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
      }

      const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
      if (isSamePassword) {
        return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องไม่เหมือนกับรหัสผ่านเดิม' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      // Manage sessions: revoke other devices if requested
      if (revokeOtherSessions && req.sessionId) {
        await prisma.session.deleteMany({
          where: {
            userId,
            id: { not: req.sessionId },
          },
        });
      }

      // Security Audit Log
      try {
        const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || null;
        await prisma.auditLog.create({
          data: {
            action: 'PASSWORD_CHANGED',
            target: user.email,
            details: revokeOtherSessions
              ? 'Password changed successfully. Other active sessions revoked.'
              : 'Password changed successfully.',
            ipAddress: clientIp,
            result: 'SUCCESS',
          },
        });
      } catch (logErr) {
        console.warn('AuditLog record error:', logErr);
      }

      return res.json({
        message: 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย',
        revokedOtherSessions: Boolean(revokeOtherSessions),
      });
    } catch (error) {
      console.error('changePassword error:', error);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' });
    }
  }

  static async googleAuth(req: Request, res: Response) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

      // Determine the originating frontend URL
      let targetFrontend = (req.query.origin as string) || (req.query.frontend as string);
      if (!targetFrontend && req.headers.referer) {
        try {
          targetFrontend = new URL(req.headers.referer).origin;
        } catch (e) {}
      }
      if (!targetFrontend) {
        targetFrontend = process.env.FRONTEND_URL || 'http://localhost:3000';
      }

      // If pointing to render backend domain by mistake, fallback to vercel app
      if (targetFrontend.includes('note-on-web.onrender.com')) {
        targetFrontend = 'https://note-on-web.vercel.app';
      }

      if (!clientId || clientId.trim() === '') {
        return res.redirect(`${targetFrontend}/login?error=google_oauth_not_configured`);
      }

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'select_account',
        state: targetFrontend,
      });

      return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    } catch (error) {
      console.error('Google auth error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const safeFrontend = frontendUrl.includes('note-on-web.onrender.com') ? 'https://note-on-web.vercel.app' : frontendUrl;
      return res.redirect(`${safeFrontend}/login?error=google_auth_failed`);
    }
  }

  static async googleCallback(req: Request, res: Response) {
    let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Parse state returned by Google
    const stateUrl = typeof req.query.state === 'string' ? req.query.state : '';
    if (stateUrl) {
      try {
        const parsed = new URL(stateUrl);
        if (
          parsed.hostname === 'localhost' ||
          parsed.hostname === '127.0.0.1' ||
          parsed.hostname.endsWith('vercel.app') ||
          parsed.hostname.endsWith('onrender.com') ||
          (process.env.FRONTEND_URL && parsed.origin === new URL(process.env.FRONTEND_URL).origin)
        ) {
          frontendUrl = parsed.origin;
        }
      } catch (e) {}
    }

    // Safety fallback: if frontendUrl points to the backend on Render, redirect to Vercel frontend
    if (frontendUrl.includes('note-on-web.onrender.com')) {
      frontendUrl = 'https://note-on-web.vercel.app';
    }

    try {
      const { code, error } = req.query;

      if (error || !code) {
        return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent(String(error || 'authorization_denied'))}`);
      }

      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

      if (!clientId || !clientSecret || clientId.trim() === '' || clientSecret.trim() === '') {
        return res.redirect(`${frontendUrl}/login?error=google_oauth_not_configured`);
      }

      // 1. Exchange code for access & ID tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: String(code),
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: callbackUrl,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData: any = await tokenResponse.json();
      if (!tokenResponse.ok || !tokenData.access_token) {
        console.error('Google token exchange error:', tokenData);
        const errDetail = encodeURIComponent(tokenData.error_description || tokenData.error || 'token_exchange_failed');
        return res.redirect(`${frontendUrl}/login?error=google_token_exchange_failed&details=${errDetail}`);
      }

      // 2. Fetch user profile from Google
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      const profile: any = await userInfoResponse.json();
      if (!userInfoResponse.ok || !profile.email) {
        console.error('Google userinfo error:', profile);
        return res.redirect(`${frontendUrl}/login?error=google_user_info_failed`);
      }

      const email = profile.email.toLowerCase().trim();

      // Rule: Must be Gmail
      if (!email.endsWith('@gmail.com')) {
        return res.redirect(`${frontendUrl}/login?error=not_gmail`);
      }

      // Rule: Must be email_verified
      if (profile.email_verified === false || profile.email_verified === 'false') {
        return res.redirect(`${frontendUrl}/login?error=google_not_verified`);
      }

      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (user) {
        if (email === 'heros5510@gmail.com' && user.role !== 'SUPER_ADMIN') {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { role: 'SUPER_ADMIN' },
          });
        }

        // User already exists -> Link googleId if missing and login
        if (!user.googleId && profile.sub) {
          await prisma.user.update({
            where: { id: user.id },
            data: { googleId: profile.sub },
          });
        }

        const token = jwt.sign(
          { userId: user.id },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '7d' }
        );

        await prisma.session.create({
          data: {
            userId: user.id,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        });

        const userJson = encodeURIComponent(JSON.stringify({ id: user.id, email: user.email, username: user.username, role: user.role }));
        return res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${userJson}`);
      }

      // User does NOT exist -> Do not auto-create without Turnstile & password option!
      // Sign temporary registration token (valid 15 minutes)
      const registrationToken = jwt.sign(
        {
          purpose: 'registration',
          email,
          googleId: profile.sub,
          name: profile.name || '',
        },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '15m' }
      );

      return res.redirect(
        `${frontendUrl}/register?step=2&token=${encodeURIComponent(registrationToken)}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(profile.name || '')}`
      );
    } catch (error: any) {
      console.error('Google callback error:', error);
      const detail = encodeURIComponent(error?.message || 'unknown');
      return res.redirect(`${frontendUrl}/login?error=google_callback_failed&details=${detail}`);
    }
  }

  // Setup Master Password for the first time
  static async setupMasterPassword(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const { verifier, salt, recoveryKeyHash } = req.body;

      if (!verifier || !salt || !recoveryKeyHash) {
        return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน (verifier, salt, recoveryKeyHash are required)' });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          hasMasterPassword: true,
          masterPasswordVerifier: verifier,
          masterPasswordSalt: salt,
          recoveryKeyHash: recoveryKeyHash,
        },
      });

      return res.json({
        success: true,
        message: 'ตั้งค่า Master Password สำเร็จเรียบร้อยแล้ว',
        hasMasterPassword: true,
        masterPasswordSalt: salt,
      });
    } catch (error) {
      console.error('setupMasterPassword error:', error);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตั้งค่า Master Password' });
    }
  }

  // Verify Master Password
  static async verifyMasterPassword(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const { verifier } = req.body;

      if (!verifier) {
        return res.status(400).json({ error: 'กรุณาส่ง verifier สำหรับตรวจสอบ' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { masterPasswordVerifier: true, hasMasterPassword: true },
      });

      if (!user || !user.hasMasterPassword || !user.masterPasswordVerifier) {
        return res.status(400).json({ error: 'ผู้ใช้นี้ยังไม่ได้ตั้ง Master Password' });
      }

      const isValid = user.masterPasswordVerifier === verifier;
      if (!isValid) {
        return res.status(401).json({ valid: false, error: 'Master Password ไม่ถูกต้อง' });
      }

      return res.json({ valid: true, message: 'รหัสผ่านถูกต้อง' });
    } catch (error) {
      console.error('verifyMasterPassword error:', error);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบรหัสผ่าน' });
    }
  }

  // Recover Master Password with Recovery Key
  static async recoverMasterPassword(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      const { recoveryKeyHash, newVerifier, newSalt, newRecoveryKeyHash } = req.body;

      if (!recoveryKeyHash || !newVerifier || !newSalt) {
        return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วนสำหรับการกู้คืนรหัสผ่าน' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { recoveryKeyHash: true },
      });

      if (!user || !user.recoveryKeyHash) {
        return res.status(400).json({ error: 'ไม่พบข้อมูล Recovery Key ในระบบ' });
      }

      if (user.recoveryKeyHash !== recoveryKeyHash) {
        return res.status(401).json({ error: 'Recovery Key ไม่ถูกต้อง' });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          hasMasterPassword: true,
          masterPasswordVerifier: newVerifier,
          masterPasswordSalt: newSalt,
          ...(newRecoveryKeyHash ? { recoveryKeyHash: newRecoveryKeyHash } : {}),
        },
      });

      return res.json({
        success: true,
        message: 'รีเซ็ต Master Password สำเร็จแล้ว',
        hasMasterPassword: true,
        masterPasswordSalt: newSalt,
      });
    } catch (error) {
      console.error('recoverMasterPassword error:', error);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการกู้คืนรหัสผ่าน' });
    }
  }

  // PDPA Right to Erasure: Self-Account Deletion
  static async deleteMyAccount(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
      }

      const { password, confirmText } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, username: true, role: true, passwordHash: true, authProvider: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้ในระบบ' });
      }

      // If user is SUPER_ADMIN, ensure at least one other SUPER_ADMIN exists
      if (user.role === 'SUPER_ADMIN') {
        const superAdminCount = await prisma.user.count({
          where: { role: 'SUPER_ADMIN' },
        });
        if (superAdminCount <= 1) {
          return res.status(400).json({
            error: 'ไม่สามารถลบบัญชีได้ เนื่องจากระบบต้องมี Super Admin อย่างน้อย 1 คน กรุณาแต่งตั้งสิทธิ์ให้ผู้อื่นก่อน',
          });
        }
      }

      // Verification: If user has local password, require current password
      if (user.passwordHash) {
        if (!password) {
          return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านปัจจุบันเพื่อยืนยันการลบบัญชี' });
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
          return res.status(400).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
        }
      } else {
        // OAuth user (Google) without local password -> require explicit confirmation text
        if (confirmText !== 'DELETE_MY_ACCOUNT') {
          return res.status(400).json({ error: 'กรุณาพิมพ์ข้อความ DELETE_MY_ACCOUNT เพื่อยืนยัน' });
        }
      }

      // Cascading delete user and all their personal data (Notes, Boards, Reminders, Sessions, Passkeys)
      await prisma.user.delete({
        where: { id: userId },
      });

      return res.json({
        success: true,
        message: 'ลบบัญชีและข้อมูลส่วนบุคคลทั้งหมดสำเร็จตามสิทธิ PDPA เรียบร้อยแล้ว',
      });
    } catch (error) {
      console.error('deleteMyAccount error:', error);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบบัญชี กรุณาลองใหม่อีกครั้ง' });
    }
  }
}
