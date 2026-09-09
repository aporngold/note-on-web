import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Bot,
  Check,
  Copy,
  Loader2,
  ShieldCheck,
  LayoutTemplate,
  AlignLeft,
  RefreshCw,
  Layers,
  ArrowDownRight,
  FileCheck2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/utils/api';
import { AISummaryResult, AIFormatResult } from '@/types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteTitle: string;
  noteContent: string;
  onInsertContent: (html: string, mode?: 'insert' | 'replace') => void;
}

const TEMPLATES = [
  {
    id: 'beautify',
    icon: '✨',
    title: 'จัดโครงสร้างสวยงาม',
    sub: 'Clean & Beautified',
    desc: 'จัดระเบียบหัวข้อ H2/H3, บล็อกเน้นข้อความ และย่อหน้าให้อ่านสบายตา',
    badge: 'ยอดนิยม',
    badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    id: 'meeting',
    icon: '📅',
    title: 'บันทึกการประชุม (MOM)',
    sub: 'Meeting Minutes',
    desc: 'วันที่, วัตถุประสงค์, ประเด็นหารือ, มติที่ประชุม และ To-Do พร้อมผู้รับผิดชอบ',
    badge: 'การทำงาน',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  {
    id: 'project_plan',
    icon: '🚀',
    title: 'แผนงานโครงการ',
    sub: 'Project Roadmap',
    desc: 'ภาพรวม, เป้าหมายสำคัญ (Milestones), ลำดับขั้นตอนดำเนินงาน และประเมินความเสี่ยง',
    badge: 'โปรเจกต์',
    badgeColor: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  },
  {
    id: 'cornell',
    icon: '💡',
    title: 'ระบบจดแบบคอร์เนลล์',
    sub: 'Cornell Notes System',
    desc: 'ตารางคำสำคัญ/คำถามนำ (Cues) + บันทึกเนื้อหา (Notes) + สรุปรวบยอดท้ายบท',
    badge: 'การเรียนรู้',
    badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  {
    id: 'pros_cons',
    icon: '⚖️',
    title: 'วิเคราะห์ข้อดี - ข้อเสีย',
    sub: 'Pros & Cons Table',
    desc: 'ตารางเปรียบเทียบจุดเด่น vs จุดด้อย พร้อมข้อสรุปเชิงกลยุทธ์เพื่อการตัดสินใจ',
    badge: 'วิเคราะห์',
    badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  },
  {
    id: 'faq',
    icon: '❓',
    title: 'ถาม - ตอบ (FAQ)',
    sub: 'Q&A Format',
    desc: 'แปลงเนื้อหาเป็นชุดคำถามและคำตอบ ชัดเจน ตรงประเด็น เหมาะทำคู่มืออ้างอิง',
    badge: 'คู่มือ',
    badgeColor: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  },
  {
    id: 'reflection',
    icon: '🌱',
    title: 'บันทึกทบทวน / ถอดบทเรียน',
    sub: 'Daily Reflection',
    desc: 'ความสำเร็จประจำวัน (Wins), อุปสรรค, บทเรียนที่ได้รับ และสิ่งที่จะทำต่อไป',
    badge: 'ส่วนตัว',
    badgeColor: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  },
  {
    id: 'executive_summary',
    icon: '📊',
    title: 'สรุปสำหรับผู้บริหาร',
    sub: 'Executive Briefing',
    desc: 'สรุปประเด็นระดับกลยุทธ์ ไฮไลต์ข้อมูลสำคัญและมติการตัดสินใจแบบกระชับ',
    badge: 'ผู้บริหาร',
    badgeColor: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  },
  {
    id: 'study_guide',
    icon: '📚',
    title: 'คู่มือสรุปบทเรียน',
    sub: 'Study & Exam Guide',
    desc: 'สรุปนิยามคำศัพท์สำคัญ, ประเด็นที่ควรจำ และคำถามทบทวนเตรียมความพร้อม',
    badge: 'อ่านสอบ',
    badgeColor: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  },
];

const REWRITE_STYLES = [
  { id: 'professional', label: '👔 สุภาพ / เป็นทางการ', desc: 'เหมาะสำหรับติดต่อธุรกิจ งานราชการ' },
  { id: 'shorten', label: '✂️ รวบรัด / กระชับ', desc: 'ตัดทอนเนื้อหาให้สั้น ได้ใจความ' },
  { id: 'expand', label: '📖 ขยายความละเอียด', desc: 'อธิบายเพิ่มเติมให้เห็นภาพชัดเจน' },
  { id: 'bullets', label: '• แปลงเป็นข้อย่อย', desc: 'เปลี่ยนเป็น Bullet points อ่านง่าย' },
  { id: 'friendly', label: '😊 อบอุ่น / เป็นกันเอง', desc: 'น้ำเสียงน่ารัก เป็นมิตร เข้าถึงง่าย' },
  { id: 'casual', label: '🗣️ ภาษาพูดสบายๆ', desc: 'เขียนแบบเล่าเรื่อง สนุกสนาน ไม่เครียด' },
  { id: 'executive', label: '💼 สไตล์ผู้บริหาร', desc: 'ตรงประเด็น เน้นผลลัพธ์และการตัดสินใจ' },
  { id: 'academic', label: '🎓 เชิงวิชาการ', desc: 'ภาษาเป็นทางการและมีเหตุผลเป็นระบบ' },
  { id: 'action_items', label: '☑️ แปลงเป็น To-Do List', desc: 'เปลี่ยนเป็นรายการเช็คลิสต์สิ่งที่ต้องทำ' },
];

export default function AIAssistantModal({
  isOpen,
  onClose,
  noteTitle,
  noteContent,
  onInsertContent,
}: AIAssistantModalProps) {
  const [activeTab, setActiveTab] = useState<'format' | 'summarize' | 'rewrite'>('format');
  const [isLoading, setIsLoading] = useState(false);
  const [engineUsed, setEngineUsed] = useState<string>('');
  const [isCopied, setIsCopied] = useState(false);

  // Format State
  const [selectedTemplate, setSelectedTemplate] = useState('beautify');
  const [formatResult, setFormatResult] = useState<AIFormatResult | null>(null);

  // Summary State
  const [summaryResult, setSummaryResult] = useState<AISummaryResult | null>(null);

  // Rewrite State
  const [selectedStyle, setSelectedStyle] = useState('professional');
  const [rewrittenText, setRewrittenText] = useState('');

  if (!isOpen) return null;

  // Handler: Format Note
  const handleFormatNote = async () => {
    try {
      setIsLoading(true);
      const res = await api.post('/ai/format', {
        title: noteTitle,
        content: noteContent,
        template: selectedTemplate,
      });

      setFormatResult(res.data);
      setEngineUsed(res.data.engine);
      toast.success('จัดรูปแบบโน้ตสำเร็จ!');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'การจัดรูปแบบโน้ตล้มเหลว');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Summarize
  const handleSummarize = async () => {
    try {
      setIsLoading(true);
      const res = await api.post('/ai/summarize', {
        title: noteTitle,
        content: noteContent,
      });

      setSummaryResult(res.data);
      setEngineUsed(res.data.engine);
      toast.success('สรุปเนื้อหาสำเร็จ!');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'การสรุปเนื้อหาล้มเหลว');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Rewrite
  const handleRewrite = async () => {
    try {
      setIsLoading(true);
      const res = await api.post('/ai/rewrite', {
        content: noteContent,
        style: selectedStyle,
      });

      setRewrittenText(res.data.rewritten);
      setEngineUsed(res.data.engine);
      toast.success('เรียบเรียงเนื้อหาใหม่สำเร็จ!');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'การเรียบเรียงล้มเหลว');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply Formatted Content
  const handleApplyFormat = (mode: 'replace' | 'insert') => {
    if (!formatResult?.formattedHtml) return;
    onInsertContent(formatResult.formattedHtml, mode);
    toast.success(mode === 'replace' ? 'แทนที่เนื้อหาด้วยรูปแบบใหม่แล้ว' : 'แทรกเนื้อหาลงในโน้ตแล้ว');
    onClose();
  };

  // Insert Summary
  const handleInsertSummary = (mode: 'replace' | 'insert' = 'insert') => {
    if (!summaryResult) return;
    let html = `<blockquote><strong>⚡ สรุปใจความสำคัญ:</strong><br/>${summaryResult.summary}</blockquote>`;
    if (summaryResult.bullets && summaryResult.bullets.length > 0) {
      html += `<ul>${summaryResult.bullets.map((b) => `<li>${b}</li>`).join('')}</ul>`;
    }
    if (summaryResult.actionItems && summaryResult.actionItems.length > 0) {
      html += `<p><strong>📋 สิ่งที่ต้องทำ:</strong></p><ul data-type="taskList">${summaryResult.actionItems
        .map((a) => `<li data-type="taskItem" data-checked="false"><p>${a}</p></li>`)
        .join('')}</ul>`;
    }

    onInsertContent(html, mode);
    toast.success('แทรกสรุปความลงในโน้ตแล้ว');
    onClose();
  };

  // Insert Rewritten
  const handleInsertRewritten = (mode: 'replace' | 'insert' = 'insert') => {
    if (!rewrittenText) return;
    const formattedHtml = `<p>${rewrittenText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`;
    onInsertContent(formattedHtml, mode);
    toast.success(mode === 'replace' ? 'แทนที่เนื้อหาด้วยข้อความเรียบเรียงใหม่แล้ว' : 'แทรกข้อความเรียบเรียงใหม่ลงในโน้ตแล้ว');
    onClose();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success('คัดลอกข้อความแล้ว');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">SecureNote AI Architect</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Gemini Free Tier (Server Secret)</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">ผู้ช่วย AI อัจฉริยะจัดโครงสร้าง สรุป เรียบเรียง และแปลงเทมเพลตโน้ตอย่างปลอดภัย</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('format')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'format'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LayoutTemplate className="w-4 h-4" />
            <span>🎨 จัดโครงสร้างโน้ต (Format & Templates)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('summarize')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'summarize'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <AlignLeft className="w-4 h-4" />
            <span>⚡ สรุปเนื้อหา (Summarize)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rewrite')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'rewrite'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/40 dark:bg-indigo-950/20'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>✍️ ปรับสำนวน (Rewrite)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* ========================================================= */}
          {/* TAB 1: Format & Templates (NEW FEATURE) */}
          {/* ========================================================= */}
          {activeTab === 'format' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>เลือกเทมเพลตและสไตล์ที่ต้องการให้ AI แปลงรูปแบบโน้ต:</span>
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  AI จะนำเนื้อหาของโน้ตปัจจุบันมาร้อยเรียง จัดหัวข้อ ทำตาราง หรือสร้างเช็คลิสต์ให้อย่างเป็นมืออาชีพ
                </p>
              </div>

              {/* Template Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {TEMPLATES.map((tmpl) => {
                  const isSelected = selectedTemplate === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedTemplate(tmpl.id)}
                      className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-sm ring-2 ring-indigo-400/20'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-lg">{tmpl.icon}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tmpl.badgeColor}`}>
                            {tmpl.badge}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">{tmpl.title}</h4>
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mb-1">{tmpl.sub}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {tmpl.desc}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="mt-2 pt-1 border-t border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-end text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                          <Check className="w-3 h-3 mr-1" /> กำลังเลือก
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Action Trigger */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  เทมเพลตที่เลือก: <strong className="text-indigo-600 dark:text-indigo-400">{TEMPLATES.find((t) => t.id === selectedTemplate)?.title}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleFormatNote}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>{isLoading ? 'AI กำลังออกแบบจัดรูปแบบ...' : '🚀 เริ่มจัดรูปแบบด้วย AI'}</span>
                </button>
              </div>

              {/* Format Preview Box */}
              {formatResult && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5" />
                      <span>ประมวลผลด้วย: {engineUsed === 'gemini-free' ? 'Gemini 2.0 Flash (Free Tier)' : 'Local Smart NLP (ฟรีในเครื่อง)'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(formatResult.formattedHtml)}
                      className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>คัดลอก HTML</span>
                    </button>
                  </div>

                  {/* Rendered WYSIWYG Preview */}
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 max-h-72 overflow-y-auto space-y-2 leading-relaxed [&_h2]:text-sm [&_h2]:font-extrabold [&_h2]:text-indigo-600 dark:[&_h2]:text-indigo-400 [&_h2]:mb-2 [&_h3]:text-xs [&_h3]:font-bold [&_h3]:text-slate-700 dark:[&_h3]:text-slate-200 [&_h3]:mt-3 [&_h3]:mb-1 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-500 [&_blockquote]:bg-indigo-50/50 dark:[&_blockquote]:bg-indigo-950/40 [&_blockquote]:p-2.5 [&_blockquote]:rounded-r-lg [&_blockquote]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_th]:border [&_th]:border-slate-300 dark:[&_th]:border-slate-700 [&_th]:p-2 [&_th]:bg-slate-100 dark:[&_th]:bg-slate-800 [&_td]:border [&_td]:border-slate-300 dark:[&_td]:border-slate-700 [&_td]:p-2">
                    <div dangerouslySetInnerHTML={{ __html: formatResult.formattedHtml }} />
                  </div>

                  {/* Insert Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleApplyFormat('insert')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                    >
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      <span>แทรกต่อท้ายโน้ต</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyFormat('replace')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>✨ แทนที่เนื้อหาเดิมทั้งหมด</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: Summarize */}
          {/* ========================================================= */}
          {activeTab === 'summarize' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  กดปุ่มเพื่อเริ่มวิเคราะห์และสรุปประเด็นสำคัญของบันทึกนี้:
                </p>
                <button
                  type="button"
                  onClick={handleSummarize}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isLoading ? 'กำลังวิเคราะห์...' : 'สรุปเนื้อหาเดี๋ยวนี้'}</span>
                </button>
              </div>

              {/* Summary Results */}
              {summaryResult && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5" />
                      <span>ประมวลผลด้วย: {engineUsed === 'gemini-free' ? 'Gemini 2.0 Flash (Free Tier)' : 'Local Smart NLP (ฟรีในเครื่อง)'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(summaryResult.summary)}
                      className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>คัดลอก</span>
                    </button>
                  </div>

                  <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed space-y-3">
                    <p className="font-medium bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      {summaryResult.summary}
                    </p>

                    {summaryResult.bullets && summaryResult.bullets.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-slate-500 uppercase">📌 หัวข้อสำคัญ:</p>
                        <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                          {summaryResult.bullets.map((b, i) => (
                            <li key={i}>{b}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {summaryResult.actionItems && summaryResult.actionItems.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-slate-500 uppercase">🎯 สิ่งที่ต้องทำ (Action Items):</p>
                        <div className="space-y-1">
                          {summaryResult.actionItems.map((a, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                              <span className="w-3.5 h-3.5 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center text-[9px]">✓</span>
                              <span>{a}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleInsertSummary('insert')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                    >
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      <span>แทรกต่อท้ายโน้ต</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertSummary('replace')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>แทนที่เนื้อหาเดิม</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: Rewrite */}
          {/* ========================================================= */}
          {activeTab === 'rewrite' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">เลือกสไตล์การปรับสำนวน:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {REWRITE_STYLES.map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStyle(st.id)}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-left ${
                        selectedStyle === st.id
                          ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-400/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <p className="font-bold">{st.label}</p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">{st.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRewrite}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>{isLoading ? 'กำลังเรียบเรียง...' : 'เริ่มเรียบเรียงใหม่'}</span>
                </button>
              </div>

              {rewrittenText && (
                <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-500">ผลลัพธ์การเรียบเรียง:</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(rewrittenText)}
                      className="text-xs text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>คัดลอก</span>
                    </button>
                  </div>
                  <div className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 font-sans">
                    {rewrittenText}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleInsertRewritten('insert')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                    >
                      <ArrowDownRight className="w-3.5 h-3.5" />
                      <span>แทรกต่อท้ายโน้ต</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertRewritten('replace')}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow transition"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>แทนที่เนื้อหาเดิม</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
