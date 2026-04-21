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

  // ── 상태 ─────────────────────────────────────────────────────
  const DEFAULT_SCALE  = 0.5;
  const MIN_SCALE      = 0.3;
  const MAX_SCALE      = 2.5;
  const LONG_PRESS_MS  = 400;
  const SWIPE_MIN      = 60;   // 스와이프 최소 거리
  const MOVE_CANCEL    = 15;   // 길게 누르기 취소 거리

  const [scale, setScale]           = useState(DEFAULT_SCALE);
  const [pos, setPos]               = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const lastScale       = useRef(DEFAULT_SCALE);
  const lastPos         = useRef({ x: 0, y: 0 });

  // 핀치줌
  const pinchStartDist  = useRef<number | null>(null);
  const pinchStartScale = useRef(DEFAULT_SCALE);

  // 길게 누르기 / 드래그
  const longPressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressed   = useRef(false);
  const touchStart      = useRef<{ x: number; y: number } | null>(null);
  const dragStartPos    = useRef({ x: 0, y: 0 });

  // 더블탭 → 리셋 + 전체화면 토글
  const lastTap = useRef(0);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // ── 전체 화면 터치 핸들러 ────────────────────────────────────
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // 두 손가락 → 핀치줌 시작
    if (e.touches.length === 2) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      isLongPressed.current = false;
      setIsDragging(false);
      pinchStartDist.current  = getDistance(e.touches);
      pinchStartScale.current = lastScale.current;
      touchStart.current = null; // 스와이프 비활성화
      return;
    }

    // 한 손가락
    if (e.touches.length === 1) {
      const x = e.touches[0].clientX;
      const y = e.touches[0].clientY;
      touchStart.current = { x, y };
      dragStartPos.current = { ...lastPos.current };
      isLongPressed.current = false;

      // 길게 누르기 타이머
      longPressTimer.current = setTimeout(() => {
        isLongPressed.current = true;
        setIsDragging(true);
        if (navigator.vibrate) navigator.vibrate(40); // 진동 피드백
      }, LONG_PRESS_MS);
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    // 두 손가락 → 핀치줌
    if (e.touches.length === 2 && pinchStartDist.current !== null) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      const dist  = getDistance(e.touches);
      const ratio = dist / pinchStartDist.current;
      const next  = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchStartScale.current * ratio));
      lastScale.current = next;
      setScale(next);
      return;
    }

    if (e.touches.length === 1 && touchStart.current) {
      const dx = e.touches[0].clientX - touchStart.current.x;
      const dy = e.touches[0].clientY - touchStart.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // 길게 누르기 중 → 드래그 이동
      if (isLongPressed.current) {
        const newPos = {
          x: dragStartPos.current.x + dx,
          y: dragStartPos.current.y + dy,
        };
        lastPos.current = newPos;
        setPos(newPos);
        return;
      }

      // 아직 길게 누르기 전인데 많이 움직임 → 스와이프 모드 (타이머 취소)
      if (dist > MOVE_CANCEL) {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
      }
    }
  }, []);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    // 핀치 종료
    if (e.touches.length < 2) {
      pinchStartDist.current = null;
    }

    if (e.touches.length === 0) {
      const wasLongPressed = isLongPressed.current;
      const start          = touchStart.current;

      // 상태 초기화
      isLongPressed.current = false;
      touchStart.current    = null;
      setIsDragging(false);

      // 길게 누르기(드래그) 종료 → 스와이프/탭 처리 안 함
      if (wasLongPressed) return;

      if (start && e.changedTouches.length === 1) {
        const dx    = e.changedTouches[0].clientX - start.x;
        const dy    = e.changedTouches[0].clientY - start.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        const dist  = Math.sqrt(dx * dx + dy * dy);

        if (dist < 10) {
          // ── 탭 / 더블탭 ──
          const now = Date.now();
          if (now - lastTap.current < 300) {
            // 더블탭 → 리셋 + 전체화면 토글
            lastScale.current = DEFAULT_SCALE;
            lastPos.current   = { x: 0, y: 0 };
            setScale(DEFAULT_SCALE);
            setPos({ x: 0, y: 0 });
            toggleFullscreen();
            lastTap.current = 0;
          } else {
            lastTap.current = now;
          }
        } else if (dist >= SWIPE_MIN) {
          // ── 스와이프 ──
          if (absDy > absDx) {
            if (dy < 0) onSwipeUp?.();
            else        onSwipeDown?.();
          } else {
            if (dx < 0) onSwipeLeft?.();
          }
        }
      }
    }
  }, [onSwipeLeft, onSwipeUp, onSwipeDown]);

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
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {/* 벚꽃 캔버스 */}
      {cherryBlossom && (
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }} />
      )}

      {/* 드래그 안내 */}
      {isDragging && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs text-white/80 pointer-events-none"
          style={{ zIndex: 10, backgroundColor: 'rgba(0,0,0,0.4)' }}
        >
          드래그로 이동 · 더블탭으로 리셋
        </div>
      )}

      {/* 타일 — 화면 중앙 기준 위치 */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging || pinchStartDist.current ? 'none' : 'transform 0.15s ease-out',
          display: 'flex',
          gap: '1rem',
          zIndex: 2,
          touchAction: 'none',
          cursor: isDragging ? 'grabbing' : 'default',
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
