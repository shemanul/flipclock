import { useState, useRef, useEffect } from 'react';
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
    subFontSize: 20,,
    subFontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    screenSaver: false,
    particleRefresh: false,
    keepScreenOn: false,
  });

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndX = useRef(0);
  const touchEndY = useRef(0);
  const isSwiping = useRef(false);

  // ── WakeLock: 획득 / 해제 + 탭 복귀 시 자동 재획득 ──────────────────
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

  // 탭을 숨겼다 다시 열면 WakeLock이 자동 해제되므로 재획득
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

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = touchStartX.current;
    touchEndY.current = touchStartY.current;
    isSwiping.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;

    const deltaX = Math.abs(touchEndX.current - touchStartX.current);
    const deltaY = Math.abs(touchEndY.current - touchStartY.current);

    if (deltaX > 10 || deltaY > 10) {
      isSwiping.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping.current) {
      touchEndX.current = 0;
      touchEndY.current = 0;
      return;
    }

    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;
    const threshold = 100;

    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > threshold) {
      if (deltaY < 0) {
        setShowSettings(true);
      } else {
        setShowSettings(false);
      }
    } else if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0 && currentScreen === 'clock') {
        setCurrentScreen('timer');
      } else if (deltaX > 0 && currentScreen === 'timer') {
        setCurrentScreen('clock');
      }
    }

    touchEndX.current = 0;
    touchEndY.current = 0;
    isSwiping.current = false;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    touchStartX.current = e.clientX;
    touchStartY.current = e.clientY;
    touchEndX.current = touchStartX.current;
    touchEndY.current = touchStartY.current;
    isSwiping.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      touchEndX.current = e.clientX;
      touchEndY.current = e.clientY;

      const deltaX = Math.abs(touchEndX.current - touchStartX.current);
      const deltaY = Math.abs(touchEndY.current - touchStartY.current);

      if (deltaX > 10 || deltaY > 10) {
        isSwiping.current = true;
      }
    }
  };

  const handleMouseUp = () => {
    if (!isSwiping.current) {
      touchEndX.current = 0;
      touchEndY.current = 0;
      return;
    }

    const deltaX = touchEndX.current - touchStartX.current;
    const deltaY = touchEndY.current - touchStartY.current;
    const threshold = 100;

    if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > threshold) {
      if (deltaY < 0) {
        setShowSettings(true);
      } else {
        setShowSettings(false);
      }
    } else if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0 && currentScreen === 'clock') {
        setCurrentScreen('timer');
      } else if (deltaX > 0 && currentScreen === 'timer') {
        setCurrentScreen('clock');
      }
    }

    touchEndX.current = 0;
    touchEndY.current = 0;
    isSwiping.current = false;
  };

  return (
    <div
      className="size-full overflow-hidden select-none relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
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
                onToggleAmPm={() => setShowAmPm(!showAmPm)}
                onToggleSeconds={() => setShowSeconds(!showSeconds)}
              />
            ) : (
              <TimerScreen
                tileColor={settings.tileColor}
                textColor={settings.textColor}
                backgroundColor={settings.backgroundColor}
                backgroundImage={settings.backgroundImage}
                fontFamily={settings.fontFamily}
                subFontSize={settings.subFontSize}
                subFontFamily={settings.subFontFamily}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {settings.particleRefresh && !showSettings && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white/30 rounded-full"
              animate={{
                x: [
                  Math.random() * window.innerWidth,
                  Math.random() * window.innerWidth,
                ],
                y: [
                  Math.random() * window.innerHeight,
                  Math.random() * window.innerHeight,
                ],
              }}
              transition={{
                duration: Math.random() * 10 + 5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
