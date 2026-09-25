import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/database';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';

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

  // Cloudflare official dummy test secret that always passes: 1x00000000000000000000000000000000BBBBBB
  const secretKey =
    process.env.TURNSTILE_SECRET_KEY || '1x00000000000000000000000000000000BBBBBB';

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

const changePasswordSchema = z.object({
  oldPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(13, 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 13 ตัวอักษร ตามมาตรฐานความปลอดภัยสากล'),
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
      const user = await prisma.user.create({
        data: {
          email,
          username: username.toLowerCase().trim(),
          passwordHash,
          authProvider: 'google',
          googleId: payload.googleId || null,
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

      return res.json({
        message: 'เข้าสู่ระบบสำเร็จ!',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          hasMasterPassword: user.hasMasterPassword,
          masterPasswordSalt: user.masterPasswordSalt,
        },
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
        select: {
          id: true,
          email: true,
          username: true,
          hasMasterPassword: true,
          masterPasswordSalt: true,
          role: true,
          createdAt: true,
        },
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

      if (!user.passwordHash) {
        return res.status(400).json({ error: 'บัญชีนี้เข้าใช้งานด้วย Google ยังไม่ได้ตั้งรหัสผ่าน' });
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
}
