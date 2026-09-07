import CryptoJS from 'crypto-js';

export class EncryptionService {
  private static instance: EncryptionService;
  private masterKey: string = '';
  private salt: string = 'secure-note-salt-2024';

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  setMasterPassword(password: string): void {
    this.masterKey = CryptoJS.PBKDF2(password, this.salt, {
      keySize: 256 / 32,
      iterations: 100000,
    }).toString();
  }

  encrypt(data: string): { encrypted: string; iv: string } {
    if (!this.masterKey) {
      throw new Error('Master password not set');
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
      throw new Error('Master password not set');
    }

    const decrypted = CryptoJS.AES.decrypt(encrypted, this.masterKey, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }

  clear(): void {
    this.masterKey = '';
  }
}

export const generatePassword = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};