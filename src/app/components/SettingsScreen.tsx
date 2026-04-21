import { X, Upload, Trash2, Monitor, Zap, Sun, ChevronUp, ChevronDown, Save } from 'lucide-react';
import { useRef, useState, useCallback } from 'react';

// ─── 타입 ─────────────────────────────────────────────────────

export interface Settings {
  tileColor: string;
  textColor: string;
  backgroundColor: string;
  backgroundImage: string;
  fontFamily: string;
  fontSize: number;
  fontBold: boolean;
  subFontFamily: string;
  subFontSize: number;
  screenSaver: boolean;
  particleRefresh: boolean;
  keepScreenOn: boolean;
  cherryBlossom: boolean;
}

interface SettingsScreenProps {
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

// ─── 상수 ─────────────────────────────────────────────────────

const DEFAULT_THEMES = [
  { name: '기본',   tileColor: '#0f4c5c', textColor: '#e5e5e5', backgroundColor: '#fb9189' },
  { name: '다크',   tileColor: '#1a1a1a', textColor: '#ffffff', backgroundColor: '#2d2d2d' },
  { name: '블루',   tileColor: '#1e3a8a', textColor: '#dbeafe', backgroundColor: '#3b82f6' },
  { name: '그린',   tileColor: '#065f46', textColor: '#d1fae5', backgroundColor: '#10b981' },
  { name: '퍼플',   tileColor: '#5b21b6', textColor: '#ede9fe', backgroundColor: '#a855f7' },
  { name: '오렌지', tileColor: '#9a3412', textColor: '#fed7aa', backgroundColor: '#f97316' },
];

const fonts = [
  { name: 'System UI',         value: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' },
  { name: 'Arial',             value: 'Arial, Helvetica, sans-serif' },
  { name: 'Helvetica',         value: 'Helvetica, Arial, sans-serif' },
  { name: 'Times New Roman',   value: 'Times New Roman, Times, serif' },
  { name: 'Georgia',           value: 'Georgia, serif' },
  { name: 'Courier New',       value: 'Courier New, Courier, monospace' },
  { name: 'Monaco',            value: 'Monaco, Consolas, monospace' },
  { name: 'Verdana',           value: 'Verdana, Geneva, sans-serif' },
  { name: 'Trebuchet MS',      value: 'Trebuchet MS, sans-serif' },
  { name: 'Impact',            value: 'Impact, Charcoal, sans-serif' },
  { name: 'Comic Sans MS',     value: 'Comic Sans MS, cursive' },
  { name: 'Palatino',          value: 'Palatino Linotype, Book Antiqua, Palatino, serif' },
  { name: 'Garamond',          value: 'Garamond, serif' },
  { name: 'Bookman',           value: 'Bookman Old Style, serif' },
  { name: 'Tahoma',            value: 'Tahoma, Geneva, sans-serif' },
  { name: 'Lucida',            value: 'Lucida Sans Unicode, Lucida Grande, sans-serif' },
  { name: 'Monospace',         value: 'ui-monospace, monospace' },
  { name: 'Serif',             value: 'ui-serif, serif' },
  { name: 'Sans-serif',        value: 'ui-sans-serif, sans-serif' },
  { name: 'Rounded',           value: 'ui-rounded, sans-serif' },
  // ── Google Fonts ──
  { name: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', sans-serif" },
  { name: 'Great Vibes',       value: "'Great Vibes', cursive" },
  { name: 'Princess Sofia',    value: "'Princess Sofia', cursive" },
  { name: 'Pinyon Script',     value: "'Pinyon Script', cursive" },
  { name: 'Parisienne',        value: "'Parisienne', cursive" },
];

// ─── 유틸: HEX ↔ HSL 변환 ────────────────────────────────────

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  const hh = h / 360, ss = s / 100, ll = l / 100;
  let r: number, g: number, b: number;
  if (ss === 0) { r = g = b = ll; }
  else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = ll < 0.5 ? ll * (1 + ss) : ll + ss - ll * ss;
    const p = 2 * ll - q;
    r = hue2rgb(p, q, hh + 1/3);
    g = hue2rgb(p, q, hh);
    b = hue2rgb(p, q, hh - 1/3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────

function Toggle({ checked, onChange, accentColor }: {
  checked: boolean; onChange: () => void; accentColor?: string;
}) {
  return (
    <button
      onClick={onChange}
      className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
      style={{ backgroundColor: checked ? (accentColor ?? '#3b82f6') : '#d1d5db' }}
    >
      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">{children}</span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

function FontPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const idx = fonts.findIndex((f) => f.value === value);
  const current = idx >= 0 ? fonts[idx] : fonts[0];
  const prev = () => onChange(fonts[(idx - 1 + fonts.length) % fonts.length].value);
  const next = () => onChange(fonts[(idx + 1) % fonts.length].value);
  return (
    <div className="flex items-center gap-1 w-full">
      <button onClick={prev} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors">
        <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
      </button>
      <div className="flex-1 text-center text-xs py-1.5 px-2 rounded-lg border border-gray-200 bg-white text-gray-700 truncate" style={{ fontFamily: value }}>
        {current.name}
      </div>
      <button onClick={next} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors">
        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
      </button>
    </div>
  );
}

function SizeInput({ value, onChange, min }: { value: number; onChange: (v: number) => void; min: number }) {
  const clamp = (n: number) => Math.max(min, n);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPress = (delta: number) => {
    onChange(clamp((value || min) + delta));
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        onChange((prev: number) => clamp((prev || min) + delta));
      }, 80);
    }, 400);
  };
  const stopPress = () => {
    if (timeoutRef.current)  clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };
  return (
    <div className="flex items-center gap-1">
      <button onPointerDown={() => startPress(-1)} onPointerUp={stopPress} onPointerLeave={stopPress}
        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center flex-shrink-0 select-none">−</button>
      <div className="relative w-16">
        <input type="number" min={min} value={value || min}
          onChange={(e) => { const n = parseInt(e.target.value, 10); if (!isNaN(n)) onChange(clamp(n)); }}
          className="w-full text-center text-xs font-mono font-semibold border border-gray-200 rounded-lg py-1.5 bg-white focus:outline-none focus:border-blue-400 text-gray-700 pr-5" />
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 pointer-events-none">px</span>
      </div>
      <button onPointerDown={() => startPress(1)} onPointerUp={stopPress} onPointerLeave={stopPress}
        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center flex-shrink-0 select-none">+</button>
    </div>
  );
}

// ─── HSL 커스텀 색상 피커 ─────────────────────────────────────

function HslColorPicker({ color, onChange }: { color: string; onChange: (hex: string) => void }) {
  const [hsl, setHsl] = useState<[number, number, number]>(() => {
    try { return hexToHsl(color); } catch { return [0, 0, 50]; }
  });
  const [hexInput, setHexInput] = useState(color.toUpperCase());

  // color prop이 바뀌면 동기화
  const prevColor = useRef(color);
  if (prevColor.current !== color) {
    prevColor.current = color;
    try {
      const newHsl = hexToHsl(color);
      setHsl(newHsl);
      setHexInput(color.toUpperCase());
    } catch {}
  }

  const apply = (h: number, s: number, l: number) => {
    const hex = hslToHex(h, s, l);
    setHexInput(hex.toUpperCase());
    onChange(hex);
  };

  const previewColor = hslToHex(...hsl);

  return (
    <div className="mt-2 p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
      {/* 미리보기 */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg border border-gray-200 flex-shrink-0" style={{ backgroundColor: previewColor }} />
        <input
          type="text"
          value={hexInput}
          maxLength={7}
          onChange={(e) => {
            const v = e.target.value.toUpperCase();
            setHexInput(v);
            const hex = v.startsWith('#') ? v : `#${v}`;
            if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
              try {
                const newHsl = hexToHsl(hex);
                setHsl(newHsl);
                onChange(hex);
              } catch {}
            }
          }}
          className="flex-1 text-xs font-mono border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-blue-400 text-gray-700 uppercase"
          placeholder="#000000"
          spellCheck={false}
        />
      </div>

      {/* 색조 슬라이더 */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-gray-500">색조</span>
          <span className="text-[10px] font-mono text-gray-400">{hsl[0]}°</span>
        </div>
        <div className="relative h-4 rounded-full overflow-hidden"
          style={{ background: 'linear-gradient(to right, #f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' }}>
          <input type="range" min={0} max={360} value={hsl[0]}
            onChange={(e) => { const h = Number(e.target.value); setHsl([h, hsl[1], hsl[2]]); apply(h, hsl[1], hsl[2]); }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <div className="absolute top-0 bottom-0 w-3 -translate-x-1/2 border-2 border-white rounded-full shadow pointer-events-none"
            style={{ left: `${(hsl[0] / 360) * 100}%`, backgroundColor: `hsl(${hsl[0]},100%,50%)` }} />
        </div>
      </div>

      {/* 채도 슬라이더 */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-gray-500">채도</span>
          <span className="text-[10px] font-mono text-gray-400">{hsl[1]}%</span>
        </div>
        <div className="relative h-4 rounded-full overflow-hidden"
          style={{ background: `linear-gradient(to right, hsl(${hsl[0]},0%,${hsl[2]}%), hsl(${hsl[0]},100%,${hsl[2]}%))` }}>
          <input type="range" min={0} max={100} value={hsl[1]}
            onChange={(e) => { const s = Number(e.target.value); setHsl([hsl[0], s, hsl[2]]); apply(hsl[0], s, hsl[2]); }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <div className="absolute top-0 bottom-0 w-3 -translate-x-1/2 border-2 border-white rounded-full shadow pointer-events-none"
            style={{ left: `${hsl[1]}%`, backgroundColor: `hsl(${hsl[0]},${hsl[1]}%,${hsl[2]}%)` }} />
        </div>
      </div>

      {/* 밝기 슬라이더 */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-gray-500">밝기</span>
          <span className="text-[10px] font-mono text-gray-400">{hsl[2]}%</span>
        </div>
        <div className="relative h-4 rounded-full overflow-hidden"
          style={{ background: `linear-gradient(to right, #000, hsl(${hsl[0]},${hsl[1]}%,50%), #fff)` }}>
          <input type="range" min={0} max={100} value={hsl[2]}
            onChange={(e) => { const l = Number(e.target.value); setHsl([hsl[0], hsl[1], l]); apply(hsl[0], hsl[1], l); }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          <div className="absolute top-0 bottom-0 w-3 -translate-x-1/2 border-2 border-white rounded-full shadow pointer-events-none"
            style={{ left: `${hsl[2]}%`, backgroundColor: `hsl(${hsl[0]},${hsl[1]}%,${hsl[2]}%)` }} />
        </div>
      </div>
    </div>
  );
}

// ─── 색상 항목 (라벨 + 칩 클릭 → 피커 펼침) ─────────────────

function ColorRow({ label, color, onChange }: {
  label: string; color: string; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-500 w-12 flex-shrink-0">{label}</span>
        <button
          onClick={() => setOpen((o) => !o)}
          className="w-8 h-8 rounded-lg border-2 flex-shrink-0 transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: color, borderColor: open ? '#3b82f6' : '#e5e7eb' }}
        />
        <span className="text-[10px] font-mono text-gray-400">{color.toUpperCase()}</span>
      </div>
      {open && <HslColorPicker color={color} onChange={onChange} />}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

export function SettingsScreen({ onClose, settings, onSettingsChange }: SettingsScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 사용자 저장 테마 — localStorage에 영구 저장
  const STORAGE_KEY = 'flipclock-user-themes';
  const [userThemes, setUserThemes] = useState<typeof DEFAULT_THEMES>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const persistThemes = (themes: typeof DEFAULT_THEMES) => {
    setUserThemes(themes);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(themes)); } catch {}
  };

  const update = (patch: Partial<Settings>) => onSettingsChange({ ...settings, ...patch });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update({ backgroundImage: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  // 현재 색상을 사용자 테마로 저장
  const saveTheme = () => {
    const newTheme = {
      name: `저장${userThemes.length + 1}`,
      tileColor: settings.tileColor,
      textColor: settings.textColor,
      backgroundColor: settings.backgroundColor,
    };
    persistThemes([newTheme, ...userThemes].slice(0, 6));
  };

  const deleteUserTheme = (idx: number) => {
    persistThemes(userThemes.filter((_, i) => i !== idx));
  };

  const now = new Date();
  const h   = String(now.getHours() % 12 || 12).padStart(2, '0');
  const m   = String(now.getMinutes()).padStart(2, '0');
  const sec = String(now.getSeconds()).padStart(2, '0');
  const isPM = now.getHours() >= 12;
  const year  = String(now.getFullYear()).slice(2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day   = String(now.getDate()).padStart(2, '0');
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const weekday = weekdays[now.getDay()];

  const PREVIEW_SCALE = 72 / Math.max(settings.fontSize, 1);
  const previewMainSize = Math.min(settings.fontSize * PREVIEW_SCALE, 28);
  const previewSubSize  = Math.min(settings.subFontSize * PREVIEW_SCALE, 11);

  const allThemes = [...DEFAULT_THEMES, ...userThemes];

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">

      {/* 헤더 */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
        <h2 className="text-sm font-bold text-gray-800 tracking-tight">설정</h2>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* 본문: 좌우 분할 */}
      <div className="flex-1 flex overflow-hidden">

        {/* 왼쪽: 미리보기 */}
        <div className="flex-shrink-0 w-[44%] flex flex-col items-center justify-start gap-3 p-3 border-r border-gray-100 bg-white overflow-hidden">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest self-start">미리보기</p>

          <div className="w-full rounded-2xl overflow-hidden shadow-md flex items-center justify-center gap-1.5 p-2"
            style={{
              backgroundColor: settings.backgroundColor,
              backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : undefined,
              backgroundSize: 'cover', backgroundPosition: 'center', aspectRatio: '2 / 1',
            }}>
            {/* 시 타일 */}
            <div className="relative rounded-xl shadow overflow-hidden flex-shrink-0"
              style={{ aspectRatio: '1/1', height: '78%', backgroundColor: settings.tileColor }}>
              <div className="absolute top-0 left-0 right-0 text-center pt-1 px-1 truncate"
                style={{ color: settings.textColor, fontFamily: settings.subFontFamily, fontSize: `${previewSubSize}px`, opacity: 0.85 }}>
                {`${year}.${month}.${day}.`}
              </div>
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ color: settings.textColor, fontFamily: settings.fontFamily, fontSize: `${previewMainSize}px`, fontWeight: settings.fontBold ? 700 : 400 }}>
                {h}
              </div>
              <div className="absolute bottom-0 left-0 px-1 pb-1"
                style={{ color: settings.textColor, fontFamily: settings.subFontFamily, fontSize: `${previewSubSize}px`, opacity: 0.85 }}>
                {isPM ? 'PM' : 'AM'}
              </div>
            </div>

            {/* 분 타일 */}
            <div className="relative rounded-xl shadow overflow-hidden flex-shrink-0"
              style={{ aspectRatio: '1/1', height: '78%', backgroundColor: settings.tileColor }}>
              <div className="absolute top-0 left-0 right-0 text-center pt-1 px-1 truncate"
                style={{ color: settings.textColor, fontFamily: settings.subFontFamily, fontSize: `${previewSubSize}px`, opacity: 0.85 }}>
                {weekday}
              </div>
              <div className="absolute inset-0 flex items-center justify-center"
                style={{ color: settings.textColor, fontFamily: settings.fontFamily, fontSize: `${previewMainSize}px`, fontWeight: settings.fontBold ? 700 : 400 }}>
                {m}
              </div>
              <div className="absolute bottom-0 right-0 px-1 pb-1"
                style={{ color: settings.textColor, fontFamily: settings.subFontFamily, fontSize: `${previewSubSize}px`, opacity: 0.85 }}>
                {sec}
              </div>
            </div>
          </div>

          {/* 요약 */}
          <div className="w-full space-y-1.5 text-[10px] text-gray-500">
            {[
              { label: '타일', color: settings.tileColor },
              { label: '글자', color: settings.textColor },
              { label: '배경', color: settings.backgroundColor },
            ].map(({ label, color }) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-400">{label}</span>
                <span className="font-mono flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded-sm border border-gray-200" style={{ backgroundColor: color }} />
                  {color}
                </span>
              </div>
            ))}
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between gap-1">
              <span className="text-gray-400 flex-shrink-0">메인 폰트</span>
              <span className="truncate text-right" style={{ fontFamily: settings.fontFamily }}>
                {fonts.find(f => f.value === settings.fontFamily)?.name ?? '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">메인 크기</span>
              <span className="font-mono">{settings.fontSize}px</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between gap-1">
              <span className="text-gray-400 flex-shrink-0">부가 폰트</span>
              <span className="truncate text-right" style={{ fontFamily: settings.subFontFamily }}>
                {fonts.find(f => f.value === settings.subFontFamily)?.name ?? '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">부가 크기</span>
              <span className="font-mono">{settings.subFontSize}px</span>
            </div>
          </div>
        </div>

        {/* 오른쪽: 설정 스크롤 */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 min-w-0">

          {/* 테마 & 색상 */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 space-y-3">
            <SectionTitle>테마 & 색상</SectionTitle>

            {/* 프리셋 그리드 */}
            <div className="grid grid-cols-3 gap-1.5">
              {DEFAULT_THEMES.map((theme) => {
                const active = settings.tileColor === theme.tileColor && settings.backgroundColor === theme.backgroundColor;
                return (
                  <button key={theme.name}
                    onClick={() => update({ tileColor: theme.tileColor, textColor: theme.textColor, backgroundColor: theme.backgroundColor })}
                    className="rounded-xl border-2 overflow-hidden transition-all hover:scale-105 active:scale-95"
                    style={{ backgroundColor: theme.backgroundColor, borderColor: active ? theme.tileColor : 'transparent' }}>
                    <div className="h-7 flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: theme.tileColor, color: theme.textColor }}>12</div>
                    <div className="py-0.5 text-[10px] text-center font-medium" style={{ color: theme.tileColor }}>{theme.name}</div>
                  </button>
                );
              })}
            </div>

            {/* 사용자 저장 테마 */}
            {userThemes.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-400 mb-1.5">저장된 테마</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {userThemes.map((theme, idx) => {
                    const active = settings.tileColor === theme.tileColor && settings.backgroundColor === theme.backgroundColor;
                    return (
                      <div key={idx} className="relative">
                        <button
                          onClick={() => update({ tileColor: theme.tileColor, textColor: theme.textColor, backgroundColor: theme.backgroundColor })}
                          className="w-full rounded-xl border-2 overflow-hidden transition-all hover:scale-105 active:scale-95"
                          style={{ backgroundColor: theme.backgroundColor, borderColor: active ? theme.tileColor : 'transparent' }}>
                          <div className="h-7 flex items-center justify-center text-xs font-bold"
                            style={{ backgroundColor: theme.tileColor, color: theme.textColor }}>12</div>
                          <div className="py-0.5 text-[10px] text-center font-medium" style={{ color: theme.tileColor }}>{theme.name}</div>
                        </button>
                        {/* 삭제 버튼 */}
                        <button
                          onClick={() => deleteUserTheme(idx)}
                          className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-400 text-white text-[9px] flex items-center justify-center shadow hover:bg-red-500 transition-colors">
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 저장 버튼 */}
            <button
              onClick={saveTheme}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors">
              <Save className="w-3.5 h-3.5" />
              현재 색상을 테마로 저장
            </button>

            {/* 색상 직접 지정 */}
            <div className="space-y-2.5">
              <p className="text-[10px] text-gray-400">색상 직접 지정</p>
              <ColorRow label="타일 배경" color={settings.tileColor}       onChange={(v) => update({ tileColor: v })} />
              <ColorRow label="타일 글자" color={settings.textColor}       onChange={(v) => update({ textColor: v })} />
              <ColorRow label="배경색"   color={settings.backgroundColor} onChange={(v) => update({ backgroundColor: v })} />
            </div>

            {/* 배경 이미지 */}
            <div>
              <p className="text-[10px] text-gray-400 mb-1.5">배경 이미지</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <div className="flex gap-1.5">
                <button onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 text-xs text-gray-500 hover:text-blue-600 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  {settings.backgroundImage ? '이미지 변경' : '이미지 업로드'}
                </button>
                {settings.backgroundImage && (
                  <button onClick={() => update({ backgroundImage: '' })}
                    className="px-3 py-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 글씨체 & 크기 */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 space-y-3">
            <SectionTitle>글씨체 & 크기</SectionTitle>
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-500">메인 글자 (시계 숫자)</p>
              <FontPicker value={settings.fontFamily} onChange={(v) => update({ fontFamily: v })} />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">글자 크기</span>
                <SizeInput value={settings.fontSize} onChange={(v) => update({ fontSize: v })} min={24} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">굵게 (Bold)</span>
                <button
                  onClick={() => update({ fontBold: !settings.fontBold })}
                  className={`w-8 h-8 rounded-lg text-sm font-bold border transition-colors ${
                    settings.fontBold
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-400 border-gray-200'
                  }`}
                >
                  B
                </button>
              </div>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-500">부가 정보 (날짜 · AM/PM)</p>
              <FontPicker value={settings.subFontFamily} onChange={(v) => update({ subFontFamily: v })} />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">글자 크기</span>
                <SizeInput value={settings.subFontSize} onChange={(v) => update({ subFontSize: v })} min={8} />
              </div>
            </div>
          </div>

          {/* 화면 설정 */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 space-y-2.5">
            <SectionTitle>화면 설정</SectionTitle>

            {/* 화면 보호 */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
              <div className="mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: settings.screenSaver ? '#dbeafe' : '#f3f4f6' }}>
                <Monitor className="w-4 h-4" style={{ color: settings.screenSaver ? '#2563eb' : '#9ca3af' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-gray-800">화면 보호</div>
                <div className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                  절전 모드 허용 — 번인 방지
                  {settings.screenSaver && <span className="block mt-0.5 text-blue-500 font-medium">✔ WakeLock 해제됨</span>}
                </div>
              </div>
              <Toggle checked={settings.screenSaver} onChange={() => {
                const next = !settings.screenSaver;
                update({ screenSaver: next, keepScreenOn: next ? false : settings.keepScreenOn });
              }} />
            </div>

            {/* 입자 픽셀 새로 고침 */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
              <div className="mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: settings.particleRefresh ? '#fef3c7' : '#f3f4f6' }}>
                <Zap className="w-4 h-4" style={{ color: settings.particleRefresh ? '#d97706' : '#9ca3af' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-gray-800">입자 픽셀 새로 고침</div>
                <div className="text-[10px] text-gray-500 mt-0.5 leading-snug">파티클로 OLED 픽셀 주기적 갱신</div>
              </div>
              <Toggle checked={settings.particleRefresh} onChange={() => update({ particleRefresh: !settings.particleRefresh })} accentColor="#d97706" />
            </div>

            {/* 화면 켜짐 유지 */}
            <div className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${settings.screenSaver ? 'bg-gray-100 border-gray-100 opacity-40 pointer-events-none' : 'bg-gray-50 border-gray-100'}`}>
              <div className="mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: settings.keepScreenOn ? '#dcfce7' : '#f3f4f6' }}>
                <Sun className="w-4 h-4" style={{ color: settings.keepScreenOn ? '#16a34a' : '#9ca3af' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-gray-800">화면 켜짐 유지</div>
                <div className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                  WakeLock — 화면 항상 켜짐
                  {settings.screenSaver && <span className="block mt-0.5 text-orange-400 font-medium">⚠ 화면 보호 ON 시 비활성</span>}
                  {settings.keepScreenOn && !settings.screenSaver && <span className="block mt-0.5 text-green-600 font-medium">✔ WakeLock 활성</span>}
                </div>
              </div>
              <Toggle checked={settings.keepScreenOn} onChange={() => update({ keepScreenOn: !settings.keepScreenOn })} accentColor="#16a34a" />
            </div>

            {/* 벚꽃 배경 */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
              <div className="mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                style={{ backgroundColor: settings.cherryBlossom ? '#fce7f3' : '#f3f4f6' }}>🌸</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-gray-800">벚꽃 배경</div>
                <div className="text-[10px] text-gray-500 mt-0.5 leading-snug">봄날 벚꽃잎이 휘날리는 애니메이션 배경</div>
              </div>
              <Toggle checked={settings.cherryBlossom} onChange={() => update({ cherryBlossom: !settings.cherryBlossom })} accentColor="#ec4899" />
            </div>

            {/* 권장 조합 */}
            <div className="p-2.5 rounded-xl bg-blue-50 text-[10px] text-blue-700 leading-relaxed">
              <strong>💡 권장 조합</strong>
              <ul className="mt-1 space-y-0.5 list-disc list-inside">
                <li>충전 중 상시 표시 → <b>화면 켜짐 유지</b> ON</li>
                <li>장시간 자리 비움 → <b>화면 보호</b> ON</li>
                <li>OLED 기기 → <b>입자 새로 고침</b> ON 권장</li>
              </ul>
            </div>
          </div>

          <div className="h-2" />
        </div>
      </div>
    </div>
  );
}
