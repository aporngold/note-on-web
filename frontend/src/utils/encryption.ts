import CryptoJS from 'crypto-js';

const LEGACY_SALT = 'secure-note-salt-2026';

export class EncryptionService {
  private static instance: EncryptionService;
  private masterKey: string = '';
  private currentSalt: string = LEGACY_SALT;

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

  getCurrentSalt(): string {
    return this.currentSalt;
  }

  // Derive master key using PBKDF2 with 100,000 iterations
  static deriveKey(password: string, salt: string = LEGACY_SALT): string {
    if (!password) return '';
    return CryptoJS.PBKDF2(password, salt, {
      keySize: 256 / 32,
      iterations: 100000,
    }).toString();
  }

  // Derive verification hash from master key for zero-knowledge server verification
  static deriveVerifier(masterKey: string): string {
    if (!masterKey) return '';
    return CryptoJS.SHA256(masterKey + ':verifier-v1').toString();
  }

  // Generate cryptographically secure random salt
  static generateSalt(): string {
    return CryptoJS.lib.WordArray.random(16).toString();
  }

  // Generate 24-character user-friendly Recovery Key: XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  static generateRecoveryKey(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like 0/O, 1/I
    let raw = '';
    const randomWords = CryptoJS.lib.WordArray.random(24);
    const hex = randomWords.toString();
    for (let i = 0; i < 24; i++) {
      const byte = parseInt(hex.substr(i * 2, 2), 16) || 0;
      raw += chars.charAt(byte % chars.length);
    }
    // Format with dashes for readability
    return raw.match(/.{1,4}/g)?.join('-') || raw;
  }

  // Hash recovery key for server storage
  static hashRecoveryKey(recoveryKey: string): string {
    const clean = recoveryKey.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    return CryptoJS.SHA256(clean + ':recovery-v1').toString();
  }

  // Activate Master Key in memory
  setMasterPassword(password: string, userSalt: string = LEGACY_SALT): void {
    if (!password) {
      this.masterKey = '';
      this.currentSalt = LEGACY_SALT;
      return;
    }
    this.currentSalt = userSalt || LEGACY_SALT;
    this.masterKey = EncryptionService.deriveKey(password, this.currentSalt);
  }

  // Encrypt note content using AES-256-CBC with PKCS7 and random 128-bit IV
  encrypt(data: string): { encrypted: string; iv: string; salt: string } {
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
      salt: this.currentSalt,
    };
  }

  // Decrypt note content with automatic fallback to legacy salt for backwards compatibility
  decrypt(encrypted: string, iv: string, noteSalt?: string): string {
    if (!this.masterKey) {
      throw new Error('กรุณาปลดล็อกด้วย Master Password ก่อนถอดรหัส');
    }

    // Try decrypting with active master key
    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, this.masterKey, {
        iv: CryptoJS.enc.Hex.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const utf8 = decrypted.toString(CryptoJS.enc.Utf8);
      if (utf8) return utf8;
    } catch (e) {
      // Ignore and attempt legacy fallback
    }

    // Fallback: If note was encrypted with legacy static salt
    if (this.currentSalt !== LEGACY_SALT) {
      try {
        const legacyKey = EncryptionService.deriveKey(this.masterKey, LEGACY_SALT);
        const decrypted = CryptoJS.AES.decrypt(encrypted, legacyKey, {
          iv: CryptoJS.enc.Hex.parse(iv),
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7,
        });
        const utf8 = decrypted.toString(CryptoJS.enc.Utf8);
        if (utf8) return utf8;
      } catch (e) {
        // Fallback failed
      }
    }

    throw new Error('ถอดรหัสไม่สำเร็จ: รหัสผ่านไม่ถูกต้อง หรือข้อมูลเสียหาย');
  }

  clear(): void {
    this.masterKey = '';
    this.currentSalt = LEGACY_SALT;
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
