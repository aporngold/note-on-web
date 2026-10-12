import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Image,
  Music,
  Video,
  File,
  HardDrive,
  ExternalLink,
  Search,
  Filter,
  ArrowUpDown,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Download,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  storageAnalyticsService,
  UserStorageDetailResponse,
  UserFileItem,
  StorageCategory,
} from '@/services/storageAnalyticsService';

interface UserStorageDetailModalProps {
  userId: string | null;
  onClose: () => void;
}

export default function UserStorageDetailModal({ userId, onClose }: UserStorageDetailModalProps) {
  const [data, setData] = useState<UserStorageDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | StorageCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ACTIVE' | 'IN_TRASH'>('all');
  const [sortBy, setSortBy] = useState<'size_desc' | 'size_asc' | 'date_desc' | 'date_asc'>('size_desc');

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    setIsLoading(true);

    storageAnalyticsService
      .getUserDetail(userId)
      .then((res) => {
        if (isMounted) setData(res);
      })
      .catch((err) => {
        console.error('Failed to load user storage details:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (!userId) return null;

  // Filter & Sort
  const filteredFiles = (data?.files || []).filter((f) => {
    if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && f.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        f.originalName.toLowerCase().includes(q) ||
        f.filename.toLowerCase().includes(q) ||
        f.noteTitle.toLowerCase().includes(q) ||
        f.mimeType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  filteredFiles.sort((a, b) => {
    if (sortBy === 'size_desc') return b.sizeBytes - a.sizeBytes;
    if (sortBy === 'size_asc') return a.sizeBytes - b.sizeBytes;
    if (sortBy === 'date_desc') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'date_asc') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    return 0;
  });

  const getCategoryIcon = (cat: StorageCategory) => {
    switch (cat) {
      case 'image':
        return <Image size={15} className="text-blue-500" />;
      case 'audio':
        return <Music size={15} className="text-purple-500" />;
      case 'video':
        return <Video size={15} className="text-rose-500" />;
      case 'document':
        return <FileText size={15} className="text-emerald-500" />;
      default:
        return <File size={15} className="text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] my-auto overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shrink-0">
              <HardDrive size={22} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg truncate">
                  {data?.user.username || 'กำลังโหลด...'}
                </h3>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {data?.user.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {data?.user.email} • ID: <code className="text-[11px] font-mono">{userId}</code>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <div className="w-9 h-9 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-400">กำลังสแกนและคำนวณขนาดไฟล์จริง...</p>
            </div>
          ) : !data ? (
            <div className="py-12 text-center text-rose-500 text-sm">
              ไม่สามารถโหลดข้อมูลผู้ใช้งานได้
            </div>
          ) : (
            <>
              {/* User Metric Overview Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/20">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                    พื้นที่จัดเก็บไฟล์รวม
                  </span>
                  <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400">
                    {data.user.totalSizeFormatted}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    ({data.user.totalSizeBytes.toLocaleString()} ไบต์)
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-blue-500/5 dark:bg-blue-950/20 border border-blue-500/20">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                    รูปภาพ (Images)
                  </span>
                  <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400">
                    {data.user.categories.image.sizeFormatted}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {data.user.categories.image.count} ไฟล์
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-purple-500/5 dark:bg-purple-950/20 border border-purple-500/20">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                    ไฟล์เสียง (Audio)
                  </span>
                  <span className="text-base sm:text-lg font-black text-purple-600 dark:text-purple-400">
                    {data.user.categories.audio.sizeFormatted}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {data.user.categories.audio.count} ไฟล์
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">
                    เอกสาร (Documents)
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {data.user.categories.document.sizeFormatted}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {data.user.categories.document.count} ไฟล์
                  </span>
                </div>
              </div>

              {/* Search, Filter & Sort Bar */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อไฟล์ หรือโน้ต..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
                  >
                    <option value="all">ทุกหมวดหมู่</option>
                    <option value="image">รูปภาพ (Images)</option>
                    <option value="audio">ไฟล์เสียง (Audio)</option>
                    <option value="video">วิดีโอ (Video)</option>
                    <option value="document">เอกสาร (Documents)</option>
                    <option value="other">ไฟล์อื่น ๆ</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
                  >
                    <option value="all">ทุกสถานะ</option>
                    <option value="ACTIVE">เฉพาะในโน้ตที่ Active</option>
                    <option value="IN_TRASH">เฉพาะในถังขยะ (In Trash)</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
                  >
                    <option value="size_desc">ขนาด: ใหญ่ไปเล็ก (Default)</option>
                    <option value="size_asc">ขนาด: เล็กไปใหญ่</option>
                    <option value="date_desc">วันที่: ล่าสุดก่อน</option>
                    <option value="date_asc">วันที่: เก่าสุดก่อน</option>
                  </select>
                </div>
              </div>

              {/* Files Table / List */}
              <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs bg-white dark:bg-slate-900">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">ไฟล์ & ประเภท</th>
                        <th className="px-4 py-3 text-right">ขนาดจริง (Bytes)</th>
                        <th className="px-4 py-3">โน้ตที่แนบ</th>
                        <th className="px-4 py-3 text-center">สถานะโน้ต</th>
                        <th className="px-4 py-3 text-center">สถานะไฟล์จริง</th>
                        <th className="px-4 py-3">วันที่อัปโหลด</th>
                        <th className="px-4 py-3 text-right">การกระทำ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                      {filteredFiles.map((file) => (
                        <tr key={file.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          {/* File Name & Category */}
                          <td className="px-4 py-3 max-w-xs">
                            <div className="flex items-center gap-2.5">
                              <span className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                                {getCategoryIcon(file.category)}
                              </span>
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 dark:text-white truncate" title={file.originalName}>
                                  {file.originalName}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono truncate" title={file.filename}>
                                  {file.filename}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Size */}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {file.sizeFormatted}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {file.sizeBytes.toLocaleString()} B
                            </span>
                          </td>

                          {/* Note Title */}
                          <td className="px-4 py-3 max-w-xs truncate text-slate-700 dark:text-slate-300">
                            {file.noteTitle}
                          </td>

                          {/* Note Status */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {file.isArchived ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-800/60">
                                <Trash2 size={10} />
                                <span>ในถังขยะ</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                                <span>Active</span>
                              </span>
                            )}
                          </td>

                          {/* Disk Status */}
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {file.existsOnDisk ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400" title="พบไฟล์จริงบนโฟลเดอร์ uploads/">
                                <CheckCircle2 size={13} />
                                <span className="hidden sm:inline">พร้อมใช้งาน</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500" title="ไฟล์จริงสูญหายหรือถูกลบออกจากดิสก์แล้ว">
                                <AlertTriangle size={13} />
                                <span className="hidden sm:inline">ไฟล์หาย (Missing)</span>
                              </span>
                            )}
                          </td>

                          {/* Upload Date */}
                          <td className="px-4 py-3 text-slate-400 text-[11px] whitespace-nowrap">
                            {new Date(file.createdAt).toLocaleDateString('th-TH')}
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {file.existsOnDisk && (
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 inline-flex items-center justify-center transition"
                                title="เปิดดูหรือดาวน์โหลดไฟล์นี้"
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}

                      {filteredFiles.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-10 text-slate-400 text-xs">
                            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                              ? 'ไม่พบไฟล์แนบที่ตรงตามเงื่อนไขการค้นหา'
                              : 'ผู้ใช้นี้ยังไม่มีไฟล์แนบในระบบ'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 bg-slate-50/30 dark:bg-slate-800/20">
          <span>
            แสดงผล {filteredFiles.length} จากทั้งหมด {data?.files.length || 0} ไฟล์
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
