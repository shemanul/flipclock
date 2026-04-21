import { useState, useEffect, useRef } from 'react';
import { FlipDigit } from './FlipDigit';
import { RotateCcw, Play, Pause } from 'lucide-react';

interface TimerScreenProps {
  tileColor: string;
  textColor: string;
  backgroundColor: string;
  backgroundImage?: string;
  fontFamily: string;
  fontSize: number;
  fontBold?: boolean;
  subFontSize: number;
  subFontFamily: string;
}

export function TimerScreen({
  tileColor,
  textColor,
  backgroundColor,
  backgroundImage,
  fontFamily,
  fontSize,
  fontBold = true,
  subFontSize,
  subFontFamily,
}: TimerScreenProps) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  const minutesValue  = String(minutes).padStart(2, '0');
  const secondsValue  = String(remainingSeconds).padStart(2, '0');

  // number → FlipDigit이 받는 string 형식으로 변환
  const subFontSizeStr = `${subFontSize}px`;

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center px-4"
      style={{
        backgroundColor,
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="flex gap-4 md:gap-6 mb-12">
        <div className="w-[45vw] md:w-[40vw] max-w-md" style={{ aspectRatio: '1 / 1' }}>
          <FlipDigit
            value={minutesValue}
            tileColor={tileColor}
            textColor={textColor}
            fontFamily={fontFamily}
            fontSize={fontSize}
            fontWeight={fontBold ? '700' : '400'}
            topContent={<div>분</div>}
            subFontSize={subFontSizeStr}
            subFontFamily={subFontFamily}
            subTextColor={textColor}
          />
        </div>

        <div className="w-[45vw] md:w-[40vw] max-w-md" style={{ aspectRatio: '1 / 1' }}>
          <FlipDigit
            value={secondsValue}
            tileColor={tileColor}
            textColor={textColor}
            fontFamily={fontFamily}
            fontSize={fontSize}
            fontWeight={fontBold ? '700' : '400'}
            topContent={<div>초</div>}
            subFontSize={subFontSizeStr}
            subFontFamily={subFontFamily}
            subTextColor={textColor}
          />
        </div>
      </div>

      <div className="flex gap-6 md:gap-10">
        <button
          onClick={handleReset}
          className="p-4 md:p-6 rounded-full hover:opacity-80 transition-opacity shadow-lg"
          style={{ backgroundColor: tileColor }}
        >
          <RotateCcw className="w-8 h-8 md:w-10 md:h-10" style={{ color: textColor }} />
        </button>

        <button
          onClick={() => setIsRunning((r) => !r)}
          className="p-4 md:p-6 rounded-full hover:opacity-80 transition-opacity shadow-lg"
          style={{ backgroundColor: tileColor }}
        >
          {isRunning
            ? <Pause className="w-8 h-8 md:w-10 md:h-10" style={{ color: textColor }} />
            : <Play  className="w-8 h-8 md:w-10 md:h-10" style={{ color: textColor }} />
          }
        </button>
      </div>
    </div>
  );
}
