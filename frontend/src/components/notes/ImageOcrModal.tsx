import React, { useState, useRef, useEffect } from 'react';
import { X, ScanText, Upload, Copy, Check, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { createWorker } from 'tesseract.js';

interface ImageOcrModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertText: (text: string) => void;
}

export default function ImageOcrModal({ isOpen, onClose, onInsertText }: ImageOcrModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [ocrLanguage, setOcrLanguage] = useState<'tha' | 'eng' | 'tha+eng'>('tha+eng');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Paste (Ctrl+V) anywhere inside modal
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const blob = items[i].getAsFile();
          if (blob) {
            const url = URL.createObjectURL(blob);
            setImageSrc(url);
            setExtractedText('');
            toast.success('วางรูปภาพจากคลิปบอร์ดแล้ว!');
          }
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('กรุณาเลือกไฟล์รูปภาพเท่านั้น');
        return;
      }
      const url = URL.createObjectURL(file);
      setImageSrc(url);
      setExtractedText('');
    }
  };

  const handleStartOcr = async () => {
    if (!imageSrc) {
      toast.error('กรุณาเลือกหรือวางรูปภาพก่อนสแกน');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setProgressStatus('กำลังเตรียมระบบ OCR ในเครื่อง...');

    try {
      const worker = await createWorker(ocrLanguage, 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100));
            setProgressStatus(`กำลังอ่านตัวอักษร (${Math.round(m.progress * 100)}%)...`);
          } else if (m.status) {
            setProgressStatus(`สถานะ: ${m.status}...`);
          }
        },
      });

      const ret = await worker.recognize(imageSrc);
      const text = ret.data.text.trim();
      await worker.terminate();

      if (!text) {
        toast('ไม่พบตัวอักษรที่ชัดเจนในรูปภาพ', { icon: '⚠️' });
        setExtractedText('ไม่พบตัวอักษรในภาพ ลองเปลี่ยนภาพที่มีความคมชัดหรือปรับภาษา');
      } else {
        setExtractedText(text);
        toast.success('สแกนข้อความสำเร็จ!');
      }
    } catch (error: any) {
      console.error('OCR Error:', error);
      toast.error('การสแกนรูปภาพล้มเหลว กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsProcessing(false);
      setProgress(100);
    }
  };

  const handleCopy = () => {
    if (!extractedText) return;
    navigator.clipboard.writeText(extractedText);
    setIsCopied(true);
    toast.success('คัดลอกข้อความแล้ว');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleInsert = () => {
    if (!extractedText) return;
    onInsertText(extractedText);
    toast.success('แทรกลงในโน้ตเรียบร้อยแล้ว');
    onClose();
  };

  const reset = () => {
    setImageSrc(null);
    setExtractedText('');
    setProgress(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <ScanText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">สแกนข้อความจากภาพ (Free OCR)</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">แปลงรูปภาพเป็นตัวอักษรฟรี 100% ประมวลผลในเครื่องของคุณ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Upload or Dropzone */}
          {!imageSrc ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 transition-all text-center group"
            >
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">คลิกเพื่อเลือกรูปภาพ หรือกด Ctrl+V เพื่อวางรูป</p>
                <p className="text-xs text-slate-400 mt-1">รองรับ PNG, JPG, JPEG, WebP, สกรีนช็อต</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview & Controls */}
              <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 max-h-56 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <img src={imageSrc} alt="Preview" className="max-h-56 object-contain" />
                <button
                  onClick={reset}
                  className="absolute top-2 right-2 px-2.5 py-1 bg-slate-900/80 hover:bg-slate-900 text-white rounded-lg text-xs font-medium backdrop-blur-sm transition-all"
                >
                  เปลี่ยนรูป
                </button>
              </div>

              {/* Language Selection & Action */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">ภาษาในภาพ:</span>
                  <select
                    value={ocrLanguage}
                    onChange={(e: any) => setOcrLanguage(e.target.value)}
                    disabled={isProcessing}
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="tha+eng">🇹🇭 ไทย + 🇺🇸 อังกฤษ (แนะนำ)</option>
                    <option value="tha">🇹🇭 ภาษาไทยอย่างเดียว</option>
                    <option value="eng">🇺🇸 English Only</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleStartOcr}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md hover:shadow-indigo-500/25 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{progressStatus || 'กำลังสแกน...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>เริ่มสแกนข้อความ (OCR)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 text-right">{progress}%</p>
                </div>
              )}

              {/* Extracted Text Result */}
              {extractedText && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      ผลลัพธ์ข้อความที่ตรวจพบ:
                    </label>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                    </button>
                  </div>
                  <textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    rows={6}
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-sans leading-relaxed"
                  />
                </div>
              )}
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
          {extractedText && (
            <button
              type="button"
              onClick={handleInsert}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all shadow-md hover:shadow-emerald-500/25"
            >
              <Check className="w-4 h-4" />
              <span>แทรกลงในโน้ตทันที</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
