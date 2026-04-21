import { useState, useEffect, useRef, useCallback } from 'react';
import { FlipDigit } from './FlipDigit';

interface ClockScreenProps {
  tileColor: string;
  textColor: string;
  backgroundColor: string;
  backgroundImage?: string;
  fontFamily: string;
  subFontSize: number | string;
  subFontFamily: string;
  showAmPm: boolean;
  showSeconds: boolean;
  cherryBlossom: boolean;
  onToggleAmPm: () => void;
  onToggleSeconds: () => void;
  onSwipeLeft?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export function ClockScreen({
  tileColor, textColor, backgroundColor, backgroundImage,
  fontFamily, subFontSize, subFontFamily,
  showAmPm, showSeconds, cherryBlossom,
  onToggleAmPm, onToggleSeconds,
  onSwipeLeft, onSwipeUp, onSwipeDown,
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
  const subFontSizeStr = typeof subFontSize === 'number' ? `${subFontSize}px` : subFontSize;

  // ── 벚꽃 캔버스 ───────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);

  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    if (!cherryBlossom) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const colors = [
      'rgba(255,182,193,0.9)', 'rgba(255,150,170,0.85)',
      'rgba(255,200,215,0.8)', 'rgba(250,205,220,0.75)', 'rgba(255,235,240,0.85)',
    ];

    type Petal = {
      x: number; y: number; vx: number; vy: number; size: number;
      angle: number; spin: number; swaySpeed: number; swayOffset: number;
      color: string; type: 'oval' | 'heart'; opacity: number;
    };

    const petals: Petal[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.8,
      vy: Math.random() * 1.2 + 0.6,
      size: Math.random() * 12 + 8,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.05,
      swaySpeed: Math.random() * 0.02 + 0.008,
      swayOffset: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      type: Math.random() < 0.6 ? 'oval' : 'heart',
      opacity: Math.random() * 0.35 + 0.65,
    }));

    const drawHeart = (ctx: CanvasRenderingContext2D, size: number) => {
      const s = size * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.3);
      ctx.bezierCurveTo(s, -s, s * 1.2, s * 0.5, 0, s);
      ctx.bezierCurveTo(-s * 1.2, s * 0.5, -s, -s, 0, -s * 0.3);
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
      t++;
      petals.forEach((p) => {
        p.x += p.vx + Math.sin(t * p.swaySpeed + p.swayOffset) * 0.7;
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
        ctx.shadowColor = 'rgba(220,100,140,0.4)';
        ctx.shadowBlur = 5;
        if (p.type === 'heart') drawHeart(ctx, p.size);
        else drawOval(ctx, p.size);
        ctx.fill();
        ctx.restore();
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, [cherryBlossom]);

  // ── 줌 & 위치 ────────────────────────────────────────────────
  const DEFAULT_SCALE = 0.5;
  const MIN_SCALE     = 0.3;
  const MAX_SCALE     = 2.5;

  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [pos, setPos]     = useState({ x: 0, y: 0 });
  const lastScale         = useRef(DEFAULT_SCALE);
  const lastPos           = useRef({ x: 0, y: 0 });

  // ── 타일 위 핀치줌 ───────────────────────────────────────────
  const pinchStartDist  = useRef<number | null>(null);
  const pinchStartScale = useRef(DEFAULT_SCALE);

  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTileTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.stopPropagation();
      pinchStartDist.current  = getDistance(e.touches);
      pinchStartScale.current = lastScale.current;
    }
  }, []);

  const handleTileTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current !== null) {
      e.stopPropagation();
      const dist  = getDistance(e.touches);
      const ratio = dist / pinchStartDist.current;
      const next  = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchStartScale.current * ratio));
      lastScale.current = next;
      setScale(next);
    }
  }, []);

  const handleTileTouchEnd = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    if (e.touches.length < 2) pinchStartDist.current = null;

    // 더블탭 리셋
    const now = Date.now();
    if (now - lastTap.current < 300) {
      lastScale.current = DEFAULT_SCALE;
      lastPos.current   = { x: 0, y: 0 };
      setScale(DEFAULT_SCALE);
      setPos({ x: 0, y: 0 });
      lastTap.current = 0;
      return;
    }
    lastTap.current = now;
  }, []);

  const lastTap = useRef(0);

  // ── 배경 터치: 영역별 분기 ───────────────────────────────────
  // 상단 20% → 스와이프 전용
  // 나머지   → 이동 드래그
  const bgTouchStart  = useRef<{ x: number; y: number; time: number } | null>(null);
  const bgIsDrag      = useRef(false);   // true면 이동모드, false면 스와이프 대기
  const SWIPE_ZONE    = 0.2;             // 상단 20%
  const DRAG_THRESHOLD = 8;             // px — 이 이상 움직이면 드래그 시작
  const SWIPE_THRESHOLD = 60;           // px — 스와이프 판정 거리

  const handleBgTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    const isTopZone = t.clientY < window.innerHeight * SWIPE_ZONE;
    bgTouchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    bgIsDrag.current = !isTopZone; // 상단이 아니면 드래그 모드
  }, []);

  const handleBgTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1 || !bgTouchStart.current) return;
    const t  = e.touches[0];
    const dx = t.clientX - bgTouchStart.current.x;
    const dy = t.clientY - bgTouchStart.current.y;

    if (bgIsDrag.current) {
      // 이동 드래그
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > DRAG_THRESHOLD) {
        const newPos = {
          x: lastPos.current.x + dx,
          y: lastPos.current.y + dy,
        };
        setPos(newPos);
      }
    }
  }, []);

  const handleBgTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!bgTouchStart.current) return;
    const t  = e.changedTouches[0];
    const dx = t.clientX - bgTouchStart.current.x;
    const dy = t.clientY - bgTouchStart.current.y;
    const elapsed = Date.now() - bgTouchStart.current.time;

    if (bgIsDrag.current) {
      // 드래그 종료 — 최종 위치 저장
      lastPos.current = {
        x: lastPos.current.x + dx,
        y: lastPos.current.y + dy,
      };
    } else {
      // 스와이프 판정
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      if (elapsed < 500) {
        if (absDy > absDx && absDy > SWIPE_THRESHOLD) {
          if (dy < 0) onSwipeUp?.();
          else        onSwipeDown?.();
        } else if (absDx > absDy && absDx > SWIPE_THRESHOLD) {
          if (dx < 0) onSwipeLeft?.();
        }
      }
    }
    bgTouchStart.current = null;
    bgIsDrag.current     = false;
  }, [onSwipeLeft, onSwipeUp, onSwipeDown]);

  // 마우스 드래그 (블루투스 마우스 대응)
  const mouseStart = useRef<{ x: number; y: number } | null>(null);

  const handleBgMouseDown = useCallback((e: React.MouseEvent) => {
    mouseStart.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleBgMouseMove = useCallback((e: React.MouseEvent) => {
    if (e.buttons !== 1 || !mouseStart.current) return;
    const dx = e.clientX - mouseStart.current.x;
    const dy = e.clientY - mouseStart.current.y;
    const newPos = {
      x: lastPos.current.x + dx,
      y: lastPos.current.y + dy,
    };
    setPos(newPos);
  }, []);

  const handleBgMouseUp = useCallback((e: React.MouseEvent) => {
    if (!mouseStart.current) return;
    const dx = e.clientX - mouseStart.current.x;
    const dy = e.clientY - mouseStart.current.y;
    lastPos.current = {
      x: lastPos.current.x + dx,
      y: lastPos.current.y + dy,
    };
    mouseStart.current = null;
  }, []);

  return (
    <div
      className="w-full h-full relative overflow-hidden"
      style={{
        backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        touchAction: 'none',
      }}
      onTouchStart={handleBgTouchStart}
      onTouchMove={handleBgTouchMove}
      onTouchEnd={handleBgTouchEnd}
      onMouseDown={handleBgMouseDown}
      onMouseMove={handleBgMouseMove}
      onMouseUp={handleBgMouseUp}
    >
      {/* 벚꽃 캔버스 */}
      {cherryBlossom && (
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }} />
      )}

      {/* 상단 스와이프 존 표시 (디버그용 — 나중에 제거 가능) */}
      <div
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{ height: '20%', zIndex: 0 }}
      />

      {/* 타일 — 화면 중앙 기준으로 이동 */}
      <div
        className="absolute"
        style={{
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(${scale})`,
          transformOrigin: 'center center',
          transition: pinchStartDist.current ? 'none' : 'transform 0.15s ease-out',
          display: 'flex',
          gap: '1rem',
          zIndex: 2,
          touchAction: 'none',
        }}
        onTouchStart={handleTileTouchStart}
        onTouchMove={handleTileTouchMove}
        onTouchEnd={handleTileTouchEnd}
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
            subFontSize={subFontSizeStr}
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
            subFontSize={subFontSizeStr}
            subFontFamily={subFontFamily}
            subTextColor={textColor}
          />
        </div>
      </div>
    </div>
  );
}