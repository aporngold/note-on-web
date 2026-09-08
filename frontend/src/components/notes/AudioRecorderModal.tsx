import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, RotateCcw, Check, X, Volume2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/utils/api';

interface AudioRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId?: string;
  onAudioSaved: (audioUrl: string, originalName: string) => void;
}

export default function AudioRecorderModal({
  isOpen,
  onClose,
  noteId,
  onAudioSaved,
}: AudioRecorderModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
  }, [isOpen]);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setIsRecording(false);
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setIsUploading(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      setHasPermission(false);
      toast.error('ไม่สามารถเข้าถึงไมโครโฟนได้ กรุณาอนุญาตการใช้งานไมโครโฟนในเบราว์เซอร์');
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current || !audioUrl) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSaveAudio = async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    try {
      const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `voice-memo-${dateStr}.webm`;
      const file = new File([audioBlob], filename, { type: 'audio/webm' });

      const formData = new FormData();
      formData.append('file', file);
      if (noteId) {
        formData.append('noteId', noteId);
      }

      const res = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const serverUrl = res.data.url;
      toast.success('บันทึกไฟล์เสียงสำเร็จ');
      onAudioSaved(serverUrl, filename);
      onClose();
    } catch (error) {
      console.error('Upload audio error:', error);
      toast.error('เกิดข้อผิดพลาดในการอัปโหลดไฟล์เสียง');
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X size={18} />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3 shadow-inner">
            <Mic size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">บันทึกเสียง (Voice Memo)</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            อัดเสียงพูด บันทึกการประชุม หรือไอเดียด่วน แล้วแทรกลงในโน้ตของคุณ
          </p>
        </div>

        {hasPermission === false && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>เบราว์เซอร์ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน โปรดเปิดสิทธิ์ในหน้าต่างความปลอดภัยของเบราว์เซอร์</span>
          </div>
        )}

        {/* Recording Animation & Timer */}
        <div className="py-6 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center mb-4">
            {isRecording && (
              <span className="absolute w-24 h-24 rounded-full bg-rose-500/20 animate-ping" />
            )}
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                  : audioUrl
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              }`}
            >
              {isRecording ? <Square size={26} /> : audioUrl ? <Volume2 size={26} /> : <Mic size={26} />}
            </div>
          </div>

          <span className="font-mono text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-wider">
            {formatTime(recordingTime)}
          </span>

          {isRecording && (
            <span className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
              กำลังบันทึกเสียง...
            </span>
          )}
        </div>

        {/* Audio Player Preview */}
        {audioUrl && !isRecording && (
          <div className="mb-6 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <button
              onClick={togglePlayback}
              className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-700 transition shrink-0"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <div className="flex-1 text-xs">
              <div className="font-semibold text-slate-800 dark:text-slate-200">ฟังเสียงตัวอย่าง</div>
              <div className="text-slate-400 text-[11px]">ความยาว {formatTime(recordingTime)}</div>
            </div>
            <audio
              ref={audioPlayerRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            <button
              onClick={cleanup}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="บันทึกใหม่"
            >
              <RotateCcw size={16} />
            </button>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {!isRecording && !audioUrl && (
            <button
              onClick={startRecording}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <Mic size={18} />
              เริ่มบันทึกเสียง
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <Square size={16} />
              หยุดการบันทึก
            </button>
          )}

          {audioUrl && !isRecording && (
            <>
              <button
                onClick={cleanup}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition"
              >
                อัดใหม่
              </button>
              <button
                onClick={handleSaveAudio}
                disabled={isUploading}
                className="flex-[2] py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check size={18} />
                {isUploading ? 'กำลังอัปโหลด...' : 'แนบไฟล์เสียงลงในโน้ต'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
