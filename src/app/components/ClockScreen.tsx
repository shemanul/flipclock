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
  onSwipeLeft,
  onSwipeUp,
  onSwipeDown,
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

  // subFontSize → string 변환
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

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = [
      'rgba(255, 182, 193, 0.9)',
      'rgba(255, 150, 170, 0.85)',
      'rgba(255, 200, 215, 0.8)',
      'rgba(250, 205, 220, 0.75)',
      'rgba(255, 235, 240, 0.85)',
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
      ctx.bezierCurveTo( s, -s,        s * 1.2,  s * 0.5, 0,  s);
      ctx.bezierCurveTo(-s * 1.2, s * 0.5, -s, -s,        0, -s * 0.3);
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
        ctx.fillStyle   = p.color;
        ctx.shadowColor = 'rgba(220, 100, 140, 0.4)';
        ctx.shadowBlur  = 5;
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

  // ── 핀치 줌 + 길게 누르기 드래그 ────────────────────────────
  const DEFAULT_SCALE = 0.5;
  const MIN_SCALE     = 0.3;
  const MAX_SCALE     = 2.5;
  const LONG_PRESS_MS = 400;

  const [scale, setScale]       = useState(DEFAULT_SCALE);
  const [pos, setPos]           = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const lastScale       = useRef(DEFAULT_SCALE);
  const lastPos         = useRef({ x: 0, y: 0 });
  const pinchStartDist  = useRef<number | null>(null);
  const pinchStartScale = useRef(DEFAULT_SCALE);
  const longPressTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartTouch  = useRef<{ x: number; y: number } | null>(null);
  const dragStartPos    = useRef({ x: 0, y: 0 });
  const isLongPressed   = useRef(false);

  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      isLongPressed.current = false;
      setIsDragging(false);
      e.stopPropagation();
      pinchStartDist.current  = getDistance(e.touches);
      pinchStartScale.current = lastScale.current;
      return;
    }
    if (e.touches.length === 1) {
      isLongPressed.current  = false;
      dragStartTouch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      dragStartPos.current   = { ...lastPos.current };
      longPressTimer.current = setTimeout(() => {
        isLongPressed.current = true;
        setIsDragging(true);
      }, LONG_PRESS_MS);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDist.current !== null) {
      e.stopPropagation();
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      const dist  = getDistance(e.touches);
      const ratio = dist / pinchStartDist.current;
      const next  = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchStartScale.current * ratio));
      lastScale.current = next;
      setScale(next);
      return;
    }
    if (e.touches.length === 1 && isLongPressed.current && dragStartTouch.current) {
      e.stopPropagation();
      const newPos = {
        x: dragStartPos.current.x + e.touches[0].clientX - dragStartTouch.current.x,
        y: dragStartPos.current.y + e.touches[0].clientY - dragStartTouch.current.y,
      };
      lastPos.current = newPos;
      setPos(newPos);
      return;
    }
    // 손가락이 움직이면 길게 누르기 취소 → 부모 스와이프 허용
    if (e.touches.length === 1 && !isLongPressed.current && dragStartTouch.current) {
      const dx = Math.abs(e.touches[0].clientX - dragStartTouch.current.x);
      const dy = Math.abs(e.touches[0].clientY - dragStartTouch.current.y);
      if (dx > 8 || dy > 8) {
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
      }
    }
  }, []);

  const SWIPE_THRESHOLD = 70;

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (e.touches.length < 2) pinchStartDist.current = null;

    if (e.touches.length === 0) {
      const wasLongPressed   = isLongPressed.current;
      const startTouch       = dragStartTouch.current; // 먼저 저장

      // 상태 초기화
      isLongPressed.current  = false;
      dragStartTouch.current = null;
      setIsDragging(false);

      // 드래그였으면 스와이프 처리 안 함
      if (wasLongPressed) return;

      // 스와이프 판정
      if (startTouch && e.changedTouches.length === 1) {
        const dx    = e.changedTouches[0].clientX - startTouch.x;
        const dy    = e.changedTouches[0].clientY - startTouch.y;
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);

        if (absDy > absDx && absDy > SWIPE_THRESHOLD) {
          if (dy < 0) onSwipeUp?.();
          else        onSwipeDown?.();
        } else if (absDx > absDy && absDx > SWIPE_THRESHOLD) {
          if (dx < 0) onSwipeLeft?.();
        }
      }
    }
  }, [onSwipeLeft, onSwipeUp, onSwipeDown]);

  // 더블탭 → 리셋 + 닫기버튼 표시 / 싱글탭 → 닫기버튼 숨기기
  const lastTap = useRef(0);
  const [showCloseBtn, setShowCloseBtn] = useState(false);

  const handleTap = useCallback(() => {
    if (isLongPressed.current) return;
    const now = Date.now();
    if (now - lastTap.current < 300) {
      // 더블탭
      lastScale.current = DEFAULT_SCALE;
      lastPos.current   = { x: 0, y: 0 };
      setScale(DEFAULT_SCALE);
      setPos({ x: 0, y: 0 });
      setShowCloseBtn(true);  // 닫기 버튼 표시
    } else {
      // 싱글탭
      setShowCloseBtn(false); // 닫기 버튼 숨기기
    }
    lastTap.current = now;
  }, []);

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

      {/* 드래그 모드 안내 */}
      {isDragging && (
        <div
          className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs text-white/80 pointer-events-none"
          style={{ zIndex: 10, backgroundColor: 'rgba(0,0,0,0.35)' }}
        >
          드래그로 이동 · 더블탭으로 리셋
        </div>
      )}

      {/* 닫기 버튼 — 더블탭 시 표시 */}
      {showCloseBtn && (
        <button
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.close();
            }
          }}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium text-white transition-all"
          style={{
            zIndex: 20,
            backgroundColor: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <span>✕</span>
          <span>앱 종료</span>
        </button>
      )}

      {/* 타일 컨테이너 */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onClick={handleTap}
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging || pinchStartDist.current ? 'none' : 'transform 0.2s ease-out',
          display: 'flex',
          gap: '1rem',
          touchAction: 'none',
          position: 'relative',
          zIndex: 2,
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
