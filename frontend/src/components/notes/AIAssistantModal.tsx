import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Bot,
  FileText,
  Check,
  Copy,
  Plus,
  RefreshCw,
  Loader2,
  CheckCircle2,
  KeyRound,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/utils/api';
import { AISummaryResult, AIRewriteResult } from '@/types';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteTitle: string;
  noteContent: string;
  onInsertContent: (html: string) => void;
}

export default function AIAssistantModal({
  isOpen,
  onClose,
  noteTitle,
  noteContent,
  onInsertContent,
}: AIAssistantModalProps) {
  const [activeTab, setActiveTab] = useState<'summarize' | 'rewrite' | 'settings'>('summarize');
  const [isLoading, setIsLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<AISummaryResult | null>(null);
  const [rewrittenText, setRewrittenText] = useState('');
  const [engineUsed, setEngineUsed] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState('professional');
  const [geminiKey, setGeminiKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('gemini_free_api_key') || '';
      setGeminiKey(savedKey);
    }
  }, []);

  if (!isOpen) return null;

  const handleSaveKey = () => {
    localStorage.setItem('gemini_free_api_key', geminiKey.trim());
    toast.success('บันทึก API Key แล้ว (เก็บในเครื่องของคุณอย่างปลอดภัย)');
  };

  const handleSummarize = async () => {
    try {
      setIsLoading(true);
      const headers: Record<string, string> = {};
      if (geminiKey.trim()) {
        headers['x-gemini-key'] = geminiKey.trim();
      }

      const res = await api.post(
        '/ai/summarize',
        {
          title: noteTitle,
          content: noteContent,
        },
        { headers }
      );

      setSummaryResult(res.data);
      setEngineUsed(res.data.engine);
      toast.success('สรุปเนื้อหาสำเร็จ!');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'การสรุปเนื้อหาล้มเหลว');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRewrite = async () => {
    try {
      setIsLoading(true);
      const headers: Record<string, string> = {};
      if (geminiKey.trim()) {
        headers['x-gemini-key'] = geminiKey.trim();
      }

      const res = await api.post(
        '/ai/rewrite',
        {
          content: noteContent,
          style: selectedStyle,
        },
        { headers }
      );

      setRewrittenText(res.data.rewritten);
      setEngineUsed(res.data.engine);
      toast.success('เรียบเรียงเนื้อหาใหม่สำเร็จ!');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'การเรียบเรียงล้มเหลว');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInsertSummary = () => {
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

    onInsertContent(html);
    toast.success('แทรกสรุปความลงในโน้ตแล้ว');
    onClose();
  };

  const handleInsertRewritten = () => {
    if (!rewrittenText) return;
    const formattedHtml = `<p>${rewrittenText.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>')}</p>`;
    onInsertContent(formattedHtml);
    toast.success('แทรกข้อความที่เรียบเรียงลงในโน้ตแล้ว');
    onClose();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success('คัดลอกข้อความแล้ว');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">SecureNote AI Assistant</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  ฟรี 100%
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">ผู้ช่วย AI อัจฉริยะช่วยสรุป เรียบเรียง และต่อยอดเนื้อหา</p>
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
        <div className="flex items-center px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
          <button
            type="button"
            onClick={() => setActiveTab('summarize')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'summarize'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ⚡ สรุปเนื้อหา (Summarize)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rewrite')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'rewrite'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ✍️ ปรับสำนวน (Rewrite)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ml-auto ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            ⚙️ ตั้งค่า Free API Key
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: Summarize */}
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
                      <span>ประมวลผลด้วย: {engineUsed === 'gemini-free' ? 'Gemini 2.0 Flash (Free)' : 'Local Smart NLP (ฟรีในเครื่อง)'}</span>
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
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Rewrite */}
          {activeTab === 'rewrite' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">เลือกสไตล์การปรับสำนวน:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'professional', label: '👔 สุภาพ / เป็นทางการ' },
                    { id: 'shorten', label: '✂️ รวบรัด / กระชับ' },
                    { id: 'expand', label: '📖 ขยายความละเอียด' },
                    { id: 'bullets', label: '• แปลงเป็นข้อย่อย' },
                    { id: 'friendly', label: '😊 อบอุ่น / เป็นกันเอง' },
                    { id: 'action_items', label: '☑️ แปลงเป็น To-Do List' },
                  ].map((st) => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedStyle(st.id)}
                      className={`p-2.5 rounded-xl border text-xs font-medium transition-all text-left ${
                        selectedStyle === st.id
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 ring-2 ring-indigo-400/20'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {st.label}
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
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Settings */}
          {activeTab === 'settings' && (
            <div className="space-y-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">Google Gemini Free API Key (ไม่บังคับ)</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    คุณสามารถขอรับ API Key ฟรี 100% ได้จาก Google AI Studio (โควตาฟรี 1,500 ครั้ง/วัน โดยไม่ต้องผูกบัตรเครดิต) หรือหากเว้นว่างไว้ ระบบจะใช้ <strong>Smart NLP Engine ในเครื่อง</strong> ซึ่งฟรี 100% และใช้งานได้ตลอดเวลา
                  </p>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline mt-1.5"
                  >
                    <span>ขอรับ Free API Key จาก Google AI Studio ได้ที่นี่</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow transition-all"
                >
                  บันทึกคีย์
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            ปิด
          </button>
          {activeTab === 'summarize' && summaryResult && (
            <button
              type="button"
              onClick={handleInsertSummary}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>แทรกสรุปความลงในโน้ต</span>
            </button>
          )}
          {activeTab === 'rewrite' && rewrittenText && (
            <button
              type="button"
              onClick={handleInsertRewritten}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>แทรกข้อความที่เรียบเรียงลงในโน้ต</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
