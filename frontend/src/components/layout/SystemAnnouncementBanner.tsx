import React, { useEffect, useState, useCallback } from 'react';
import {
  Info,
  AlertTriangle,
  AlertOctagon,
  Sparkles,
  X,
  ExternalLink,
  ChevronRight,
  Megaphone,
} from 'lucide-react';
import { announcementService, AnnouncementItem } from '@/services/announcementService';
import { getSharedSocket } from '@/utils/socketClient';

export default function SystemAnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<AnnouncementItem | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // ตรวจสอบและดึงข้อมูลประกาศ
  const fetchAnnouncement = useCallback(async () => {
    try {
      const active = await announcementService.getActive();
      if (!active) {
        setAnnouncement(null);
        return;
      }

      // ตรวจสอบว่าผู้ใช้เคยกดปิดประกาศนี้ไปแล้วหรือไม่
      const dismissedKey = `dismissed_announcement_${active.id}`;
      const hasDismissed = typeof window !== 'undefined' && localStorage.getItem(dismissedKey) === 'true';

      if (hasDismissed && active.dismissible) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }

      setAnnouncement(active);
    } catch (err) {
      console.warn('SystemAnnouncementBanner error:', err);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncement();

    // ฟัง Real-time event จาก Socket.io
    const socket = getSharedSocket();
    const handleUpdate = () => {
      fetchAnnouncement();
    };

    socket.on('system-announcement-updated', handleUpdate);

    return () => {
      socket.off('system-announcement-updated', handleUpdate);
    };
  }, [fetchAnnouncement]);

  const handleDismiss = () => {
    if (!announcement) return;
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`dismissed_announcement_${announcement.id}`, 'true');
    }
  };

  if (!announcement || isDismissed || !announcement.isActive) {
    return null;
  }

  // ธีมสีตามประเภทของประกาศ (info, warning, critical, success)
  const themeConfig = {
    info: {
      bg: 'bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-blue-700/90 dark:from-blue-950/80 dark:via-indigo-950/80 dark:to-blue-900/80',
      border: 'border-b border-blue-400/30 dark:border-blue-700/40',
      text: 'text-white dark:text-blue-100',
      badge: 'bg-white/20 text-white dark:bg-blue-800/60 dark:text-blue-200 border border-white/20',
      icon: <Info size={16} className="text-white shrink-0" />,
      tag: 'ประกาศข่าวสาร',
    },
    warning: {
      bg: 'bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-amber-600/90 dark:from-amber-950/80 dark:via-amber-900/80 dark:to-orange-950/80',
      border: 'border-b border-amber-300/40 dark:border-amber-700/40',
      text: 'text-white dark:text-amber-100',
      badge: 'bg-black/20 text-white dark:bg-amber-800/60 dark:text-amber-200 border border-white/20',
      icon: <AlertTriangle size={16} className="text-white shrink-0" />,
      tag: 'แจ้งเตือนสำคัญ',
    },
    critical: {
      bg: 'bg-gradient-to-r from-rose-600/95 via-red-600/95 to-rose-700/95 dark:from-red-950/90 dark:via-rose-950/90 dark:to-red-900/90',
      border: 'border-b border-rose-400/40 dark:border-rose-700/50',
      text: 'text-white dark:text-red-100',
      badge: 'bg-white/25 text-white dark:bg-red-800/70 dark:text-red-100 border border-white/30 font-bold animate-pulse',
      icon: <AlertOctagon size={16} className="text-white shrink-0" />,
      tag: 'ด่วนที่สุด',
    },
    success: {
      bg: 'bg-gradient-to-r from-emerald-600/90 via-teal-600/90 to-emerald-700/90 dark:from-emerald-950/80 dark:via-teal-950/80 dark:to-emerald-900/80',
      border: 'border-b border-emerald-400/30 dark:border-emerald-700/40',
      text: 'text-white dark:text-emerald-100',
      badge: 'bg-white/20 text-white dark:bg-emerald-800/60 dark:text-emerald-200 border border-white/20',
      icon: <Sparkles size={16} className="text-white shrink-0" />,
      tag: 'อัปเดตใหม่',
    },
  };

  const currentTheme = themeConfig[announcement.type] || themeConfig.info;

  return (
    <aside
      aria-label="ประกาศระบบ"
      className={`relative z-20 w-full shadow-sm backdrop-blur-md transition-all duration-300 ${currentTheme.bg} ${currentTheme.border}`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2.5 sm:gap-4 text-xs sm:text-sm">
        {/* ส่วนเนื้อหาหลัก */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className="p-1 rounded-md bg-white/15 dark:bg-black/20 shrink-0 flex items-center justify-center">
            {currentTheme.icon}
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
            {/* ป้ายประเภท */}
            <span
              className={`hidden xs:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase shrink-0 ${currentTheme.badge}`}
            >
              {currentTheme.tag}
            </span>

            {/* หัวข้อและข้อความ */}
            <div className="flex items-baseline gap-1.5 min-w-0 text-left">
              <span className={`font-bold tracking-tight shrink-0 ${currentTheme.text}`}>
                {announcement.title}:
              </span>
              <span
                className={`opacity-95 font-medium truncate ${
                  isExpanded ? 'whitespace-normal' : 'truncate'
                } ${currentTheme.text}`}
              >
                {announcement.message}
              </span>

              {/* ปุ่มขยายข้อความบนหน้าจอมือถือถ้าข้อความยาว */}
              {announcement.message.length > 50 && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="sm:hidden text-[10px] underline underline-offset-2 opacity-80 hover:opacity-100 shrink-0 ml-1 text-white"
                >
                  {isExpanded ? 'ย่อ' : 'อ่านต่อ'}
                </button>
              )}
            </div>

            {/* ลิงก์รายละเอียดถ้ามี */}
            {announcement.linkUrl && (
              <a
                href={announcement.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-white/95 hover:text-white underline underline-offset-4 hover:opacity-90 transition shrink-0 ml-1 sm:ml-2 text-xs"
              >
                <span>{announcement.linkText || 'ดูรายละเอียด'}</span>
                <ExternalLink size={12} className="stroke-[2.5]" />
              </a>
            )}
          </div>
        </div>

        {/* ปุ่มกากบาทปิด (ถ้าอนุญาตให้ปิดได้) */}
        {announcement.dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="ปิดแถบประกาศนี้"
            title="ปิดประกาศนี้"
            className="p-1.5 sm:p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 active:scale-90 transition-all flex items-center justify-center shrink-0 min-w-[32px] min-h-[32px] sm:min-w-0 sm:min-h-0"
          >
            <X size={15} className="stroke-[2.5]" />
          </button>
        )}
      </div>
    </aside>
  );
}
