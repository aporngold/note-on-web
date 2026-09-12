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
  const chosenMimeTypeRef = useRef<string>('');
  const chosenExtRef = useRef<string>('webm');

  // Detect supported audio MIME type cross-platform (iOS Safari / iPadOS, Android Chrome, PC/Mac)
  const getBestSupportedMimeType = (): { mimeType: string; extension: string } => {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
      return { mimeType: '', extension: 'webm' };
    }

    const candidateTypes = [
      // WebM with Opus (Chrome, Firefox, Edge, Android)
      { mime: 'audio/webm;codecs=opus', ext: 'webm' },
      { mime: 'audio/webm', ext: 'webm' },
      // MP4 / AAC (iOS Safari / iPadOS, macOS Safari)
      { mime: 'audio/mp4;codecs=mp4a.40.2', ext: 'm4a' },
      { mime: 'audio/mp4', ext: 'mp4' },
      { mime: 'audio/aac', ext: 'aac' },
      // Ogg / Opus
      { mime: 'audio/ogg;codecs=opus', ext: 'ogg' },
      // WAV
      { mime: 'audio/wav', ext: 'wav' },
    ];

    for (const cand of candidateTypes) {
      try {
        if (MediaRecorder.isTypeSupported(cand.mime)) {
          return { mimeType: cand.mime, extension: cand.ext };
        }
      } catch (e) {
        // continue
      }
    }

    return { mimeType: '', extension: 'webm' };
  };

  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
  }, [isOpen]);

  const [permissionErrorType, setPermissionErrorType] = useState<'denied' | 'insecure_context' | 'not_supported' | 'not_found' | 'other' | null>(null);

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
    setPermissionErrorType(null);
  };

  const startRecording = async () => {
    setPermissionErrorType(null);

    // Check secure context for mobile devices over LAN IP (e.g. http://192.168.x.x:3000)
    if (
      typeof window !== 'undefined' &&
      !window.isSecureContext &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      setHasPermission(false);
      setPermissionErrorType('insecure_context');
      toast.error('การเข้าถึงไมโครโฟนบนมือถือต้องใช้ HTTPS หรือ localhost');
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setHasPermission(false);
      setPermissionErrorType('not_supported');
      toast.error('เบราว์เซอร์นี้ไม่รองรับการบันทึกเสียง หรือถูกบล็อกเนื่องจากความปลอดภัย');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      setPermissionErrorType(null);

      const { mimeType, extension } = getBestSupportedMimeType();
      chosenMimeTypeRef.current = mimeType;
      chosenExtRef.current = extension;

      const options: MediaRecorderOptions = {};
      if (mimeType) {
        options.mimeType = mimeType;
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalType = chosenMimeTypeRef.current || mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: finalType });
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

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionErrorType('denied');
        toast.error('เบราว์เซอร์ไม่อนุญาตให้ใช้ไมค์ กรุณากดเปิดสิทธิ์ที่ไอคอนแม่กุญแจบนแถบ URL');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionErrorType('not_found');
        toast.error('ไม่พบอุปกรณ์ไมโครโฟน');
      } else {
        setPermissionErrorType('other');
        toast.error('ไม่สามารถเข้าถึงไมโครโฟนได้: ' + (err.message || 'โปรดตรวจสอบสิทธิ์'));
      }
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
      const ext = chosenExtRef.current || 'webm';
      const filename = `voice-memo-${dateStr}.${ext}`;
      const file = new File([audioBlob], filename, { type: audioBlob.type || `audio/${ext}` });

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
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 space-y-2 text-xs text-rose-700 dark:text-rose-300 animate-fade-in">
            <div className="flex items-start gap-2.5 font-bold">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-500" />
              <span>
                {permissionErrorType === 'insecure_context'
                  ? 'เบราว์เซอร์บล็อกไมค์บนการเชื่อมต่อที่ไม่ปลอดภัย (HTTP)'
                  : permissionErrorType === 'denied'
                  ? 'เบราว์เซอร์ไม่ได้รับอนุญาตให้ใช้ไมโครโฟน'
                  : 'ไม่สามารถเข้าถึงไมโครโฟนได้'}
              </span>
            </div>

            <div className="pl-6 text-[11px] text-slate-600 dark:text-slate-300 space-y-1 leading-relaxed">
              {permissionErrorType === 'insecure_context' ? (
                <p>
                  เบราว์เซอร์บนมือถือต้องการการเชื่อมต่อแบบ <strong>HTTPS</strong> หรือ <strong>localhost</strong> ในการเข้าถึงไมค์ หากเข้าผ่าน IP วงแลน (เช่น 192.168.x.x) เบราว์เซอร์จะบล็อกตามระบบความปลอดภัย
                </p>
              ) : (
                <p>
                  <strong>วิธีแก้ไข:</strong> แตะไอคอน <strong>แม่กุญแจ</strong> หรือ <strong>การตั้งค่าสิทธิ์เว็บไซต์</strong> ที่ด้านหน้าแถบ URL ของเบราว์เซอร์ แล้วเลือก <strong>อนุญาต (Allow) ไมโครโฟน</strong>
                </p>
              )}
            </div>

            <div className="pl-6 pt-1">
              <button
                type="button"
                onClick={startRecording}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition shadow-xs flex items-center gap-1.5"
              >
                <RotateCcw size={13} />
                <span>ลองเชื่อมต่อไมค์อีกครั้ง</span>
              </button>
            </div>
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
