import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { 
  ShieldCheck, 
  Lock, 
  ArrowLeft, 
  FileText, 
  Database, 
  Trash2, 
  Download, 
  Bell, 
  UserCheck, 
  Mail, 
  CheckCircle2,
  Cookie,
  Sliders,
  AlertTriangle,
  Loader2,
  ExternalLink,
  Clock,
  Send,
  HelpCircle,
  Eye
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api from '@/utils/api';

interface ConsentRecord {
  id: string;
  consentType: string;
  version: string;
  isGranted: boolean;
  grantedAt?: string;
  revokedAt?: string;
}

interface DataRequest {
  id: string;
  requestType: string;
  status: string;
  details?: string;
  createdAt: string;
  resolvedAt?: string;
}

export default function PrivacyPolicyPage() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  
  // Tab state: 'policy' | 'cookies' | 'rights'
  const [activeTab, setActiveTab] = useState<'policy' | 'cookies' | 'rights'>('policy');

  // Rights tab states
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [requests, setRequests] = useState<DataRequest[]>([]);
  const [isLoadingRights, setIsLoadingRights] = useState<boolean>(false);

  // New Request Form
  const [requestType, setRequestType] = useState<string>('ACCESS');
  const [requestDetails, setRequestDetails] = useState<string>('');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState<boolean>(false);

  // Account Deletion Dialog
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState<string>('');
  const [deletePassword, setDeletePassword] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Load consents and requests when switching to 'rights' tab
  useEffect(() => {
    if (activeTab === 'rights' && token) {
      fetchPrivacyData();
    }
  }, [activeTab, token]);

  const fetchPrivacyData = async () => {
    setIsLoadingRights(true);
    try {
      const [consentsRes, requestsRes] = await Promise.allSettled([
        api.get('/privacy/consents'),
        api.get('/privacy/requests'),
      ]);

      if (consentsRes.status === 'fulfilled') {
        setConsents(consentsRes.value.data.consents || []);
      }
      if (requestsRes.status === 'fulfilled') {
        setRequests(requestsRes.value.data.requests || []);
      }
    } catch (err) {
      console.error('Failed to load privacy data:', err);
    } finally {
      setIsLoadingRights(false);
    }
  };

  // Export User Data (Data Portability)
  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await api.get('/privacy/export-data', { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `note-on-web-export-${user?.username || 'user'}-${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('ส่งออกข้อมูลส่วนบุคคลสำเร็จ (Data Exported Successfully)');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('ไม่สามารถส่งออกข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExporting(false);
    }
  };

  // Toggle or Update Consent
  const handleToggleConsent = async (consentType: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      await api.post('/privacy/consents', {
        consentType,
        isGranted: newStatus,
        version: '2569.1',
      });
      toast.success(newStatus ? 'บันทึกความยินยอมเรียบร้อย' : 'ถอนความยินยอมเรียบร้อย');
      fetchPrivacyData();
    } catch (error) {
      toast.error('เกิดข้อผิดพลาดในการปรับปรุงความยินยอม');
    }
  };

  // Submit Data Subject Request
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestType) return;
    setIsSubmittingRequest(true);
    try {
      await api.post('/privacy/requests', {
        requestType,
        details: requestDetails,
      });
      toast.success('ส่งคำขอใช้สิทธิเรียบร้อย เจ้าหน้าที่จะดำเนินการภายใน 30 วัน');
      setRequestDetails('');
      fetchPrivacyData();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'ไม่สามารถส่งคำขอได้');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Delete Account Permanently
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('กรุณาพิมพ์คำว่า DELETE เพื่อยืนยัน');
      return;
    }
    setIsDeleting(true);
    try {
      await api.post('/privacy/delete-account', {
        confirmText: deleteConfirmText,
        password: deletePassword,
      });
      toast.success('บัญชีของคุณถูกลบออกจากระบบอย่างถาวรแล้ว');
      await logout();
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'เกิดข้อผิดพลาดในการลบบัญชี');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Head>
        <title>ศูนย์ความโปร่งใสและสิทธิข้อมูลส่วนบุคคล (PDPA Portal) — Note on Web</title>
        <meta 
          name="description" 
          content="นโยบายความเป็นส่วนตัวตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) สิทธิของเจ้าของข้อมูล และมาตรฐาน Zero-Knowledge E2EE" 
        />
      </Head>

      {/* Top Header Navigation */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
          >
            <ArrowLeft size={16} />
            <span>กลับหน้าหลัก (Back)</span>
          </Link>

          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-extrabold text-sm sm:text-base">
            <ShieldCheck size={20} />
            <span>Note on Web PDPA 2569</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
        {/* Hero Title Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-purple-50/40 dark:from-slate-900 dark:via-indigo-950/30 dark:to-purple-950/20 border border-indigo-100 dark:border-slate-800 p-6 sm:p-10 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-4 border border-emerald-500/20">
            <CheckCircle2 size={13} />
            <span>สอดคล้องตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) & เกณฑ์ปี 2569</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            ศูนย์ความเป็นส่วนตัวและสิทธิข้อมูลส่วนบุคคล<br className="hidden sm:inline" /> (Privacy & Data Rights)
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            เราให้ความสำคัญสูงสุดกับความโปร่งใส ความมั่นคงปลอดภัย และสิทธิในข้อมูลของท่าน ภายใต้สถาปัตยกรรม <b>Zero-Knowledge Encryption</b> ที่ผู้ดูแลระบบไม่สามารถอ่านข้อความส่วนบุคคลของท่านได้
          </p>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 mt-6 pt-6 border-t border-indigo-100/80 dark:border-slate-800/80">
            <button
              onClick={() => setActiveTab('policy')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
                activeTab === 'policy'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <FileText size={15} />
              <span>ประกาศความเป็นส่วนตัว</span>
            </button>

            <button
              onClick={() => setActiveTab('cookies')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
                activeTab === 'cookies'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Cookie size={15} />
              <span>นโยบายคุกกี้และพื้นที่จัดเก็บ</span>
            </button>

            <button
              onClick={() => setActiveTab('rights')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition ${
                activeTab === 'rights'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Sliders size={15} />
              <span>จัดการสิทธิ์ & ส่งออกข้อมูล (Self-Service)</span>
            </button>
          </div>
        </div>

        {/* TAB 1: PRIVACY NOTICE */}
        {activeTab === 'policy' && (
          <div className="space-y-6 animate-fadeIn">
            {/* 1. บทนำ */}
            <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <FileText size={20} />
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  1. บทนำและบทบาทของผู้ให้บริการ (Data Controller Role)
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                ประกาศความเป็นส่วนตัวนี้จัดทำขึ้นโดย <b>โครงการ Note on Web</b> ในฐานะผู้ควบคุมข้อมูลส่วนบุคคล (Data Controller) เพื่อแจ้งให้ท่านในฐานะเจ้าของข้อมูลส่วนบุคคล (Data Subject) ทราบถึงแนวปฏิบัติในการเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคล รวมถึงมาตรการรักษาความมั่นคงปลอดภัยตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) ของประเทศไทย
              </p>
            </section>

            {/* 2. ข้อมูลที่เก็บรวบรวม */}
            <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <Database size={20} />
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  2. ข้อมูลส่วนบุคคลที่เราจัดเก็บ (Data Minimization)
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                เรายึดหลักการจัดเก็บข้อมูลเท่าที่จำเป็นต่อการให้บริการตามสัญญา (Contractual Necessity) เท่านั้น:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <li className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <b className="text-slate-900 dark:text-white block mb-1">ข้อมูลบัญชีผู้ใช้งาน:</b>
                  อีเมล (Gmail), ชื่อผู้ใช้ (Username), และรหัสผ่านที่เข้ารหัสความปลอดภัยทางเดียว (Password Hash ด้วย bcrypt)
                </li>
                <li className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <b className="text-slate-900 dark:text-white block mb-1">เนื้อหาบันทึกและกระดาน:</b>
                  ข้อความในโน้ต, ป้ายกำกับ, พิกัดโน้ตบนบอร์ด, ไฟล์แนบ, และรายการเตือนความจำที่ท่านสร้างขึ้น
                </li>
                <li className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <b className="text-slate-900 dark:text-white block mb-1">การแจ้งเตือน (Web Push):</b>
                  รหัส Push Subscription Token ประจำอุปกรณ์ เพื่อส่งสัญญาณแจ้งเตือนตามเวลาที่ท่านตั้งไว้
                </li>
                <li className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <b className="text-slate-900 dark:text-white block mb-1">บันทึกความมั่นคงปลอดภัย (Security Logs):</b>
                  หมายเลข IP Address และ User Agent บันทึกเพื่อวัตถุประสงค์ในการป้องกันการบุกรุกและ Anti-DDoS เท่านั้น
                </li>
              </ul>
            </section>

            {/* 3. สถาปัตยกรรม Zero-Knowledge E2EE */}
            <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white to-indigo-500/10 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 border border-amber-500/30 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                  <Lock size={20} />
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  3. มาตรการความปลอดภัยขั้นสูงสุด: Zero-Knowledge E2EE
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                สำหรับบันทึกในหมวด <b>Encrypted Vault Notes</b> ระบบใช้การเข้ารหัสแบบ <b>End-to-End Encryption (AES-GCM 256-bit)</b> โดยกุญแจเข้ารหัสถูกสร้างและจัดเก็บบนเครื่องของท่านเท่านั้น เซิร์ฟเวอร์และผู้ดูแลระบบ Note on Web ไม่สามารถอ่านข้อความหรือกู้คืนรหัสผ่านหลักของท่านได้
              </p>
            </section>

            {/* 4. สิทธิของเจ้าของข้อมูล */}
            <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <UserCheck size={20} />
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  4. สิทธิของท่านตามกฎหมาย PDPA (มาตรา 30-36)
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                  <b className="text-slate-900 dark:text-white">สิทธิขอเข้าถึงและรับสำเนา (Access):</b> ดูและขอรับข้อมูลของท่านได้ตลอดเวลา
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                  <b className="text-slate-900 dark:text-white">สิทธิขอโอนย้ายข้อมูล (Portability):</b> ดาวน์โหลดข้อมูลทั้งหมดในรูปแบบ JSON
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                  <b className="text-slate-900 dark:text-white">สิทธิขอลบข้อมูล (Erasure):</b> สั่งลบโน้ตและบัญชีผู้ใช้ออกจากระบบถาวร
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
                  <b className="text-slate-900 dark:text-white">สิทธิขอแก้ไขข้อมูล (Rectification):</b> ปรับปรุงข้อมูลส่วนตัวให้ถูกต้อง
                </div>
              </div>
              <p className="text-xs text-slate-500 pt-2">
                ท่านสามารถดำเนินการใช้สิทธิแบบอัตโนมัติได้ทันทีผ่านแท็บ <b>"จัดการสิทธิ์ & ส่งออกข้อมูล"</b> ด้านบน
              </p>
            </section>
          </div>
        )}

        {/* TAB 2: COOKIES & LOCAL STORAGE */}
        {activeTab === 'cookies' && (
          <div className="space-y-6 animate-fadeIn">
            <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <Cookie size={20} />
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  นโยบายการจัดเก็บข้อมูลบนเบราว์เซอร์ (Web Storage Policy)
                </h2>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm">
                <b>ความโปร่งใสสูงสุด:</b> ระบบ Note on Web <b>ไม่มีการใช้ HTTP Cookies เพื่อการติดตามพฤติกรรม (No Tracking Cookies)</b> และไม่มีการติดตั้ง Google Analytics, Meta Pixel หรือเครือข่ายโฆษณาใด ๆ ทั้งสิ้น
              </div>

              <h3 className="text-sm font-bold text-slate-900 dark:text-white pt-2">
                รายการ LocalStorage ที่ทำงานบนเครื่องของท่าน:
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">secure_note_token</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">Strictly Necessary</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    จัดเก็บ Token ยืนยันตัวตน (JWT) เพื่อให้ท่านสามารถล็อกอินใช้งานได้อย่างปลอดภัย สิ้นสุดเมื่อออกจากระบบ
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">theme & sound</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">Functional</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    จดจำการเลือกโหมดมืด (Dark Mode) และการเปิด/ปิดเสียงเอฟเฟกต์ เพื่อความสะดวกในการใช้งาน
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* TAB 3: SELF-SERVICE RIGHTS & EXPORT PORTAL */}
        {activeTab === 'rights' && (
          <div className="space-y-6 animate-fadeIn">
            {!token ? (
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-4">
                <Lock size={36} className="mx-auto text-slate-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  กรุณาเข้าสู่ระบบเพื่อจัดการสิทธิข้อมูลส่วนบุคคล
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  การส่งออกข้อมูลส่วนบุคคล (Data Portability) และการยื่นคำร้องตามกฎหมาย PDPA จำเป็นต้องยืนยันตัวตนเจ้าของบัญชีก่อนดำเนินการ
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-md transition"
                >
                  <span>เข้าสู่ระบบ (Sign In)</span>
                </Link>
              </div>
            ) : (
              <>
                {/* Section A: Data Portability (Export) */}
                <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                      <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                        <Download size={20} />
                      </span>
                      <div>
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                          สิทธิขอโอนย้ายข้อมูล (Data Portability — PDPA ม.31)
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          ดาวน์โหลดสำเนาข้อมูลบันทึก บอร์ด ป้ายกำกับ และประวัติบัญชีทั้งหมดในรูปแบบ JSON
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleExportData}
                      disabled={isExporting}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md shadow-indigo-600/20 active:scale-95 transition disabled:opacity-50"
                    >
                      {isExporting ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>กำลังส่งออก...</span>
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          <span>ดาวน์โหลดข้อมูลของฉัน (JSON)</span>
                        </>
                      )}
                    </button>
                  </div>
                </section>

                {/* Section B: Consent Preferences */}
                <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                      <Sliders size={20} />
                    </span>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        จัดการความยินยอม (Consent Preferences — PDPA ม.19)
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ท่านสามารถตรวจสอบและถอนความยินยอมได้ตลอดเวลา
                      </p>
                    </div>
                  </div>

                  {isLoadingRights ? (
                    <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" />
                      <span>กำลังโหลดรายการความยินยอม...</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <b className="text-xs sm:text-sm text-slate-900 dark:text-white block">
                            การแจ้งเตือนเตือนความจำผ่านเบราว์เซอร์ (Web Push Notifications)
                          </b>
                          <span className="text-[11px] text-slate-500">
                            ส่งการแจ้งเตือนเมื่อถึงกำหนดเวลาของโน้ต
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            const current = consents.find(c => c.consentType === 'WEB_PUSH')?.isGranted ?? true;
                            handleToggleConsent('WEB_PUSH', current);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                            consents.find(c => c.consentType === 'WEB_PUSH')?.isGranted !== false
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {consents.find(c => c.consentType === 'WEB_PUSH')?.isGranted !== false ? 'ยินยอม (Granted)' : 'ถอนแล้ว (Revoked)'}
                        </button>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <b className="text-xs sm:text-sm text-slate-900 dark:text-white block">
                            ข้อตกลงการให้บริการและประกาศความเป็นส่วนตัว (Terms & Privacy Notice)
                          </b>
                          <span className="text-[11px] text-slate-500">
                            รับทราบเมื่อสมัครสมาชิก (เวอร์ชัน 2569.1)
                          </span>
                        </div>
                        <span className="px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-600 border border-indigo-500/30">
                          ยอมรับแล้ว
                        </span>
                      </div>
                    </div>
                  )}
                </section>

                {/* Section C: Submit Data Subject Request */}
                <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400">
                      <Send size={20} />
                    </span>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                        ยื่นคำร้องขอใช้สิทธิตามกฎหมาย (Data Subject Request Portal)
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        ดำเนินการตามกรอบเวลา 30 วันตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitRequest} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        ประเภทของสิทธิที่ต้องการใช้:
                      </label>
                      <select
                        value={requestType}
                        onChange={(e) => setRequestType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="ACCESS">ขอเข้าถึงและขอรับสำเนาข้อมูล (Right of Access - ม.30)</option>
                        <option value="DATA_PORTABILITY">ขอรับหรือโอนย้ายข้อมูล (Right to Data Portability - ม.31)</option>
                        <option value="RECTIFICATION">ขอแก้ไขข้อมูลให้ถูกต้อง (Right to Rectification - ม.35)</option>
                        <option value="RESTRICTION">ขอให้ระงับการใช้ข้อมูลชั่วคราว (Right to Restriction - ม.34)</option>
                        <option value="OBJECTION">ขอคัดค้านการประมวลผลข้อมูล (Right to Object - ม.32)</option>
                        <option value="ERASURE">ขอลบหรือทำลายข้อมูลเฉพาะส่วน (Right to Erasure - ม.33)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        รายละเอียดเพิ่มเติม / คำอธิบายคำขอ:
                      </label>
                      <textarea
                        value={requestDetails}
                        onChange={(e) => setRequestDetails(e.target.value)}
                        rows={3}
                        placeholder="ระบุรายละเอียดเพิ่มเติมเพื่อช่วยให้เจ้าหน้าที่ดำเนินการได้อย่างรวดเร็วและถูกต้อง"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingRequest}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md shadow-teal-600/20 transition disabled:opacity-50"
                    >
                      {isSubmittingRequest ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>กำลังส่งคำขอ...</span>
                        </>
                      ) : (
                        <>
                          <Send size={15} />
                          <span>ส่งคำร้องขอใช้สิทธิ (Submit Request)</span>
                        </>
                      )}
                    </button>
                  </form>

                  {/* Active Requests List */}
                  {requests.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        ประวัติคำร้องของคุณ:
                      </h4>
                      <div className="space-y-2">
                        {requests.map((r) => (
                          <div
                            key={r.id}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs"
                          >
                            <div>
                              <b className="text-slate-800 dark:text-slate-200 block">{r.requestType}</b>
                              <span className="text-[11px] text-slate-400">
                                {new Date(r.createdAt).toLocaleDateString('th-TH')}
                              </span>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                              r.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                                : r.status === 'REJECTED'
                                ? 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                                : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                            }`}>
                              {r.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>

                {/* Section D: Danger Zone - Permanent Account Deletion */}
                <section className="p-6 sm:p-8 rounded-3xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 shadow-2xs space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400">
                      <Trash2 size={20} />
                    </span>
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-rose-900 dark:text-rose-200">
                        พื้นที่อันตราย: ขอลบบัญชีผู้ใช้ถาวร (Right to Erasure — PDPA ม.33)
                      </h2>
                      <p className="text-xs text-rose-700/80 dark:text-rose-300/80">
                        เมื่อยืนยันลบบัญชี ข้อมูลบันทึก บอร์ด ป้ายกำกับ และไฟล์แนบทั้งหมดจะถูกทำลายอย่างถาวรและไม่สามารถกู้คืนได้
                      </p>
                    </div>
                  </div>

                  {!showDeleteModal ? (
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-md shadow-rose-600/20 transition"
                    >
                      <Trash2 size={15} />
                      <span>ขอลบบัญชีของฉันอย่างถาวร</span>
                    </button>
                  ) : (
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 space-y-3">
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                        ⚠️ การดำเนินการนี้ไม่สามารถย้อนกลับได้ โปรดพิมพ์คำว่า <b>DELETE</b> และกรอกรหัสผ่านเพื่อยืนยัน:
                      </p>

                      <div className="space-y-2">
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="พิมพ์คำว่า DELETE เพื่อยืนยัน"
                          className="w-full px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                        />
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="รหัสผ่านปัจจุบันของคุณ (ถ้ามี)"
                          className="w-full px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={handleDeleteAccount}
                          disabled={isDeleting || deleteConfirmText !== 'DELETE'}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition"
                        >
                          {isDeleting ? 'กำลังลบข้อมูล...' : 'ยืนยันลบบัญชีถาวร'}
                        </button>
                        <button
                          onClick={() => setShowDeleteModal(false)}
                          className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold hover:bg-slate-200 transition"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              </>
            )}
          </div>
        )}

        {/* Footer Navigation */}
        <footer className="pt-8 border-t border-slate-200/80 dark:border-slate-800 text-center space-y-2 text-xs text-slate-500">
          <p>© 2569 โครงการ Note on Web — พัฒนาและดำเนินงานตามมาตรฐาน PDPA B.E. 2562</p>
          <div className="flex items-center justify-center gap-4 text-indigo-600 dark:text-indigo-400 font-semibold">
            <button onClick={() => setActiveTab('policy')} className="hover:underline">ประกาศความเป็นส่วนตัว</button>
            <span>•</span>
            <button onClick={() => setActiveTab('cookies')} className="hover:underline">นโยบายคุกกี้</button>
            <span>•</span>
            <button onClick={() => setActiveTab('rights')} className="hover:underline">จัดการสิทธิ์ข้อมูล</button>
          </div>
        </footer>
      </main>
    </div>
  );
}
