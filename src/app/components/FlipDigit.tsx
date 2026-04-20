import { motion } from 'motion/react';
import { useState, useEffect, useRef, ReactNode } from 'react';

interface FlipDigitProps {
  value: string;
  tileColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: number;          // ← 신규: 숫자(px). 없으면 clamp CSS 사용
  topContent?: ReactNode;
  bottomLeftContent?: ReactNode;
  bottomRightContent?: ReactNode;
  subFontSize?: string;       // 부가정보 크기 — TimerScreen에서 `${n}px` 로 전달
  subFontFamily?: string;
  subTextColor?: string;
}

type Phase = 'idle' | 'fold' | 'fall';

export function FlipDigit({
  value,
  tileColor = '#0f4c5c',
  textColor = '#e5e5e5',
  fontFamily = 'system-ui, -apple-system, sans-serif',
  fontSize,
  topContent,
  bottomLeftContent,
  bottomRightContent,
  subFontSize = '1.25rem',
  subFontFamily = 'system-ui, -apple-system, sans-serif',
  subTextColor = '#ffffff',
}: FlipDigitProps) {
  const [currentValue, setCurrentValue] = useState(value);
  const [nextValue,    setNextValue]    = useState(value);
  const [phase,        setPhase]        = useState<Phase>('idle');

  const phaseRef = useRef<Phase>('idle');
  phaseRef.current = phase;

  useEffect(() => {
    if (value === currentValue) return;
    if (phaseRef.current !== 'idle') return;

    setNextValue(value);
    setPhase('fold');

    const t1 = setTimeout(() => setPhase('fall'),  180);
    const t2 = setTimeout(() => {
      setCurrentValue(value);
      setPhase('idle');
    }, 360);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [value, currentValue]);

  // fontSize prop이 있으면 px 고정, 없으면 반응형 clamp
  const numStyle: React.CSSProperties = {
    color: textColor,
    fontFamily,
    fontWeight: '700',
    fontSize: fontSize ? `${fontSize}px` : 'clamp(6rem, 20vw, 16rem)',
    lineHeight: 1,
    userSelect: 'none',
    pointerEvents: 'none',
  };

  const subStyle: React.CSSProperties = {
    fontSize: subFontSize,
    fontFamily: subFontFamily,
    color: subTextColor,
    opacity: 0.9,
  };

  const TopNumber = ({ val }: { val: string }) => (
    <div
      className="absolute inset-x-0"
      style={{ top: 0, height: '200%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <span style={numStyle}>{val}</span>
    </div>
  );

  const BottomNumber = ({ val }: { val: string }) => (
    <div
      className="absolute inset-x-0"
      style={{ top: '-100%', height: '200%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <span style={numStyle}>{val}</span>
    </div>
  );

  const topStaticValue    = phase === 'idle' ? currentValue : nextValue;
  const bottomStaticValue = currentValue;

  return (
    <div className="relative w-full h-full flex flex-col gap-[4px]">

      {/* TOP */}
      <div
        className="relative flex-1 rounded-t-[32px] overflow-hidden shadow-2xl"
        style={{ backgroundColor: tileColor }}
      >
        {topContent && (
          <div className="absolute top-4 left-4 right-4 text-center z-10" style={subStyle}>
            {topContent}
          </div>
        )}

        <div className="absolute inset-0 overflow-hidden">
          <TopNumber val={topStaticValue} />
        </div>

        {phase === 'fold' && (
          <motion.div
            className="absolute inset-0 overflow-hidden"
            style={{ transformOrigin: 'bottom center', willChange: 'transform' }}
            initial={{ scaleY: 1 }}
            animate={{ scaleY: 0 }}
            transition={{ duration: 0.18, ease: 'easeIn' }}
          >
            <TopNumber val={currentValue} />
          </motion.div>
        )}

        <div
          className="absolute bottom-0 left-0 right-0 h-6 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.35))' }}
        />

        {bottomLeftContent && (
          <div className="absolute bottom-4 left-4 z-20" style={subStyle}>
            {bottomLeftContent}
          </div>
        )}
      </div>

      {/* BOTTOM */}
      <div
        className="relative flex-1 rounded-b-[32px] overflow-hidden shadow-2xl"
        style={{ backgroundColor: tileColor }}
      >
        <div className="absolute inset-0 overflow-hidden">
          <BottomNumber val={bottomStaticValue} />
        </div>

        {phase === 'fall' && (
          <motion.div
            className="absolute inset-0 overflow-hidden"
            style={{ transformOrigin: 'top center', willChange: 'transform' }}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <BottomNumber val={nextValue} />
          </motion.div>
        )}

        <div
          className="absolute top-0 left-0 right-0 h-6 pointer-events-none z-10"
          style={{ background: 'linear-gradient(to top, transparent, rgba(0,0,0,0.4))' }}
        />

        {bottomRightContent && (
          <div className="absolute bottom-4 right-4 z-20" style={subStyle}>
            {bottomRightContent}
          </div>
        )}
      </div>
    </div>
  );
}
