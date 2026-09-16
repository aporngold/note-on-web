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

export type SpeechSessionState = 'idle' | 'starting' | 'listening' | 'stopping' | 'error';

interface SpeechStateSnapshot {
  status: SpeechSessionState;
  isListening: boolean;
  interimText: string;
  lang: 'th-TH' | 'en-US';
  errorMessage?: string;
}

type Listener = (state: SpeechStateSnapshot) => void;

class SpeechToTextManager {
  private recognition: any = null;
  private userIntent = false; // Explicit user desire to be dictating
  private status: SpeechSessionState = 'idle';
  private interimText = '';
  private lang: 'th-TH' | 'en-US' = 'th-TH';
  private activeEditor: Editor | null = null;
  private listeners: Set<Listener> = new Set();
  
  // Index-based deduplication: ensures NO duplicate transcripts even if Safari resets resultIndex
  private highestFinalIndex = -1;
  private lastInsertedText = '';
  private lastInsertedTime = 0;
  private lastSpeechTime = 0;
  private noSpeechCount = 0;
  private restartTimeout: NodeJS.Timeout | null = null;
  private silenceCheckTimer: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.userIntent) {
          this.stop(false);
        }
      });
      window.addEventListener('pagehide', () => {
        if (this.userIntent) this.stop(false);
      });
      window.addEventListener('beforeunload', () => {
        if (this.userIntent) this.stop(false);
      });
    }
  }

  public subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private getSnapshot(): SpeechStateSnapshot {
    return {
      status: this.status,
      isListening: this.status === 'listening' || this.status === 'starting',
      interimText: this.interimText,
      lang: this.lang,
    };
  }

  private notify() {
    const snap = this.getSnapshot();
    this.listeners.forEach((fn) => fn(snap));
  }

  private cleanupRecognitionInstance() {
    if (this.recognition) {
      try {
        this.recognition.onstart = null;
        this.recognition.onresult = null;
        this.recognition.onerror = null;
        this.recognition.onend = null;
        this.recognition.abort();
      } catch (e) {}
      this.recognition = null;
    }
  }

  private createRecognitionInstance() {
    if (typeof window === 'undefined') return null;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return null;

    this.cleanupRecognitionInstance();

    const recognition = new SpeechRecognition();
    const isMobile = isTouchOrMobile();

    // Enable continuous dictation and interim results across platforms
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = this.lang;

    // Reset session-scoped index tracking
    this.highestFinalIndex = -1;

    recognition.onstart = () => {
      // Hardware session is actually active
      if (!this.userIntent) {
        // User clicked stop before hardware started
        try {
          recognition.abort();
        } catch (e) {}
        this.status = 'idle';
        this.notify();
        return;
      }

      this.status = 'listening';
      this.lastSpeechTime = Date.now();
      this.noSpeechCount = 0;
      this.notify();
    };

    recognition.onresult = (event: any) => {
      this.lastSpeechTime = Date.now();
      this.noSpeechCount = 0;

      let currentInterim = '';
      let newFinalText = '';

      // Bulletproof result traversal: track highest finalized index to permanently eliminate Safari duplicate bug
      for (let i = 0; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          if (i > this.highestFinalIndex) {
            newFinalText += (newFinalText ? ' ' : '') + item[0].transcript.trim();
            this.highestFinalIndex = i;
          }
        } else {
          currentInterim += (currentInterim ? ' ' : '') + item[0].transcript;
        }
      }

      this.interimText = currentInterim;
      this.notify();

      // Insert confirmed new final text into TipTap without stealing focus or triggering keyboard jump
      if (newFinalText && this.activeEditor && !this.activeEditor.isDestroyed) {
        const textToInsert = newFinalText.trim();
        if (textToInsert) {
          const now = Date.now();
          // STRICT DEDUPLICATION: Ignore exact duplicate phrase within 3 seconds
          if (textToInsert === this.lastInsertedText && now - this.lastInsertedTime < 3000) {
            console.warn('[STT] Dropped duplicate text:', textToInsert);
            return;
          }

          this.lastInsertedText = textToInsert;
          this.lastInsertedTime = now;

          try {
            const isDocEmpty = this.activeEditor.isEmpty;
            const prefix = isDocEmpty ? '' : ' ';
            this.activeEditor.commands.insertContent(`${prefix}${textToInsert}`);
          } catch (err) {
            console.warn('[STT] TipTap insertion error:', err);
          }
        }
        this.interimText = '';
        this.notify();
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[STT] Recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('เบราว์เซอร์ไม่อนุญาตไมโครโฟน โปรดแตะไอคอนแม่กุญแจบนแถบ URL เพื่อเปิดสิทธิ์');
        this.userIntent = false;
        this.status = 'error';
        this.notify();
        this.stop(false);
      } else if (event.error === 'no-speech') {
        this.noSpeechCount += 1;
        // If silence persists for 3 cycles or > 8 seconds, gracefully conclude
        if (this.noSpeechCount >= 3 || Date.now() - this.lastSpeechTime > 8000) {
          this.userIntent = false;
          this.stop(false);
        }
      } else if (event.error === 'network') {
        toast.error('การเชื่อมต่อระบบแปลงเสียงขัดข้อง');
        this.userIntent = false;
        this.status = 'error';
        this.notify();
        this.stop(false);
      }
    };

    recognition.onend = () => {
      // 1. If user explicitly stopped, or an error halted intent:
      if (!this.userIntent) {
        this.status = 'idle';
        this.interimText = '';
        this.cleanupRecognitionInstance();
        this.notify();
        return;
      }

      // 2. On Mobile / Tablet / iPad: STOP CLEANLY!
      // Do NOT auto-restart on touch mobile/tablet. This prevents re-transcribing the microphone audio buffer.
      if (isMobile) {
        this.userIntent = false;
        this.status = 'idle';
        this.interimText = '';
        this.cleanupRecognitionInstance();
        this.notify();
        return;
      }

      // 3. On Desktop: If browser ended naturally and user still wants dictation to continue:
      const isIdleTooLong = Date.now() - this.lastSpeechTime > 8500 && this.noSpeechCount >= 2;
      if (isIdleTooLong) {
        this.userIntent = false;
        this.status = 'idle';
        this.interimText = '';
        this.cleanupRecognitionInstance();
        this.notify();
        return;
      }

      // Safe, guarded restart on Desktop
      this.status = 'starting';
      this.notify();

      if (this.restartTimeout) clearTimeout(this.restartTimeout);
      this.restartTimeout = setTimeout(() => {
        if (!this.userIntent) {
          this.status = 'idle';
          this.notify();
          return;
        }

        try {
          const freshRec = this.createRecognitionInstance();
          if (freshRec) {
            freshRec.start();
          }
        } catch (e) {
          console.warn('[STT] restart error:', e);
          this.status = 'idle';
          this.userIntent = false;
          this.notify();
        }
      }, 300);
    };

    this.recognition = recognition;
    return recognition;
  }

  public setLanguage(newLang: 'th-TH' | 'en-US') {
    this.lang = newLang;
    if (this.userIntent) {
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

    if (this.restartTimeout) clearTimeout(this.restartTimeout);

    this.activeEditor = editor;
    this.userIntent = true;
    this.status = 'starting';
    this.lastSpeechTime = Date.now();
    this.noSpeechCount = 0;
    this.interimText = '';
    this.highestFinalIndex = -1;
    this.notify();

    const rec = this.createRecognitionInstance();
    if (!rec) {
      toast.error('เบราว์เซอร์นี้ยังไม่รองรับ Web Speech API แนะนำให้ใช้ Google Chrome หรือ Safari');
      this.userIntent = false;
      this.status = 'idle';
      this.notify();
      return;
    }

    try {
      rec.start();
      const mobileMsg = isTouchOrMobile()
        ? `กำลังฟังเสียงพูด (${this.lang === 'th-TH' ? 'ภาษาไทย' : 'English'})... พูดได้เลย`
        : `กำลังฟังเสียงพูดต่อเนื่อง (${this.lang === 'th-TH' ? 'ภาษาไทย' : 'English'})... พูดได้เลย`;
      toast.success(mobileMsg);
    } catch (err: any) {
      console.warn('[STT] start error:', err);
      this.userIntent = false;
      this.status = 'idle';
      this.notify();
    }
  }

  public stop(notify = true) {
    this.userIntent = false;
    this.status = 'stopping';
    this.interimText = '';
    this.noSpeechCount = 0;
    this.lastSpeechTime = 0;
    this.highestFinalIndex = -1;
    if (this.restartTimeout) clearTimeout(this.restartTimeout);

    this.cleanupRecognitionInstance();
    this.status = 'idle';
    this.notify();

    if (notify) {
      toast('หยุดพิมพ์ตามเสียงพูดแล้ว', { icon: '🛑' });
    }
  }

  public toggle(editor: Editor | null) {
    if (this.userIntent || this.status === 'listening' || this.status === 'starting') {
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
  const [state, setState] = useState<SpeechStateSnapshot>({
    status: 'idle',
    isListening: false,
    interimText: '',
    lang: 'th-TH',
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
                ? 'bg-rose-500 text-white ring-2 ring-rose-300 dark:ring-rose-800 shadow-sm'
                : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
            }`}
          >
            <Mic size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>พูดเพื่อพิมพ์ (Speech-to-Text)</span>
              {state.status === 'starting' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500 text-white font-bold">
                  กำลังเตรียมไมค์...
                </span>
              )}
              {state.status === 'listening' && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-bold">
                  กำลังฟัง...
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {state.isListening
                ? 'กำลังฟังเสียงพูด (แตะอีกครั้งเพื่อหยุด)'
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
            state.status === 'starting'
              ? 'กำลังเชื่อมต่อไมโครโฟน...'
              : state.isListening
              ? 'กำลังฟังเสียงพูดเพื่อพิมพ์ (แตะเพื่อหยุด)'
              : 'พูดเพื่อพิมพ์ (Speech-to-Text)'
          }
          aria-label="พูดเพื่อพิมพ์"
          className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition active:scale-95 ${
            state.isListening
              ? 'bg-rose-500 text-white shadow-md ring-2 ring-rose-300 dark:ring-rose-900'
              : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
          }`}
        >
          <Mic size={18} className={state.status === 'listening' ? 'scale-110 transition-transform duration-200' : ''} />
          {state.status === 'listening' && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-white animate-ping pointer-events-none" />
          )}
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
          state.status === 'starting'
            ? 'กำลังเชื่อมต่อไมโครโฟน...'
            : state.isListening
            ? 'กำลังฟังเสียงพูดต่อเนื่อง (คลิกเพื่อหยุด)'
            : 'พูดเพื่อพิมพ์ (Speech-to-Text)'
        }
        aria-label="พูดเพื่อพิมพ์"
        className={`relative p-1.5 rounded-lg transition font-medium flex items-center justify-center ${
          state.isListening
            ? 'bg-rose-500 text-white ring-2 ring-rose-300 dark:ring-rose-900 shadow-sm'
            : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
        }`}
      >
        <Mic size={16} className={state.status === 'listening' ? 'scale-110 transition-transform duration-200' : ''} />
        {state.status === 'listening' && (
          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-white animate-ping pointer-events-none" />
        )}
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
