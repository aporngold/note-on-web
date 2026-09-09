import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { Editor } from '@tiptap/react';

interface SpeechToTextButtonProps {
  editor: Editor | null;
}

export default function SpeechToTextButton({ editor }: SpeechToTextButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [lang, setLang] = useState<'th-TH' | 'en-US'>('th-TH');
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);

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

      if (finalTranscript && editor) {
        editor.chain().focus().insertContent(` ${finalTranscript.trim()} `).run();
        setInterimText('');
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('กรุณาอนุญาตการเข้าถึงไมโครโฟนบนเบราว์เซอร์');
        setIsListening(false);
      } else if (event.error === 'no-speech') {
        // Just silent timeout, ignore
      }
    };

    recognition.onend = () => {
      // If user didn't explicitly stop, restart for continuous dictation
      if (isListening) {
        try {
          recognition.start();
        } catch (e) {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
        setInterimText('');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [lang, editor, isListening]);

  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error('เบราว์เซอร์นี้ยังไม่รองรับ Web Speech API แนะนำให้ใช้ Google Chrome หรือ Microsoft Edge');
      return;
    }

    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      toast('หยุดพิมพ์ตามเสียงพูดแล้ว', { icon: '🛑' });
    } else {
      try {
        if (recognitionRef.current) {
          recognitionRef.current.lang = lang;
          recognitionRef.current.start();
          setIsListening(true);
          toast.success(`กำลังฟังเสียงพูด (${lang === 'th-TH' ? 'ภาษาไทย' : 'English'})... พูดได้เลย!`);
        }
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
      }
    }
  };

  const toggleLanguage = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextLang = lang === 'th-TH' ? 'en-US' : 'th-TH';
    setLang(nextLang);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.lang = nextLang;
          recognitionRef.current.start();
        }
      }, 200);
    }
    toast(`สลับภาษาเป็น: ${nextLang === 'th-TH' ? '🇹🇭 ภาษาไทย' : '🇺🇸 English'}`);
  };

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggleListening}
        title={isListening ? 'กำลังพิมพ์ตามเสียงพูดสด (คลิกเพื่อหยุด)' : 'พิมพ์ตามเสียงพูดสด (Speech-to-Text)'}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
          isListening
            ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-300 dark:ring-rose-900'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
        }`}
      >
        {isListening ? (
          <>
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <Mic className="w-3.5 h-3.5" />
            <span>กำลังฟัง...</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-indigo-500" />
            <span>พูดพิมพ์สด</span>
          </>
        )}
      </button>

      {/* Language badge toggle */}
      <button
        type="button"
        onClick={toggleLanguage}
        title="คลิกเพื่อสลับภาษา (ไทย / English)"
        className="ml-1 px-1.5 py-1 text-[10px] font-bold rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors"
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
