import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Users,
  FileText,
  LayoutGrid,
  Database,
  History,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  HardDrive,
  UserCheck,
  Lock,
  Unlock,
  Key,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Save,
  Check,
  X,
  Sparkles,
  Download,
  RotateCcw,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useAuthStore } from '@/store/authStore';
import {
  adminService,
  AdminStats,
  AdminUserItem,
  BoardStatItem,
  DatabaseInfo,
  BackupRecordItem,
  PhysicalBackupFile,
  AuditLogItem,
} from '@/services/adminService';
import toast from 'react-hot-toast';

type AdminTab = 'overview' | 'users' | 'boards' | 'database' | 'audit';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuthStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Data States
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [usersPagination, setUsersPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 10 });
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');

  // Boards
  const [boardsData, setBoardsData] = useState<{
    summary: { totalBoards: number; fullBoardsCount: number; nearFullBoardsCount: number; maxNotesLimit: number };
    boards: BoardStatItem[];
  } | null>(null);

  // Database & Backup
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [backups, setBackups] = useState<{ records: BackupRecordItem[]; physicalFiles: PhysicalBackupFile[] }>({
    records: [],
    physicalFiles: [],
  });
  const [backupNote, setBackupNote] = useState('');
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditPagination, setAuditPagination] = useState({ total: 0, totalPages: 1, page: 1, limit: 15 });

  // Role Change Modal
  const [selectedUserForRole, setSelectedUserForRole] = useState<AdminUserItem | null>(null);
  const [newRole, setNewRole] = useState<'USER' | 'ADMIN' | 'SUPER_ADMIN'>('USER');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // Delete User Modal State
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<AdminUserItem | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Restore Modal State
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<string | null>(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  // Security Gate: Check Role
  useEffect(() => {
    if (!isAuthLoading && user) {
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        toast.error('การเข้าถึงถูกปฏิเสธ: คุณไม่มีสิทธิ์เข้าถึงส่วนผู้ดูแลระบบ');
        router.push('/dashboard');
      }
    }
  }, [user, isAuthLoading, router]);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  // Load Tab Data
  const loadStats = useCallback(async () => {
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (err: any) {
      toast.error('ไม่สามารถโหลดข้อมูลสถิติภาพรวมได้');
    }
  }, []);

  const loadUsers = useCallback(async (page = 1, search = userSearch, role = userRoleFilter) => {
    try {
      const data = await adminService.getUsers({ page, limit: 10, search, role });
      setUsers(data.users);
      setUsersPagination(data.pagination);
    } catch (err: any) {
      toast.error('ไม่สามารถโหลดรายชื่อผู้ใช้ได้');
    }
  }, [userSearch, userRoleFilter]);

  const loadBoards = useCallback(async () => {
    try {
      const data = await adminService.getBoardsStats();
      setBoardsData(data);
    } catch (err: any) {
      toast.error('ไม่สามารถโหลดสถิติกกระดานได้');
    }
  }, []);

  const loadDatabaseAndBackups = useCallback(async () => {
    try {
      const [db, bks] = await Promise.all([
        adminService.getDatabaseInfo(),
        adminService.getBackupsList(),
      ]);
      setDbInfo(db);
      setBackups(bks);
    } catch (err: any) {
      toast.error('ไม่สามารถโหลดข้อมูลฐานข้อมูลได้');
    }
  }, []);

  const loadAuditLogs = useCallback(async (page = 1) => {
    try {
      const data = await adminService.getAuditLogs({ page, limit: 15 });
      setAuditLogs(data.logs);
      setAuditPagination(data.pagination);
    } catch (err: any) {
      toast.error('ไม่สามารถโหลดบันทึกประวัติกิจกรรมได้');
    }
  }, []);

  const refreshCurrentTab = useCallback(async () => {
    setIsLoading(true);
    if (activeTab === 'overview') await loadStats();
    else if (activeTab === 'users') await loadUsers(usersPagination.page);
    else if (activeTab === 'boards') await loadBoards();
    else if (activeTab === 'database') await loadDatabaseAndBackups();
    else if (activeTab === 'audit') await loadAuditLogs(auditPagination.page);
    setIsLoading(false);
  }, [activeTab, loadStats, loadUsers, usersPagination.page, loadBoards, loadDatabaseAndBackups, loadAuditLogs, auditPagination.page]);

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      refreshCurrentTab();
    }
  }, [activeTab, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle Search Users
  const handleUserSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers(1, userSearch, userRoleFilter);
  };

  // Handle Role Change
  const handleOpenRoleModal = (targetUser: AdminUserItem) => {
    if (!isSuperAdmin) {
      toast.error('เฉพาะ Super Admin เท่านั้นที่สามารถเปลี่ยนสิทธิ์ผู้ใช้ได้');
      return;
    }
    if (targetUser.id === user?.id) {
      toast.error('ไม่สามารถเปลี่ยนสิทธิ์ของบัญชีตนเองได้');
      return;
    }
    setSelectedUserForRole(targetUser);
    setNewRole(targetUser.role);
  };

  const handleSaveRole = async () => {
    if (!selectedUserForRole) return;
    setIsUpdatingRole(true);
    try {
      const res = await adminService.updateUserRole(selectedUserForRole.id, newRole);
      toast.success(res.message);
      setSelectedUserForRole(null);
      loadUsers(usersPagination.page);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // Handle Open Delete User Modal
  const handleOpenDeleteUserModal = (targetUser: AdminUserItem) => {
    if (!isSuperAdmin) {
      toast.error('เฉพาะ Super Admin เท่านั้นที่สามารถลบผู้ใช้งานได้');
      return;
    }
    if (targetUser.id === user?.id) {
      toast.error('ไม่สามารถลบบัญชีของตนเองได้');
      return;
    }
    setSelectedUserForDelete(targetUser);
  };

  // Handle Confirm Delete User
  const handleConfirmDeleteUser = async () => {
    if (!selectedUserForDelete) return;
    setIsDeletingUser(true);
    try {
      const res = await adminService.deleteUser(selectedUserForDelete.id);
      toast.success(res.message);
      setSelectedUserForDelete(null);
      loadUsers(usersPagination.page);
      loadStats();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาดในการลบผู้ใช้');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Handle Manual Backup
  const handleTriggerBackup = async () => {
    setIsBackingUp(true);
    try {
      const res = await adminService.triggerBackup(backupNote || undefined);
      toast.success(res.message);
      setBackupNote('');
      loadDatabaseAndBackups();
      if (stats) loadStats();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'ไม่สามารถสำรองฐานข้อมูลได้');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Handle Download Backup (.db)
  const handleDownloadBackup = async (filename: string) => {
    try {
      toast.loading(`กำลังเตรียมดาวน์โหลด ${filename}...`, { id: 'download-backup' });
      const blob = await adminService.downloadBackup(filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`ดาวน์โหลด ${filename} เรียบร้อย`, { id: 'download-backup' });
    } catch (err: any) {
      toast.error('ไม่สามารถดาวน์โหลดไฟล์สำรองได้', { id: 'download-backup' });
    }
  };

  // Handle Open Restore Modal
  const handleOpenRestoreModal = (filename: string) => {
    if (!isSuperAdmin) {
      toast.error('เฉพาะ Super Admin เท่านั้นที่สามารถสั่งกู้คืนฐานข้อมูลได้');
      return;
    }
    setSelectedBackupForRestore(filename);
    setRestoreConfirmText('');
  };

  // Handle Confirm Restore
  const handleConfirmRestore = async () => {
    if (!selectedBackupForRestore) return;
    if (restoreConfirmText !== 'CONFIRM_RESTORE') {
      toast.error('กรุณากรอกคำว่า CONFIRM_RESTORE ให้ถูกต้อง');
      return;
    }

    setIsRestoring(true);
    try {
      const res = await adminService.restoreDatabase(selectedBackupForRestore, restoreConfirmText);
      toast.success(res.message, { duration: 6000 });
      setSelectedBackupForRestore(null);
      setRestoreConfirmText('');
      loadDatabaseAndBackups();
      loadStats();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาดในการกู้คืนฐานข้อมูล');
    } finally {
      setIsRestoring(false);
    }
  };

  // Handle Export Audit Logs to CSV
  const handleExportAuditLogs = () => {
    if (auditLogs.length === 0) {
      toast.error('ไม่มีรายการบันทึกสำหรับส่งออก');
      return;
    }

    const headers = ['วันที่/เวลา', 'ผู้ดำเนินการ (Admin)', 'สิทธิ์', 'การกระทำ (Action)', 'เป้าหมาย (Target)', 'รายละเอียด', 'IP Address', 'ผลลัพธ์'];
    const rows = auditLogs.map((l) => [
      `"${new Date(l.createdAt).toLocaleString('th-TH')}"`,
      `"${l.admin?.username || l.adminId}"`,
      `"${l.admin?.role || '-'}"`,
      `"${l.action}"`,
      `"${l.target || '-'}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.ipAddress || '-'}"`,
      `"${l.result}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success('ส่งออกรายงาน Audit Logs (CSV) สำเร็จ');
  };

  if (isAuthLoading || !user) {
    return (
      <Layout showSearch={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <span className="text-slate-400 text-sm">กำลังตรวจสอบสิทธิ์ผู้ดูแลระบบ...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showSearch={false}>
      <Head>
        <title>Admin Dashboard — NoteAll</title>
      </Head>

      <div className="max-w-7xl mx-auto space-y-6 pb-12">
        {/* Top Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/20 shadow-2xl p-6 sm:p-8">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <ShieldCheck size={22} />
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  แผงควบคุมระบบ (Admin Dashboard)
                </h1>
              </div>
              <p className="text-slate-400 text-sm max-w-xl">
                ศูนย์กลางการจัดการระบบ ตรวจสอบความปลอดภัย ดูสถิติกกระดาน 56 แผ่น และดูแลฐานข้อมูล NoteAll
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Role Badge */}
              <div
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border shadow-sm ${
                  isSuperAdmin
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 shadow-amber-500/10'
                    : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/40 shadow-indigo-500/10'
                }`}
              >
                <Sparkles size={14} className={isSuperAdmin ? 'text-amber-400' : 'text-indigo-400'} />
                <span>{user.role}</span>
              </div>

              {/* Refresh Button */}
              <button
                onClick={refreshCurrentTab}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition"
                title="รีเฟรชข้อมูล"
              >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">รีเฟรช</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Shield size={16} />
            <span>ภาพรวม (Overview)</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users size={16} />
            <span>ผู้ใช้งาน & สิทธิ์ ({stats?.users.total || users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('boards')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'boards'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <LayoutGrid size={16} />
            <span>กระดาน & โน้ต (บอร์ด 56 แผ่น)</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'database'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <HardDrive size={16} />
            <span>ฐานข้อมูล & การสำรอง</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <History size={16} />
            <span>ประวัติกิจกรรม (Audit Logs)</span>
          </button>
        </div>

        {/* ────────────── TAB 1: OVERVIEW ────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stat Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Users Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">ผู้ใช้ทั้งหมด</span>
                  <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500"><Users size={18} /></span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {stats?.users.total ?? '-'}
                  </span>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                    <span>Super Admin: <b className="text-amber-500">{stats?.users.superAdmins}</b></span>
                    <span>•</span>
                    <span>Admin: <b className="text-indigo-500">{stats?.users.admins}</b></span>
                  </div>
                </div>
              </div>

              {/* Notes Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">โน้ตทั้งหมด</span>
                  <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><FileText size={18} /></span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {stats?.notes.total ?? '-'}
                  </span>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="text-emerald-500 font-semibold">{stats?.notes.unlocked} ทั่วไป</span>
                    <span>•</span>
                    <span className="text-amber-500 font-semibold">{stats?.notes.locked} ห้องนิรภัย</span>
                  </div>
                </div>
              </div>

              {/* Boards Card (56 limit rule) */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">กระดาน (Boards)</span>
                  <span className="p-2 rounded-xl bg-purple-500/10 text-purple-500"><LayoutGrid size={18} /></span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {stats?.boards.total ?? '-'}
                  </span>
                  <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span>จำกัด 56 โน้ต/บอร์ด</span>
                    {stats?.boards.full ? (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 font-bold">
                        {stats.boards.full} บอร์ดเต็ม
                      </span>
                    ) : (
                      <span className="text-emerald-500">ความจุเพียงพอ</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Database & Backup Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">ขนาดฐานข้อมูล</span>
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><Database size={18} /></span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {stats?.database.sizeFormatted ?? '-'}
                  </span>
                  <div className="mt-1 text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
                    <span>สำรองล่าสุด:</span>
                    <span className="text-slate-300 font-medium">
                      {stats?.backup.lastBackupAt
                        ? new Date(stats.backup.lastBackupAt).toLocaleDateString('th-TH')
                        : 'ยังไม่เคยสำรอง'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Privacy Guarantee */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Privacy Notice Box */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/60 border border-indigo-500/30 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Lock size={20} />
                  </div>
                  <h3 className="text-base font-bold text-white">การันตีความปลอดภัยและสิทธิส่วนบุคคล (Privacy & E2EE)</h3>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed mb-4">
                  ระบบแอดมินถูกออกแบบภายใต้หลักสากล <b>Zero-Knowledge</b> — ผู้ดูแลระบบและเซิร์ฟเวอร์
                  <b>ไม่สามารถเห็นรหัสผ่านจริง</b> และ <b>ไม่สามารถอ่านเนื้อหาโน้ตในห้องนิรภัย</b> ของผู้ใช้งานได้ 
                  แอดมินสามารถดูเฉพาะตัวเลขสถิติภาพรวมและการจัดการระบบเท่านั้น
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-slate-400 block mb-0.5">โน้ตในห้องนิรภัย</span>
                    <span className="font-bold text-amber-400">{stats?.notes.locked} ฉบับ (เข้ารหัส E2EE)</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-slate-400 block mb-0.5">กุญแจ Passkeys ในระบบ</span>
                    <span className="font-bold text-indigo-400">{stats?.passkeys.total} บัญชีเปิดใช้</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60">
                    <span className="text-slate-400 block mb-0.5">สมุดบันทึก & ป้ายกำกับ</span>
                    <span className="font-bold text-emerald-400">
                      {(stats?.notebooks.total || 0) + (stats?.labels.total || 0)} รายการ
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Admin Actions Box */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                    คำสั่งด่วน (Quick Tools)
                  </h3>
                  <div className="space-y-2.5">
                    <button
                      onClick={() => setActiveTab('database')}
                      className="w-full py-2.5 px-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-between transition"
                    >
                      <span className="flex items-center gap-2"><HardDrive size={15} /> สำรองฐานข้อมูลทันที</span>
                      <ArrowUpRight size={14} />
                    </button>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-between transition"
                    >
                      <span className="flex items-center gap-2"><Users size={15} /> ดูรายชื่อผู้ใช้งานทั้งหมด</span>
                      <ArrowUpRight size={14} />
                    </button>
                    <button
                      onClick={() => setActiveTab('boards')}
                      className="w-full py-2.5 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-between transition"
                    >
                      <span className="flex items-center gap-2"><LayoutGrid size={15} /> ตรวจสอบความจุกระดาน (56 แผ่น)</span>
                      <ArrowUpRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ────────────── TAB 2: USERS & ROLES ────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <form onSubmit={handleUserSearchSubmit} className="relative w-full sm:w-80">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="ค้นหาด้วยอีเมล หรือ ชื่อผู้ใช้..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </form>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Filter size={15} className="text-slate-400 hidden sm:inline" />
                <select
                  value={userRoleFilter}
                  onChange={(e) => {
                    setUserRoleFilter(e.target.value);
                    loadUsers(1, userSearch, e.target.value);
                  }}
                  className="px-3 py-2 rounded-xl text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">ทุกระดับสิทธิ์ (All Roles)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (สูงสุด)</option>
                  <option value="ADMIN">ADMIN (แอดมิน)</option>
                  <option value="USER">USER (ผู้ใช้ทั่วไป)</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <table className="w-full text-left text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">ผู้ใช้งาน (User)</th>
                    <th className="px-4 py-3.5">สิทธิ์ (Role)</th>
                    <th className="px-4 py-3.5 hidden md:table-cell">การยืนยันตัวตน</th>
                    <th className="px-4 py-3.5">โน้ต / บอร์ด</th>
                    <th className="px-4 py-3.5 hidden sm:table-cell">วันที่สมัคร</th>
                    <th className="px-4 py-3.5 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {users.map((u) => {
                    const isSelf = u.id === user.id;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>{u.username}</span>
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-bold">
                                บัญชีคุณ
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-[180px] sm:max-w-none">
                            {u.email}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              u.role === 'SUPER_ADMIN'
                                ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                                : u.role === 'ADMIN'
                                ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/30'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {u.role === 'SUPER_ADMIN' ? '👑 ' : ''}
                            {u.role}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <span className="capitalize">{u.authProvider}</span>
                            {u.hasMasterPassword && (
                              <span className="p-1 rounded bg-amber-500/10 text-amber-500" title="ตั้งค่า Master Password แล้ว">
                                <Lock size={12} />
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="text-xs">
                            <span className="font-bold text-slate-900 dark:text-white">{u._count.notes}</span>
                            <span className="text-slate-400"> โน้ต / </span>
                            <span className="font-bold text-slate-900 dark:text-white">{u._count.boards}</span>
                            <span className="text-slate-400"> บอร์ด</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 hidden sm:table-cell text-xs text-slate-400">
                          {new Date(u.createdAt).toLocaleDateString('th-TH')}
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenRoleModal(u)}
                              disabled={!isSuperAdmin || isSelf}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                                !isSuperAdmin || isSelf
                                  ? 'text-slate-400 cursor-not-allowed opacity-50'
                                  : 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800'
                              }`}
                              title={
                                !isSuperAdmin
                                  ? 'เฉพาะ Super Admin เท่านั้นที่เปลี่ยนสิทธิ์ได้'
                                  : isSelf
                                  ? 'ไม่สามารถเปลี่ยนสิทธิ์ตนเองได้'
                                  : 'เปลี่ยนระดับสิทธิ์'
                              }
                            >
                              เปลี่ยนสิทธิ์
                            </button>

                            <button
                              onClick={() => handleOpenDeleteUserModal(u)}
                              disabled={!isSuperAdmin || isSelf}
                              className={`p-1.5 rounded-xl text-xs font-semibold transition ${
                                !isSuperAdmin || isSelf
                                  ? 'text-slate-400 cursor-not-allowed opacity-30'
                                  : 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                              }`}
                              title={
                                !isSuperAdmin
                                  ? 'เฉพาะ Super Admin เท่านั้นที่ลบผู้ใช้ได้'
                                  : isSelf
                                  ? 'ไม่สามารถลบบัญชีตนเองได้'
                                  : 'ลบบัญชีผู้ใช้ถาวร'
                              }
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        ไม่พบผู้ใช้งานตามเงื่อนไขที่ค้นหา
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {usersPagination.totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-slate-500 px-2">
                <span>
                  หน้า {usersPagination.page} จาก {usersPagination.totalPages} (ผู้ใช้ทั้งหมด {usersPagination.total} คน)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={usersPagination.page <= 1}
                    onClick={() => loadUsers(usersPagination.page - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={usersPagination.page >= usersPagination.totalPages}
                    onClick={() => loadUsers(usersPagination.page + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ────────────── TAB 3: BOARDS & 56 NOTES LIMIT ────────────── */}
        {activeTab === 'boards' && (
          <div className="space-y-6">
            {/* Limit Explanation Banner */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-start gap-3 text-xs sm:text-sm">
              <span className="p-1.5 rounded-lg bg-amber-500/20 shrink-0"><LayoutGrid size={18} /></span>
              <div>
                <b className="font-bold">กฎการควบคุมความจุของกระดาน (Sticky Board Rule):</b>{' '}
                แต่ละกระดานจำกัดจำนวนโน้ตสูงสุดที่ <b>56 แผ่น</b> (`MAX_NOTES_PER_BOARD = 56`) 
                เพื่อประสิทธิภาพสูงสุดของระบบ Drag-and-Drop และการแสดงผลบนหน้าจอทั้ง Desktop และ Mobile
              </div>
            </div>

            {/* Boards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {boardsData?.boards.map((b) => {
                const percent = Math.min(100, Math.round((b.notesCount / b.maxCapacity) * 100));
                return (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: b.color || '#FCD34D' }}
                          />
                          <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                            {b.name}
                          </h4>
                        </div>
                        {b.isFull ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500 text-white animate-pulse">
                            เต็ม (FULL)
                          </span>
                        ) : b.notesCount >= 45 ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-500">
                            ใกล้เต็ม
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                            ปกติ
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-slate-400 mb-4">
                        เจ้าของ: <span className="font-medium text-slate-600 dark:text-slate-300">{b.owner.username}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">ความจุโน้ต:</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {b.notesCount} / {b.maxCapacity} แผ่น
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 rounded-full ${
                              b.isFull
                                ? 'bg-rose-500'
                                : b.notesCount >= 45
                                ? 'bg-amber-500'
                                : 'bg-indigo-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-slate-400 text-right">
                          {b.isFull ? 'ไม่มีพื้นที่เหลือ' : `เหลืออีก ${b.remainingCapacity} แผ่น`}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{b.isPublic ? '🌐 สาธารณะ' : '🔒 ส่วนตัว'}</span>
                      <span>แก้ไขล่าสุด: {new Date(b.updatedAt).toLocaleDateString('th-TH')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ────────────── TAB 4: DATABASE & BACKUP ────────────── */}
        {activeTab === 'database' && (
          <div className="space-y-6">
            {/* DB Status & Trigger Backup Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* SQLite Health Info */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500"><Database size={20} /></span>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base">ฐานข้อมูล SQLite</h3>
                    <span className="text-xs text-slate-400">{dbInfo?.filePath}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800/60">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-400">ขนาดไฟล์บน Disk:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{dbInfo?.sizeFormatted}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-400">การตรวจสอบความสมบูรณ์:</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/10 text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 size={13} /> {dbInfo?.integrityCheck}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-400">อัปเดตล่าสุด:</span>
                    <span className="text-slate-300">
                      {dbInfo?.lastModified ? new Date(dbInfo.lastModified).toLocaleString('th-TH') : '-'}
                    </span>
                  </div>
                </div>

                {/* Table Row Counts */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    จำนวนรายการในตาราง
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      ผู้ใช้: <b>{dbInfo?.tables.users}</b>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      โน้ต: <b>{dbInfo?.tables.notes}</b>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      กระดาน: <b>{dbInfo?.tables.boards}</b>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      สมุดบันทึก: <b>{dbInfo?.tables.notebooks}</b>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instant Backup Box */}
              <div className="lg:col-span-2 p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Save size={20} />
                    </span>
                    <div>
                      <h3 className="font-bold text-white text-base">สั่งสำรองฐานข้อมูลทันที (Create Snapshot)</h3>
                      <p className="text-xs text-slate-400">
                        สร้างชุดสำรองไฟล์ dev.db พร้อมระบุหมายเหตุ เพื่อป้องกันความผิดพลาดและเก็บประวัติ
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-3">
                    <label className="text-xs text-slate-300 font-medium block">
                      หมายเหตุการสำรอง (Optional Note):
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น: สำรองก่อนอัปเดตระบบ หรือ สำรองประจำสัปดาห์..."
                      value={backupNote}
                      onChange={(e) => setBackupNote(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl text-xs sm:text-sm bg-slate-800/80 border border-slate-700 text-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
                  <span className="text-[11px] text-slate-400">
                    * ระบบจะจัดเก็บสำรองสูงสุด 15 ไฟล์ล่าสุด และหมุนเวียนล้างไฟล์เก่าอัตโนมัติ
                  </span>
                  <button
                    onClick={handleTriggerBackup}
                    disabled={isBackingUp}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
                  >
                    <Save size={16} className={isBackingUp ? 'animate-spin' : ''} />
                    <span>{isBackingUp ? 'กำลังสำรองข้อมูล...' : 'กดสำรองข้อมูลเดี๋ยวนี้'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Backups List Table */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                <History size={17} /> รายการไฟล์สำรองข้อมูล (Backups History)
              </h4>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                <table className="w-full text-left text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-4 py-3.5">ชื่อไฟล์สำรอง (.db)</th>
                      <th className="px-4 py-3.5">ขนาด</th>
                      <th className="px-4 py-3.5 hidden sm:table-cell">ผู้สั่งสำรอง</th>
                      <th className="px-4 py-3.5 hidden md:table-cell">หมายเหตุ</th>
                      <th className="px-4 py-3.5">วันที่ / เวลา</th>
                      <th className="px-4 py-3.5 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {backups.physicalFiles.map((f, idx) => {
                      const matchedRecord = backups.records.find((r) => r.filename === f.name);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                          <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900 dark:text-white">
                            {f.name}
                          </td>
                          <td className="px-4 py-3 text-xs">{f.sizeFormatted}</td>
                          <td className="px-4 py-3 text-xs hidden sm:table-cell text-slate-400">
                            {matchedRecord?.triggerBy || 'System / CLI'}
                          </td>
                          <td className="px-4 py-3 text-xs hidden md:table-cell text-slate-400">
                            {matchedRecord?.note || '-'}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-400">
                            {new Date(f.mtime).toLocaleString('th-TH')}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Download Button */}
                              <button
                                onClick={() => handleDownloadBackup(f.name)}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition"
                                title="ดาวน์โหลดไฟล์ .db ลงเครื่องคอมพิวเตอร์"
                              >
                                <Download size={14} />
                              </button>

                              {/* Restore Button (Super Admin only) */}
                              <button
                                onClick={() => handleOpenRestoreModal(f.name)}
                                disabled={!isSuperAdmin}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                                  !isSuperAdmin
                                    ? 'text-slate-400 opacity-40 cursor-not-allowed'
                                    : 'bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                                }`}
                                title={!isSuperAdmin ? 'เฉพาะ Super Admin เท่านั้นที่กู้คืนข้อมูลได้' : 'กู้คืนฐานข้อมูล (Restore)'}
                              >
                                <RotateCcw size={13} />
                                <span>กู้คืน</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {backups.physicalFiles.length === 0 && (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-400">
                          ยังไม่มีไฟล์สำรองในโฟลเดอร์ backups/
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ────────────── TAB 5: AUDIT LOGS ────────────── */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">บันทึกประวัติการกระทำของผู้ดูแลระบบ</h3>
                <p className="text-xs text-slate-400">
                  ตรวจสอบทุกคำสั่งที่มีผลต่อระบบ เช่น การเปลี่ยนสิทธิ์ผู้ใช้ และการสั่งสำรองข้อมูล
                </p>
              </div>

              <button
                onClick={handleExportAuditLogs}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto border border-slate-200 dark:border-slate-700"
                title="ส่งออกบันทึกประวัติเป็นไฟล์ CSV"
              >
                <FileSpreadsheet size={15} className="text-emerald-500" />
                <span>ส่งออก CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <table className="w-full text-left text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">วันที่ / เวลา</th>
                    <th className="px-4 py-3.5">ผู้ดำเนินการ (Admin)</th>
                    <th className="px-4 py-3.5">การกระทำ (Action)</th>
                    <th className="px-4 py-3.5 hidden sm:table-cell">เป้าหมาย (Target)</th>
                    <th className="px-4 py-3.5">รายละเอียด</th>
                    <th className="px-4 py-3.5 text-right">ผลลัพธ์</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition">
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('th-TH')}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {log.admin?.username || log.adminId}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-500/10 text-indigo-500 font-mono">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-xs font-mono text-slate-400 truncate max-w-[150px]">
                        {log.target || '-'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-300 max-w-[200px] truncate">
                        {log.details || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                          {log.result}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">
                        ยังไม่มีบันทึกกิจกรรมในระบบ
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {auditPagination.totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-slate-500 px-2">
                <span>
                  หน้า {auditPagination.page} จาก {auditPagination.totalPages} (ทั้งหมด {auditPagination.total} รายการ)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={auditPagination.page <= 1}
                    onClick={() => loadAuditLogs(auditPagination.page - 1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    disabled={auditPagination.page >= auditPagination.totalPages}
                    onClick={() => loadAuditLogs(auditPagination.page + 1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ────────────── ROLE CHANGE MODAL (SUPER_ADMIN ONLY) ────────────── */}
      {selectedUserForRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><Key size={18} /></span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">ปรับเปลี่ยนระดับสิทธิ์ (Role)</h3>
              </div>
              <button
                onClick={() => setSelectedUserForRole(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                ผู้ใช้: <b className="text-slate-900 dark:text-white">{selectedUserForRole.username}</b> ({selectedUserForRole.email})
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">
                  เลือกระดับสิทธิ์ใหม่:
                </label>
                <div className="space-y-2">
                  {[
                    { role: 'USER', label: 'USER (ผู้ใช้งานทั่วไป)', desc: 'เข้าใช้งานโน้ตและบอร์ดของตนเองได้ปกติ' },
                    { role: 'ADMIN', label: 'ADMIN (ผู้ดูแลระบบ)', desc: 'เข้าแผงควบคุม ดูสถิติ และสั่งสำรองข้อมูลได้' },
                    { role: 'SUPER_ADMIN', label: 'SUPER_ADMIN (ผู้ดูแลสูงสุด)', desc: 'มีสิทธิ์เต็มทุกส่วน สามารถเปลี่ยนสิทธิ์ผู้ใช้อื่นได้' },
                  ].map((r) => (
                    <label
                      key={r.role}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        newRole === r.role
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={r.role}
                        checked={newRole === r.role}
                        onChange={() => setNewRole(r.role as any)}
                        className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-xs">{r.label}</div>
                        <div className="text-[11px] text-slate-400">{r.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserForRole(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                disabled={isUpdatingRole}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {isUpdatingRole ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                <span>บันทึกสิทธิ์</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────── RESTORE CONFIRMATION MODAL (SUPER_ADMIN ONLY) ────────────── */}
      {selectedBackupForRestore && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-rose-500/40 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/30">
                  <AlertTriangle size={20} />
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">ยืนยันการกู้คืนฐานข้อมูล (Database Restore)</h3>
              </div>
              <button
                onClick={() => setSelectedBackupForRestore(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs sm:text-sm space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <span>⚠️ คำเตือนความปลอดภัยระดับสูงสุด:</span>
              </div>
              <p className="leading-relaxed">
                การกู้คืนจะนำข้อมูลในไฟล์ <b>"{selectedBackupForRestore}"</b> มาเขียนทับฐานข้อมูลปัจจุบัน 
                ข้อมูลโน้ตและบอร์ดหลังจากวันที่สำรองไฟล์นี้จะถูกย้อนกลับ
              </p>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                🛡️ <b>ด่านป้องกัน:</b> ระบบจะทำการสร้าง Safety Backup ของฐานข้อมูลปัจจุบันเก็บไว้ให้อัตโนมัติทันทีก่อนกู้คืนเสมอ
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                พิมพ์คำว่า <span className="font-mono text-rose-500 font-black">CONFIRM_RESTORE</span> เพื่อปลดล็อก:
              </label>
              <input
                type="text"
                value={restoreConfirmText}
                onChange={(e) => setRestoreConfirmText(e.target.value)}
                placeholder="พิมพ์ CONFIRM_RESTORE ที่นี่..."
                className="w-full px-4 py-2.5 rounded-xl font-mono text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedBackupForRestore(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={restoreConfirmText !== 'CONFIRM_RESTORE' || isRestoring}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 transition"
              >
                {isRestoring ? <RefreshCw size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                <span>{isRestoring ? 'กำลังกู้คืนข้อมูล...' : 'ยืนยันกู้คืนเดี๋ยวนี้'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────── DELETE USER CONFIRMATION MODAL (SUPER_ADMIN ONLY) ────────────── */}
      {selectedUserForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-rose-500/40 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/30">
                  <Trash2 size={20} />
                </span>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">ยืนยันการลบบัญชีผู้ใช้ถาวร</h3>
              </div>
              <button
                onClick={() => setSelectedUserForDelete(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs sm:text-sm space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <span>⚠️ คำเตือนการลบข้อมูล (Irreversible Action):</span>
              </div>
              <p className="leading-relaxed">
                คุณกำลังจะลบบัญชีของ <b>"{selectedUserForDelete.username}"</b> ({selectedUserForDelete.email})
              </p>
              <div className="p-2.5 rounded-xl bg-slate-900/40 border border-rose-500/20 text-xs text-rose-300 space-y-1">
                <div>• โน้ตทั้งหมด ({selectedUserForDelete._count.notes} ฉบับ) จะถูกลบถาวร</div>
                <div>• กระดานบอร์ด ({selectedUserForDelete._count.boards} บอร์ด) จะถูกลบถาวร</div>
                <div>• กุญแจ Passkeys และเซสชันทั้งหมดจะถูกยกเลิกทันที</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedUserForDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteUser}
                disabled={isDeletingUser}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5 transition"
              >
                {isDeletingUser ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{isDeletingUser ? 'กำลังลบข้อมูล...' : 'ยืนยันลบบัญชีนี้ถาวร'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
