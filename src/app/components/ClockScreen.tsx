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

  const month   = String(time.getMonth() + 1).padStart(2, '0');
  const day     = String(time.getDate()).padStart(2, '0');
  const year    = String(time.getFullYear()).slice(2);
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const weekday = weekdays[time.getDay()];

  const hoursValue   = String(displayHours).padStart(2, '0');
  const minutesValue = String(minutes).padStart(2, '0');
  const secondsValue = String(seconds).padStart(2, '0');

  // ── 핀치줌: 타일만 확대/축소 ──────────────────────────────────
  const DEFAULT_SCALE = 0.5;
  const MIN_SCALE     = 0.4;
  const MAX_SCALE     = 2.5;

  const [scale, setScale]      = useState(DEFAULT_SCALE);
  const lastScale              = useRef(DEFAULT_SCALE);
  const pinchStartDist         = useRef<number | null>(null);
  const pinchStartScale        = useRef(DEFAULT_SCALE);

  const getDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTilesTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.stopPropagation();
      pinchStartDist.current  = getDistance(e.touches);
      pinchStartScale.current = lastScale.current;
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
    }
  };

  const handleTilesTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      pinchStartDist.current = null;
    }
  };

  // 더블탭으로 기본 크기 리셋
  const lastTap = useRef(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      lastScale.current = DEFAULT_SCALE;
      setScale(DEFAULT_SCALE);
    }
    lastTap.current = now;
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* 타일 컨테이너 — 핀치줌 대상 */}
      <div
        onTouchStart={handleTilesTouchStart}
        onTouchMove={handleTilesTouchMove}
        onTouchEnd={handleTilesTouchEnd}
        onTouchCancel={handleTilesTouchEnd}
        onClick={handleDoubleTap}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          transition: pinchStartDist.current ? 'none' : 'transform 0.2s ease-out',
          display: 'flex',
          gap: '1rem',
          touchAction: 'none',
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