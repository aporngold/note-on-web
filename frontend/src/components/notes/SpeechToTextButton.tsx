import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { Editor } from '@tiptap/react';

interface SpeechToTextButtonProps {
  editor: Editor | null;
  variant?: 'default' | 'compact' | 'menu-item' | 'icon';
  className?: string;
  onActionComplete?: () => void;
}

// Check if current device is a smartphone, tablet, or touch-screen device
export const isTouchOrMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches)
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON SPEECH SERVICE
// Mobile / Tablet: One-Touch Clean Dictation (ไม่มีเสียงบี๊บถี่ ไม่เบิ้ลคำ)
// Desktop: Continuous Dictation (พูดต่อเนื่องได้ตามต้องการ)
// ─────────────────────────────────────────────────────────────────────────────

type Listener = (state: { isListening: boolean; interimText: string; lang: 'th-TH' | 'en-US' }) => void;

class SpeechToTextManager {
  private recognition: any = null;
  private isListening = false;
  private interimText = '';
  private lang: 'th-TH' | 'en-US' = 'th-TH';
  private activeEditor: Editor | null = null;
  private listeners: Set<Listener> = new Set();
  private lastInsertedText = '';
  private lastInsertedTime = 0;
  private lastSpeechTime = 0;
  private noSpeechCount = 0;
  private restartTimeout: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.isListening) {
          this.stop(false);
        }
      });
      window.addEventListener('pagehide', () => {
        if (this.isListening) this.stop(false);
      });
      window.addEventListener('beforeunload', () => {
        if (this.isListening) this.stop(false);
      });
    }
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener({
      isListening: this.isListening,
      interimText: this.interimText,
      lang: this.lang,
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) =>
      fn({
        isListening: this.isListening,
        interimText: this.interimText,
        lang: this.lang,
      })
    );
  }

  private initRecognition() {
    if (typeof window === 'undefined') return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    // Destroy existing instance if any
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
    }

    const recognition = new SpeechRecognition();
    const mobileDevice = isTouchOrMobile();

    // Enable continuous dictation across all platforms so users have time to speak naturally
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = this.lang;

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

      this.interimText = currentInterim;
      this.notify();

      if (finalTranscript && this.activeEditor) {
        if (this.activeEditor.isDestroyed) {
          this.stop(false);
          return;
        }

        this.noSpeechCount = 0;
        this.lastSpeechTime = Date.now();
        const trimmed = finalTranscript.trim();
        if (!trimmed) return;

        const now = Date.now();

        // Strict deduplication safeguard: ignore exact duplicate within 1.8 seconds
        if (trimmed === this.lastInsertedText && now - this.lastInsertedTime < 1800) {
          return;
        }

        this.lastInsertedText = trimmed;
        this.lastInsertedTime = now;
        this.activeEditor.chain().focus().insertContent(` ${trimmed} `).run();
        this.interimText = '';
        this.notify();
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[SpeechService] Recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('เบราว์เซอร์ไม่อนุญาตไมโครโฟน โปรดแตะไอคอนแม่กุญแจบนแถบ URL เพื่อเปิดสิทธิ์');
        this.stop(false);
      } else if (event.error === 'no-speech') {
        this.noSpeechCount += 1;
        // Allow at least 2 cycles of no-speech before stopping
        if (this.noSpeechCount >= 2) {
          this.stop(false);
        }
      } else if (event.error === 'network') {
        toast.error('การเชื่อมต่อกับระบบแปลงเสียงพูดขัดข้อง');
        this.stop(false);
      }
    };

    recognition.onend = () => {
      // 1. On Mobile, Tablet & iPad: STOP CLEANLY!
      // Do NOT restart automatically. This permanently eliminates the bouncing mic and Android chime loop.
      if (mobileDevice) {
        this.isListening = false;
        this.interimText = '';
        this.notify();
        return;
      }

      // 2. On Desktop: Keep listening if user hasn't explicitly stopped
      if (this.isListening && this.noSpeechCount < 2) {
        if (this.restartTimeout) clearTimeout(this.restartTimeout);
        this.restartTimeout = setTimeout(() => {
          if (this.isListening && this.recognition) {
            try {
              this.recognition.start();
            } catch (e) {}
          }
        }, 400);
      } else {
        this.isListening = false;
        this.interimText = '';
        this.notify();
      }
    };

    this.recognition = recognition;
    return recognition;
  }

  public setLanguage(newLang: 'th-TH' | 'en-US') {
    this.lang = newLang;
    if (this.isListening) {
      this.stop(false);
      setTimeout(() => {
        this.start(this.activeEditor);
      }, 250);
    } else {
      this.notify();
    }
  }

  public start(editor: Editor | null) {
    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      toast.error('การพิมพ์ด้วยเสียงบนมือถือต้องใช้ HTTPS หรือ localhost');
      return;
    }

    const rec = this.initRecognition();
    if (!rec) {
      toast.error('เบราว์เซอร์นี้ยังไม่รองรับ Web Speech API แนะนำให้ใช้ Google Chrome หรือ Edge');
      return;
    }

    this.activeEditor = editor;
    this.lastInsertedText = '';
    this.lastInsertedTime = 0;
    this.noSpeechCount = 0;
    this.lastSpeechTime = Date.now();

    try {
      rec.start();
      this.isListening = true;
      this.notify();
      const mobileMsg = isTouchOrMobile()
        ? `กำลังฟังเสียงพูด (${this.lang === 'th-TH' ? 'ภาษาไทย' : 'English'})... พูดได้เลย (แตะอีกครั้งเมื่อต้องการหยุด)`
        : `กำลังฟังเสียงพูดต่อเนื่อง (${this.lang === 'th-TH' ? 'ภาษาไทย' : 'English'})... พูดได้เลย`;
      toast.success(mobileMsg);
    } catch (err: any) {
      console.error('[SpeechService] start error:', err);
      this.isListening = false;
      this.notify();
    }
  }

  public stop(notify = true) {
    this.isListening = false;
    this.interimText = '';
    this.noSpeechCount = 0;
    this.lastSpeechTime = 0;
    if (this.restartTimeout) clearTimeout(this.restartTimeout);
    this.notify();

    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
    }

    if (notify) {
      toast('หยุดพิมพ์ตามเสียงพูดแล้ว', { icon: '🛑' });
    }
  }

  public toggle(editor: Editor | null) {
    if (this.isListening) {
      this.stop(true);
    } else {
      this.start(editor);
    }
  }
}

// Global Singleton Instance
const speechManager = new SpeechToTextManager();

export function stopGlobalSpeechToText(notify = false) {
  speechManager.stop(notify);
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function SpeechToTextButton({
  editor,
  variant = 'default',
  className = '',
  onActionComplete,
}: SpeechToTextButtonProps) {
  const [state, setState] = useState({
    isListening: false,
    interimText: '',
    lang: 'th-TH' as 'th-TH' | 'en-US',
  });

  const editorRef = useRef<Editor | null>(editor);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  // Subscribe to the Singleton Manager
  useEffect(() => {
    const unsubscribe = speechManager.subscribe((newState) => {
      setState(newState);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleToggleListening = () => {
    speechManager.toggle(editorRef.current);
    if (onActionComplete) {
      onActionComplete();
    }
  };

  const handleToggleLanguage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextLang = state.lang === 'th-TH' ? 'en-US' : 'th-TH';
    speechManager.setLanguage(nextLang);
    toast(`สลับภาษาเป็น: ${nextLang === 'th-TH' ? '🇹🇭 ภาษาไทย' : '🇺🇸 English'}`);
  };

  // 1. Menu item variant for Bottom Sheets / More Drawers
  if (variant === 'menu-item') {
    return (
      <div
        className={`w-full flex items-center justify-between p-3 rounded-2xl border transition ${
          state.isListening
            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
        } ${className}`}
      >
        <button
          type="button"
          onClick={handleToggleListening}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <div
            className={`p-2 rounded-xl transition ${
              state.isListening
                ? 'bg-rose-500 text-white animate-pulse'
                : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            <Mic size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>พูดเพื่อพิมพ์ (Speech-to-Text)</span>
              {state.isListening && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                  กำลังฟัง...
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {state.isListening
                ? 'กำลังฟังเสียงพูด (แตะอีกครั้งเมื่อต้องการหยุด)'
                : 'แตะเพื่อเปิดไมค์พิมพ์ข้อความด้วยเสียง'}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={handleToggleLanguage}
          title="สลับภาษาพูด"
          className="px-2 py-1 text-xs font-bold rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition"
        >
          {state.lang === 'th-TH' ? '🇹🇭 TH' : '🇺🇸 EN'}
        </button>
      </div>
    );
  }

  // 2. Compact / Icon variant for Mobile & Tablet toolbar
  if (variant === 'compact' || variant === 'icon') {
    return (
      <div className={`relative inline-flex items-center ${className}`}>
        <button
          type="button"
          onClick={handleToggleListening}
          title={
            state.isListening
              ? 'กำลังฟังเสียงพูดเพื่อพิมพ์ (แตะเพื่อหยุด)'
              : 'พูดเพื่อพิมพ์ (Speech-to-Text)'
          }
          aria-label="พูดเพื่อพิมพ์"
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
            state.isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-md ring-2 ring-rose-300 dark:ring-rose-900'
              : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
          }`}
        >
          <Mic size={18} className={state.isListening ? 'animate-bounce' : ''} />
        </button>

        {/* Small language toggle badge */}
        <button
          type="button"
          onClick={handleToggleLanguage}
          title="สลับภาษา (TH/EN)"
          className="px-1 py-0.5 text-[9px] font-extrabold rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition -ml-1 mr-1"
        >
          {state.lang === 'th-TH' ? 'TH' : 'EN'}
        </button>

        {/* Floating preview for interim transcript */}
        {state.isListening && state.interimText && (
          <div className="fixed bottom-20 left-4 right-4 mx-auto max-w-sm px-3 py-2 rounded-xl bg-slate-900/95 text-white text-xs shadow-2xl border border-slate-700 z-[9999] animate-fade-in backdrop-blur-md pointer-events-none text-center">
            <span className="text-amber-300 font-semibold mr-1">🎙️ กำลังฟัง:</span>
            <span>{state.interimText}</span>
          </div>
        )}
      </div>
    );
  }

  // 3. Default variant for Desktop toolbar
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={handleToggleListening}
        title={
          state.isListening
            ? 'กำลังฟังเสียงพูดต่อเนื่อง (คลิกเพื่อหยุด)'
            : 'พูดเพื่อพิมพ์ (Speech-to-Text)'
        }
        aria-label="พูดเพื่อพิมพ์"
        className={`p-1.5 rounded-lg transition font-medium flex items-center justify-center ${
          state.isListening
            ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-300 dark:ring-rose-900 shadow-sm'
            : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
        }`}
      >
        <Mic size={16} className={state.isListening ? 'animate-bounce' : ''} />
      </button>

      {/* Language badge toggle */}
      <button
        type="button"
        onClick={handleToggleLanguage}
        title="คลิกเพื่อสลับภาษาพูด (ไทย / English)"
        className="ml-0.5 px-1 py-0.5 text-[9px] font-extrabold rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 transition-colors"
      >
        {state.lang === 'th-TH' ? 'TH' : 'EN'}
      </button>

      {/* Floating interim transcript preview */}
      {state.isListening && state.interimText && (
        <div className="absolute left-0 bottom-full mb-2 px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs whitespace-nowrap shadow-xl border border-slate-700 z-50 animate-fade-in backdrop-blur-sm pointer-events-none">
          <span className="text-amber-300 font-semibold mr-1">🎙️ กำลังฟัง:</span>
          <span>{state.interimText}</span>
        </div>
      )}
    </div>
  );
}
