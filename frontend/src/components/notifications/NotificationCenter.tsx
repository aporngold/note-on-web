import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Bell, Check, Trash2, Clock, CheckCheck, ExternalLink, X, Volume2, VolumeX, Settings } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { useAuthStore } from '@/store/authStore';
import io, { Socket } from 'socket.io-client';
import {
  playNotificationSound,
  triggerVibration,
  getNotificationSoundSetting,
  saveNotificationSoundSetting,
  SoundTone,
} from '@/utils/soundEffects';
import toast from 'react-hot-toast';

export default function NotificationCenter() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    isOpen,
    setIsOpen,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    addRealtimeNotification,
  } = useNotificationStore();

  const dropdownRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [soundTone, setSoundTone] = useState<SoundTone>('chime');
  const [showSoundMenu, setShowSoundMenu] = useState(false);

  useEffect(() => {
    const s = getNotificationSoundSetting();
    setSoundEnabled(s.soundEnabled);
    setSoundTone(s.tone);
  }, [isOpen]);

  // Fetch notifications when user is authenticated
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id, fetchNotifications]);

  // Connect socket.io to listen for real-time notification events
  useEffect(() => {
    if (!user?.id) return;

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:5000';
    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-user', user.id);
    });

    socket.on('notification:new', (notif: any) => {
      addRealtimeNotification(notif);
      playNotificationSound();
      triggerVibration();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, addRealtimeNotification]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      await markAsRead(notif.id);
    }
    setIsOpen(false);

    if (notif.noteId) {
      router.push(`/notes/${notif.noteId}`);
    } else {
      router.push('/dashboard');
    }
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return 'เมื่อสักครู่';
      if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
      if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
      if (diffDays === 1) return 'เมื่อวานนี้';
      if (diffDays < 7) return `${diffDays} วันที่แล้ว`;

      return date.toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ── Bell Icon Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition flex items-center justify-center ${
          isOpen
            ? 'bg-indigo-50 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'
            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        title="การแจ้งเตือน"
        aria-label="การแจ้งเตือน"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Notification Dropdown Center ── */}
      {isOpen && (
        <>
          {/* Mobile Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/40 z-40 sm:hidden animate-fade-in"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed sm:absolute right-2 sm:right-0 top-16 sm:top-full mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-[400px] max-h-[85vh] sm:max-h-[520px] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">การแจ้งเตือน</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold rounded-full">
                    ใหม่ {unreadCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs">
                {/* Sound Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !soundEnabled;
                    setSoundEnabled(nextVal);
                    saveNotificationSoundSetting({ soundEnabled: nextVal });
                    if (nextVal) {
                      playNotificationSound(soundTone);
                      toast.success(`เปิดเสียงเตือนแล้ว (${soundTone})`, { icon: '🔊' });
                    } else {
                      toast('ปิดเสียงเตือนแล้ว', { icon: '🔇' });
                    }
                  }}
                  className={`p-1.5 rounded-lg transition ${
                    soundEnabled
                      ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title={soundEnabled ? 'เสียงเตือน: เปิดอยู่ (คลิกเพื่อปิด)' : 'เสียงเตือน: ปิดอยู่ (คลิกเพื่อเปิด)'}
                  aria-label="สลับเสียงแจ้งเตือน"
                >
                  {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>

                {/* Sound Tone Settings Button */}
                <button
                  type="button"
                  onClick={() => setShowSoundMenu(!showSoundMenu)}
                  className={`p-1.5 rounded-lg transition ${
                    showSoundMenu
                      ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50'
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  title="เลือกเสียงแจ้งเตือน"
                  aria-label="เลือกเสียงแจ้งเตือน"
                >
                  <Settings size={14} />
                </button>

                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="px-2 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition font-medium flex items-center gap-1"
                    title="ทำเครื่องหมายว่าอ่านทั้งหมด"
                  >
                    <CheckCheck size={14} />
                    <span>อ่านทั้งหมด</span>
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                    title="ล้างทั้งหมด"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg sm:hidden ml-1"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Sound Tone Picker Sub-bar */}
            {showSoundMenu && (
              <div className="px-3.5 py-2 bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200/80 dark:border-slate-800 text-xs flex items-center justify-between gap-2 shrink-0 animate-fade-in">
                <span className="text-slate-500 dark:text-slate-400 font-medium">เสียงเตือน:</span>
                <div className="flex items-center gap-1">
                  {(['chime', 'ding', 'digital', 'bell'] as SoundTone[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setSoundTone(t);
                        saveNotificationSoundSetting({ tone: t, soundEnabled: true });
                        setSoundEnabled(true);
                        playNotificationSound(t);
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold capitalize transition ${
                        soundTone === t
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200/60'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* List of Notifications */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading && notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span>กำลังโหลดการแจ้งเตือน...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-10 text-center flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                  <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2.5 text-slate-400">
                    <Bell size={22} className="stroke-[1.5]" />
                  </div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">ไม่มีการแจ้งเตือน</p>
                  <p className="text-xs mt-1 text-slate-400 max-w-[200px]">
                    เมื่อถึงเวลาแจ้งเตือนโน้ตที่คุณตั้งไว้ รายการจะปรากฏที่นี่
                  </p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`group relative p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition flex items-start gap-3 ${
                      !notif.isRead ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                    }`}
                  >
                    {/* Indicator Dot */}
                    <div className="shrink-0 mt-1">
                      {!notif.isRead ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 dark:bg-indigo-400 block shadow-xs" />
                      ) : (
                        <Clock size={13} className="text-slate-300 dark:text-slate-600" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-bold truncate ${
                          !notif.isRead
                            ? 'text-slate-900 dark:text-slate-100 font-semibold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {notif.title}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                        {notif.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                        <span>{formatRelativeTime(notif.createdAt)}</span>
                        {notif.noteId && (
                          <span className="inline-flex items-center gap-0.5 text-indigo-500 hover:underline">
                            <span>เปิดโน้ต</span>
                            <ExternalLink size={10} />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Item Action Buttons (Mark as read & Delete) */}
                    <div className="flex items-center gap-1 shrink-0">
                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                          }}
                          className="p-1.5 sm:p-1 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg text-indigo-500 hover:text-indigo-600 transition"
                          title="ทำเครื่องหมายว่าอ่านแล้ว"
                          aria-label="ทำเครื่องหมายว่าอ่านแล้ว"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        className="p-1.5 sm:p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-500 transition"
                        title="ลบการแจ้งเตือนนี้"
                        aria-label="ลบการแจ้งเตือนนี้"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
