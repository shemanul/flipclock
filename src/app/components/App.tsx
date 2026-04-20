import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClockScreen } from './components/ClockScreen';
import { TimerScreen } from './components/TimerScreen';
import { SettingsScreen, Settings } from './components/SettingsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'clock' | 'timer'>('clock');
  const [showSettings, setShowSettings] = useState(false);
  const [showAmPm, setShowAmPm] = useState(true);
  const [showSeconds, setShowSeconds] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    tileColor: '#0f4c5c',
    textColor: '#e5e5e5',
    backgroundColor: '#fb9189',
    backgroundImage: '',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    fontSize: 64,
    subFontSize: 20,
    subFontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    screenSaver: false,
    particleRefresh: false,
    keepScreenOn: false,
  });

  // ── 픽셀 시프트 ──────────────────────────────────────────────
  // screenSaver ON  → 3초마다 ±4px 이동
  // particleRefresh ON → 8초마다 ±4px 이동 (둘 다 ON이면 3초 우선)
  const [shift, setShift] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const active = settings.screenSaver || settings.particleRefresh;
    if (!active) {
      setShift({ x: 0, y: 0 });
      return;
    }
    const interval = settings.screenSaver ? 3000 : 8000;
    const MAX = 4;
    const tick = () => {
      setShift({
        x: Math.round((Math.random() * 2 - 1) * MAX),
        y: Math.round((Math.random() * 2 - 1) * MAX),
      });
    };
    tick();
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [settings.screenSaver, settings.particleRefresh]);

  // ── 파티클 (particleRefresh ON) ──────────────────────────────
  const PARTICLE_COUNT = 50;
  const [particles] = useState(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      duration: Math.random() * 12 + 6,
      delay: Math.random() * 5,
      size: Math.random() < 0.5 ? 4 : 6,   // 2~3 → 4~6px
      x1: Math.random() * 100,
      y1: Math.random() * 100,
      x2: Math.random() * 100,
      y2: Math.random() * 100,
      x3: Math.random() * 100,
      y3: Math.random() * 100,
    }))
  );

  // ── 눈꽃송이 (particleRefresh ON) ────────────────────────────
  const SNOWFLAKE_COUNT = 30;
  const SNOWFLAKES = ['❄', '❅', '❆'];
  const [snowflakes] = useState(() =>
    Array.from({ length: SNOWFLAKE_COUNT }, (_, i) => ({
      id: i,
      symbol: SNOWFLAKES[i % SNOWFLAKES.length],
      startX: Math.random() * 100,
      drift: (Math.random() - 0.5) * 8,
      fontSize: Math.random() * 20 + 20,    // 10~26 → 20~40px
      duration: Math.random() * 8 + 7,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.3 + 0.5,  // 0.15~0.55 → 0.5~0.8
      rotation: Math.random() * 360,
    }))
  );

  // ── WakeLock ─────────────────────────────────────────────────
  const wakeLockRef = useRef<any>(null);

  const acquireWakeLock = async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      wakeLockRef.current.addEventListener('release', () => {
        wakeLockRef.current = null;
      });
    } catch (err) {
      console.warn('WakeLock 획득 실패:', err);
    }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  useEffect(() => {
    if (settings.keepScreenOn && !settings.screenSaver) {
      acquireWakeLock();
    } else {
      releaseWakeLock();
    }
    return () => { releaseWakeLock(); };
  }, [settings.keepScreenOn, settings.screenSaver]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (
        document.visibilityState === 'visible' &&
        settings.keepScreenOn &&
        !settings.screenSaver &&
        !wakeLockRef.current
      ) {
        acquireWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [settings.keepScreenOn, settings.screenSaver]);

  // ── 스와이프 ─────────────────────────────────────────────────
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX   = useRef(0);
  const touchEndY   = useRef(0);
  const isSwiping   = useRef(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current   = touchStartX.current;
    touchEndY.current   = touchStartY.current;
    isSwiping.current   = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
    const dx = Math.abs(touchEndX.current - touchStartX.current);
    const dy = Math.abs(touchEndY.current - touchStartY.current);
    if (dx > 10 || dy > 10) isSwiping.current = true;
  };

  const handleSwipeEnd = useCallback(() => {
    if (!isSwiping.current) {
      touchEndX.current = 0; touchEndY.current = 0; return;
    }
    const dx = touchEndX.current - touchStartX.current;
    const dy = touchEndY.current - touchStartY.current;
    const threshold = 100;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > threshold) {
      if (dy < 0) setShowSettings(true);
      else        setShowSettings(false);
    } else if (Math.abs(dx) > threshold) {
      if (dx < 0 && currentScreen === 'clock') setCurrentScreen('timer');
      else if (dx > 0 && currentScreen === 'timer') setCurrentScreen('clock');
    }
    touchEndX.current = 0; touchEndY.current = 0; isSwiping.current = false;
  }, [currentScreen]);

  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX; touchStartY.current = e.clientY;
    touchEndX.current   = e.clientX; touchEndY.current   = e.clientY;
    isSwiping.current   = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 1) return;
    touchEndX.current = e.clientX; touchEndY.current = e.clientY;
    const dx = Math.abs(touchEndX.current - touchStartX.current);
    const dy = Math.abs(touchEndY.current - touchStartY.current);
    if (dx > 10 || dy > 10) isSwiping.current = true;
  };

  return (
    <div
      className="size-full overflow-hidden select-none relative bg-black"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleSwipeEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleSwipeEnd}
    >
      {/* ── 픽셀 시프트 래퍼 ── */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `translate(${shift.x}px, ${shift.y}px)`,
          transition: 'transform 1.5s ease-in-out',
        }}
      >
        <AnimatePresence mode="wait">
          {showSettings ? (
            <motion.div
              key="settings"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute inset-0 z-50"
            >
              <SettingsScreen
                onClose={() => setShowSettings(false)}
                settings={settings}
                onSettingsChange={setSettings}
              />
            </motion.div>
          ) : (
            <motion.div
              key={currentScreen}
              initial={{ x: currentScreen === 'timer' ? '100%' : '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: currentScreen === 'timer' ? '-100%' : '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="size-full"
            >
              {currentScreen === 'clock' ? (
                <ClockScreen
                  tileColor={settings.tileColor}
                  textColor={settings.textColor}
                  backgroundColor={settings.backgroundColor}
                  backgroundImage={settings.backgroundImage}
                  fontFamily={settings.fontFamily}
                  subFontSize={settings.subFontSize}
                  subFontFamily={settings.subFontFamily}
                  showAmPm={showAmPm}
                  showSeconds={showSeconds}
                  onToggleAmPm={() => setShowAmPm(v => !v)}
                  onToggleSeconds={() => setShowSeconds(v => !v)}
                />
              ) : (
                <TimerScreen
                  tileColor={settings.tileColor}
                  textColor={settings.textColor}
                  backgroundColor={settings.backgroundColor}
                  backgroundImage={settings.backgroundImage}
                  fontFamily={settings.fontFamily}
                  fontSize={settings.fontSize}
                  subFontSize={settings.subFontSize}
                  subFontFamily={settings.subFontFamily}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 파티클 레이어 (particleRefresh ON, 설정 화면 제외) ── */}
      {settings.particleRefresh && !showSettings && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* 픽셀 입자 */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full bg-white/20"
              style={{ width: p.size, height: p.size }}
              animate={{
                left: [`${p.x1}%`, `${p.x2}%`, `${p.x3}%`],
                top:  [`${p.y1}%`, `${p.y2}%`, `${p.y3}%`],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}

          {/* 눈꽃송이 — 위에서 아래로 떨어지며 좌우 흔들림 + 회전 */}
          {snowflakes.map((s) => (
            <motion.div
              key={`snow-${s.id}`}
              className="absolute select-none"
              style={{
                left: `${s.startX}%`,
                fontSize: s.fontSize,
                opacity: s.opacity,
                color: 'white',
                lineHeight: 1,
              }}
              animate={{
                y: ['-5vh', '108vh'],
                x: [0, s.drift * 10, s.drift * -5, s.drift * 15, 0],
                rotate: [s.rotation, s.rotation + 180, s.rotation + 360],
              }}
              transition={{
                duration: s.duration,
                delay: s.delay,
                repeat: Infinity,
                ease: 'linear',
                x: { duration: s.duration, ease: 'easeInOut', repeat: Infinity },
                rotate: { duration: s.duration * 1.5, ease: 'linear', repeat: Infinity },
              }}
            >
              {s.symbol}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
