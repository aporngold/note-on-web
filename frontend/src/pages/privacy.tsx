import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
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
  CheckCircle2 
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <Head>
        <title>นโยบายความเป็นส่วนตัว (Privacy Policy) — Note on Web</title>
        <meta 
          name="description" 
          content="นโยบายความเป็นส่วนตัวตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล (PDPA) ของ Note on Web และมาตรฐานความปลอดภัย Zero-Knowledge E2EE" 
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
            <span>Note on Web PDPA</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-8">
        {/* Hero Title Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-50 via-white to-purple-50/40 dark:from-slate-900 dark:via-indigo-950/30 dark:to-purple-950/20 border border-indigo-100 dark:border-slate-800 p-6 sm:p-10 shadow-sm">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-4 border border-emerald-500/20">
            <CheckCircle2 size={13} />
            <span>สอดคล้องตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            นโยบายความเป็นส่วนตัว<br className="hidden sm:inline" /> (Privacy Policy)
          </h1>
          <p className="mt-3 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            มีผลบังคับใช้ตั้งแต่วันที่ 1 มกราคม 2567 (อัปเดตล่าสุด: ตุลาคม 2567)<br />
            เราให้ความสำคัญสูงสุดกับความปลอดภัย ความเป็นส่วนตัว และสิทธิในข้อมูลของท่าน ภายใต้สถาปัตยกรรมความปลอดภัย <b>Zero-Knowledge Encryption</b>
          </p>
        </div>

        {/* Section 1: บทนำ */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <FileText size={20} />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              1. บทนำและขอบเขตการใช้งาน
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            นโยบายความเป็นส่วนตัวนี้จัดทำขึ้นโดย <b>Note on Web (SecureNote)</b> เพื่อแจ้งให้ท่านในฐานะเจ้าของข้อมูลส่วนบุคคล (Data Subject) ทราบถึงแนวปฏิบัติในการเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคล รวมถึงมาตรการรักษาความมั่นคงปลอดภัยตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) ของประเทศไทย
          </p>
        </section>

        {/* Section 2: ข้อมูลที่จัดเก็บ */}
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
            เรายึดหลักการจัดเก็บข้อมูลเท่าที่จำเป็นต่อการให้บริการ (Data Minimization) เท่านั้น:
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <li className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <b className="text-slate-900 dark:text-white block mb-1">ข้อมูลบัญชีผู้ใช้งาน:</b>
              อีเมล (Email), ชื่อผู้ใช้ (Username), และรหัสผ่านที่เข้ารหัสความปลอดภัยทางเดียว (Password Hash ด้วย bcrypt)
            </li>
            <li className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <b className="text-slate-900 dark:text-white block mb-1">เนื้อหาบันทึกและกระดาน:</b>
              ข้อความในโน้ต, ป้ายกำกับ, พิกัดโน้ตบนบอร์ด, ไฟล์แนบ, และรายการเตือนความจำที่ท่านสร้างขึ้น
            </li>
            <li className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <b className="text-slate-900 dark:text-white block mb-1">การแจ้งเตือน (Web Push):</b>
              รหัส Token ประจำเครื่องของเบราว์เซอร์ เพื่อส่งสัญญาณแจ้งเตือนตามเวลาที่ท่านตั้งไว้
            </li>
            <li className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <b className="text-slate-900 dark:text-white block mb-1">ข้อมูลยืนยันตัวตนพิเศษ (Passkeys):</b>
              กุญแจสาธารณะ WebAuthn (FIDO2) ในกรณีที่ท่านเปิดใช้งานระบบสแกนนิ้วมือหรือใบหน้า (ไม่มีการเก็บข้อมูลไบโอเมตริกซ์จริง)
            </li>
          </ul>
        </section>

        {/* Section 3: สถาปัตยกรรม Zero-Knowledge E2EE */}
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-white to-indigo-500/10 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/40 border border-amber-500/30 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Lock size={20} />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              3. มาตรการความปลอดภัยขั้นสูงสุด: Zero-Knowledge E2EE
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            สำหรับ <b>"ห้องนิรภัย (Vault Notes)"</b> ระบบใช้การเข้ารหัสระดับ <b>AES-GCM-256</b> ที่เครื่องของท่านโดยตรง (Client-Side Encryption) ก่อนส่งข้อมูลมาจัดเก็บ โดยที่:
          </p>
          <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-amber-500/20 text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-2">
            <p>• <b>ผู้ดูแลระบบ (Admin) และเซิร์ฟเวอร์ ไม่สามารถอ่านเนื้อหาโน้ตในห้องนิรภัยของท่านได้</b></p>
            <p>• กุญแจ Master Password จะไม่ถูกส่งออกมาทางอินเทอร์เน็ต ทำให้ข้อมูลของท่านปลอดภัยสูงสุดแม้ในกรณีที่มีการบุกรุกเซิร์ฟเวอร์</p>
          </div>
        </section>

        {/* Section 4: สิทธิของเจ้าของข้อมูล (Data Subject Rights) */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <UserCheck size={20} />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              4. สิทธิของท่านตามกฎหมาย PDPA
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            ท่านสามารถใช้สิทธิของเจ้าของข้อมูลส่วนบุคคลตามที่กฎหมายกำหนดได้ตลอดเวลา โดยระบบมีเครื่องมือรองรับในตัว:
          </p>
          <div className="space-y-3 text-xs sm:text-sm">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-start gap-3">
              <Download size={18} className="text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <b className="text-slate-900 dark:text-white block">สิทธิในการขอรับและโอนย้ายข้อมูล (Right to Data Portability):</b>
                ท่านสามารถดาวน์โหลดข้อมูลทั้งหมดของท่านออกเป็นไฟล์ JSON หรือ Markdown ผ่านเมนู <b>"สำรองข้อมูล (Backup)"</b> ได้ตลอดเวลาโดยไม่มีค่าใช้จ่าย
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-start gap-3">
              <Trash2 size={18} className="text-rose-500 shrink-0 mt-0.5" />
              <div>
                <b className="text-slate-900 dark:text-white block">สิทธิในการขอให้ลบข้อมูล (Right to Erasure):</b>
                ท่านสามารถสั่ง <b>"ลบบัญชีและทำลายข้อมูลถาวร"</b> ได้ทุกเมื่อ ข้อมูลโน้ต, บอร์ด, รูปภาพ และประวัติทั้งหมดจะถูกลบออกจากฐานข้อมูลทันทีแบบถาวร
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 flex items-start gap-3">
              <Bell size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <b className="text-slate-900 dark:text-white block">สิทธิในการเพิกถอนความยินยอม (Right to Withdraw Consent):</b>
                ท่านสามารถเปิด-ปิดสิทธิ์การรับแจ้งเตือน Web Push หรือเสียงเตือนได้ทันทีผ่านเมนูกระดิ่งแจ้งเตือน
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: การเปิดเผยข้อมูลและคุกกี้ */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
              <ShieldCheck size={20} />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              5. การไม่ส่งต่อข้อมูลแก่บุคคลที่สาม และคุกกี้ที่จำเป็น
            </h2>
          </div>
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
            <p>• <b>ไม่มีการขายข้อมูล:</b> เราไม่มีนโยบายการขาย แลกเปลี่ยน หรือให้เช่าข้อมูลส่วนบุคคลของท่านแก่บุคคลที่สามหรือตัวแทนโฆษณาใดๆ ทั้งสิ้น</p>
            <p>• <b>ไม่มี Third-Party Ad Trackers:</b> ระบบไม่ติดตั้ง Google Analytics, Facebook Pixel หรือสคริปต์สอดส่องพฤติกรรมเพื่อการตลาด</p>
            <p>• <b>คุกกี้ที่จำเป็น (Strictly Necessary Cookies):</b> เราใช้เพียง Cookie / LocalStorage เพื่อบันทึก Session ล็อกอิน และการตั้งค่าหน้าจอของท่านเท่านั้น</p>
          </div>
        </section>

        {/* Section 6: ติดต่อเรา */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Mail size={20} />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              6. การติดต่อเกี่ยวกับข้อมูลส่วนบุคคล
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            หากท่านมีข้อสงสัย ข้อเสนอแนะ หรือประสงค์จะใช้สิทธิของเจ้าของข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) สามารถติดต่อผู้ดูแลระบบได้โดยตรงผ่านช่องทางศูนย์ช่วยเหลือภายในแอปพลิเคชัน Note on Web
          </p>
        </section>

        {/* Bottom Back Button */}
        <div className="text-center pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition active:scale-95"
          >
            <ArrowLeft size={16} />
            <span>กลับสู่หน้ากระดานโน้ต (Back to Dashboard)</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
