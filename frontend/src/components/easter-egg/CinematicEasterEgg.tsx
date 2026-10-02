import React, { useEffect, useRef, useState, useCallback } from 'react';
import ViewportPortal from '../ui/ViewportPortal';

interface CinematicEasterEggProps {
  isActive: boolean;
  onClose: () => void;
}

interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
  twinkleOffset: number;
  vx: number;
  vy: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  rotationVelocity: number;
  drag: number;
  gravity: number;
  isSpiral?: boolean;
  spiralAngle?: number;
  spiralSpeed?: number;
  spiralRadius?: number;
}

interface VortexFlake {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationVelocity: number;
  mass: number;
  color: string;
  alpha: number;
  orbitRadius: number;
  angle: number;
  angularVelocity: number;
}

interface Shockwave {
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
  lineWidth: number;
}

export default function CinematicEasterEgg({ isActive, onClose }: CinematicEasterEggProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Phase tracker for Typography & Interactions
  const [phase, setPhase] = useState<'intro' | 'supernova' | 'title1' | 'title2' | 'final'>('intro');
  const [heartbeatScale, setHeartbeatScale] = useState<number>(1);
  const phaseRef = useRef<'intro' | 'supernova' | 'title1' | 'title2' | 'final'>('intro');

  // Camera Shake
  const cameraShakeRef = useRef<{ intensity: number; decay: number }>({ intensity: 0, decay: 0.92 });

  // Procedural Data
  const starsRef = useRef<Star[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const vortexFlakesRef = useRef<VortexFlake[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const streaksRef = useRef<{ x: number; y: number; length: number; color: string; alpha: number; speed: number }[]>([]);

  // White flash state
  const whiteFlashRef = useRef<number>(0);

  // Final Interactive Yin-Yang Rotation
  const finalRotationRef = useRef<number>(0);

  // Sync ref
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  // Handle Escape Key to exit Easter Egg
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen?.().catch(() => {});
        }
        onClose();
      }
    };

    const handleFullscreenChange = () => {
      // If user exits fullscreen via browser UI, Easter egg adapts without closing immediately
      // But if they want to close, they can press Escape or click exit
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isActive, onClose]);

  // Heartbeat loop for Title 1 (80 BPM = 750ms per beat)
  useEffect(() => {
    if (phase !== 'title1') return;

    let beatTimeout: NodeJS.Timeout;
    const beatInterval = 750; // 80 BPM

    const triggerBeat = () => {
      setHeartbeatScale(1.22);
      setTimeout(() => {
        setHeartbeatScale(1.08);
        setTimeout(() => {
          setHeartbeatScale(1.18);
          setTimeout(() => {
            setHeartbeatScale(1.0);
          }, 120);
        }, 80);
      }, 140);

      beatTimeout = setTimeout(triggerBeat, beatInterval);
    };

    triggerBeat();
    return () => clearTimeout(beatTimeout);
  }, [phase]);

  // Initialize procedural elements
  const initProceduralStars = (width: number, height: number) => {
    const starCount = Math.min(Math.floor((width * height) / 3800), 280);
    const stars: Star[] = [];
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.8 + 0.4,
        alpha: Math.random() * 0.7 + 0.3,
        twinkleSpeed: Math.random() * 0.04 + 0.015,
        twinkleOffset: Math.random() * Math.PI * 2,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
      });
    }
    starsRef.current = stars;
  };

  // Initialize 180 Gold Flakes for the Gravitational Vortex
  const initVortexFlakes = (cx: number, cy: number) => {
    const flakes: VortexFlake[] = [];
    const goldPalette = ['#fff8db', '#ffd700', '#f5af19', '#9d6205', '#ffe066', '#d4af37'];

    for (let i = 0; i < 180; i++) {
      const orbit = Math.random() * 260 + 110;
      const angle = Math.random() * Math.PI * 2;
      flakes.push({
        x: cx + Math.cos(angle) * orbit,
        y: cy + Math.sin(angle) * orbit,
        vx: 0,
        vy: 0,
        size: Math.random() * 2.8 + 1.2,
        rotation: Math.random() * Math.PI * 2,
        rotationVelocity: (Math.random() - 0.5) * 0.08,
        mass: Math.random() * 0.8 + 0.4,
        color: goldPalette[Math.floor(Math.random() * goldPalette.length)],
        alpha: Math.random() * 0.65 + 0.35,
        orbitRadius: orbit,
        angle: angle,
        angularVelocity: (0.012 + Math.random() * 0.018) * (Math.random() > 0.1 ? 1 : -1),
      });
    }
    vortexFlakesRef.current = flakes;
  };

  // Trigger Gold Dust Particles (35 on click, 80 on double-click)
  const spawnGoldDust = (cx: number, cy: number, count: number, is360: boolean) => {
    const goldPalette = ['#ffffff', '#fff8db', '#ffd700', '#f5af19', '#9d6205'];
    for (let i = 0; i < count; i++) {
      const angle = is360 ? (i / count) * Math.PI * 2 + Math.random() * 0.2 : Math.random() * Math.PI * 2;
      const speed = Math.random() * (is360 ? 9 : 6) + 3;
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 3 + 1.5,
        color: goldPalette[Math.floor(Math.random() * goldPalette.length)],
        alpha: 1,
        life: 0,
        maxLife: Math.random() * 60 + 50,
        rotation: Math.random() * Math.PI * 2,
        rotationVelocity: (Math.random() - 0.5) * 0.2,
        drag: 0.94,
        gravity: 0.25,
      });
    }
    // Subtle camera kick on interactive burst
    cameraShakeRef.current.intensity = Math.max(cameraShakeRef.current.intensity, is360 ? 6 : 3);
  };

  // Main Canvas Render & Physics Loop
  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resizeCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      initProceduralStars(width, height);
      if (vortexFlakesRef.current.length === 0) {
        initVortexFlakes(width / 2, height / 2);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    startTimeRef.current = performance.now();
    let lastTime = performance.now();

    // Spawn Supernova Explosion (300+ particles, Shockwaves, Streaks)
    let supernovaTriggered = false;
    const triggerSupernova = (cx: number, cy: number) => {
      supernovaTriggered = true;
      whiteFlashRef.current = 1.0;
      cameraShakeRef.current.intensity = 18; // Trauma shake

      // 3 Shockwaves
      shockwavesRef.current = [
        { radius: 10, maxRadius: Math.max(width, height) * 0.85, alpha: 1, color: '#ffffff', lineWidth: 6 },
        { radius: 5, maxRadius: Math.max(width, height) * 0.75, alpha: 0.9, color: '#ffd700', lineWidth: 4 },
        { radius: 2, maxRadius: Math.max(width, height) * 0.65, alpha: 0.8, color: '#60a5fa', lineWidth: 3 },
      ];

      // Horizontal Anamorphic Streaks (Gold & Blue)
      streaksRef.current = [
        { x: -width * 0.5, y: cy, length: width * 2, color: 'rgba(255, 215, 0, 0.9)', alpha: 1, speed: 28 },
        { x: -width * 0.5, y: cy - 2, length: width * 2, color: 'rgba(96, 165, 250, 0.85)', alpha: 1, speed: 32 },
        { x: -width * 0.5, y: cy + 3, length: width * 2, color: 'rgba(255, 248, 219, 0.95)', alpha: 1, speed: 24 },
      ];

      // 300+ Procedural Particles
      const particleCount = 340;
      const palette = ['#ffffff', '#fff8db', '#ffd700', '#f5af19', '#9d6205', '#60a5fa', '#3b82f6', '#0a0a18'];
      const newParticles: Particle[] = [];

      for (let i = 0; i < particleCount; i++) {
        const isSpiral = i % 3 === 0;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 16 + 2;

        newParticles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: Math.random() * 3.5 + 1,
          color: palette[Math.floor(Math.random() * palette.length)],
          alpha: 1,
          life: 0,
          maxLife: Math.random() * 90 + 60,
          rotation: Math.random() * Math.PI * 2,
          rotationVelocity: (Math.random() - 0.5) * 0.25,
          drag: 0.965,
          gravity: 0.05,
          isSpiral: isSpiral,
          spiralAngle: angle,
          spiralSpeed: (Math.random() - 0.5) * 0.08,
          spiralRadius: speed * 8,
        });
      }
      particlesRef.current = newParticles;
    };

    // Render loop
    const render = (now: number) => {
      const elapsed = (now - startTimeRef.current) / 1000;
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const cx = width / 2;
      const cy = height / 2;

      // Update Phase transitions
      if (elapsed < 3.9) {
        if (phaseRef.current !== 'intro') setPhase('intro');
      } else if (elapsed >= 3.9 && elapsed < 5.5) {
        if (!supernovaTriggered) {
          triggerSupernova(cx, cy);
        }
        if (phaseRef.current !== 'supernova') setPhase('supernova');
      } else if (elapsed >= 5.5 && elapsed < 11.0) {
        if (phaseRef.current !== 'title1') setPhase('title1');
      } else if (elapsed >= 11.0 && elapsed < 12.0) {
        // 1 second dramatic breath
        if (phaseRef.current !== 'supernova') setPhase('supernova');
      } else if (elapsed >= 12.0 && elapsed < 16.5) {
        if (phaseRef.current !== 'title2') setPhase('title2');
      } else {
        if (phaseRef.current !== 'final') setPhase('final');
      }

      // Camera Shake computation
      let shakeX = 0;
      let shakeY = 0;
      if (cameraShakeRef.current.intensity > 0.05) {
        shakeX = (Math.random() - 0.5) * cameraShakeRef.current.intensity;
        shakeY = (Math.random() - 0.5) * cameraShakeRef.current.intensity;
        cameraShakeRef.current.intensity *= cameraShakeRef.current.decay;
      }

      // Clear Screen with deep cosmic #000000
      ctx.save();
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Apply camera shake transform
      ctx.translate(shakeX, shakeY);

      // ── 1. PROCEDURAL TWINKLING STARS ──
      const stars = starsRef.current;
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = width;
        if (s.x > width) s.x = 0;
        if (s.y < 0) s.y = height;
        if (s.y > height) s.y = 0;

        const twinkle = Math.sin(now * s.twinkleSpeed * 0.05 + s.twinkleOffset) * 0.35 + 0.65;
        const currentAlpha = s.alpha * twinkle;

        ctx.fillStyle = `rgba(255, 255, 255, ${currentAlpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── 2. TIMELINE: 0.0s - 3.9s YIN & YANG ORBIT ──
      if (elapsed < 3.9) {
        const orbitDuration = 3.0; // 0.5s to 3.5s
        let progress = 0;
        let orbitRadius = 500;
        let scale = 0.85;
        let opacity = 1;

        if (elapsed < 0.5) {
          // 0.0s - 0.5s: Fade In
          opacity = elapsed / 0.5;
          orbitRadius = 500;
          scale = 0.85;
        } else if (elapsed <= 3.5) {
          // 0.5s - 3.5s: Deep Orbit (4 rounds = 8*PI radians) with easeInOutSine
          const t = (elapsed - 0.5) / orbitDuration;
          const easeProgress = -(Math.cos(Math.PI * t) - 1) / 2; // easeInOutSine
          progress = easeProgress * 4; // 4 full orbits

          orbitRadius = 500 * (1 - easeProgress);
          scale = 0.85 + 0.3 * easeProgress;
          opacity = 1;

          // Spawn star & gold trail particles during orbit
          if (Math.random() < 0.65) {
            const angleYang = progress * Math.PI * 2;
            const angleYin = angleYang + Math.PI;
            const yangX = cx + Math.cos(angleYang) * orbitRadius;
            const yangY = cy + Math.sin(angleYang) * orbitRadius;
            const yinX = cx + Math.cos(angleYin) * orbitRadius;
            const yinY = cy + Math.sin(angleYin) * orbitRadius;

            particlesRef.current.push({
              x: yangX + (Math.random() - 0.5) * 16,
              y: yangY + (Math.random() - 0.5) * 16,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              size: Math.random() * 2.2 + 0.8,
              color: '#ffd700',
              alpha: 0.85,
              life: 0,
              maxLife: 35,
              rotation: 0,
              rotationVelocity: 0,
              drag: 0.95,
              gravity: 0,
            });

            particlesRef.current.push({
              x: yinX + (Math.random() - 0.5) * 16,
              y: yinY + (Math.random() - 0.5) * 16,
              vx: (Math.random() - 0.5) * 2,
              vy: (Math.random() - 0.5) * 2,
              size: Math.random() * 2.2 + 0.8,
              color: '#60a5fa',
              alpha: 0.8,
              life: 0,
              maxLife: 35,
              rotation: 0,
              rotationVelocity: 0,
              drag: 0.95,
              gravity: 0,
            });
          }
        } else {
          // 3.5s - 3.9s: Dramatic pause, lock together at center, 200ms camera shake
          orbitRadius = 0;
          scale = 1.15;
          opacity = 1;
          if (elapsed < 3.7) {
            cameraShakeRef.current.intensity = Math.max(cameraShakeRef.current.intensity, 4);
          }
        }

        const angle = (progress * Math.PI * 2);
        const yangX = cx + Math.cos(angle) * orbitRadius;
        const yangY = cy + Math.sin(angle) * orbitRadius;
        const yinX = cx + Math.cos(angle + Math.PI) * orbitRadius;
        const yinY = cy + Math.sin(angle + Math.PI) * orbitRadius;

        // Draw Yang (Glowing White with Hollywood Gold Rim)
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(yangX, yangY);
        ctx.scale(scale * 0.45, scale * 0.45);
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 75, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f5af19';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();

        // Draw Yin (Mystic Cosmic Indigo-Black with Blue-Gold Rim)
        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.translate(yinX, yinY);
        ctx.scale(scale * 0.45, scale * 0.45);
        ctx.shadowColor = '#3b82f6';
        ctx.shadowBlur = 24;
        ctx.fillStyle = '#0a0a18';
        ctx.beginPath();
        ctx.arc(0, 0, 75, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#9d6205';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
      }

      // ── 3. SUPERNOVA SHOCKWAVES & ENERGY CORE (3.9s+) ──
      if (elapsed >= 3.9) {
        // Shockwaves expansion
        for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
          const sw = shockwavesRef.current[i];
          sw.radius += 18;
          sw.alpha *= 0.95;

          if (sw.alpha > 0.02 && sw.radius < sw.maxRadius) {
            ctx.save();
            ctx.globalAlpha = sw.alpha;
            ctx.strokeStyle = sw.color;
            ctx.lineWidth = sw.lineWidth;
            ctx.shadowColor = sw.color;
            ctx.shadowBlur = 18;
            ctx.beginPath();
            ctx.arc(cx, cy, sw.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          } else {
            shockwavesRef.current.splice(i, 1);
          }
        }

        // Anamorphic Streaks (Horizontal light beams)
        for (let i = streaksRef.current.length - 1; i >= 0; i--) {
          const str = streaksRef.current[i];
          str.alpha *= 0.96;
          if (str.alpha > 0.02) {
            ctx.save();
            ctx.globalAlpha = str.alpha;
            ctx.fillStyle = str.color;
            ctx.shadowColor = str.color;
            ctx.shadowBlur = 25;
            ctx.fillRect(0, str.y - 1.5, width, 3);
            ctx.restore();
          } else {
            streaksRef.current.splice(i, 1);
          }
        }

        // Rotating Light Rays during Supernova (3.9s - 6.0s)
        if (elapsed < 6.5) {
          const rayAlpha = Math.max(0, 1 - (elapsed - 3.9) / 2.6) * 0.35;
          ctx.save();
          ctx.globalAlpha = rayAlpha;
          ctx.translate(cx, cy);
          ctx.rotate(elapsed * 0.7);

          const rays = 12;
          for (let r = 0; r < rays; r++) {
            ctx.rotate((Math.PI * 2) / rays);
            const rayGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, Math.max(width, height) * 0.7);
            rayGrad.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
            rayGrad.addColorStop(0.5, 'rgba(245, 175, 25, 0.15)');
            rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = rayGrad;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, Math.max(width, height) * 0.7, -0.06, 0.06);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }
      }

      // ── 4. PARTICLE PHYSICS ENGINE ──
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);

        if (p.isSpiral && p.spiralAngle !== undefined && p.spiralRadius !== undefined) {
          p.spiralAngle += p.spiralSpeed || 0.05;
          p.spiralRadius *= 0.99;
          p.x = cx + Math.cos(p.spiralAngle) * p.spiralRadius;
          p.y = cy + Math.sin(p.spiralAngle) * p.spiralRadius;
        } else {
          // Gravitational pull towards center + tangential drag
          const dx = cx - p.x;
          const dy = cy - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 15) {
            const force = (p.gravity * 80) / (dist + 50);
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }

          p.vx *= p.drag;
          p.vy *= p.drag;
          p.x += p.vx;
          p.y += p.vy;
        }

        p.rotation += p.rotationVelocity;

        if (p.alpha <= 0.01) {
          particles.splice(i, 1);
        } else {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      }

      // ── 5. GRAVITATIONAL VORTEX (180 Gold Flakes) ──
      if (elapsed >= 5.5) {
        const flakes = vortexFlakesRef.current;
        for (let i = 0; i < flakes.length; i++) {
          const f = flakes[i];
          f.angle += f.angularVelocity;
          f.rotation += f.rotationVelocity;

          // Tangential & gentle orbital drift
          f.x = cx + Math.cos(f.angle) * f.orbitRadius;
          f.y = cy + Math.sin(f.angle) * f.orbitRadius;

          ctx.save();
          ctx.globalAlpha = f.alpha;
          ctx.translate(f.x, f.y);
          ctx.rotate(f.rotation);
          ctx.fillStyle = f.color;
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 8;
          ctx.fillRect(-f.size / 2, -f.size / 2, f.size, f.size * 1.4);
          ctx.restore();
        }
      }

      // ── 6. FINAL YIN-YANG RENDERING ON CANVAS (AFTER TITLES) ──
      if (elapsed >= 16.5) {
        finalRotationRef.current += (Math.PI * 2) / (3.0 * 60); // 1 round per 3 seconds at 60fps

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(finalRotationRef.current);
        ctx.scale(0.85, 0.85); // 260px diameter (radius ~130)

        // Subtle Hollywood Gold Glow Rim
        ctx.shadowColor = '#ffd700';
        ctx.shadowBlur = 32;

        // Draw Outer Gold Border
        ctx.beginPath();
        ctx.arc(0, 0, 150, 0, Math.PI * 2);
        ctx.strokeStyle = '#f5af19';
        ctx.lineWidth = 4;
        ctx.stroke();

        // White Yang S-curve
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -75, 75, -Math.PI / 2, Math.PI / 2, false);
        ctx.arc(0, 75, 75, -Math.PI / 2, Math.PI / 2, true);
        ctx.arc(0, 0, 150, Math.PI / 2, -Math.PI / 2, true);
        ctx.closePath();
        ctx.fill();

        // Dark Yin S-curve
        ctx.fillStyle = '#0a0a18';
        ctx.beginPath();
        ctx.arc(0, -75, 75, -Math.PI / 2, Math.PI / 2, false);
        ctx.arc(0, 75, 75, -Math.PI / 2, Math.PI / 2, true);
        ctx.arc(0, 0, 150, Math.PI / 2, -Math.PI / 2, false);
        ctx.closePath();
        ctx.fill();

        // Yang Eye (Black dot at 0, -75, diameter 15% of R = 22.5px -> radius ~11.25)
        ctx.fillStyle = '#0a0a18';
        ctx.beginPath();
        ctx.arc(0, -75, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Yin Eye (White dot at 0, 75)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 75, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f5af19';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
      }

      ctx.restore(); // Restore camera shake

      // ── 7. WHITE FLASH EFFECT ──
      if (whiteFlashRef.current > 0.01) {
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${whiteFlashRef.current})`;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        whiteFlashRef.current *= 0.88; // Flash decay
      }

      // ── 8. VIGNETTE (85% Dark Edge) ──
      ctx.save();
      const vignetteGrad = ctx.createRadialGradient(
        cx,
        cy,
        Math.min(width, height) * 0.35,
        cx,
        cy,
        Math.max(width, height) * 0.75
      );
      vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignetteGrad.addColorStop(1, 'rgba(0, 0, 0, 0.85)');
      ctx.fillStyle = vignetteGrad;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();

      // ── 9. CINEMATIC LETTERBOX 2.39:1 ──
      const cinemaHeight = width / 2.39;
      if (height > cinemaHeight) {
        const barHeight = (height - cinemaHeight) / 2;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, barHeight);
        ctx.fillRect(0, height - barHeight, width, barHeight);
      }

      // ── 10. PROCEDURAL 35MM FILM GRAIN ──
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      const grainCount = Math.floor((width * height) / 12000);
      for (let g = 0; g < grainCount; g++) {
        const gx = Math.random() * width;
        const gy = Math.random() * height;
        ctx.fillRect(gx, gy, 1, 1);
      }
      ctx.restore();

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isActive]);

  // Handle Interactive Yin-Yang Click & Double-click
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== 'final') return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);

    // If clicked near center Yin-Yang (radius 150px)
    if (dist <= 160) {
      spawnGoldDust(cx, cy, 35, false);
    }
  };

  const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== 'final') return;
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const dist = Math.hypot(e.clientX - cx, e.clientY - cy);

    // If double-clicked on Yin-Yang
    if (dist <= 160) {
      spawnGoldDust(cx, cy, 80, true);
    }
  };

  if (!isActive) return null;

  return (
    <ViewportPortal>
      <div
        className="fixed inset-0 select-none bg-black cursor-pointer overflow-hidden z-[999999]"
        style={{ width: '100vw', height: '100vh', margin: 0, padding: 0 }}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDoubleClick}
      >
        {/* Fullscreen Canvas for Stars, Supernova, Particles, and Letterbox */}
        <canvas ref={canvasRef} className="block w-full h-full" />

        {/* ── CINEMATIC TYPOGRAPHY OVERLAY (SVG-BASED RENDERING) ── */}

        {/* FIRST TITLE: APORN 💛 SURIYA (Duration 5.5s) */}
        {phase === 'title1' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4 animate-fade-in">
            <svg
              viewBox="0 0 1000 240"
              className="w-full max-w-4xl max-h-[38vh] drop-shadow-[0_0_35px_rgba(255,215,0,0.6)]"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Pure Hollywood Gold Multi-Stop Gradient */}
                <linearGradient id="hollywoodGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fff8db" />
                  <stop offset="28%" stopColor="#ffd700" />
                  <stop offset="65%" stopColor="#f5af19" />
                  <stop offset="100%" stopColor="#9d6205" />
                </linearGradient>

                <linearGradient id="heartGold" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fff8db" />
                  <stop offset="40%" stopColor="#ffd700" />
                  <stop offset="85%" stopColor="#f5af19" />
                  <stop offset="100%" stopColor="#784704" />
                </linearGradient>

                <filter id="goldBevel" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000000" floodOpacity="0.8" />
                  <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#ffd700" floodOpacity="0.5" />
                </filter>
              </defs>

              {/* APORN Text */}
              <text
                x="240"
                y="145"
                textAnchor="middle"
                fill="url(#hollywoodGold)"
                stroke="#ffeaa7"
                strokeWidth="1.2"
                filter="url(#goldBevel)"
                className="font-serif font-black tracking-[0.22em]"
                style={{ fontSize: '78px', letterSpacing: '0.18em' }}
              >
                APORN
              </text>

              {/* 3D Gold Heart with 80 BPM Heartbeat */}
              <g
                transform={`translate(500, 120) scale(${heartbeatScale}) translate(-500, -120)`}
                style={{ transition: 'transform 0.12s ease-out' }}
              >
                <path
                  d="M500,90 C480,55 435,55 435,100 C435,135 500,165 500,175 C500,165 565,135 565,100 C565,55 520,55 500,90 Z"
                  fill="url(#heartGold)"
                  stroke="#fff8db"
                  strokeWidth="2.5"
                  filter="url(#goldBevel)"
                />
              </g>

              {/* SURIYA Text */}
              <text
                x="760"
                y="145"
                textAnchor="middle"
                fill="url(#hollywoodGold)"
                stroke="#ffeaa7"
                strokeWidth="1.2"
                filter="url(#goldBevel)"
                className="font-serif font-black tracking-[0.22em]"
                style={{ fontSize: '78px', letterSpacing: '0.18em' }}
              >
                SURIYA
              </text>
            </svg>
          </div>
        )}

        {/* SECOND TITLE: ETERNAL (Dolly Zoom in effect, duration 4.5s) */}
        {phase === 'title2' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-4 animate-fade-in">
            <svg
              viewBox="0 0 1000 200"
              className="w-full max-w-3xl max-h-[30vh] drop-shadow-[0_0_40px_rgba(255,215,0,0.55)] transition-transform duration-[4500ms] ease-out scale-100 hover:scale-110"
              xmlns="http://www.w3.org/2000/svg"
              style={{ animation: 'dollyIn 4.5s ease-out forwards' }}
            >
              <defs>
                <linearGradient id="eternalGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fff8db" />
                  <stop offset="30%" stopColor="#ffd700" />
                  <stop offset="70%" stopColor="#f5af19" />
                  <stop offset="100%" stopColor="#784704" />
                </linearGradient>

                <filter id="engravedGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#000000" floodOpacity="0.9" />
                  <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#ffd700" floodOpacity="0.6" />
                </filter>
              </defs>

              <text
                x="500"
                y="135"
                textAnchor="middle"
                fill="url(#eternalGold)"
                stroke="#fff8db"
                strokeWidth="1.5"
                filter="url(#engravedGlow)"
                className="font-serif font-black tracking-[0.45em]"
                style={{ fontSize: '84px', letterSpacing: '0.38em' }}
              >
                ETERNAL
              </text>
            </svg>
          </div>
        )}

        {/* Subtle Escape Hint (Hidden/Minimal for user safety) */}
        <div className="absolute bottom-4 right-6 text-[11px] text-slate-600/60 hover:text-slate-400 transition pointer-events-auto">
          <button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen?.().catch(() => {});
              }
              onClose();
            }}
            className="px-2.5 py-1 rounded bg-black/40 border border-slate-800/50 hover:border-slate-700"
          >
            กด Esc เพื่อออก
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes dollyIn {
          0% {
            transform: scale(0.88);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: scale(1.08);
            opacity: 0;
          }
        }
      `}</style>
    </ViewportPortal>
  );
}
