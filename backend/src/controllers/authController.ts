import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/database';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(30),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid input data' });
      }

      const { email, username, password } = parsed.data;

      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: email.toLowerCase() },
            { username: username.toLowerCase() },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email.toLowerCase() === email.toLowerCase()) {
          return res.status(409).json({ error: 'อีเมลนี้ถูกใช้งานแล้ว (Email already registered)' });
        }
        return res.status(409).json({ error: 'ชื่อผู้ใช้นี้ถูกใช้งานแล้ว (Username already taken)' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          passwordHash,
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
        message: 'ลงทะเบียนสำเร็จ!',
        token,
        user: { id: user.id, email: user.email, username: user.username },
      });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({ error: 'Registration failed due to server error' });
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

      return res.json({
        message: 'เข้าสู่ระบบสำเร็จ!',
        token,
        user: { id: user.id, email: user.email, username: user.username },
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Login failed due to server error' });
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
        select: { id: true, email: true, username: true, createdAt: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json(user);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to get user profile' });
    }
  }

  static async changePassword(req: AuthRequest, res: Response) {
    try {
      const userId = req.userId!;
      const parsed = changePasswordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid input' });
      }

      const { oldPassword, newPassword } = parsed.data;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(newPassword, salt);

      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });

      return res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to change password' });
    }
  }

  static async googleAuth(req: Request, res: Response) {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const callbackUrl = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

      if (!clientId || clientId.trim() === '') {
        return res.redirect(`${frontendUrl}/login?error=google_oauth_not_configured`);
      }

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: callbackUrl,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'select_account',
      });

      return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
    } catch (error) {
      console.error('Google auth error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
    }
  }

  static async googleCallback(req: Request, res: Response) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
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
      let user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Generate a unique clean username
        let baseUsername = (profile.name || email.split('@')[0])
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '_')
          .slice(0, 20);
        if (baseUsername.length < 3) baseUsername = 'user_' + baseUsername;

        let username = baseUsername;
        let counter = 1;
        while (await prisma.user.findUnique({ where: { username } })) {
          username = `${baseUsername.slice(0, 15)}_${counter}`;
          counter++;
        }

        const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(randomPassword, salt);

        user = await prisma.user.create({
          data: {
            email,
            username,
            passwordHash,
          },
        });

        // Create default notebook
        await prisma.notebook.create({
          data: {
            name: 'My Notes',
            description: 'สมุดบันทึกหลักของคุณ',
            color: '#6366F1',
            isDefault: true,
            userId: user.id,
          },
        });

        // Create starter labels
        await prisma.label.createMany({
          data: [
            { name: 'สำคัญ', color: '#EF4444', userId: user.id },
            { name: 'ไอเดีย', color: '#10B981', userId: user.id },
            { name: 'งาน', color: '#3B82F6', userId: user.id },
          ],
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

      const userJson = encodeURIComponent(JSON.stringify({ id: user.id, email: user.email, username: user.username }));
      return res.redirect(`${frontendUrl}/auth/callback?token=${token}&user=${userJson}`);
    } catch (error: any) {
      console.error('Google callback error:', error);
      const detail = encodeURIComponent(error?.message || 'unknown');
      return res.redirect(`${frontendUrl}/login?error=google_callback_failed&details=${detail}`);
    }
  }
}
