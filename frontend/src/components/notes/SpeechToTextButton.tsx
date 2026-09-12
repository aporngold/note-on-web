import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { Editor } from '@tiptap/react';

interface SpeechToTextButtonProps {
  editor: Editor | null;
  variant?: 'default' | 'compact' | 'menu-item' | 'icon';
  className?: string;
  onActionComplete?: () => void;
}

export default function SpeechToTextButton({
  editor,
  variant = 'default',
  className = '',
  onActionComplete,
}: SpeechToTextButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [lang, setLang] = useState<'th-TH' | 'en-US'>('th-TH');
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<Editor | null>(editor);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    // Check Web Speech API support
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = lang;

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      setInterimText(currentInterim);

      if (finalTranscript && editorRef.current) {
        editorRef.current.chain().focus().insertContent(` ${finalTranscript.trim()} `).run();
        setInterimText('');
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('เบราว์เซอร์ไม่อนุญาตไมโครโฟน โปรดแตะไอคอนแม่กุญแจบนแถบ URL เพื่อเปิดสิทธิ์');
        isListeningRef.current = false;
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        // Silent timeout by browser - do NOT disable, let onend auto-restart
      } else if (event.error === 'aborted') {
        // Manual stop or restart, ignore
      }
    };

    recognition.onend = () => {
      // If user still wants to listen, auto-restart seamlessly (Continuous Dictation)
      if (isListeningRef.current) {
        if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = setTimeout(() => {
          if (isListeningRef.current && recognitionRef.current) {
            try {
              recognitionRef.current.start();
            } catch (e: any) {
              // Already running or starting
            }
          }
        }, 150);
      } else {
        setIsListening(false);
        setInterimText('');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, [lang]);

  const toggleListening = () => {
    // Check secure context for mobile devices over LAN IP
    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      toast.error('การพิมพ์ด้วยเสียงบนมือถือต้องใช้ HTTPS หรือ localhost');
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('เบราว์เซอร์นี้ยังไม่รองรับ Web Speech API แนะนำให้ใช้ Google Chrome หรือ Microsoft Edge');
      return;
    }

    if (isListeningRef.current) {
      isListeningRef.current = false;
      setIsListening(false);
      if (restartTimeoutRef.current) clearTimeout(restartTimeoutRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
      toast('หยุดพิมพ์ตามเสียงพูดแล้ว', { icon: '🛑' });
    } else {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = lang;
          isListeningRef.current = true;
          setIsListening(true);
          recognitionRef.current.start();
          toast.success(`กำลังฟังเสียงพูด (${lang === 'th-TH' ? 'ภาษาไทย' : 'English'})... พูดได้ต่อเนื่องเลย!`);
        }
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    }
    if (onActionComplete) {
      onActionComplete();
    }
  };

  const toggleLanguage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextLang = lang === 'th-TH' ? 'en-US' : 'th-TH';
    setLang(nextLang);
    if (isListeningRef.current && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setTimeout(() => {
        if (recognitionRef.current && isListeningRef.current) {
          recognitionRef.current.lang = nextLang;
          try {
            recognitionRef.current.start();
          } catch (e) {}
        }
      }, 200);
    }
    toast(`สลับภาษาเป็น: ${nextLang === 'th-TH' ? '🇹🇭 ภาษาไทย' : '🇺🇸 English'}`);
  };

  // 1. Menu item variant for Bottom Sheets
  if (variant === 'menu-item') {
    return (
      <div className={`w-full flex items-center justify-between p-3 rounded-2xl border transition ${
        isListening
          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
      } ${className}`}>
        <button
          type="button"
          onClick={toggleListening}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <div className={`p-2 rounded-xl ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'}`}>
            <Mic size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>พูดเพื่อพิมพ์ (Speech-to-Text)</span>
              {isListening && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                  กำลังฟัง...
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              แปลงเสียงพูดสดเป็นตัวหนังสือลงในเนื้อหาโน้ต
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={toggleLanguage}
          title="สลับภาษาพูด"
          className="px-2 py-1 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition"
        >
          {lang === 'th-TH' ? '🇹🇭 TH' : '🇺🇸 EN'}
        </button>
      </div>
    );
  }

  // 2. Compact / Icon variant for mobile toolbar
  if (variant === 'compact' || variant === 'icon') {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <button
          type="button"
          onClick={toggleListening}
          title={isListening ? 'กำลังฟังเสียงพูดเพื่อพิมพ์ (แตะเพื่อหยุด)' : 'พูดเพื่อพิมพ์ (Speech-to-Text)'}
          aria-label="พูดเพื่อพิมพ์"
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-md'
              : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
          }`}
        >
          <Mic size={18} className={isListening ? 'animate-bounce' : ''} />
        </button>

        {/* Small language toggle badge */}
        <button
          type="button"
          onClick={toggleLanguage}
          title="สลับภาษา (TH/EN)"
          className="px-1 py-0.5 text-[9px] font-extrabold rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition -ml-1 mr-1"
        >
          {lang === 'th-TH' ? 'TH' : 'EN'}
        </button>

        {/* Floating preview for interim transcript */}
        {isListening && interimText && (
          <div className="fixed bottom-20 left-4 right-4 mx-auto max-w-sm px-3 py-2 rounded-xl bg-slate-900/95 text-white text-xs shadow-2xl border border-slate-700 z-[9999] animate-fade-in backdrop-blur-md pointer-events-none text-center">
            <span className="text-amber-300 font-semibold mr-1">🎙️ ได้ยินว่า:</span>
            <span>{interimText}</span>
          </div>
        )}
      </div>
    );
  }

  // 3. Default variant for desktop / rich toolbar (compact icon-only with language badge)
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        title={isListening ? 'กำลังฟังเสียงพูดเพื่อพิมพ์ (คลิกเพื่อหยุด)' : 'พูดเพื่อพิมพ์ (Speech-to-Text)'}
        aria-label="พูดเพื่อพิมพ์"
        className={`p-1.5 rounded-lg transition font-medium flex items-center justify-center ${
          isListening
            ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-300 dark:ring-rose-900 shadow-sm'
            : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
        }`}
      >
        <Mic size={16} className={isListening ? 'animate-bounce' : ''} />
      </button>

      {/* Language badge toggle */}
      <button
        type="button"
        onClick={toggleLanguage}
        title="คลิกเพื่อสลับภาษาพูด (ไทย / English)"
        className="ml-0.5 px-1 py-0.5 text-[9px] font-extrabold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors"
      >
        {lang === 'th-TH' ? 'TH' : 'EN'}
      </button>

      {/* Floating interim transcript preview */}
      {isListening && interimText && (
        <div className="absolute left-0 bottom-full mb-2 px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs whitespace-nowrap shadow-xl border border-slate-700 z-50 animate-fade-in backdrop-blur-sm pointer-events-none">
          <span className="text-amber-300 font-semibold mr-1">🎙️ ได้ยินว่า:</span>
          <span>{interimText}</span>
        </div>
      )}
    </div>
  );
}
