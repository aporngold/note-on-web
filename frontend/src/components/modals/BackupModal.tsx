import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  Database,
  FileJson,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import api from '@/utils/api';
import { useNoteStore } from '@/store/noteStore';
import toast from 'react-hot-toast';

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BackupModal({ isOpen, onClose }: BackupModalProps) {
  const { notes, boards, notebooks, labels, fetchNotes, fetchBoards } = useNoteStore();
  const [activeTab, setActiveTab] = useState<'backup' | 'restore'>('backup');
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<{ noteCount: number; exportedAt?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // 1. Export as JSON (Recommended Complete Backup)
  const handleExportJSON = async () => {
    try {
      setIsExporting(true);
      const res = await api.get('/notes/backup/export');
      const dataStr = JSON.stringify(res.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `NoteOnWeb-Backup-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('ดาวน์โหลดไฟล์สำรองข้อมูล JSON สำเร็จ');
    } catch (err) {
      console.error(err);
      toast.error('สำรองข้อมูลล้มเหลว กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Export as Markdown (.md) for external note apps (Obsidian, Notion, etc.)
  const handleExportMarkdown = () => {
    try {
      const activeNotes = notes.filter((n) => !n.isArchived);
      let mdContent = `# NoteOnWeb Backup Export\n`;
      mdContent += `*วันที่สำรองข้อมูล: ${new Date().toLocaleString('th-TH')}*\n`;
      mdContent += `*จำนวนโน้ตทั้งหมด: ${activeNotes.length} รายการ*\n\n---\n\n`;

      activeNotes.forEach((n, idx) => {
        mdContent += `## ${idx + 1}. ${n.title || 'ไม่มีชื่อ'}\n`;
        mdContent += `- **สถานะ:** ${n.kanbanStatus ? n.kanbanStatus.toUpperCase() : 'NOTE'}\n`;
        mdContent += `- **สีกระดาษ:** ${n.color}\n`;
        if (n.notebook) mdContent += `- **สมุดบันทึก:** ${n.notebook.name}\n`;
        if (n.labels && n.labels.length > 0) {
          mdContent += `- **ป้ายกำกับ:** ${n.labels.map((l) => '#' + l.name).join(' ')}\n`;
        }
        if (n.attachments && n.attachments.length > 0) {
          mdContent += `- **ไฟล์แนบ (${n.attachments.length} ไฟล์):** ${n.attachments.map((a) => a.originalName).join(', ')}\n`;
        }
        mdContent += `\n### เนื้อหา:\n${n.content || '*(ไม่มีเนื้อหา)*'}\n\n---\n\n`;
      });

      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `NoteOnWeb-Notes-${dateStr}.md`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('ดาวน์โหลดไฟล์ Markdown สำเร็จ');
    } catch (err) {
      console.error(err);
      toast.error('สร้างไฟล์ Markdown ล้มเหลว');
    }
  };

  // File select for Restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFile(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && Array.isArray(json.notes)) {
          setRestorePreview({
            noteCount: json.notes.length,
            exportedAt: json.exportedAt,
          });
        } else {
          toast.error('ไฟล์ JSON นี้ไม่มีข้อมูลโน้ตที่ถูกต้อง');
          setRestorePreview(null);
        }
      } catch (err) {
        toast.error('ไฟล์ไม่ใช่ JSON ที่ถูกต้อง');
        setRestorePreview(null);
      }
    };
    reader.readAsText(file);
  };

  // Execute Restore
  const handleExecuteRestore = async () => {
    if (!restoreFile) return;

    try {
      setIsRestoring(true);
      const text = await restoreFile.text();
      const backupData = JSON.parse(text);

      const res = await api.post('/notes/backup/restore', {
        notes: backupData.notes || [],
      });

      toast.success(res.data.message || 'กู้คืนโน้ตทั้งหมดเรียบร้อยแล้ว');
      fetchNotes({ isArchived: false });
      fetchBoards();
      onClose();
    } catch (err: any) {
      console.error('Restore error:', err);
      toast.error(err.response?.data?.error || 'เกิดข้อผิดพลาดในการกู้คืนโน้ต');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in select-none">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Database size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                สำรองและกู้คืนข้อมูล (Backup &amp; Restore)
              </h3>
              <p className="text-xs text-slate-500">
                ดาวน์โหลดข้อมูลโน้ตทั้งหมดเก็บไว้บนเครื่อง หรือกู้คืนข้อมูลกลับเข้ามา
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-4 pb-0">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'backup'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Download size={14} />
              <span>สำรองข้อมูล (Backup)</span>
            </button>
            <button
              onClick={() => setActiveTab('restore')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'restore'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              <Upload size={14} />
              <span>กู้คืนข้อมูล (Restore)</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-4">
          {activeTab === 'backup' ? (
            <div className="space-y-4">
              {/* Recommendation Guide */}
              <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 space-y-2">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-bold text-xs">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>คำแนะนำ: ควรเลือกสำรองข้อมูลเป็นไฟล์แบบไหน?</span>
                </div>
                <div className="text-[11px] text-indigo-950/80 dark:text-indigo-300/80 space-y-1.5 leading-relaxed">
                  <p>
                    • <b>ไฟล์ JSON (.json) [แนะนำเป็นอันดับ 1]:</b> เป็นรูปแบบที่เก็บโครงสร้างข้อมูลได้สมบูรณ์แบบ 100% ทั้งข้อความ, สีกระดาษ, สีหมึก, แบบอักษร, พิกัดตำแหน่งบนกระดาน, สถานะคัมบัง, ไฟล์แนบ, และเส้นเชื่อมต่อลูกศร สามารถนำไฟล์นี้กลับมากู้คืน (Restore) ได้ครบทุกอย่าง
                  </p>
                  <p>
                    • <b>ไฟล์ Markdown (.md):</b> เป็นไฟล์ข้อความธรรมดา อ่านง่าย จัดเรียงสวยงาม เหมาะสำหรับนำไปเปิดอ่าน คัดลอก หรือเปิดใช้งานต่อในโปรแกรมจดโน้ตภายนอก เช่น Obsidian, Notion หรือ VS Code
                  </p>
                </div>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* JSON Download Option */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-indigo-500 transition space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                      <FileJson size={20} />
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      ไฟล์ JSON (สำหรับกู้คืน 100%)
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      สำรองครบทั้งโน้ต ({notes.length}), บอร์ด ({boards.length}), ไฟล์แนบ และเส้นเชื่อมต่อ
                    </p>
                  </div>

                  <button
                    onClick={handleExportJSON}
                    disabled={isExporting}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                  >
                    <Download size={14} />
                    <span>{isExporting ? 'กำลังส่งออก...' : 'ดาวน์โหลดไฟล์ .json'}</span>
                  </button>
                </div>

                {/* Markdown Download Option */}
                <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-indigo-500 transition space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                      <FileText size={20} />
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      ไฟล์ Markdown (สำหรับอ่าน/แชร์)
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-normal">
                      ข้อความล้วนจัดรูปแบบสวยงาม นำไปใช้ต่อใน Obsidian, Notion, VS Code ได้ทันที
                    </p>
                  </div>

                  <button
                    onClick={handleExportMarkdown}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
                  >
                    <Download size={14} />
                    <span>ดาวน์โหลดไฟล์ .md</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Restore Tab */
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Upload size={15} className="text-indigo-600" />
                  <span>เลือกไฟล์ Backup (.json) เพื่อกู้คืนข้อมูล</span>
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  เมื่อกู้คืน โน้ตทั้งหมดจากไฟล์สำรองจะถูกเพิ่มกลับเข้ามาในบัญชีของคุณอย่างปลอดภัย
                </p>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center mb-2">
                  <FileJson size={20} />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {restoreFile ? restoreFile.name : 'คลิกเพื่อเลือกไฟล์ .json จากในเครื่อง'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  {restoreFile ? `ขนาด ${(restoreFile.size / 1024).toFixed(1)} KB` : 'รองรับเฉพาะไฟล์ .json ที่สำรองจาก NoteOnWeb'}
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Preview Info */}
              {restorePreview && (
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between text-xs animate-fade-in">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold">ตรวจพบข้อมูลพร้อมกู้คืน</p>
                      <p className="text-[10px] opacity-80">
                        จำนวนโน้ตทั้งหมด: {restorePreview.noteCount} รายการ
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleExecuteRestore}
                    disabled={isRestoring}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    {isRestoring ? 'กำลังกู้คืน...' : 'กู้คืนทันที'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <span className="text-[11px] text-slate-400">
            ระบบความปลอดภัยและสำรองข้อมูล NoteOnWeb
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
