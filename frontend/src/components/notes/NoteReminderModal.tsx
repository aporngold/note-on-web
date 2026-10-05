import React, { useState, useEffect } from 'react';
import { Bell, Clock, Calendar, Repeat, Trash2, X, Check, ShieldCheck, AlertCircle, Share } from 'lucide-react';
import { useReminderStore } from '@/store/reminderStore';
import { subscribeToWebPush, sendTestWebPush, getCurrentPushSubscription, isIOSDevice, isStandalonePWA, isAndroidDevice } from '@/utils/webPush';
import toast from 'react-hot-toast';
import ViewportPortal from '../ui/ViewportPortal';

interface NoteReminderModalProps {
  noteId: string;
  noteTitle?: string;
  isOpen: boolean;
  onClose: () => void;
  onReminderUpdated?: (hasReminder: boolean) => void;
}

export default function NoteReminderModal({
  noteId,
  noteTitle,
  isOpen,
  onClose,
  onReminderUpdated,
}: NoteReminderModalProps) {
  const { currentNoteReminder, fetchReminderByNote, saveReminder, deleteReminder, isLoading } = useReminderStore();

  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('09:00');
  const [repeatRule, setRepeatRule] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [hasPushPermission, setHasPushPermission] = useState<boolean>(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState<boolean>(false);
  const [isTestingPush, setIsTestingPush] = useState<boolean>(false);

  const isIOS = typeof window !== 'undefined' && isIOSDevice();
  const isStandalone = typeof window !== 'undefined' && isStandalonePWA();
  const isAndroid = typeof window !== 'undefined' && isAndroidDevice();

  // Initialize dates
  useEffect(() => {
    if (!isOpen) return;

    fetchReminderByNote(noteId).then((existing) => {
      if (existing) {
        const d = new Date(existing.reminderDateTime);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const hh = String(d.getHours()).padStart(2, '0');
        const min = String(d.getMinutes()).padStart(2, '0');

        setDate(`${yyyy}-${mm}-${dd}`);
        setTime(`${hh}:${min}`);
        setRepeatRule(existing.repeatRule || 'none');
      } else {
        // Smart Default: Current time + round up to next full hour
        const target = new Date();
        target.setHours(target.getHours() + 1);
        target.setMinutes(0);
        target.setSeconds(0);
        target.setMilliseconds(0);

        const yyyy = target.getFullYear();
        const mm = String(target.getMonth() + 1).padStart(2, '0');
        const dd = String(target.getDate()).padStart(2, '0');
        const hh = String(target.getHours()).padStart(2, '0');
        const min = String(target.getMinutes()).padStart(2, '0');

        setDate(`${yyyy}-${mm}-${dd}`);
        setTime(`${hh}:${min}`);
        setRepeatRule('none');
      }
    });

    // Check push permission status and auto-sync token with backend
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const isGranted = Notification.permission === 'granted';
      setHasPushPermission(isGranted);
      if (isGranted) {
        subscribeToWebPush().catch((err) => {
          console.warn('Auto push subscription sync notice:', err);
        });
      }
    }
  }, [isOpen, noteId, fetchReminderByNote]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!date || !time) {
      toast.error('กรุณาระบุวันที่และเวลาที่ต้องการแจ้งเตือน');
      return;
    }

    const selectedDateTime = new Date(`${date}T${time}:00`);
    if (isNaN(selectedDateTime.getTime())) {
      toast.error('รูปแบบวันที่หรือเวลาไม่ถูกต้อง');
      return;
    }

    if (selectedDateTime.getTime() <= Date.now()) {
      toast.error('เวลาแจ้งเตือนต้องอยู่ในอนาคต');
      return;
    }

    // Ensure Web Push subscription and verify permissions
    let pushWarningMessage = '';
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'denied') {
        pushWarningMessage = 'เบราว์เซอร์บล็อกการแจ้งเตือนอยู่: มือถือจะไม่เด้งเตือนจนกว่าคุณจะแตะไอคอน 🔒 ด้านบนสุด > สิทธิ์ (Permissions) > อนุญาตการแจ้งเตือน';
      } else if (Notification.permission === 'granted') {
        try {
          const pushResult = await subscribeToWebPush();
          if (!pushResult.success) {
            pushWarningMessage = pushResult.error || 'ไม่สามารถผูกการแจ้งเตือนพุชกับอุปกรณ์นี้ได้';
          }
        } catch (e: any) {
          pushWarningMessage = e?.message || 'เกิดข้อผิดพลาดในการลงทะเบียนรับพุช';
        }
      } else {
        try {
          setIsRequestingPermission(true);
          const pushResult = await subscribeToWebPush();
          if (pushResult.success) {
            setHasPushPermission(true);
          } else {
            pushWarningMessage = pushResult.error || 'ยังไม่ได้รับสิทธิ์การแจ้งเตือนพุช';
          }
        } catch (e: any) {
          pushWarningMessage = e?.message || 'ไม่สามารถขอสิทธิ์การแจ้งเตือนได้';
        } finally {
          setIsRequestingPermission(false);
        }
      }
    }

    const saved = await saveReminder({
      noteId,
      title: noteTitle,
      reminderDateTime: selectedDateTime.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Bangkok',
      repeatRule,
    });

    if (saved) {
      if (pushWarningMessage) {
        toast(
          (t) => (
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-500">⚠️ บันทึกเตือนความจำสำเร็จ แต่ Push ไม่พร้อมใช้งาน</p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{pushWarningMessage}</p>
            </div>
          ),
          { id: 'reminder-push-warn', duration: 4000, icon: '⚠️' }
        );
      }
      // Note: saveReminder() already triggers the single consolidated success toast
      if (onReminderUpdated) onReminderUpdated(true);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!currentNoteReminder) return;
    const ok = await deleteReminder(currentNoteReminder.id, noteId);
    if (ok) {
      if (onReminderUpdated) onReminderUpdated(false);
      onClose();
    }
  };

  const handleEnablePushDirectly = async () => {
    setIsRequestingPermission(true);
    const res = await subscribeToWebPush();
    setIsRequestingPermission(false);
    if (res.success) {
      setHasPushPermission(true);
      toast.success('เปิดการแจ้งเตือน Web Push สำเร็จแล้ว!', { id: 'push-perm', icon: '🔔', duration: 3000 });
    } else {
      toast.error(res.error || 'เปิดการแจ้งเตือนไม่สำเร็จ', { id: 'push-perm', duration: 5000 });
    }
  };

  const handleTestPush = async () => {
    try {
      setIsTestingPush(true);
      toast.loading('กำลังเชื่อมต่อ Web Push และส่งการแจ้งเตือนทดสอบ...', { id: 'test-push' });
      const res = await sendTestWebPush();
      if (res.success) {
        setHasPushPermission(true);
        toast.success(
          res.devicesCount && res.devicesCount > 0
            ? `ส่งข้อความทดสอบสำเร็จแล้ว (${res.devicesCount} เครื่อง)! กรุณาดูที่แถบแจ้งเตือนของเครื่องคุณ`
            : 'ส่งข้อความทดสอบสำเร็จแล้ว! กรุณาดูที่แถบแจ้งเตือนของเครื่องคุณ',
          { id: 'test-push', duration: 3000, icon: '🔔' }
        );
      } else {
        toast.error(res.error || 'ส่งการแจ้งเตือนทดสอบไม่สำเร็จ กรุณาตรวจสอบสิทธิ์', { id: 'test-push', duration: 5000 });
      }
    } catch (err: any) {
      toast.error(err?.message || 'เกิดข้อผิดพลาดในการทดสอบ', { id: 'test-push' });
    } finally {
      setIsTestingPush(false);
    }
  };

  // Quick preset shortcuts
  const setQuickPreset = (hoursFromNow: number) => {
    const target = new Date(Date.now() + hoursFromNow * 3600 * 1000);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, '0');
    const dd = String(target.getDate()).padStart(2, '0');
    const hh = String(target.getHours()).padStart(2, '0');
    const min = String(target.getMinutes()).padStart(2, '0');
    setDate(`${yyyy}-${mm}-${dd}`);
    setTime(`${hh}:${min}`);
  };

  return (
    <ViewportPortal>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div
        className="w-full max-w-md max-h-[92dvh] bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col mt-auto sm:my-auto animate-scale-up pb-[max(12px,env(safe-area-inset-bottom))] sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Handle Bar */}
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-2.5 sm:hidden shrink-0" />
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bell size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {currentNoteReminder ? 'แก้ไขการแจ้งเตือน' : 'ตั้งเวลาแจ้งเตือนโน้ต'}
              </h3>
              <p className="text-[11px] text-slate-400 truncate max-w-[240px]">
                {noteTitle || 'โน้ตเตือนความจำ'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 space-y-4 text-xs overflow-y-auto flex-1 overscroll-contain">
          {/* Push Permission Alert Banner if not enabled yet */}
          {!hasPushPermission && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
              <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                {isIOS && !isStandalone ? (
                  <>
                    <p className="font-bold text-amber-950 dark:text-amber-200 text-xs flex items-center gap-1.5">
                      <span>📱 สำหรับผู้ใช้ iPhone / iPad</span>
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300/90 mt-1 leading-relaxed">
                      ตามกฎความปลอดภัยของ Apple ระบบ Web Push จะเปิดใช้งานได้เมื่อเปิดผ่านหน้าจอโฮม:
                    </p>
                    <div className="mt-2 p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/80 dark:border-amber-800/40 space-y-1.5 text-[11px] text-slate-700 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">1</span>
                        <span>แตะปุ่ม <b>แชร์ (Share)</b> <Share size={12} className="inline text-indigo-500 mb-0.5" /> ที่แถบด้านล่างของ Safari</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">2</span>
                        <span>เลื่อนลงมาเลือก <b>&quot;เพิ่มไปยังหน้าจอโฮม&quot;</b> (Add to Home Screen)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">3</span>
                        <span>เปิดแอปจากหน้าจอโฮมเพื่อรับการแจ้งเตือนทันที</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-semibold text-amber-900 dark:text-amber-200">
                      ต้องการแจ้งเตือนเมื่อปิดหน้าเว็บหรือไม่?
                    </p>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                      เปิดการแจ้งเตือนผ่าน Web Push เพื่อให้ระบบสามารถแจ้งเตือนคุณได้ แม้ปิดแท็บหรือกำลังใช้งานเว็บอื่น
                    </p>
                    {typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'denied' ? (
                      <div className="mt-2 text-[10.5px] text-amber-900 dark:text-amber-200 bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-amber-300 dark:border-amber-800 space-y-1">
                        <p className="font-bold text-rose-600 dark:text-rose-400">⚠️ เบราว์เซอร์บล็อกการแจ้งเตือนของเว็บนี้</p>
                        <p>วิธีปลดล็อก: แตะไอคอน <b>แม่กุญแจ 🔒</b> ที่แถบ URL ด้านบนสุด &gt; เลือก <b>สิทธิ์ (Permissions)</b> &gt; เปลี่ยนการแจ้งเตือนเป็น <b>อนุญาต (Allow)</b> แล้วรีเฟรช</p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleEnablePushDirectly}
                        disabled={isRequestingPermission}
                        className="mt-2.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                      >
                        <Bell size={13} />
                        <span>{isRequestingPermission ? 'กำลังขออนุญาต...' : 'เปิดการแจ้งเตือน'}</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          {/* Android Background Battery Guidance Card */}
          {isAndroid && (
            <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 dark:border-amber-800/40 flex items-start gap-2.5 text-[11px] text-slate-700 dark:text-slate-300">
              <span className="text-amber-500 text-sm shrink-0 mt-0.5">💡</span>
              <div className="space-y-1 flex-1">
                <p className="font-semibold text-amber-950 dark:text-amber-200">
                  คำแนะนำสำหรับ Android (Xiaomi, Oppo, Vivo, Samsung)
                </p>
                <p className="text-[10.5px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  เพื่อให้ระบบแจ้งเตือนตรงเวลาเป๊ะแม้ปิดหน้าจอ แนะนำตั้งค่าในเครื่อง: <b>ข้อมูลแอปเบราว์เซอร์ &gt; แบตเตอรี่ &gt; ไม่จำกัด (No restrictions)</b>
                </p>
              </div>
            </div>
          )}

          {/* Web Push Diagnostic & Instant Test Button */}
          <div className="p-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${hasPushPermission ? 'bg-emerald-500 shadow-xs shadow-emerald-500/50' : 'bg-amber-500'}`} />
              <div className="truncate">
                <p className="text-[11.5px] font-bold text-slate-800 dark:text-slate-200">
                  {hasPushPermission ? 'Web Push บนเครื่องนี้: พร้อมใช้งาน' : 'Web Push: ยังไม่ได้รับสิทธิ์'}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                  กดทดสอบเพื่อตรวจสอบว่าเครื่องของคุณเด้งแจ้งเตือนได้จริงหรือไม่
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTestPush}
              disabled={isTestingPush}
              className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-xl text-[11px] transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <span>{isTestingPush ? 'กำลังยิง...' : '🧪 ทดสอบเด้งเตือน'}</span>
            </button>
          </div>

          {/* Quick presets */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">ทางลัดด่วน</label>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setQuickPreset(1)}
                className="py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 rounded-xl font-medium transition text-center text-[11px]"
              >
                +1 ชม.
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset(3)}
                className="py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 rounded-xl font-medium transition text-center text-[11px]"
              >
                +3 ชม.
              </button>
              <button
                type="button"
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setDate(tomorrow.toISOString().split('T')[0]);
                  setTime('09:00');
                }}
                className="py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 rounded-xl font-medium transition text-center text-[11px]"
              >
                พรุ่งนี้ 09:00
              </button>
              <button
                type="button"
                onClick={() => {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  setDate(nextWeek.toISOString().split('T')[0]);
                  setTime('09:00');
                }}
                className="py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 rounded-xl font-medium transition text-center text-[11px]"
              >
                สัปดาห์หน้า
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Date Picker */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                <Calendar size={13} className="text-indigo-500" />
                <span>วันที่แจ้งเตือน</span>
              </label>
              <input
                type="date"
                value={date}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Time Picker */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
                <Clock size={13} className="text-indigo-500" />
                <span>เวลา</span>
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Repeat Rule */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
              <Repeat size={13} className="text-indigo-500" />
              <span>การทำซ้ำ (Recurrence)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { value: 'none', label: 'ไม่ทำซ้ำ (ครั้งเดียว)' },
                { value: 'daily', label: 'ทุกวัน' },
                { value: 'weekly', label: 'ทุกสัปดาห์' },
                { value: 'monthly', label: 'ทุกเดือน' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRepeatRule(opt.value as any)}
                  className={`py-2 px-2 rounded-xl text-center font-medium transition text-xs ${
                    repeatRule === opt.value
                      ? 'bg-indigo-600 text-white shadow-xs font-bold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action-Based / Pin to top notice */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-2.5">
            <span className="text-base">📌</span>
            <div className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Action-Based Reminder:</span>{' '}
              เมื่อถึงเวลาแจ้งเตือน ระบบจะตรึงโน้ตนี้ไว้บนสุดของหน้าหลัก และส่งการแจ้งเตือนจนกว่าคุณจะกดอ่านหรือจัดการเสร็จสิ้น
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          {currentNoteReminder ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading}
              className="px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-semibold text-xs transition flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              <span>ลบเตือนความจำ</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-semibold text-xs transition"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-500/20 transition active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check size={14} />
              <span>{isLoading ? 'กำลังบันทึก...' : 'บันทึก'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </ViewportPortal>
);
}
