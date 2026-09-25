import React, { useState, useEffect } from 'react';
import { Bell, Clock, Calendar, Repeat, Trash2, X, Check, ShieldCheck, AlertCircle } from 'lucide-react';
import { useReminderStore } from '@/store/reminderStore';
import { subscribeToWebPush, getCurrentPushSubscription } from '@/utils/webPush';
import toast from 'react-hot-toast';

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
        // Default tomorrow 09:00
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');

        setDate(`${yyyy}-${mm}-${dd}`);
        setTime('09:00');
        setRepeatRule('none');
      }
    });

    // Check push permission status
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasPushPermission(Notification.permission === 'granted');
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

    // Auto-request Web Push permission if not granted yet
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
      try {
        setIsRequestingPermission(true);
        const pushResult = await subscribeToWebPush();
        if (pushResult.success) {
          setHasPushPermission(true);
        }
      } catch (e) {
        // Continue even if push subscription failed (in-app notifications will still work)
      } finally {
        setIsRequestingPermission(false);
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
      if (onReminderUpdated) onReminderUpdated(true);
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!currentNoteReminder) return;
    const ok = await deleteReminder(currentNoteReminder.id);
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
      toast.success('เปิดการแจ้งเตือน Web Push สำเร็จแล้ว!', { icon: '🔔' });
    } else {
      toast.error(res.error || 'เปิดการแจ้งเตือนไม่สำเร็จ');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
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
        <div className="p-5 space-y-4 text-xs">
          {/* Push Permission Alert Banner if not enabled yet */}
          {!hasPushPermission && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5">
              <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-amber-900 dark:text-amber-200">
                  ต้องการแจ้งเตือนเมื่อปิดหน้าเว็บหรือไม่?
                </p>
                <p className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-0.5 leading-relaxed">
                  เปิดการแจ้งเตือนผ่าน Web Push เพื่อให้ระบบสามารถแจ้งเตือนคุณได้ แม้ปิดแท็บหรือกำลังใช้งานเว็บอื่น
                </p>
                <button
                  type="button"
                  onClick={handleEnablePushDirectly}
                  disabled={isRequestingPermission}
                  className="mt-2 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] transition active:scale-95 disabled:opacity-50"
                >
                  {isRequestingPermission ? 'กำลังขออนุญาต...' : 'เปิดการแจ้งเตือน'}
                </button>
              </div>
            </div>
          )}

          {/* Quick presets */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">ทางลัดด่วน</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setQuickPreset(1)}
                className="py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 rounded-xl font-medium transition text-center"
              >
                +1 ชั่วโมง
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset(3)}
                className="py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 rounded-xl font-medium transition text-center"
              >
                +3 ชั่วโมง
              </button>
              <button
                type="button"
                onClick={() => setQuickPreset(24)}
                className="py-1.5 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 rounded-xl font-medium transition text-center"
              >
                พรุ่งนี้
              </button>
            </div>
          </div>

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

          {/* Repeat Rule */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1.5">
              <Repeat size={13} className="text-indigo-500" />
              <span>การทำซ้ำ</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { value: 'none', label: 'ไม่ทำซ้ำ' },
                { value: 'daily', label: 'ทุกวัน' },
                { value: 'weekly', label: 'ทุกสัปดาห์' },
                { value: 'monthly', label: 'ทุกเดือน' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setRepeatRule(opt.value as any)}
                  className={`py-1.5 px-2 rounded-xl text-center font-medium transition ${
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
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
  );
}
