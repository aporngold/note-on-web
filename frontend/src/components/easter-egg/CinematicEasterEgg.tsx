import React, { useEffect, useRef } from 'react';
import ViewportPortal from '../ui/ViewportPortal';

interface CinematicEasterEggProps {
  isActive: boolean;
  onClose: () => void;
}

export default function CinematicEasterEgg({ isActive, onClose }: CinematicEasterEggProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const yinPieceRef = useRef<HTMLDivElement | null>(null);
  const yangPieceRef = useRef<HTMLDivElement | null>(null);
  const energyCoreRef = useRef<HTMLDivElement | null>(null);
  const flashOverlayRef = useRef<HTMLDivElement | null>(null);
  const filmGrainRef = useRef<HTMLDivElement | null>(null);
  const anamorphicFlareRef = useRef<HTMLDivElement | null>(null);
  const lightRaysRef = useRef<HTMLDivElement | null>(null);
  const titleMainRef = useRef<SVGSVGElement | null>(null);
  const titleSubRef = useRef<SVGSVGElement | null>(null);
  const finalYinYangRef = useRef<HTMLDivElement | null>(null);
  const letterboxTopRef = useRef<HTMLDivElement | null>(null);
  const letterboxBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Handle Escape Key to exit
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (typeof document !== 'undefined' && document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const _canvas = canvasRef.current;
    const _viewport = viewportRef.current;
    const _yinPiece = yinPieceRef.current;
    const _yangPiece = yangPieceRef.current;
    const _energyCore = energyCoreRef.current;
    const _flashOverlay = flashOverlayRef.current;
    const _filmGrain = filmGrainRef.current;
    const _anamorphicFlare = anamorphicFlareRef.current;
    const _lightRays = lightRaysRef.current;
    const _titleMain = titleMainRef.current;
    const _titleSub = titleSubRef.current;
    const _finalYinYang = finalYinYangRef.current;
    const _letterboxTop = letterboxTopRef.current;
    const _letterboxBottom = letterboxBottomRef.current;

    if (!_canvas || !_viewport || !_yinPiece || !_yangPiece || !_energyCore || !_flashOverlay || 
        !_filmGrain || !_anamorphicFlare || !_lightRays || !_titleMain || !_titleSub || 
        !_finalYinYang || !_letterboxTop || !_letterboxBottom) {
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }

    const _ctx = _canvas.getContext('2d');
    if (!_ctx) {
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }

    const canvas: HTMLCanvasElement = _canvas;
    const viewport: HTMLDivElement = _viewport;
    const yinPiece: HTMLDivElement = _yinPiece;
    const yangPiece: HTMLDivElement = _yangPiece;
    const energyCore: HTMLDivElement = _energyCore;
    const flashOverlay: HTMLDivElement = _flashOverlay;
    const filmGrain: HTMLDivElement = _filmGrain;
    const anamorphicFlare: HTMLDivElement = _anamorphicFlare;
    const lightRays: HTMLDivElement = _lightRays;
    const titleMain: SVGSVGElement = _titleMain;
    const titleSub: SVGSVGElement = _titleSub;
    const finalYinYang: HTMLDivElement = _finalYinYang;
    const letterboxTop: HTMLDivElement = _letterboxTop;
    const letterboxBottom: HTMLDivElement = _letterboxBottom;
    const ctx: CanvasRenderingContext2D = _ctx;

    let width = window.innerWidth;
    let height = window.innerHeight;

    function resizeCanvas() {
      width = window.innerWidth;
      height = window.innerHeight;
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
      }
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // ────────────── WEB AUDIO SYNTHESIZER ENGINE ──────────────
    let audioCtx: AudioContext | null = null;
    let masterGain: GainNode | null = null;

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioCtx = new AudioCtxClass();
      masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.75, audioCtx.currentTime);
      masterGain.connect(audioCtx.destination);
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }
    } catch {
      // AudioContext unavailable or blocked
    }

    let droneOsc1: OscillatorNode | null = null;
    let droneOsc2: OscillatorNode | null = null;
    let droneGain: GainNode | null = null;

    function startCosmicDrone() {
      if (!audioCtx || !masterGain || audioCtx.state === 'closed') return;
      try {
        const now = audioCtx.currentTime;
        droneGain = audioCtx.createGain();
        droneGain.gain.setValueAtTime(0.001, now);
        droneGain.gain.linearRampToValueAtTime(0.28, now + 1.2);
        droneGain.connect(masterGain);

        droneOsc1 = audioCtx.createOscillator();
        droneOsc1.type = 'sine';
        droneOsc1.frequency.setValueAtTime(55, now);
        droneOsc1.frequency.exponentialRampToValueAtTime(110, now + 3.5);

        droneOsc2 = audioCtx.createOscillator();
        droneOsc2.type = 'triangle';
        droneOsc2.frequency.setValueAtTime(110, now);
        droneOsc2.frequency.exponentialRampToValueAtTime(220, now + 3.5);

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(180, now);
        filter.frequency.linearRampToValueAtTime(480, now + 3.5);

        droneOsc1.connect(filter);
        droneOsc2.connect(filter);
        filter.connect(droneGain);

        droneOsc1.start(now);
        droneOsc2.start(now);
      } catch {}
    }

    function stopCosmicDrone() {
      if (!audioCtx || !droneGain || audioCtx.state === 'closed') return;
      try {
        const now = audioCtx.currentTime;
        droneGain.gain.setValueAtTime(droneGain.gain.value, now);
        droneGain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
        safeSetTimeout(() => {
          try {
            droneOsc1?.stop();
            droneOsc2?.stop();
            droneOsc1?.disconnect();
            droneOsc2?.disconnect();
          } catch {}
        }, 300);
      } catch {}
    }

    function playAnticipationSuction() {
      if (!audioCtx || !masterGain || audioCtx.state === 'closed') return;
      try {
        const now = audioCtx.currentTime;
        const dur = 0.38;
        const bufferSize = Math.floor(audioCtx.sampleRate * dur);
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.18;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(180, now);
        filter.frequency.exponentialRampToValueAtTime(1800, now + dur);
        filter.Q.value = 3.5;

        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.35, now + dur - 0.05);
        gain.gain.linearRampToValueAtTime(0.0001, now + dur);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        noise.start(now);
      } catch {}
    }

    function playSupernovaImpact() {
      if (!audioCtx || !masterGain || audioCtx.state === 'closed') return;
      try {
        const now = audioCtx.currentTime;

        // Sub-bass heavy impact boom
        const subOsc = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(180, now);
        subOsc.frequency.exponentialRampToValueAtTime(26, now + 1.8);

        subGain.gain.setValueAtTime(0.95, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.9);

        subOsc.connect(subGain);
        subGain.connect(masterGain);
        subOsc.start(now);
        subOsc.stop(now + 2.0);

        // Explosion rumble with dynamic lowpass sweep
        const noiseDur = 3.2;
        const bufferSize = Math.floor(audioCtx.sampleRate * noiseDur);
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.75;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, now);
        filter.frequency.exponentialRampToValueAtTime(55, now + noiseDur);
        filter.Q.value = 2.8;

        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.8, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + noiseDur);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(masterGain);

        noise.start(now);
      } catch {}
    }

    function playCelestialChime(isMajor = true) {
      if (!audioCtx || !masterGain || audioCtx.state === 'closed') return;
      try {
        const freqs = isMajor ? [528, 660, 792, 1056, 1320, 1584] : [440, 554.37, 659.25, 880, 1108.73, 1318.51];
        freqs.forEach((freq, idx) => {
          if (!audioCtx || !masterGain) return;
          const noteTime = audioCtx.currentTime + idx * 0.085;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteTime);

          gain.gain.setValueAtTime(0.001, noteTime);
          gain.gain.linearRampToValueAtTime(0.14, noteTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 2.4);

          osc.connect(gain);
          gain.connect(masterGain);

          osc.start(noteTime);
          osc.stop(noteTime + 2.5);
        });
      } catch {}
    }

    function playHeartbeat() {
      if (!audioCtx || !masterGain || audioCtx.state === 'closed') return;
      try {
        const now = audioCtx.currentTime;

        // 1st beat (lub)
        const osc1 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(65, now);
        osc1.frequency.exponentialRampToValueAtTime(34, now + 0.12);

        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc1.connect(gain1);
        gain1.connect(masterGain);
        osc1.start(now);
        osc1.stop(now + 0.13);

        // 2nd beat (dub)
        const now2 = now + 0.16;
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(80, now2);
        osc2.frequency.exponentialRampToValueAtTime(38, now2 + 0.15);

        gain2.gain.setValueAtTime(0.4, now2);
        gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.15);

        osc2.connect(gain2);
        gain2.connect(masterGain);
        osc2.start(now2);
        osc2.stop(now2 + 0.16);
      } catch {}
    }

    function playGoldDustPop() {
      if (!audioCtx || !masterGain || audioCtx.state === 'closed') return;
      try {
        const now = audioCtx.currentTime;
        const freqs = [1760, 2200, 2640];
        freqs.forEach((freq, idx) => {
          if (!audioCtx || !masterGain) return;
          const t = now + idx * 0.035;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);

          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.16, t + 0.015);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.65);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(t);
          osc.stop(t + 0.7);
        });
      } catch {}
    }

    function playDoubleTapBurst() {
      if (!audioCtx || !masterGain || audioCtx.state === 'closed') return;
      try {
        const now = audioCtx.currentTime;

        // Resonating golden gong bell
        const oscGong = audioCtx.createOscillator();
        const gainGong = audioCtx.createGain();
        oscGong.type = 'sine';
        oscGong.frequency.setValueAtTime(432, now);

        gainGong.gain.setValueAtTime(0.45, now);
        gainGong.gain.exponentialRampToValueAtTime(0.0001, now + 1.9);

        oscGong.connect(gainGong);
        gainGong.connect(masterGain);
        oscGong.start(now);
        oscGong.stop(now + 2.0);

        // Low bass punch
        const oscBass = audioCtx.createOscillator();
        const gainBass = audioCtx.createGain();
        oscBass.type = 'triangle';
        oscBass.frequency.setValueAtTime(115, now);
        oscBass.frequency.exponentialRampToValueAtTime(32, now + 0.42);

        gainBass.gain.setValueAtTime(0.55, now);
        gainBass.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

        oscBass.connect(gainBass);
        gainBass.connect(masterGain);
        oscBass.start(now);
        oscBass.stop(now + 0.5);

        // Flurry of golden high chimes
        const freqs = [1056, 1320, 1584, 2112, 2640];
        freqs.forEach((freq, idx) => {
          if (!audioCtx || !masterGain) return;
          const t = now + idx * 0.04;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, t);

          gain.gain.setValueAtTime(0.001, t);
          gain.gain.linearRampToValueAtTime(0.14, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);

          osc.connect(gain);
          gain.connect(masterGain);
          osc.start(t);
          osc.stop(t + 0.9);
        });
      } catch {}
    }

    const stars: Array<{
      x: number;
      y: number;
      radius: number;
      baseAlpha: number;
      twinkleSpeed: number;
      phase: number;
    }> = [];

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      color: string;
      alpha: number;
      decay: number;
    }> = [];

    const goldFlakes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      rotation: number;
      vRot: number;
      alpha: number;
      color: string;
      isDust: boolean;
    }> = [];

    const shockwaves: Array<{
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
      alpha: number;
      growthRate: number;
    }> = [];

    let bgStarOpacity = 1.0;
    let gravityCenter1 = { x: width / 2, y: height / 2, mass: 1.0 };
    let gravityCenter2 = { x: width / 2, y: height / 2, mass: 1.0 };
    let vortexActive = false;

    // ดวงดาวฉากหลัง (220 ดวง)
    const NUM_STARS = 220;
    for (let i = 0; i < NUM_STARS; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5 + 0.3,
        baseAlpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.04 + 0.01,
        phase: Math.random() * Math.PI * 2
      });
    }

    // สร้างเศษทองคำเริ่มต้น (180 ชิ้น)
    const BASE_GOLD_FLAKES = 180;
    function createGoldFlake(initialRandomPos = false) {
      const angle = Math.random() * Math.PI * 2;
      const dist = initialRandomPos
        ? Math.random() * (Math.min(width, height) * 0.6) + 40
        : Math.max(width, height) * 0.5 + Math.random() * 100;
      return {
        x: width / 2 + Math.cos(angle) * dist,
        y: height / 2 + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        size: Math.random() * 5.5 + 2.5,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.08,
        alpha: Math.random() * 0.6 + 0.4,
        color: Math.random() > 0.3 ? '#ffd700' : '#fff199',
        isDust: false
      };
    }

    for (let i = 0; i < BASE_GOLD_FLAKES; i++) {
      goldFlakes.push(createGoldFlake(true));
    }

    // ฟังก์ชันพ่นผงทองเมื่อคลิกที่หยินหยาง (Emitter)
    function spawnGoldDust(count: number, burstForce: number) {
      const cx = width / 2;
      const cy = height / 2;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * burstForce + 2.5;
        const isFineDust = Math.random() > 0.4;
        goldFlakes.push({
          x: cx + Math.cos(angle) * (Math.random() * 70 + 20),
          y: cy + Math.sin(angle) * (Math.random() * 70 + 20),
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: isFineDust ? Math.random() * 2.2 + 1.2 : Math.random() * 4.5 + 2.5,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.15,
          alpha: Math.random() * 0.5 + 0.5,
          color: Math.random() > 0.25 ? '#ffd700' : (Math.random() > 0.5 ? '#fff8b3' : '#ffae00'),
          isDust: true
        });
      }
    }

    let shakeIntensity = 0;
    const shakeDecay = 0.95;

    function easeInOutSine(x: number) {
      return -(Math.cos(Math.PI * x) - 1) / 2;
    }
    function easeOutQuad(x: number) {
      return 1 - (1 - x) * (1 - x);
    }

    // Interaction handlers on final Yin-Yang
    let yinyangClickTimer: ReturnType<typeof setTimeout> | null = null;

    const handleYinYangPointerDown = (e: MouseEvent | TouchEvent) => {
      e.stopPropagation();
    };

    const handleYinYangClick = (e: MouseEvent) => {
      e.stopPropagation();
      if (yinyangClickTimer === null) {
        yinyangClickTimer = setTimeout(() => {
          spawnGoldDust(35, 6.5);
          playGoldDustPop();
          yinyangClickTimer = null;
        }, 220);
      }
    };

    const handleYinYangDblClick = (e: MouseEvent) => {
      e.stopPropagation();
      if (yinyangClickTimer !== null) {
        clearTimeout(yinyangClickTimer);
        yinyangClickTimer = null;
      }
      spawnGoldDust(80, 12.0);
      shakeIntensity = 6;
      spawnShockwave(0);
      playDoubleTapBurst();
    };

    finalYinYang.addEventListener('pointerdown', handleYinYangPointerDown);
    finalYinYang.addEventListener('click', handleYinYangClick);
    finalYinYang.addEventListener('dblclick', handleYinYangDblClick);

    const activeTimeouts: ReturnType<typeof setTimeout>[] = [];
    function safeSetTimeout(fn: () => void, ms: number) {
      const t = setTimeout(fn, ms);
      activeTimeouts.push(t);
      return t;
    }

    function spawnShockwave(delayMs: number) {
      safeSetTimeout(() => {
        shockwaves.push({
          x: width / 2,
          y: height / 2,
          radius: 10,
          maxRadius: Math.max(width, height) * 0.85,
          alpha: 1.0,
          growthRate: 22
        });
      }, delayMs);
    }

    function createOrbitalSpark(x: number, y: number, color: string) {
      particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        radius: Math.random() * 2.8 + 0.8,
        color: color,
        alpha: 0.8,
        decay: Math.random() * 0.03 + 0.02
      });
    }

    function triggerImpactExplosion() {
      const cx = width / 2;
      const cy = height / 2;

      spawnShockwave(0);
      spawnShockwave(200);
      spawnShockwave(400);

      const colors = ['#ffffff', '#ffd700', '#ffae00', '#ffd54f'];
      for (let i = 0; i < 180; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 16 + 2;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 3.5 + 1.2,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: 1.0,
          decay: Math.random() * 0.015 + 0.008
        });
      }

      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 12 + 1;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 3 + 1,
          color: '#ffffff',
          alpha: 1.0,
          decay: Math.random() * 0.015 + 0.01
        });
      }
      for (let i = 0; i < 60; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 12 + 1;
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 3 + 1,
          color: '#0a0a18',
          alpha: 0.9,
          decay: Math.random() * 0.015 + 0.01
        });
      }

      for (let i = 0; i < 240; i++) {
        const armAngle = (i / 240) * Math.PI * 8;
        const dist = Math.random() * 80 + 10;
        const speed = Math.random() * 8 + 3;
        particles.push({
          x: cx + Math.cos(armAngle) * dist,
          y: cy + Math.sin(armAngle) * dist,
          vx: Math.cos(armAngle + Math.PI / 2) * speed + (Math.random() - 0.5) * 2,
          vy: Math.sin(armAngle + Math.PI / 2) * speed + (Math.random() - 0.5) * 2,
          radius: Math.random() * 2.5 + 1,
          color: i % 2 === 0 ? '#ffd700' : '#ff8c00',
          alpha: 1.0,
          decay: Math.random() * 0.012 + 0.007
        });
      }
    }

    let sequenceStartTime = performance.now();
    let sequencePhase = 1;
    vortexActive = true;
    letterboxTop.classList.add('active');
    letterboxBottom.classList.add('active');
    startCosmicDrone();

    function executeTitleSequence() {
      playCelestialChime(true);
      // Play rhythmic heartbeats matching the 1.1s pulse animation
      for (let i = 0; i < 5; i++) {
        safeSetTimeout(() => {
          playHeartbeat();
        }, Math.round((0.3 + i * 1.1) * 1000));
      }

      // 1. APORN 💛 SURIYA แสดง 5.5 วินาที
      titleMain.style.display = 'block';
      titleMain.animate([
        { opacity: 0, transform: 'scale(0.94)' },
        { opacity: 1, transform: 'scale(1.0)', offset: 0.12 },
        { opacity: 1, transform: 'scale(1.02)', offset: 0.88 },
        { opacity: 0, transform: 'scale(1.05)', offset: 1.0 }
      ], {
        duration: 5500,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'forwards'
      });

      // พักช่วง 1.0 วินาที
      safeSetTimeout(() => {
        titleMain.style.display = 'none';

        // 2. ETERNAL แสดง 4.5 วินาที
        titleSub.style.display = 'block';
        playCelestialChime(false);
        titleSub.animate([
          { opacity: 0, transform: 'scale(1.08)' },
          { opacity: 1, transform: 'scale(1.0)', offset: 0.14 },
          { opacity: 1, transform: 'scale(0.98)', offset: 0.86 },
          { opacity: 0, transform: 'scale(0.94)', offset: 1.0 }
        ], {
          duration: 4500,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          fill: 'forwards'
        });

        safeSetTimeout(() => {
          titleSub.style.display = 'none';
        }, 4500);

      }, 5500 + 1000);
    }

    let animationFrameId: number;

    function renderLoop(currentTime: number) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // 1. ดวงดาวพื้นหลัง
      ctx.save();
      for (const s of stars) {
        s.phase += s.twinkleSpeed;
        const currentAlpha = (s.baseAlpha + Math.sin(s.phase) * 0.3) * bgStarOpacity;
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, currentAlpha)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // 2. การจำลองแรงโน้มถ่วงและการหมุนวนของเศษและผงทองคำ (Gravitational Vortex)
      const cx = width / 2;
      const cy = height / 2;

      for (let i = goldFlakes.length - 1; i >= 0; i--) {
        const gf = goldFlakes[i];

        if (vortexActive) {
          const d1x = gravityCenter1.x - gf.x;
          const d1y = gravityCenter1.y - gf.y;
          const dist1 = Math.sqrt(d1x * d1x + d1y * d1y) + 40;

          const d2x = gravityCenter2.x - gf.x;
          const d2y = gravityCenter2.y - gf.y;
          const dist2 = Math.sqrt(d2x * d2x + d2y * d2y) + 40;

          const gForce1 = 1350 / (dist1 * dist1);
          const gForce2 = 1350 / (dist2 * dist2);

          gf.vx += (d1x / dist1) * gForce1 + (d2x / dist2) * gForce2;
          gf.vy += (d1y / dist1) * gForce1 + (d2y / dist2) * gForce2;

          const toCenterX = gf.x - cx;
          const toCenterY = gf.y - cy;
          const distCenter = Math.sqrt(toCenterX * toCenterX + toCenterY * toCenterY) + 30;

          const tangentX = -toCenterY / distCenter;
          const tangentY = toCenterX / distCenter;

          const orbitalSpeed = Math.min(5.0, 500 / distCenter);
          gf.vx += tangentX * orbitalSpeed * 0.085;
          gf.vy += tangentY * orbitalSpeed * 0.085;

          gf.vx *= 0.985;
          gf.vy *= 0.985;
        } else {
          gf.vx *= 0.99;
          gf.vy *= 0.99;
        }

        gf.x += gf.vx;
        gf.y += gf.vy;
        gf.rotation += gf.vRot;

        const distOffscreen = Math.hypot(gf.x - cx, gf.y - cy);
        if (distOffscreen > Math.max(width, height) * 0.75) {
          if (gf.isDust && goldFlakes.length > BASE_GOLD_FLAKES + 120) {
            goldFlakes.splice(i, 1);
            continue;
          } else {
            const resetAngle = Math.random() * Math.PI * 2;
            const resetDist = Math.random() * 220 + 130;
            gf.x = cx + Math.cos(resetAngle) * resetDist;
            gf.y = cy + Math.sin(resetAngle) * resetDist;
            gf.vx = (Math.random() - 0.5) * 2;
            gf.vy = (Math.random() - 0.5) * 2;
          }
        }

        ctx.save();
        ctx.translate(gf.x, gf.y);
        ctx.rotate(gf.rotation);
        ctx.globalAlpha = gf.alpha;
        ctx.fillStyle = gf.color;
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = gf.isDust ? 5 : 8;

        if (gf.isDust && gf.size < 2.5) {
          ctx.beginPath();
          ctx.arc(0, 0, gf.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(0, -gf.size);
          ctx.lineTo(gf.size * 0.85, gf.size * 0.65);
          ctx.lineTo(-gf.size * 0.75, gf.size * 0.45);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. Shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += sw.growthRate;
        sw.alpha -= 0.022;

        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${sw.alpha})`;
        ctx.lineWidth = Math.max(1, 14 * sw.alpha);
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // 4. Particles ระเบิด
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        if (p.color !== '#0a0a18') {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 5. กล้องสั่น
      if (shakeIntensity > 0.1) {
        const offsetX = (Math.random() - 0.5) * shakeIntensity * 2;
        const offsetY = (Math.random() - 0.5) * shakeIntensity * 2;
        viewport.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        shakeIntensity *= shakeDecay;
      } else {
        viewport.style.transform = 'translate(0px, 0px)';
        shakeIntensity = 0;
      }

      // 6. ไทม์ไลน์ควบคุมลำดับเหตุการณ์
      if (sequencePhase > 0) {
        const elapsed = (currentTime - sequenceStartTime) / 1000;
        const initialRadius = Math.max(width * 0.35, 400);

        // Step 1: Fade In (0.0s - 0.5s)
        if (elapsed < 0.5) {
          sequencePhase = 1;
          const p = elapsed / 0.5;
          const opacity = easeOutQuad(p);
          const startR = initialRadius;
          const scale = 0.85;

          const angleYin = -Math.PI / 2;
          const angleYang = Math.PI / 2;

          const yinX = Math.cos(angleYin) * startR;
          const yinY = Math.sin(angleYin) * startR;
          const yangX = Math.cos(angleYang) * startR;
          const yangY = Math.sin(angleYang) * startR;

          gravityCenter1.x = cx + yinX;
          gravityCenter1.y = cy + yinY;
          gravityCenter2.x = cx + yangX;
          gravityCenter2.y = cy + yangY;

          yinPiece.style.opacity = opacity.toString();
          yangPiece.style.opacity = opacity.toString();
          yinPiece.style.transform = `translate(${yinX}px, ${yinY}px) scale(${scale})`;
          yangPiece.style.transform = `translate(${yangX}px, ${yangY}px) scale(${scale})`;
        }
        // Step 2: โคจร 4 รอบ (0.5s - 3.5s)
        else if (elapsed >= 0.5 && elapsed < 3.5) {
          sequencePhase = 2;
          const progress = (elapsed - 0.5) / 3.0;
          const easedProgress = easeInOutSine(progress);
          const currentRotation = easedProgress * (Math.PI * 8);
          const r = Math.max(0, 500 * (1 - progress));
          const currentScale = 0.85 + (1.15 - 0.85) * progress;

          const angleYin = -Math.PI / 2 + currentRotation;
          const angleYang = angleYin + Math.PI;

          const yinX = Math.cos(angleYin) * r;
          const yinY = Math.sin(angleYin) * r;
          const yangX = Math.cos(angleYang) * r;
          const yangY = Math.sin(angleYang) * r;

          gravityCenter1.x = cx + yinX;
          gravityCenter1.y = cy + yinY;
          gravityCenter2.x = cx + yangX;
          gravityCenter2.y = cy + yangY;

          yinPiece.style.opacity = '1';
          yangPiece.style.opacity = '1';
          yinPiece.style.transform = `translate(${yinX}px, ${yinY}px) scale(${currentScale})`;
          yangPiece.style.transform = `translate(${yangX}px, ${yangY}px) scale(${currentScale})`;

          createOrbitalSpark(width / 2 + yinX, height / 2 + yinY, '#ffd700');
          createOrbitalSpark(width / 2 + yangX, height / 2 + yangY, '#ffffff');
        }
        // Step 3: Dramatic Pause (3.5s - 3.9s)
        else if (elapsed >= 3.5 && elapsed < 3.9) {
          if (sequencePhase !== 3) {
            sequencePhase = 3;
            stopCosmicDrone();
            playAnticipationSuction();
          }
          yinPiece.style.transform = `translate(0px, 0px) scale(1.15)`;
          yangPiece.style.transform = `translate(0px, 0px) scale(1.15)`;

          gravityCenter1.x = cx;
          gravityCenter1.y = cy;
          gravityCenter2.x = cx;
          gravityCenter2.y = cy;

          if (elapsed - 3.5 < 0.2) {
            shakeIntensity = 5;
          }
        }
        // Step 4: IMPACT (3.9s - 5.5s)
        else if (elapsed >= 3.9 && elapsed < 5.5) {
          if (sequencePhase !== 4) {
            sequencePhase = 4;
            playSupernovaImpact();
            yinPiece.style.opacity = '0';
            yangPiece.style.opacity = '0';

            shakeIntensity = 28;
            triggerImpactExplosion();

            anamorphicFlare.style.opacity = '1';
            anamorphicFlare.style.transform = 'translateY(-50%) scaleX(1)';
            safeSetTimeout(() => {
              if (anamorphicFlare) {
                anamorphicFlare.style.opacity = '0';
                anamorphicFlare.style.transform = 'translateY(-50%) scaleX(0.2)';
              }
            }, 650);

            filmGrain.style.opacity = '0.75';
            safeSetTimeout(() => {
              if (filmGrain) {
                filmGrain.style.transition = 'opacity 0.8s ease';
                filmGrain.style.opacity = '0';
              }
            }, 1200);

            energyCore.style.opacity = '1';
            energyCore.style.transition = 'transform 1.2s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 1.2s ease-out';
            energyCore.style.transform = 'scale(100)';
            safeSetTimeout(() => {
              if (energyCore) {
                energyCore.style.opacity = '0';
              }
            }, 800);

            lightRays.style.opacity = '1';
            lightRays.style.transition = 'transform 2s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.8s ease-out';
            lightRays.style.transform = 'scale(1.2) rotate(360deg)';
            safeSetTimeout(() => {
              if (lightRays) {
                lightRays.style.opacity = '0';
              }
            }, 1600);
          }

          const impactElapsed = elapsed - 3.9;
          if (impactElapsed < 0.7) {
            const fp = impactElapsed / 0.7;
            const flashVal = fp < 0.15 ? fp / 0.15 : fp < 0.5 ? 1 - ((fp - 0.15) / 0.35) * 0.3 : 0.7 * (1 - (fp - 0.5) / 0.5);
            flashOverlay.style.opacity = flashVal.toString();
          } else {
            flashOverlay.style.opacity = '0';
          }
        }
        // Step 5: Cinematic Title Sequence (เริ่มที่ 5.5s)
        else if (elapsed >= 5.5 && elapsed < 16.5) {
          if (sequencePhase !== 5) {
            sequencePhase = 5;
            executeTitleSequence();
          }
        }
        // Step 7: หยินหยางหมุนไม่สิ้นสุด (16.5s เป็นต้นไป)
        else if (elapsed >= 16.5) {
          if (sequencePhase !== 7) {
            sequencePhase = 7;
            bgStarOpacity = 0.3;
            vortexActive = true;
            gravityCenter1.x = cx;
            gravityCenter1.y = cy;
            gravityCenter2.x = cx;
            gravityCenter2.y = cy;

            finalYinYang.style.opacity = '1';
            finalYinYang.style.transform = 'scale(1)';
            finalYinYang.classList.add('interactive');
          }
        }
      }

      animationFrameId = requestAnimationFrame(renderLoop);
    }

    animationFrameId = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
      activeTimeouts.forEach(clearTimeout);
      if (yinyangClickTimer !== null) clearTimeout(yinyangClickTimer);
      if (finalYinYang) {
        finalYinYang.removeEventListener('pointerdown', handleYinYangPointerDown);
        finalYinYang.removeEventListener('click', handleYinYangClick);
        finalYinYang.removeEventListener('dblclick', handleYinYangDblClick);
      }
      try {
        if (audioCtx && audioCtx.state !== 'closed') {
          if (masterGain) {
            masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime);
            masterGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.05);
          }
          setTimeout(() => {
            try {
              audioCtx?.close().catch(() => {});
            } catch {}
          }, 60);
        }
      } catch {}
    };
  }, [isActive, onClose]);

  if (!isActive) return null;

  return (
    <ViewportPortal>
      <div
        ref={containerRef}
        className="fixed inset-0 z-[999999] overflow-hidden bg-black select-none"
        style={{
          fontFamily: '"Cinzel", "Trajan Pro", "Times New Roman", Georgia, serif',
          cursor: 'pointer'
        }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&display=swap');

          .easter-egg-viewport {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            transform-origin: center center;
          }

          .easter-egg-canvas {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            display: block;
            z-index: 1;
            pointer-events: none;
          }

          .vignette {
            position: absolute;
            inset: 0;
            z-index: 5;
            pointer-events: none;
            background: radial-gradient(circle at center, transparent 32%, rgba(2, 2, 8, 0.94) 100%);
            opacity: 0.85;
            mix-blend-mode: multiply;
          }

          .letterbox {
            position: absolute;
            left: 0;
            width: 100%;
            height: 0;
            background: #000;
            z-index: 30;
            pointer-events: none;
            transition: height 1.4s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .letterbox-top { top: 0; }
          .letterbox-bottom { bottom: 0; }
          .letterbox.active { height: 7.5vh; }

          .film-grain {
            position: absolute;
            inset: -50%;
            width: 200%;
            height: 200%;
            z-index: 35;
            pointer-events: none;
            opacity: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.12'/%3E%3C/svg%3E");
            mix-blend-mode: overlay;
          }

          .anamorphic-flare {
            position: absolute;
            top: 50%;
            left: 0;
            width: 100%;
            height: 2px;
            transform: translateY(-50%) scaleX(0);
            background: linear-gradient(90deg, 
              transparent 0%, 
              rgba(255, 215, 0, 0.3) 25%, 
              rgba(255, 255, 255, 0.95) 50%, 
              rgba(255, 215, 0, 0.3) 75%, 
              transparent 100%);
            box-shadow: 0 0 25px 6px #ffd700, 0 0 60px 15px rgba(255, 170, 0, 0.7);
            z-index: 25;
            pointer-events: none;
            opacity: 0;
            transition: transform 0.5s ease-out, opacity 0.5s ease-out;
          }

          .flash-overlay {
            position: absolute;
            inset: 0;
            background: #ffffff;
            opacity: 0;
            z-index: 28;
            pointer-events: none;
          }

          .light-rays {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 1300px;
            height: 1300px;
            margin-left: -650px;
            margin-top: -650px;
            border-radius: 50%;
            background: conic-gradient(
              from 0deg,
              transparent 0deg,
              rgba(255, 240, 180, 0.18) 15deg,
              transparent 30deg,
              rgba(255, 215, 0, 0.22) 55deg,
              transparent 80deg,
              rgba(255, 160, 0, 0.18) 120deg,
              transparent 160deg,
              rgba(255, 255, 255, 0.2) 195deg,
              transparent 230deg,
              rgba(255, 215, 0, 0.22) 280deg,
              transparent 320deg,
              rgba(255, 240, 180, 0.18) 360deg
            );
            -webkit-mask-image: radial-gradient(circle, rgba(0,0,0,1) 12%, transparent 68%);
            mask-image: radial-gradient(circle, rgba(0,0,0,1) 12%, transparent 68%);
            z-index: 8;
            pointer-events: none;
            opacity: 0;
            transform: scale(0.4) rotate(0deg);
          }

          .energy-core {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 4px;
            height: 4px;
            margin-left: -2px;
            margin-top: -2px;
            border-radius: 50%;
            background: radial-gradient(circle, #ffffff 0%, #ffd700 35%, #ff8c00 70%, transparent 100%);
            box-shadow: 
              0 0 40px 15px #ffffff,
              0 0 100px 40px #ffd700,
              0 0 180px 70px #ff8c00;
            z-index: 15;
            pointer-events: none;
            opacity: 0;
            transform: scale(1);
          }

          .piece-wrapper {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 300px;
            height: 300px;
            margin-left: -150px;
            margin-top: -150px;
            z-index: 10;
            pointer-events: none;
            opacity: 0;
            will-change: transform, opacity;
            filter: drop-shadow(0 0 24px rgba(255, 215, 0, 0.45));
          }

          .piece-svg {
            width: 100%;
            height: 100%;
            display: block;
            overflow: visible;
          }

          .title-stage {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 26;
            width: 90vw;
            max-width: 1200px;
            pointer-events: none;
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .title-svg {
            width: 100%;
            height: auto;
            max-height: 52vh;
            overflow: visible;
            opacity: 0;
            display: none;
            will-change: transform, opacity;
          }

          @keyframes goldenHeartbeat {
            0% { transform: scale(1); filter: drop-shadow(0 0 14px #ffd700) drop-shadow(0 0 30px #ff9100); }
            14% { transform: scale(1.22); filter: drop-shadow(0 0 26px #fff2a3) drop-shadow(0 0 55px #ffd700); }
            28% { transform: scale(1.05); filter: drop-shadow(0 0 18px #ffd700); }
            42% { transform: scale(1.28); filter: drop-shadow(0 0 30px #fff2a3) drop-shadow(0 0 65px #ffd700); }
            70% { transform: scale(1); filter: drop-shadow(0 0 14px #ffd700) drop-shadow(0 0 30px #ff9100); }
            100% { transform: scale(1); filter: drop-shadow(0 0 14px #ffd700) drop-shadow(0 0 30px #ff9100); }
          }

          .heart-element {
            transform-origin: 500px 115px;
            animation: goldenHeartbeat 1.1s cubic-bezier(0.25, 0.1, 0.25, 1) infinite;
          }

          .final-yinyang-container {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 260px;
            height: 260px;
            margin-left: -130px;
            margin-top: -130px;
            z-index: 20;
            opacity: 0;
            transform: scale(0.6);
            pointer-events: none;
            transition: opacity 1.8s cubic-bezier(0.16, 1, 0.3, 1), transform 1.8s cubic-bezier(0.16, 1, 0.3, 1);
            cursor: pointer;
          }

          .final-yinyang-container.interactive {
            pointer-events: auto;
          }

          .yinyang-disk {
            position: relative;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background: linear-gradient(90deg, #0a0a18 0%, #0a0a18 50%, #ffffff 50%, #ffffff 100%);
            box-shadow: 
              0 0 35px 5px rgba(255, 255, 255, 0.65),
              0 0 80px 18px rgba(255, 215, 0, 0.6),
              0 0 140px 30px rgba(255, 140, 0, 0.45);
            animation: perpetualSpin 3s linear infinite;
            transition: transform 0.2s cubic-bezier(0.1, 0.9, 0.2, 1);
          }

          .final-yinyang-container:active .yinyang-disk {
            transform: scale(0.94);
          }

          .yinyang-disk::before {
            content: "";
            position: absolute;
            top: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 130px;
            height: 130px;
            background: #0a0a18;
            border-radius: 50%;
            z-index: 1;
          }

          .yinyang-disk::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 130px;
            height: 130px;
            background: #ffffff;
            border-radius: 50%;
            z-index: 1;
          }

          .yinyang-dot-white {
            position: absolute;
            top: 17.5%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 39px;
            height: 39px;
            border-radius: 50%;
            background: #ffffff;
            z-index: 2;
          }

          .yinyang-dot-black {
            position: absolute;
            bottom: 17.5%;
            left: 50%;
            transform: translate(-50%, 50%);
            width: 39px;
            height: 39px;
            border-radius: 50%;
            background: #0a0a18;
            z-index: 2;
          }

          @keyframes perpetualSpin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>

        {/* Global SVG Definitions for Hollywood Gold Gradient & Glow */}
        <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
          <defs>
            <linearGradient id="richGold" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fff8db" />
              <stop offset="16%" stopColor="#ffd700" />
              <stop offset="35%" stopColor="#f5af19" />
              <stop offset="50%" stopColor="#9d6205" />
              <stop offset="55%" stopColor="#d89e13" />
              <stop offset="80%" stopColor="#ffe885" />
              <stop offset="100%" stopColor="#8a5300" />
            </linearGradient>

            <linearGradient id="goldEdge" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#ffd700" />
              <stop offset="70%" stopColor="#8a5300" />
              <stop offset="100%" stopColor="#fff5b3" />
            </linearGradient>

            <radialGradient id="goldHeartGrad" cx="35%" cy="30%" r="72%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#ffe66d" />
              <stop offset="55%" stopColor="#ffd700" />
              <stop offset="80%" stopColor="#d48800" />
              <stop offset="100%" stopColor="#593200" />
            </radialGradient>

            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="10" floodColor="#ffd700" floodOpacity="0.65" />
              <feDropShadow dx="0" dy="0" stdDeviation="28" floodColor="#ff9100" floodOpacity="0.38" />
            </filter>
          </defs>
        </svg>

        {/* Viewport Frame */}
        <div id="viewport" ref={viewportRef} className="easter-egg-viewport">
          <canvas id="fx-canvas" ref={canvasRef} className="easter-egg-canvas" />

          <div className="vignette" />
          <div className="film-grain" id="filmGrain" ref={filmGrainRef} />
          <div className="anamorphic-flare" id="anamorphicFlare" ref={anamorphicFlareRef} />
          <div className="flash-overlay" id="flashOverlay" ref={flashOverlayRef} />
          <div className="light-rays" id="lightRays" ref={lightRaysRef} />
          <div className="energy-core" id="energyCore" ref={energyCoreRef} />

          <div className="letterbox letterbox-top" id="letterboxTop" ref={letterboxTopRef} />
          <div className="letterbox letterbox-bottom" id="letterboxBottom" ref={letterboxBottomRef} />

          {/* ชิ้นส่วนซีก Yin และ Yang */}
          <div className="piece-wrapper" id="yinPiece" ref={yinPieceRef}>
            <svg className="piece-svg" viewBox="-150 -150 300 300">
              <path
                d="M 0,-150 A 150,150 0 0,0 0,150 A 75,75 0 0,1 0,0 A 75,75 0 0,0 0,-150 Z"
                fill="#0a0a18"
                stroke="#14142a"
                strokeWidth="1.2"
              />
              <circle cx="0" cy="-75" r="22.5" fill="#ffffff" />
            </svg>
          </div>

          <div className="piece-wrapper" id="yangPiece" ref={yangPieceRef}>
            <svg className="piece-svg" viewBox="-150 -150 300 300">
              <path
                d="M 0,150 A 150,150 0 0,0 0,-150 A 75,75 0 0,1 0,0 A 75,75 0 0,0 0,150 Z"
                fill="#ffffff"
                stroke="#e0e0e0"
                strokeWidth="1"
              />
              <circle cx="0" cy="75" r="22.5" fill="#0a0a18" />
            </svg>
          </div>

          {/* ข้อความไตเติลสีทองคำแท้ */}
          <div className="title-stage">
            <svg className="title-svg" id="titleMain" ref={titleMainRef} viewBox="0 0 1000 240">
              <g filter="url(#goldGlow)">
                <text
                  x="360"
                  y="145"
                  textAnchor="end"
                  fill="url(#richGold)"
                  stroke="url(#goldEdge)"
                  strokeWidth="1.2"
                  fontSize="64"
                  fontWeight="700"
                  letterSpacing="14"
                >
                  APORN
                </text>

                <text
                  x="640"
                  y="145"
                  textAnchor="start"
                  fill="url(#richGold)"
                  stroke="url(#goldEdge)"
                  strokeWidth="1.2"
                  fontSize="64"
                  fontWeight="700"
                  letterSpacing="14"
                >
                  SURIYA
                </text>
              </g>

              {/* หัวใจสีทองคำ 3D */}
              <g className="heart-element">
                <path
                  d="M 500,140 C 500,140 455,108 455,85 C 455,67 470,54 487,54 C 496,54 500,60 500,60 C 500,60 504,54 513,54 C 530,54 545,67 545,85 C 545,108 500,140 500,140 Z"
                  fill="url(#goldHeartGrad)"
                  stroke="url(#goldEdge)"
                  strokeWidth="1.6"
                />
                <ellipse cx="482" cy="74" rx="7" ry="4" transform="rotate(-30 482 74)" fill="#ffffff" opacity="0.8" />
              </g>
            </svg>

            <svg className="title-svg" id="titleSub" ref={titleSubRef} viewBox="0 0 1000 240">
              <g filter="url(#goldGlow)">
                <text
                  x="500"
                  y="145"
                  textAnchor="middle"
                  fill="url(#richGold)"
                  stroke="url(#goldEdge)"
                  strokeWidth="1.4"
                  fontSize="82"
                  fontWeight="600"
                  letterSpacing="34"
                >
                  ETERNAL
                </text>
              </g>
            </svg>
          </div>

          {/* หยิน-หยางตัวใหญ่หมุนไม่สิ้นสุด (คลิก/ดับเบิลคลิกพ่นผงทองได้) */}
          <div className="final-yinyang-container" id="finalYinYang" ref={finalYinYangRef}>
            <div className="yinyang-disk">
              <div className="yinyang-dot-white" />
              <div className="yinyang-dot-black" />
            </div>
          </div>
        </div>
      </div>
    </ViewportPortal>
  );
}
