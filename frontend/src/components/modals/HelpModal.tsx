import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  BookOpen,
  LayoutGrid,
  Lock,
  Columns,
  Star,
  FileText,
  Database,
  Share2,
  Bell,
  Fingerprint,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Keyboard,
  Sparkles,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: string;
}

interface HelpTopic {
  id: string;
  category: 'board' | 'views' | 'vault' | 'editor' | 'backup' | 'passkey' | 'faq';
  title: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ElementType;
  summary: string;
  content: React.ReactNode;
  tags: string[];
}

export default function HelpModal({ isOpen, onClose, initialTab = 'all' }: HelpModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(initialTab);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'ทั้งหมด', icon: BookOpen },
    { id: 'board', label: 'กระดาน 56 แผ่น', icon: LayoutGrid },
    { id: 'views', label: '4 มุมมอง & หน้าหลัก', icon: Columns },
    { id: 'vault', label: 'ห้องนิรภัย & รหัสผ่าน', icon: Lock },
    { id: 'editor', label: 'จดโน้ต & คีย์ลัด', icon: FileText },
    { id: 'backup', label: 'สำรองข้อมูล & แชร์', icon: Database },
    { id: 'passkey', label: 'Passkey & เตือนความจำ', icon: Fingerprint },
    { id: 'faq', label: 'คำถามที่พบบ่อย (FAQ)', icon: HelpCircle },
  ];

  const topics: HelpTopic[] = useMemo(() => [
    {
      id: 'board-56-rule',
      category: 'board',
      title: 'ทำไมจำกัด 56 แผ่นต่อบอร์ด และโน้ตหายไปไหนถ้าบอร์ดเต็ม?',
      badge: 'จุดที่คนใหม่งงบ่อย',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      icon: LayoutGrid,
      summary: 'กติกา 56 แผ่นออกแบบเพื่อให้กระดานลื่นไหลและเป็นระเบียบ หากบอร์ดเต็มโน้ตใหม่จะไม่สูญหายแต่จะถูกเก็บไว้ในคลังโน้ต',
      tags: ['บอร์ด', '56', 'กระดาน', 'board', 'เต็ม', 'โน้ตหาย', 'โพสต์อิท', 'sticky'],
      content: (
        <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-2.5">
            <AlertTriangle className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-bold text-amber-800 dark:text-amber-300">กฎสถาปัตยกรรม 56 แผ่น (Strict 56 Limit)</p>
              <p className="text-xs text-amber-700/90 dark:text-amber-400/90 mt-0.5">
                แต่ละบอร์ดถูกจำกัดไว้ที่ 56 โน้ตพอดี เพื่อป้องกันปัญหาหน้าจอกระตุกจากการเรนเดอร์ และกระตุ้นให้คัดแยกโปรเจกต์เป็นบอร์ดๆ อย่างมีระเบียบ
              </p>
            </div>
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-100">ถ้าบอร์ดเต็ม 56 แผ่นแล้วสร้างโน้ตใหม่ จะเกิดอะไรขึ้น?</h4>
          <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
            <li><b>โน้ตของคุณไม่สูญหาย:</b> โน้ตจะถูกบันทึกลงในระบบอย่างปลอดภัย 100%</li>
            <li>โน้ตที่เกิน 56 แผ่นจะไม่ปรากฏบนบอร์ดที่มีจำกัด แต่คุณสามารถค้นหาและเปิดดูได้ในมุมมอง <b>Grid (การ์ด)</b>, <b>List (รายการ)</b> หรือ <b>Kanban (คัมบัง)</b> ได้เสมอ</li>
          </ul>
          <h4 className="font-bold text-slate-800 dark:text-slate-100">วิธีแก้ปัญหาเมื่อบอร์ดเต็ม:</h4>
          <ol className="list-decimal pl-5 space-y-1 text-xs sm:text-sm">
            <li>สร้างกระดาน (Board) ใหม่สำหรับโปรเจกต์หรือหมวดหมู่นั้นๆ</li>
            <li>ลบโน้ตที่ไม่ใช้งานแล้ว หรือย้ายโน้ตไปยังบอร์ดอื่น</li>
            <li>ใช้ระบบสมุดบันทึก (Notebook) หรือป้ายกำกับ (Label) จัดระเบียบร่วมด้วย</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'board-drag-drop',
      category: 'board',
      title: 'วิธีใช้งานกระดานโพสต์อิทอิสระ (Sticky Board)',
      icon: LayoutGrid,
      summary: 'ลากย้ายตำแหน่งอิสระ เปลี่ยนสี ปักหมุด และติดสติ๊กเกอร์บนกระดาน',
      tags: ['ลาก', 'ย้าย', 'drag', 'drop', 'ปักหมุด', 'สี', 'สติ๊กเกอร์'],
      content: (
        <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            ในโหมด <b>บอร์ด (Sticky Board)</b> โน้ตจะแสดงเป็นการ์ดโพสต์อิทเสมือนจริงบนโต๊ะทำงานของคุณ
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="font-bold text-indigo-600 dark:text-indigo-400 block mb-1">👆 ลากและวางตำแหน่ง (Drag & Drop)</span>
              คลิกค้างที่หัวการ์ดหรือใช้นิ้วลากบนหน้าจอมือถือเพื่อย้ายตำแหน่งโน้ตได้อย่างอิสระ ระบบจะจำตำแหน่งล่าสุดอัตโนมัติ
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="font-bold text-amber-600 dark:text-amber-400 block mb-1">📌 ปักหมุด (Pin Note)</span>
              คลิกไอคอนหมุดเพื่อล็อกโน้ตสำคัญไว้ด้านบนสุด ป้องกันไม่ให้เลื่อนหลุดหายไป
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 block mb-1">🎨 สีพาสเทลแยกหมวดหมู่</span>
              คลิกเปลี่ยนสีโน้ต (เหลือง เขียว ฟ้า ชมพู ม่วง ส้ม ขาว) เพื่อแยกประเภทงานอย่างรวดเร็ว
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="font-bold text-purple-600 dark:text-purple-400 block mb-1">✨ สติ๊กเกอร์ & ลิงก์เชื่อมโยง</span>
              แปะสติ๊กเกอร์ตกแต่ง หรือลากเส้นเชื่อมโยงความสัมพันธ์ระหว่างโน้ต 2 แผ่นเข้าด้วยกัน
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'view-modes-explanation',
      category: 'views',
      title: 'ทำความเข้าใจ 4 มุมมอง และการตั้งค่าปุ่ม ⭐ "หน้าหลัก"',
      badge: 'แนะนำ',
      badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      icon: Columns,
      summary: 'เลือกมุมมองที่เหมาะกับสไตล์การทำงานของคุณ พร้อมวิธีตั้งโหมดที่ชอบให้เปิดมาเจออันแรกเสมอ',
      tags: ['มุมมอง', 'grid', 'list', 'kanban', 'board', 'คัมบัง', 'หน้าหลัก', 'default'],
      content: (
        <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            ระบบรองรับ 4 มุมมองการแสดงผลที่ออกแบบมาเพื่อจุดประสงค์ที่แตกต่างกัน:
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-2.5">
              <span className="font-bold text-amber-500 text-sm mt-0.5">📌</span>
              <div>
                <b className="text-slate-800 dark:text-slate-200">บอร์ด (Sticky Board):</b> กระดานโพสต์อิทอิสระ เหมาะสำหรับการระดมสมอง (Brainstorming) และเห็นภาพรวมแบบ Visual
              </div>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-2.5">
              <span className="font-bold text-indigo-500 text-sm mt-0.5">▦</span>
              <div>
                <b className="text-slate-800 dark:text-slate-200">การ์ด (Grid View):</b> เรียงโน้ตเป็นตารางการ์ดสวยงาม อ่านง่าย เหมาะกับการเปิดดูเนื้อหาโน้ตจำนวนมาก
              </div>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-2.5">
              <span className="font-bold text-blue-500 text-sm mt-0.5">☰</span>
              <div>
                <b className="text-slate-800 dark:text-slate-200">รายการ (List View):</b> แถวรายการแนวนอนกะทัดรัด แสดงข้อมูลวันที่และสถานะชัดเจน เหมาะสำหรับโน้ตที่มีขนาดยาว
              </div>
            </div>
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start gap-2.5">
              <span className="font-bold text-purple-500 text-sm mt-0.5">🗂️</span>
              <div>
                <b className="text-slate-800 dark:text-slate-200">คัมบัง (Kanban View):</b> จัดการกระบวนการทำงาน แบ่งตามสถานะ (ยังไม่เริ่ม / กำลังทำ / เสร็จแล้ว) ลากย้ายการ์ดข้ามคอลัมน์ได้ทันที
              </div>
            </div>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50">
            <h5 className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-1">
              <Star size={15} className="fill-amber-400 text-amber-500" />
              <span>วิธีตั้งโหมดโปรดเป็นหน้าหลักเริ่มต้น (Default View)</span>
            </h5>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              เมื่อคุณอยู่ในโหมดที่ชื่นชอบ (เช่น บอร์ด หรือ คัมบัง) ให้กดปุ่ม <b>⭐ หน้าหลัก</b> ที่อยู่มุมขวาบนของแถบเครื่องมือ ระบบจะจดจำและเปิดโหมดนี้ให้เป็นหน้าแรกอัตโนมัติทุกครั้งที่คุณล็อกอินเข้ามาใช้งาน
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'vault-master-password',
      category: 'vault',
      title: 'ห้องนิรภัย (Vault) และคำเตือนเรื่อง Master Password',
      badge: 'สำคัญยิ่งยวด ⚠️',
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      icon: Lock,
      summary: 'ห้องนิรภัยเข้ารหัสขั้นสูงสุดแบบ Zero-Knowledge หากลืม Master Password จะไม่มีใครกู้คืนได้แม้กระทั่งแอดมิน!',
      tags: ['ตู้นิรภัย', 'ห้องนิรภัย', 'vault', 'รหัสผ่าน', 'master password', 'ลืม', 'กู้รหัส', 'ความลับ', 'e2ee'],
      content: (
        <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-2">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold">
              <AlertTriangle size={18} />
              <span>คำเตือน: หากลืม Master Password ข้อมูลจะสูญหายถาวร</span>
            </div>
            <p className="text-xs text-rose-600/90 dark:text-rose-400/90">
              ระบบใช้สถาปัตยกรรม <b>Zero-Knowledge End-to-End Encryption (E2EE)</b> โน้ตในห้องนิรภัยจะถูกเข้ารหัสบนเครื่องของคุณก่อนส่งขึ้นเซิร์ฟเวอร์
              <b> เซิร์ฟเวอร์และแอดมินไม่เก็บรหัสผ่านจริง และไม่มีกุญแจถอดรหัสใดๆ ทั้งสิ้น</b>
            </p>
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-100">วิธีใช้งานห้องนิรภัย:</h4>
          <ol className="list-decimal pl-5 space-y-1.5 text-xs sm:text-sm">
            <li><b>ตั้งรหัสผ่าน Master Password:</b> เข้าเมนู "ตู้นิรภัยเข้ารหัส (Vault)" และตั้งรหัสผ่านที่มีความยาวอย่างน้อย 8 ตัวอักษร จดบันทึกรหัสนี้ไว้ในที่ปลอดภัย</li>
            <li><b>ย้ายโน้ตเข้าห้องนิรภัย:</b> เมื่อต้องการซ่อนโน้ต ให้คลิกเมนูสามจุดบนโน้ต แล้วเลือก <b>"ล็อกเข้าห้องนิรภัย"</b></li>
            <li><b>การเปิดอ่าน:</b> เมื่อต้องการเปิดอ่าน ต้องกรอก Master Password เพื่อถอดรหัสในหน่วยความจำชั่วคราว</li>
            <li><b>การออกจากระบบความปลอดภัย:</b> ห้องนิรภัยจะล็อกอัตโนมัติเมื่อปิดเบราว์เซอร์ หรือเมื่อคุณคลิกล็อกตู้นิรภัย</li>
          </ol>
        </div>
      ),
    },
    {
      id: 'editor-shortcuts',
      category: 'editor',
      title: 'เทคนิคการจดโน้ต เช็คลิสต์ ตาราง และตารางคีย์ลัด',
      icon: FileText,
      summary: 'ใช้ประโยชน์สูงสุดจาก WYSIWYG Editor สร้างเช็คลิสต์ที่ติ๊กได้ ใส่ตาราง และคีย์ลัดเพิ่มความเร็ว',
      tags: ['คีย์ลัด', 'shortcuts', 'editor', 'ตาราง', 'เช็คลิสต์', 'checklist', 'จัดรูปแบบ', 'bold'],
      content: (
        <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>
            หน้าจอเขียนโน้ตรองรับโปรแกรมแก้ไขข้อความขั้นสูง (WYSIWYG Rich Editor) ซึ่งแสดงผลจริงทันทีที่จัดรูปแบบ:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-2.5">ฟังก์ชัน</th>
                  <th className="p-2.5">คีย์ลัด (Windows / Linux)</th>
                  <th className="p-2.5">คีย์ลัด (Mac)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                <tr>
                  <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">ตัวหนา (Bold)</td>
                  <td className="p-2.5"><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">Ctrl + B</kbd></td>
                  <td className="p-2.5"><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">⌘ + B</kbd></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">ตัวเอียง (Italic)</td>
                  <td className="p-2.5"><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">Ctrl + I</kbd></td>
                  <td className="p-2.5"><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">⌘ + I</kbd></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">ขีดเส้นใต้ (Underline)</td>
                  <td className="p-2.5"><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">Ctrl + U</kbd></td>
                  <td className="p-2.5"><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">⌘ + U</kbd></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">บันทึกโน้ต (Save)</td>
                  <td className="p-2.5"><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">Ctrl + S</kbd></td>
                  <td className="p-2.5"><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">⌘ + S</kbd></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">เลิกทำ (Undo)</td>
                  <td className="p-2.5"><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">Ctrl + Z</kbd></td>
                  <td className="p-2.5"><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">⌘ + Z</kbd></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">ทำซ้ำ (Redo)</td>
                  <td className="p-2.5"><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">Ctrl + Y</kbd></td>
                  <td className="p-2.5"><kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">⌘ + ⇧ + Z</kbd></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="space-y-1.5 text-xs">
            <p><b>☑️ เช็คลิสต์รายการงาน (Task List):</b> กดปุ่มไอคอนกล่องกาเครื่องหมาย เพื่อสร้างเช็คลิสต์ที่สามารถคลิกติ๊กเสร็จแล้วได้โดยตรงในเนื้อหา</p>
            <p><b>📊 ตาราง (Table):</b> แทรกตาราง เพิ่ม/ลบ แถวและคอลัมน์ได้อย่างยืดหยุ่น</p>
            <p><b>🎙️ บันทึกเสียง & รูปภาพ:</b> แนบรูปภาพ หรืออัดเสียงพูดบันทึกไว้ในโน้ตเพื่อเปิดฟังซ้ำได้ทุกเวลา</p>
          </div>
        </div>
      ),
    },
    {
      id: 'backup-and-share',
      category: 'backup',
      title: 'การสำรองข้อมูล (Backup) และการแชร์กระดาน (Share)',
      icon: Database,
      summary: 'วิธีดาวน์โหลดไฟล์สำรองเก็บไว้ และการสร้างลิงก์แชร์เพื่อทำงานร่วมกัน',
      tags: ['สำรองข้อมูล', 'backup', 'กู้คืน', 'restore', 'json', 'export', 'แชร์', 'share'],
      content: (
        <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-900/40">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 mb-1.5">
              <Database size={16} />
              <span>การสำรองและกู้คืนข้อมูล (Backup & Restore)</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
              คุณสามารถส่งออกโน้ตและบอร์ดทั้งหมดเป็นไฟล์ JSON เพื่อเก็บไว้ในเครื่องคอมพิวเตอร์ของคุณเองได้ตลอดเวลา:
            </p>
            <ol className="list-decimal pl-5 space-y-1 text-xs">
              <li>คลิกปุ่ม <b>"สำรองข้อมูล"</b> ที่แถบเมนูด้านบน หรือในเมนูเพิ่มเติม</li>
              <li>กด <b>"สร้างไฟล์สำรองข้อมูล (Export JSON)"</b> แล้วดาวน์โหลดไฟล์เก็บไว้</li>
              <li>เมื่อต้องการกู้คืนข้อมูล ให้ไปที่แท็บ <b>"กู้คืนข้อมูล (Restore)"</b> แล้วเลือกไฟล์สำรองที่เคยบันทึกไว้</li>
            </ol>
          </div>
          <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40">
            <h4 className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5 mb-1.5">
              <Share2 size={16} />
              <span>การแชร์กระดานกับเพื่อนร่วมงาน (Board Sharing)</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              ในหน้ากระดานบอร์ด คุณสามารถคลิกปุ่ม <b>"แชร์บอร์ด"</b> เพื่อสร้างรหัสหรือลิงก์ส่งให้เพื่อน เพื่อเข้ามาดูหรือช่วยกันแปะโน้ตบนบอร์ดเดียวกันได้แบบเรียลไทม์
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'passkey-and-reminders',
      category: 'passkey',
      title: 'การใช้ Passkey (สแกนนิ้ว/ใบหน้า) และการแจ้งเตือนเตือนความจำ',
      icon: Fingerprint,
      summary: 'เข้าสู่ระบบอย่างปลอดภัยโดยไม่ต้องจำรหัสผ่าน และการตั้งเตือนความจำโน้ต',
      tags: ['passkey', 'สแกนนิ้ว', 'ใบหน้า', 'login', 'เตือนความจำ', 'reminder', 'notification', 'พุช'],
      content: (
        <div className="space-y-3.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Fingerprint size={16} className="text-teal-500" />
              <span>Passkey คืออะไร และทำไมควรเปิดใช้?</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Passkey เป็นเทคโนโลยีการล็อกอินมาตรฐานระดับสากล (FIDO2 / WebAuthn) ช่วยให้คุณเข้าสู่ระบบได้ด้วยการ <b>สแกนลายนิ้วมือ, สแกนใบหน้า (Face ID), หรือ Windows Hello</b> โดยไม่ต้องกรอกรหัสผ่าน ปลอดภัยจากการถูก Phishing 100%
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              * สามารถเปิดใช้งานได้ที่รูปไอคอนลายนิ้วมือ <b>Fingerprint</b> ใน Sidebar หรือเมนูโปรไฟล์
            </p>
          </div>
          <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Bell size={16} className="text-amber-500" />
              <span>การแจ้งเตือน & เตือนความจำ (Reminders)</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              เมื่อเขียนโน้ต คุณสามารถคลิกไอคอนกระดิ่ง 🔔 เพื่อตั้งวันและเวลาแจ้งเตือนล่วงหน้าได้ ระบบรองรับ Web Push Notification แจ้งเตือนตรงสู่หน้าจอคอมพิวเตอร์และมือถือของคุณ
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'faq-top-questions',
      category: 'faq',
      title: 'คำถามที่พบบ่อย (FAQ) สำหรับผู้ใช้งานใหม่',
      icon: HelpCircle,
      summary: 'รวมคำตอบของคำถามยอดฮิต โน้ตหายไปไหน? ข้อมูลปลอดภัยไหม? ใช้งานออฟไลน์ได้ไหม?',
      tags: ['faq', 'คำถาม', 'สงสัย', 'ปลอดภัย', 'หาย', 'offline', 'แอดมิน'],
      content: (
        <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">Q: โน้ตของฉันมีความเป็นส่วนตัวแค่ไหน แอดมินอ่านได้ไหม?</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <b>A:</b> โน้ตในห้องนิรภัยเป็นแบบ End-to-End Encryption แอดมินและเซิร์ฟเวอร์อ่านไม่ได้แน่นอน 100% ส่วนโน้ตทั่วไปจะถูกเก็บรักษาภายใต้มาตรฐานความปลอดภัยและ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA 2569) อย่างเคร่งครัด
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">Q: หาโน้ตที่เขียนไว้ไม่เจอ ทำอย่างไร?</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <b>A:</b> ลองใช้ช่องค้นหา (Search) ด้านบน หรือสลับไปที่มุมมอง <b>Grid (การ์ด)</b> เพื่อดูโน้ตทั้งหมด หรือตรวจดูในเมนู <b>ถังขยะ (Trash)</b> หากเผลอกดลบไป
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
            <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">Q: ใช้บนสมาร์ตโฟนได้สะดวกไหม?</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <b>A:</b> ได้อย่างสมบูรณ์แบบ Note on Web มี Mobile Toolbar, Bottom Sheet และ Touch Interaction ที่ออกแบบมาเพื่อการสัมผัสด้วยนิ้วมือบนสมาร์ตโฟนโดยเฉพาะ
            </p>
          </div>
        </div>
      ),
    },
  ], []);

  // Filter topics based on search & category
  const filteredTopics = useMemo(() => {
    return topics.filter((topic) => {
      const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
      if (!searchQuery.trim()) return matchesCategory;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        topic.title.toLowerCase().includes(q) ||
        topic.summary.toLowerCase().includes(q) ||
        topic.tags.some((t) => t.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [topics, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:px-6 sm:py-4.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/60 via-purple-50/30 to-transparent dark:from-slate-800/60 dark:via-indigo-950/20 dark:to-transparent">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/25">
              <BookOpen size={22} />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>วิธีใช้งานและคำแนะนำ (Help & Guide)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                คู่มือการใช้งานระบบ Note on Web รวบรวมคำแนะนำและจุดที่ผู้ใช้ใหม่ควรรู้
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="ปิดหน้าต่าง (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar & Category Filter */}
        <div className="p-3 sm:p-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="ค้นหาเรื่องที่ต้องการช่วยเหลือ (เช่น บอร์ด, 56, รหัสผ่าน, คัมบัง, คีย์ลัด, สำรอง)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white transition shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                ล้างคำค้น
              </button>
            )}
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <Icon size={13} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredTopics.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                ไม่พบคำแนะนำที่ตรงกับคำค้นหา "{searchQuery}"
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
              >
                ดูหัวข้อคำแนะนำทั้งหมด
              </button>
            </div>
          ) : (
            filteredTopics.map((topic) => {
              const Icon = topic.icon;
              const isExpanded = selectedTopicId === topic.id || filteredTopics.length === 1 || Boolean(searchQuery.trim());
              return (
                <div
                  key={topic.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xs hover:shadow-xs transition-all overflow-hidden"
                >
                  <button
                    onClick={() => setSelectedTopicId(selectedTopicId === topic.id ? null : topic.id)}
                    className="w-full p-4 sm:px-5 sm:py-4 text-left flex items-start justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                  >
                    <div className="flex items-start gap-3">
                      <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 mt-0.5 shrink-0">
                        <Icon size={18} />
                      </span>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                            {topic.title}
                          </h3>
                          {topic.badge && (
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${topic.badgeColor}`}>
                              {topic.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                          {topic.summary}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      size={18}
                      className={`text-slate-400 transition-transform shrink-0 mt-1 ${isExpanded ? 'rotate-90 text-indigo-500' : ''}`}
                    />
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-5 sm:px-5 sm:pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/40 dark:bg-slate-950/20">
                      {topic.content}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:px-6 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            <span>Note on Web — ระบบบันทึกข้อความปลอดภัยสูง</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
