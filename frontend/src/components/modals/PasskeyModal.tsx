import React, { useState, useEffect } from 'react';
import { X, Fingerprint, Trash2, Plus, Smartphone, Laptop, ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { startRegistration, browserSupportsWebAuthn } from '@simplewebauthn/browser';
import api from '@/utils/api';

interface PasskeyItem {
  id: string;
  name: string | null;
  deviceType: string | null;
  backedUp: boolean;
  createdAt: string;
  lastUsedAt: string | null;
}

interface PasskeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PasskeyModal({ isOpen, onClose }: PasskeyModalProps) {
  const [passkeys, setPasskeys] = useState<PasskeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    setIsSupported(browserSupportsWebAuthn());
  }, []);

  const fetchPasskeys = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/auth/passkey/list');
      setPasskeys(res.data || []);
    } catch (err) {
      console.error('Failed to load passkeys:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPasskeys();
      // Suggest default name based on browser/OS
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      setDeviceName(isMobile ? 'สมาร์ตโฟนของฉัน' : 'คอมพิวเตอร์ของฉัน');
    }
  }, [isOpen]);

  const handleRegisterPasskey = async () => {
    if (!isSupported) {
      toast.error('เบราว์เซอร์หรืออุปกรณ์นี้ไม่รองรับระบบ Passkey');
      return;
    }

    try {
      setIsRegistering(true);
      // 1. Get options from server
      const optionsRes = await api.get('/auth/passkey/register-options');
      const optionsJSON = optionsRes.data;

      // 2. Trigger browser passkey registration (Fingerprint, Touch ID, Face ID, or Phone)
      const registrationResponse = await startRegistration(optionsJSON);

      // 3. Send response back to server for verification
      const verifyRes = await api.post('/auth/passkey/register-verify', {
        response: registrationResponse,
        name: deviceName.trim() || 'อุปกรณ์ Passkey ของฉัน',
      });

      toast.success(verifyRes.data.message || 'เพิ่ม Passkey เรียบร้อยแล้ว!');
      await fetchPasskeys();
    } catch (err: any) {
      console.error('Passkey registration error:', err);
      if (err.name === 'NotAllowedError') {
        toast('ยกเลิกการสแกน Passkey แล้ว', { icon: 'ℹ️' });
      } else {
        toast.error(err.response?.data?.error || err.message || 'ไม่สามารถลงทะเบียน Passkey ได้');
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDeletePasskey = async (id: string, name: string | null) => {
    if (!window.confirm(`ต้องการลบ Passkey "${name || 'อุปกรณ์นี้'}" หรือไม่?`)) return;

    try {
      await api.delete(`/auth/passkey/${id}`);
      toast.success('ลบ Passkey เรียบร้อยแล้ว');
      setPasskeys((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'ไม่สามารถลบ Passkey ได้');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in font-inter">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <Fingerprint size={22} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                จัดการ Passkeys
              </h2>
              <p className="text-xs text-slate-400">สแกนนิ้วมือ / ใบหน้า / อุปกรณ์ เพื่อเข้าสู่ระบบในเสี้ยววินาที</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Informative Banner */}
        <div className="p-3.5 bg-gradient-to-r from-teal-500/10 to-sky-500/10 border border-teal-500/20 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-teal-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Passkey เป็นมาตรฐานความปลอดภัยสูงสุด ไม่ต้องจำรหัสผ่าน คุณสามารถใช้สแกนนิ้วบนโน้ตบุ๊ก Face ID บนมือถือ หรือเชื่อมต่อผ่าน Bluetooth/QR เพื่อเข้าใช้งานได้ทันที
          </p>
        </div>

        {/* Register New Passkey Section */}
        <div className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/70 dark:border-slate-800">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            ตั้งชื่ออุปกรณ์เครื่องนี้
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              placeholder="เช่น โน้ตบุ๊ก Asus F15, iPhone 15"
              className="flex-1 px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-900 dark:text-white"
            />
            <button
              onClick={handleRegisterPasskey}
              disabled={isRegistering || !isSupported}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 rounded-xl shadow-md shadow-teal-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            >
              {isRegistering ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>กำลังสแกน...</span>
                </>
              ) : (
                <>
                  <Plus size={14} />
                  <span>เพิ่ม Passkey</span>
                </>
              )}
            </button>
          </div>
          {!isSupported && (
            <p className="text-[11px] text-rose-500 font-medium">
              * เบราว์เซอร์นี้ไม่รองรับระบบ WebAuthn Passkeys
            </p>
          )}
        </div>

        {/* Existing Passkeys List */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            อุปกรณ์ที่ลงทะเบียนไว้ ({passkeys.length})
          </h3>

          {isLoading ? (
            <div className="py-6 flex items-center justify-center text-slate-400 text-xs gap-2">
              <Loader2 size={16} className="animate-spin" />
              <span>กำลังโหลดข้อมูล...</span>
            </div>
          ) : passkeys.length === 0 ? (
            <div className="py-6 text-center text-slate-400 text-xs space-y-1">
              <p>ยังไม่มี Passkey ที่ลงทะเบียนไว้</p>
              <p className="text-[11px] text-slate-500">
                กดปุ่ม &quot;เพิ่ม Passkey&quot; ด้านบนเพื่อเริ่มใช้งาน
              </p>
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {passkeys.map((pk) => (
                <div
                  key={pk.id}
                  className="flex items-center justify-between p-3 bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-xl hover:border-teal-500/50 transition shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 shrink-0">
                      {pk.deviceType === 'multiDevice' ? <Smartphone size={16} /> : <Laptop size={16} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                        {pk.name || 'อุปกรณ์ Passkey'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        เพิ่มเมื่อ: {new Date(pk.createdAt).toLocaleDateString('th-TH')}
                        {pk.lastUsedAt && ` • ใช้ล่าสุด: ${new Date(pk.lastUsedAt).toLocaleDateString('th-TH')}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePasskey(pk.id, pk.name)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition shrink-0"
                    title="ลบ Passkey นี้"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
