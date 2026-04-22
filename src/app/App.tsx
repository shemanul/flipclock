import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ClockScreen } from './components/ClockScreen';
import { TimerScreen } from './components/TimerScreen';
import { SettingsScreen, Settings } from './components/SettingsScreen';

const DEFAULT_SETTINGS: Settings = {
  tileColor: '#0f4c5c',
  textColor: '#e5e5e5',
  backgroundColor: '#fb9189',
  backgroundImage: '',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  fontSize: 64,
  fontBold: true,
  subFontSize: 20,
  subFontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  screenSaver: false,
  particleRefresh: false,
  keepScreenOn: false,
  cherryBlossom: false,
  clockOpacity: 1,
  clockPosition: { x: 0, y: 0 },
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<'clock' | 'timer'>('clock');
  const [showSettings, setShowSettings] = useState(false);
  const [showAmPm, setShowAmPm] = useState(true);
  const [showSeconds, setShowSeconds] = useState(true);
  const [settings, setSettings] = useState<Settings>(() => {
    try {
      const saved = localStorage.getItem('flipclock-settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });
  // ── localStorage에 settings 저장 ──────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem('flipclock-settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // ── 픽셀 시프트 ──────────────────────────────────────────────
  const [shift, setShift] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const active = settings.screenSaver || settings.particleRefresh;
    if (!active) { setShift({ x: 0, y: 0 }); return; }
    const interval = settings.screenSaver ? 3000 : 8000;
    const MAX = 4;
    const tick = () => setShift({
      x: Math.round((Math.random() * 2 - 1) * MAX),
      y: Math.round((Math.random() * 2 - 1) * MAX),
    });
    tick();
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [settings.screenSaver, settings.particleRefresh]);

  // ── 파티클 ───────────────────────────────────────────────────
  const PARTICLE_COUNT = 50;
  const [particles] = useState(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      id: i,
      duration: Math.random() * 12 + 6,
      delay: Math.random() * 5,
      size: Math.random() < 0.5 ? 4 : 6,
      x1: Math.random() * 100, y1: Math.random() * 100,
      x2: Math.random() * 100, y2: Math.random() * 100,
      x3: Math.random() * 100, y3: Math.random() * 100,
    }))
  );

  // ── 눈꽃송이 ─────────────────────────────────────────────────
  const SNOWFLAKE_COUNT = 30;
  const SNOWFLAKES = ['❄', '❅', '❆'];
  const [snowflakes] = useState(() =>
    Array.from({ length: SNOWFLAKE_COUNT }, (_, i) => ({
      id: i,
      symbol: SNOWFLAKES[i % SNOWFLAKES.length],
      startX: Math.random() * 100,
      drift: (Math.random() - 0.5) * 8,
      fontSize: Math.random() * 20 + 20,
      duration: Math.random() * 8 + 7,
      delay: Math.random() * 10,
      opacity: Math.random() * 0.3 + 0.5,
      rotation: Math.random() * 360,
    }))
  );

  // ── WakeLock ─────────────────────────────────────────────────
  const wakeLockRef = useRef<any>(null);

  const acquireWakeLock = async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      wakeLockRef.current.addEventListener('release', () => { wakeLockRef.current = null; });
    } catch (err) { console.warn('WakeLock 획득 실패:', err); }
  };

  const releaseWakeLock = async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
  };

  useEffect(() => {
    if (settings.keepScreenOn && !settings.screenSaver) acquireWakeLock();
    else releaseWakeLock();
    return () => { releaseWakeLock(); };
  }, [settings.keepScreenOn, settings.screenSaver]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' &&
        settings.keepScreenOn && !settings.screenSaver && !wakeLockRef.current) {
        acquireWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [settings.keepScreenOn, settings.screenSaver]);

  // ── 타이머 화면 스와이프 (App 레벨) ─────────────────────────
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping   = useRef(false);

  const handleTimerTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length >= 2) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current   = false;
  };

  const handleTimerTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length >= 2) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartX.current);
    const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
    if (dx > 10 || dy > 10) isSwiping.current = true;
  };

  const handleTimerTouchEnd = (e: React.TouchEvent) => {
    if (!isSwiping.current) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const threshold = 80;
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > threshold) {
      if (dy < 0) setShowSettings(true);
      else        setShowSettings(false);
    } else if (Math.abs(dx) > threshold && dx > 0) {
      setCurrentScreen('clock');
    }
    isSwiping.current = false;
  };

  return (
    <div className="size-full overflow-hidden select-none relative bg-black">
      {/* ── 픽셀 시프트 래퍼 ── */}
      <div
        style={{
          width: '100%', height: '100%',
          transform: `translate(${shift.x}px, ${shift.y}px)`,
          transition: 'transform 1.5s ease-in-out',
        }}
      >
        <AnimatePresence mode="wait">
          {showSettings ? (
            <motion.div
              key="settings"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
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
                // ── ClockScreen: 스와이프 콜백 전달 ──
                <ClockScreen
                  tileColor={settings.tileColor}
                  textColor={settings.textColor}
                  backgroundColor={settings.backgroundColor}
                  backgroundImage={settings.backgroundImage}
                  fontFamily={settings.fontFamily}
                  fontBold={settings.fontBold}
                  subFontSize={settings.subFontSize}
                  subFontFamily={settings.subFontFamily}
                  showAmPm={showAmPm}
                  showSeconds={showSeconds}
                  cherryBlossom={settings.cherryBlossom}
                  clockOpacity={settings.clockOpacity}
                  clockPosition={settings.clockPosition}
                  onPositionChange={(pos) => setSettings(s => ({ ...s, clockPosition: pos }))}
                  onToggleAmPm={() => setShowAmPm(v => !v)}
                  onToggleSeconds={() => setShowSeconds(v => !v)}
                  onSwipeLeft={() => setCurrentScreen('timer')}
                  onSwipeUp={() => setShowSettings(true)}
                  onSwipeDown={() => setShowSettings(false)}
                />
              ) : (
                // ── TimerScreen: 자체 스와이프 ──
                <div
                  className="size-full"
                  onTouchStart={handleTimerTouchStart}
                  onTouchMove={handleTimerTouchMove}
                  onTouchEnd={handleTimerTouchEnd}
                >
                  <TimerScreen
                    tileColor={settings.tileColor}
                    textColor={settings.textColor}
                    backgroundColor={settings.backgroundColor}
                    backgroundImage={settings.backgroundImage}
                    fontFamily={settings.fontFamily}
                    fontSize={settings.fontSize}
                    fontBold={settings.fontBold}
                    subFontSize={settings.subFontSize}
                    subFontFamily={settings.subFontFamily}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── 파티클 + 눈꽃 레이어 ── */}
      {settings.particleRefresh && !showSettings && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
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
              transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
            />
          ))}
          {snowflakes.map((s) => (
            <motion.div
              key={`snow-${s.id}`}
              className="absolute select-none"
              style={{ left: `${s.startX}%`, fontSize: s.fontSize, opacity: s.opacity, color: 'white', lineHeight: 1 }}
              animate={{
                y: ['-5vh', '108vh'],
                x: [0, s.drift * 10, s.drift * -5, s.drift * 15, 0],
                rotate: [s.rotation, s.rotation + 180, s.rotation + 360],
              }}
              transition={{
                duration: s.duration, delay: s.delay, repeat: Infinity, ease: 'linear',
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