import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';

const prisma = new PrismaClient();

function getRpID(req: Request): string {
  const origin = req.headers.origin || req.headers.referer || '';
  try {
    const url = new URL(origin);
    // Remove port if any
    return url.hostname;
  } catch {
    return process.env.NODE_ENV === 'production' ? 'note-on-web.vercel.app' : 'localhost';
  }
}

function getExpectedOrigin(req: Request): string {
  const origin = req.headers.origin || req.headers.referer;
  if (origin) {
    try {
      const url = new URL(origin);
      return url.origin;
    } catch {
      // fallback
    }
  }
  return process.env.FRONTEND_URL || 'http://localhost:3000';
}

export class PasskeyController {
  // 1. Generate Registration Options (User must be logged in)
  static async getRegisterOptions(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนลงทะเบียน Passkey' });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { passkeys: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'ไม่พบผู้ใช้ในระบบ' });
      }

      const rpID = getRpID(req);
      const rpName = 'NoteAll';

      const options = await generateRegistrationOptions({
        rpName,
        rpID,
        userID: Buffer.from(user.id),
        userName: user.email,
        userDisplayName: user.username || user.email.split('@')[0],
        attestationType: 'none',
        excludeCredentials: user.passkeys.map((pk) => ({
          id: pk.credentialId,
          transports: pk.transports ? JSON.parse(pk.transports) : undefined,
        })),
        authenticatorSelection: {
          residentKey: 'preferred',
          userVerification: 'preferred',
        },
      });

      // Save challenge to DB (valid for 5 minutes)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await prisma.webAuthnChallenge.create({
        data: {
          challenge: options.challenge,
          userId: user.id,
          expiresAt,
        },
      });

      return res.json(options);
    } catch (err: any) {
      console.error('Error generating passkey register options:', err);
      return res.status(500).json({ error: 'ไม่สามารถสร้างเงื่อนไข Passkey ได้ กรุณาลองใหม่อีกครั้ง' });
    }
  }

  // 2. Verify Registration Response & Save Passkey
  static async verifyRegister(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนลงทะเบียน Passkey' });
      }

      const { response, name } = req.body;
      if (!response) {
        return res.status(400).json({ error: 'ไม่พบข้อมูลการตอบกลับจากอุปกรณ์ Passkey' });
      }

      const expectedRPID = getRpID(req);
      const expectedOrigin = getExpectedOrigin(req);

      // Find challenge
      const challengeRecord = await prisma.webAuthnChallenge.findFirst({
        where: {
          userId,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!challengeRecord) {
        return res.status(400).json({ error: 'คำขอหมดอายุแล้ว กรุณาลองใหม่อีกครั้ง' });
      }

      const verification = await verifyRegistrationResponse({
        response,
        expectedChallenge: challengeRecord.challenge,
        expectedOrigin,
        expectedRPID,
      });

      if (!verification.verified || !verification.registrationInfo) {
        return res.status(400).json({ error: 'ไม่สามารถยืนยันตัวตนกับอุปกรณ์ Passkey ได้' });
      }

      const {
        credential,
        credentialDeviceType,
        credentialBackedUp,
      } = verification.registrationInfo;

      const publicKeyBase64 = Buffer.from(credential.publicKey).toString('base64url');
      const transportsJson = response.response?.transports
        ? JSON.stringify(response.response.transports)
        : credential.transports
        ? JSON.stringify(credential.transports)
        : null;

      const passkey = await prisma.passkey.create({
        data: {
          userId,
          credentialId: credential.id,
          publicKey: publicKeyBase64,
          counter: BigInt(credential.counter),
          deviceType: credentialDeviceType || 'singleDevice',
          backedUp: credentialBackedUp || false,
          transports: transportsJson,
          name: name || 'อุปกรณ์ Passkey ของฉัน',
        },
      });

      // Cleanup used challenge
      await prisma.webAuthnChallenge.deleteMany({
        where: { userId },
      });

      return res.status(201).json({
        success: true,
        message: 'เพิ่ม Passkey เรียบร้อยแล้ว! คุณสามารถใช้สแกนนิ้วหรือใบหน้าเพื่อเข้าสู่ระบบในครั้งถัดไปได้ทันที',
        passkey: {
          id: passkey.id,
          name: passkey.name,
          deviceType: passkey.deviceType,
          createdAt: passkey.createdAt,
        },
      });
    } catch (err: any) {
      console.error('Error verifying passkey registration:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบ Passkey กรุณาลองใหม่อีกครั้ง' });
    }
  }

  // 3. Generate Authentication Options (Login page)
  static async getLoginOptions(req: Request, res: Response) {
    try {
      const { emailOrUsername } = req.body || {};
      const rpID = getRpID(req);

      let allowCredentials: any[] | undefined = undefined;

      if (emailOrUsername && typeof emailOrUsername === 'string' && emailOrUsername.trim().length > 0) {
        const cleanInput = emailOrUsername.toLowerCase().trim();
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: cleanInput },
              { username: cleanInput },
            ],
          },
          include: { passkeys: true },
        });

        if (user && user.passkeys.length > 0) {
          allowCredentials = user.passkeys.map((pk) => ({
            id: pk.credentialId,
            transports: pk.transports ? JSON.parse(pk.transports) : undefined,
          }));
        }
      }

      const options = await generateAuthenticationOptions({
        rpID,
        allowCredentials,
        userVerification: 'preferred',
      });

      // Save challenge (valid for 5 minutes)
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await prisma.webAuthnChallenge.create({
        data: {
          challenge: options.challenge,
          expiresAt,
        },
      });

      return res.json(options);
    } catch (err: any) {
      console.error('Error generating passkey login options:', err);
      return res.status(500).json({ error: 'ไม่สามารถสร้างคำขอ Passkey ได้ กรุณาลองใหม่อีกครั้ง' });
    }
  }

  // 4. Verify Authentication Response (Login page)
  static async verifyLogin(req: Request, res: Response) {
    try {
      const { response } = req.body;
      if (!response || !response.id) {
        return res.status(400).json({ error: 'ไม่พบข้อมูลการตอบกลับจากอุปกรณ์ Passkey' });
      }

      const credentialId = response.id;
      const passkey = await prisma.passkey.findUnique({
        where: { credentialId },
        include: { user: true },
      });

      if (!passkey || !passkey.user) {
        return res.status(404).json({ error: 'ไม่พบข้อมูล Passkey นี้ในระบบ กรุณาลองใหม่หรือใช้วิธีอื่น' });
      }

      // Find challenge
      const challengeRecord = await prisma.webAuthnChallenge.findFirst({
        where: {
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!challengeRecord) {
        return res.status(400).json({ error: 'คำขอเข้าสู่ระบบหมดอายุแล้ว กรุณาลองใหม่อีกครั้ง' });
      }

      const expectedRPID = getRpID(req);
      const expectedOrigin = getExpectedOrigin(req);

      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: challengeRecord.challenge,
        expectedOrigin,
        expectedRPID,
        credential: {
          id: passkey.credentialId,
          publicKey: Buffer.from(passkey.publicKey, 'base64url'),
          counter: Number(passkey.counter),
          transports: passkey.transports ? JSON.parse(passkey.transports) : undefined,
        },
        requireUserVerification: false,
      });

      if (!verification.verified) {
        return res.status(400).json({ error: 'การยืนยันตัวตนด้วย Passkey ล้มเหลว' });
      }

      // Update counter and lastUsedAt
      await prisma.passkey.update({
        where: { id: passkey.id },
        data: {
          counter: BigInt(verification.authenticationInfo.newCounter),
          lastUsedAt: new Date(),
        },
      });

      // Cleanup used challenges
      await prisma.webAuthnChallenge.deleteMany({
        where: {
          expiresAt: { lt: new Date() },
        },
      });

      // Issue JWT session token (valid 7 days)
      const token = jwt.sign(
        { userId: passkey.user.id },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '7d' }
      );

      await prisma.session.create({
        data: {
          userId: passkey.user.id,
          token,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      return res.json({
        success: true,
        message: 'เข้าสู่ระบบด้วย Passkey สำเร็จ ยินดีต้อนรับกลับสู่ NoteAll!',
        token,
        user: {
          id: passkey.user.id,
          email: passkey.user.email,
          username: passkey.user.username,
          role: passkey.user.role,
        },
      });
    } catch (err: any) {
      console.error('Error verifying passkey login:', err);
      return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการตรวจสอบ Passkey กรุณาลองใหม่อีกครั้ง' });
    }
  }

  // 5. List Passkeys for current user
  static async listPasskeys(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อน' });
      }

      const passkeys = await prisma.passkey.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          deviceType: true,
          backedUp: true,
          createdAt: true,
          lastUsedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      return res.json(passkeys);
    } catch (err: any) {
      console.error('Error listing passkeys:', err);
      return res.status(500).json({ error: 'ไม่สามารถดึงข้อมูล Passkey ได้' });
    }
  }

  // 6. Delete a Passkey
  static async deletePasskey(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { id } = req.params;

      const passkey = await prisma.passkey.findUnique({
        where: { id },
      });

      if (!passkey || passkey.userId !== userId) {
        return res.status(404).json({ error: 'ไม่พบ Passkey นี้ในบัญชีของคุณ' });
      }

      await prisma.passkey.delete({
        where: { id },
      });

      return res.json({ success: true, message: 'ลบ Passkey เรียบร้อยแล้ว' });
    } catch (err: any) {
      console.error('Error deleting passkey:', err);
      return res.status(500).json({ error: 'ไม่สามารถลบ Passkey ได้' });
    }
  }
}
