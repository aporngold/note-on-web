import CryptoJS from 'crypto-js';

export class EncryptionService {
  private static instance: EncryptionService;
  private masterKey: string = '';
  private salt: string = 'secure-note-salt-2026';

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  isUnlocked(): boolean {
    return Boolean(this.masterKey);
  }

  setMasterPassword(password: string): void {
    if (!password) {
      this.masterKey = '';
      return;
    }
    this.masterKey = CryptoJS.PBKDF2(password, this.salt, {
      keySize: 256 / 32,
      iterations: 100000,
    }).toString();
  }

  encrypt(data: string): { encrypted: string; iv: string } {
    if (!this.masterKey) {
      throw new Error('กรุณาปลดล็อกด้วย Master Password ก่อนเข้ารหัส');
    }

    const iv = CryptoJS.lib.WordArray.random(128 / 8);
    const encrypted = CryptoJS.AES.encrypt(data, this.masterKey, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return {
      encrypted: encrypted.toString(),
      iv: iv.toString(),
    };
  }

  decrypt(encrypted: string, iv: string): string {
    if (!this.masterKey) {
      throw new Error('กรุณาปลดล็อกด้วย Master Password ก่อนถอดรหัส');
    }

    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.masterKey, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const utf8 = decrypted.toString(CryptoJS.enc.Utf8);
      if (!utf8) {
        throw new Error('รหัสผ่านไม่ถูกต้อง หรือข้อมูลเสียหาย');
      }
      return utf8;
    } catch (e: any) {
      throw new Error('ถอดรหัสไม่สำเร็จ: รหัสผ่านไม่ถูกต้อง');
    }
  }

  clear(): void {
    this.masterKey = '';
  }
}

export const generateRandomPassword = (length: number = 24): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};
