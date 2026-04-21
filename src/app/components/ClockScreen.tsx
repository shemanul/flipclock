import { useState, useEffect, useRef } from 'react';
import { FlipDigit } from './FlipDigit';

interface ClockScreenProps {
  tileColor: string;
  textColor: string;
  backgroundColor: string;
  backgroundImage?: string;
  fontFamily: string;
  subFontSize: string;
  subFontFamily: string;
  showAmPm: boolean;
  showSeconds: boolean;
  cherryBlossom: boolean;
  onToggleAmPm: () => void;
  onToggleSeconds: () => void;
}

export function ClockScreen({
  tileColor,
  textColor,
  backgroundColor,
  backgroundImage,
  fontFamily,
  subFontSize,
  subFontFamily,
  showAmPm,
  showSeconds,
  cherryBlossom,
  onToggleAmPm,
  onToggleSeconds,
}: ClockScreenProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours        = time.getHours();
  const minutes      = time.getMinutes();
  const seconds      = time.getSeconds();
  const isPM         = hours >= 12;
  const displayHours = hours % 12 || 12;

  const month    = String(time.getMonth() + 1).padStart(2, '0');
  const day      = String(time.getDate()).padStart(2, '0');
  const year     = String(time.getFullYear()).slice(2);
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const weekday  = weekdays[time.getDay()];

  const hoursValue   = String(displayHours).padStart(2, '0');
  const minutesValue = String(minutes).padStart(2, '0');
  const secondsValue = String(seconds).padStart(2, '0');

  // ── 벚꽃 캔버스 ───────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);

  useEffect(() => {
    if (!cherryBlossom) {
      cancelAnimationFrame(animRef.current);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = [
      'rgba(255, 182, 193, 0.85)',
      'rgba(255, 160, 180, 0.80)',
      'rgba(255, 200, 210, 0.75)',
      'rgba(250, 210, 220, 0.70)',
      'rgba(255, 240, 245, 0.80)',
    ];

    type Petal = {
      x: number; y: number;
      vx: number; vy: number;
      size: number;
      angle: number; spin: number;
      swaySpeed: number; swayOffset: number;
      color: string;
      type: 'oval' | 'heart';
      opacity: number;
    };

    const COUNT = 60;
    const petals: Petal[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight - window.innerHeight,
      vx: (Math.random() - 0.5) * 0.8,
      vy: Math.random() * 1.2 + 0.6,
      size: Math.random() * 10 + 7,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.04,
      swaySpeed: Math.random() * 0.02 + 0.008,
      swayOffset: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      type: Math.random() < 0.6 ? 'oval' : 'heart',
      opacity: Math.random() * 0.4 + 0.6,
    }));

    const drawHeart = (ctx: CanvasRenderingContext2D, size: number) => {
      const s = size * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.3);
      ctx.bezierCurveTo( s, -s,       s * 1.2,  s * 0.5, 0,  s);
      ctx.bezierCurveTo(-s * 1.2, s * 0.5, -s, -s,       0, -s * 0.3);
      ctx.closePath();
    };

    const drawOval = (ctx: CanvasRenderingContext2D, size: number) => {
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.45, size * 0.28, 0, 0, Math.PI * 2);
      ctx.closePath();
    };

    let t = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 1;

      petals.forEach((p) => {
        p.x += p.vx + Math.sin(t * p.swaySpeed + p.swayOffset) * 0.6;
        p.y += p.vy;
        p.angle += p.spin;

        if (p.y > canvas.height + 20) { p.y = -20; p.x = Math.random() * canvas.width; }
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.shadowColor = 'rgba(200, 100, 130, 0.3)';
        ctx.shadowBlur  = 4;

        if (p.type === 'heart') drawHeart(ctx, p.size);
        else drawOval(ctx, p.size);

        ctx.fill();
        ctx.restore();
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [cherryBlossom]);

  // ── 핀치줌 + 두 손가락 드래그 ────────────────────────────────
  const DEFAULT_SCALE = 0.5;
  const MIN_SCALE     = 0.4;
  const MAX_SCALE     = 2.5;

  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [pos, setPos]     = useState({ x: 0, y: 0 });

  const lastScale       = useRef(DEFAULT_SCALE);
  const lastPos         = useRef({ x: 0, y: 0 });
  const pinchStartDist  = useRef<number | null>(null);
  const pinchStartScale = useRef(DEFAULT_SCALE);
  const dragStartMid    = useRef<{ x: number; y: number } | null>(null);
  const dragStartPos    = useRef({ x: 0, y: 0 });

  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getMidpoint = (touches: React.TouchList) => ({
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  });

  const handleTilesTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.stopPropagation();
      pinchStartDist.current  = getDistance(e.touches);
      pinchStartScale.current = lastScale.current;
      dragStartMid.current    = getMidpoint(e.touches);
      dragStartPos.current    = { ...lastPos.current };
    }
  };

  const handleTilesTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current !== null) {
      e.stopPropagation();
      const dist  = getDistance(e.touches);
      const ratio = dist / pinchStartDist.current;
      const next  = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchStartScale.current * ratio));
      lastScale.current = next;
      setScale(next);
      if (dragStartMid.current) {
        const mid    = getMidpoint(e.touches);
        const newPos = {
          x: dragStartPos.current.x + mid.x - dragStartMid.current.x,
          y: dragStartPos.current.y + mid.y - dragStartMid.current.y,
        };
        lastPos.current = newPos;
        setPos(newPos);
      }
    }
  };

  const handleTilesTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinchStartDist.current = null;
      dragStartMid.current   = null;
    }
  };

  const lastTap = useRef(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      lastScale.current = DEFAULT_SCALE;
      lastPos.current   = { x: 0, y: 0 };
      setScale(DEFAULT_SCALE);
      setPos({ x: 0, y: 0 });
    }
    lastTap.current = now;
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center relative overflow-hidden"
      style={{
        backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 벚꽃 캔버스 */}
      {cherryBlossom && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 1 }}
        />
      )}

      {/* 타일 컨테이너 */}
      <div
        onTouchStart={handleTilesTouchStart}
        onTouchMove={handleTilesTouchMove}
        onTouchEnd={handleTilesTouchEnd}
        onTouchCancel={handleTilesTouchEnd}
        onClick={handleDoubleTap}
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: pinchStartDist.current ? 'none' : 'transform 0.2s ease-out',
          display: 'flex',
          gap: '1rem',
          touchAction: 'none',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* 시 타일 */}
        <div style={{ width: '45vw', aspectRatio: '1 / 1' }}>
          <FlipDigit
            value={hoursValue}
            tileColor={tileColor}
            textColor={textColor}
            fontFamily={fontFamily}
            topContent={<div>{year}. {month}. {day}.</div>}
            bottomLeftContent={
              <button
                onClick={(e) => { e.stopPropagation(); onToggleAmPm(); }}
                className="hover:opacity-70 transition-opacity min-w-[56px] text-center"
              >
                {showAmPm ? (isPM ? 'PM' : 'AM') : '\u00A0'}
              </button>
            }
            subFontSize={subFontSize}
            subFontFamily={subFontFamily}
            subTextColor={textColor}
          />
        </div>

        {/* 분 타일 */}
        <div style={{ width: '45vw', aspectRatio: '1 / 1' }}>
          <FlipDigit
            value={minutesValue}
            tileColor={tileColor}
            textColor={textColor}
            fontFamily={fontFamily}
            topContent={<div>{weekday}</div>}
            bottomRightContent={
              <button
                onClick={(e) => { e.stopPropagation(); onToggleSeconds(); }}
                className="hover:opacity-70 transition-opacity min-w-[56px] text-center"
              >
                {showSeconds ? secondsValue : '\u00A0'}
              </button>
            }
            subFontSize={subFontSize}
            subFontFamily={subFontFamily}
            subTextColor={textColor}
          />
        </div>
      </div>
    </div>
  );
}