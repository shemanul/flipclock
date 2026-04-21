import { X, Upload, Trash2, Monitor, Zap, Sun, ChevronUp, ChevronDown } from 'lucide-react';
import { useRef, useState } from 'react';

// ─── 타입 ─────────────────────────────────────────────────────

export interface Settings {
  tileColor: string;
  textColor: string;
  backgroundColor: string;
  backgroundImage: string;
  // 메인 글자 (시계 숫자)
  fontFamily: string;
  fontSize: number;           // 신규 — 기본값 예: 64
  // 부가 정보 (날짜 · AM/PM · 분/초 라벨)
  subFontFamily: string;
  subFontSize: number;        // string → number 로 통일
  // 화면 설정
  screenSaver: boolean;
  particleRefresh: boolean;
  keepScreenOn: boolean;
  cherryBlossom: boolean;  // 벚꽃 배경
}

interface SettingsScreenProps {
  onClose: () => void;
  settings: Settings;
  onSettingsChange: (settings: Settings) => void;
}

// ─── 상수 ─────────────────────────────────────────────────────

const themes = [
  { name: '기본',   tileColor: '#0f4c5c', textColor: '#e5e5e5', backgroundColor: '#fb9189' },
  { name: '다크',   tileColor: '#1a1a1a', textColor: '#ffffff', backgroundColor: '#2d2d2d' },
  { name: '블루',   tileColor: '#1e3a8a', textColor: '#dbeafe', backgroundColor: '#3b82f6' },
  { name: '그린',   tileColor: '#065f46', textColor: '#d1fae5', backgroundColor: '#10b981' },
  { name: '퍼플',   tileColor: '#5b21b6', textColor: '#ede9fe', backgroundColor: '#a855f7' },
  { name: '오렌지', tileColor: '#9a3412', textColor: '#fed7aa', backgroundColor: '#f97316' },
];

const fonts = [
  { name: 'System UI',       value: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif' },
  { name: 'Arial',           value: 'Arial, Helvetica, sans-serif' },
  { name: 'Helvetica',       value: 'Helvetica, Arial, sans-serif' },
  { name: 'Times New Roman', value: 'Times New Roman, Times, serif' },
  { name: 'Georgia',         value: 'Georgia, serif' },
  { name: 'Courier New',     value: 'Courier New, Courier, monospace' },
  { name: 'Monaco',          value: 'Monaco, Consolas, monospace' },
  { name: 'Verdana',         value: 'Verdana, Geneva, sans-serif' },
  { name: 'Trebuchet MS',    value: 'Trebuchet MS, sans-serif' },
  { name: 'Impact',          value: 'Impact, Charcoal, sans-serif' },
  { name: 'Comic Sans MS',   value: 'Comic Sans MS, cursive' },
  { name: 'Palatino',        value: 'Palatino Linotype, Book Antiqua, Palatino, serif' },
  { name: 'Garamond',        value: 'Garamond, serif' },
  { name: 'Bookman',         value: 'Bookman Old Style, serif' },
  { name: 'Tahoma',          value: 'Tahoma, Geneva, sans-serif' },
  { name: 'Lucida',          value: 'Lucida Sans Unicode, Lucida Grande, sans-serif' },
  { name: 'Monospace',       value: 'ui-monospace, monospace' },
  { name: 'Serif',           value: 'ui-serif, serif' },
  { name: 'Sans-serif',      value: 'ui-sans-serif, sans-serif' },
  { name: 'Rounded',         value: 'ui-rounded, sans-serif' },
];

// ─── 서브 컴포넌트 ────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  accentColor,
}: {
  checked: boolean;
  onChange: () => void;
  accentColor?: string;
}) {
  return (
    <button
      onClick={onChange}
      className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
      style={{ backgroundColor: checked ? (accentColor ?? '#3b82f6') : '#d1d5db' }}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2.5">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  );
}

/** 화살표 ▲▼ 로 폰트 즉시 변경 */
function FontPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const idx = fonts.findIndex((f) => f.value === value);
  const current = idx >= 0 ? fonts[idx] : fonts[0];

  const prev = () => onChange(fonts[(idx - 1 + fonts.length) % fonts.length].value);
  const next = () => onChange(fonts[(idx + 1) % fonts.length].value);

  return (
    <div className="flex items-center gap-1 w-full">
      <button
        onClick={prev}
        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors"
      >
        <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
      </button>
      <div
        className="flex-1 text-center text-xs py-1.5 px-2 rounded-lg border border-gray-200 bg-white text-gray-700 truncate"
        style={{ fontFamily: value }}
      >
        {current.name}
      </div>
      <button
        onClick={next}
        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center flex-shrink-0 transition-colors"
      >
        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
      </button>
    </div>
  );
}

/** 숫자 크기 입력 — 길게 누르면 계속 증감 */
function SizeInput({
  value,
  onChange,
  min,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
}) {
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
      <button
        onPointerDown={() => startPress(-1)}
        onPointerUp={stopPress}
        onPointerLeave={stopPress}
        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center flex-shrink-0 transition-colors select-none"
      >−</button>
      <div className="relative w-16">
        <input
          type="number"
          min={min}
          value={value || min}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n)) onChange(clamp(n));
          }}
          className="w-full text-center text-xs font-mono font-semibold border border-gray-200 rounded-lg py-1.5 bg-white focus:outline-none focus:border-blue-400 text-gray-700 pr-5"
        />
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-gray-400 pointer-events-none">px</span>
      </div>
      <button
        onPointerDown={() => startPress(1)}
        onPointerUp={stopPress}
        onPointerLeave={stopPress}
        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center flex-shrink-0 transition-colors select-none"
      >+</button>
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

export function SettingsScreen({ onClose, settings, onSettingsChange }: SettingsScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 색상 이력 — 최근 10개
  const [colorHistory, setColorHistory] = useState<string[]>([]);

  const update = (patch: Partial<Settings>) =>
    onSettingsChange({ ...settings, ...patch });

  const updateColor = (key: keyof Settings, value: string) => {
    update({ [key]: value });
    setColorHistory((prev) => {
      const filtered = prev.filter((c) => c !== value);
      return [value, ...filtered].slice(0, 10);
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => update({ backgroundImage: ev.target?.result as string });
    reader.readAsDataURL(file);
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

  // 미리보기 내 폰트 크기 — 타일 크기(72px)에 맞게 비율 축소
  const PREVIEW_SCALE = 72 / Math.max(settings.fontSize, 1);
  const previewMainSize  = Math.min(settings.fontSize  * PREVIEW_SCALE, 28);
  const previewSubSize   = Math.min(settings.subFontSize * PREVIEW_SCALE, 11);

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">

      {/* ── 헤더 ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm">
        <h2 className="text-sm font-bold text-gray-800 tracking-tight">설정</h2>
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100 transition-colors">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* ── 본문: 좌우 분할 ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ════ 왼쪽: 미리보기 고정 ════ */}
        <div className="flex-shrink-0 w-[44%] flex flex-col items-center justify-start gap-3 p-3 border-r border-gray-100 bg-white overflow-hidden">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest self-start">미리보기</p>

          {/* 시계 미리보기 — ClockScreen 구조와 동일 */}
          <div
            className="w-full rounded-2xl overflow-hidden shadow-md flex items-center justify-center gap-1.5 p-2"
            style={{
              backgroundColor: settings.backgroundColor,
              backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              aspectRatio: '2 / 1',
            }}
          >
            {/* 시 타일: 상단 년.월.일 / 하단 AM/PM */}
            <div
              className="relative rounded-xl shadow overflow-hidden flex-shrink-0"
              style={{
                aspectRatio: '1 / 1',
                height: '78%',
                backgroundColor: settings.tileColor,
              }}
            >
              {/* 상단: 년.월.일 */}
              <div
                className="absolute top-0 left-0 right-0 text-center pt-1 px-1 truncate"
                style={{
                  color: settings.textColor,
                  fontFamily: settings.subFontFamily,
                  fontSize: `${previewSubSize}px`,
                  opacity: 0.85,
                }}
              >
                {`${year}.${month}.${day}.`}
              </div>
              {/* 중앙: 시 */}
              <div
                className="absolute inset-0 flex items-center justify-center font-bold"
                style={{
                  color: settings.textColor,
                  fontFamily: settings.fontFamily,
                  fontSize: `${previewMainSize}px`,
                }}
              >
                {h}
              </div>
              {/* 하단: AM/PM */}
              <div
                className="absolute bottom-0 left-0 px-1 pb-1"
                style={{
                  color: settings.textColor,
                  fontFamily: settings.subFontFamily,
                  fontSize: `${previewSubSize}px`,
                  opacity: 0.85,
                }}
              >
                {isPM ? 'PM' : 'AM'}
              </div>
            </div>

            {/* 분 타일: 상단 요일 / 하단 초 */}
            <div
              className="relative rounded-xl shadow overflow-hidden flex-shrink-0"
              style={{
                aspectRatio: '1 / 1',
                height: '78%',
                backgroundColor: settings.tileColor,
              }}
            >
              {/* 상단: 요일 */}
              <div
                className="absolute top-0 left-0 right-0 text-center pt-1 px-1 truncate"
                style={{
                  color: settings.textColor,
                  fontFamily: settings.subFontFamily,
                  fontSize: `${previewSubSize}px`,
                  opacity: 0.85,
                }}
              >
                {weekday}
              </div>
              {/* 중앙: 분 */}
              <div
                className="absolute inset-0 flex items-center justify-center font-bold"
                style={{
                  color: settings.textColor,
                  fontFamily: settings.fontFamily,
                  fontSize: `${previewMainSize}px`,
                }}
              >
                {m}
              </div>
              {/* 하단: 초 */}
              <div
                className="absolute bottom-0 right-0 px-1 pb-1"
                style={{
                  color: settings.textColor,
                  fontFamily: settings.subFontFamily,
                  fontSize: `${previewSubSize}px`,
                  opacity: 0.85,
                }}
              >
                {sec}
              </div>
            </div>
          </div>

          {/* 현재 설정 요약 */}
          <div className="w-full space-y-1.5 text-[10px] text-gray-500">
            <div className="flex justify-between">
              <span className="text-gray-400">타일</span>
              <span className="font-mono flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm border border-gray-200" style={{ backgroundColor: settings.tileColor }} />
                {settings.tileColor}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">글자</span>
              <span className="font-mono flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm border border-gray-200" style={{ backgroundColor: settings.textColor }} />
                {settings.textColor}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">배경</span>
              <span className="font-mono flex items-center gap-1">
                <span className="inline-block w-3 h-3 rounded-sm border border-gray-200" style={{ backgroundColor: settings.backgroundColor }} />
                {settings.backgroundColor}
              </span>
            </div>
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

        {/* ════ 오른쪽: 설정 스크롤 ════ */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 min-w-0">

          {/* ── 섹션: 테마 & 색상 ── */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 space-y-3">
            <SectionTitle>테마 & 색상</SectionTitle>

            {/* 프리셋 */}
            <div className="grid grid-cols-3 gap-1.5">
              {themes.map((theme) => {
                const active =
                  settings.tileColor === theme.tileColor &&
                  settings.backgroundColor === theme.backgroundColor;
                return (
                  <button
                    key={theme.name}
                    onClick={() => update({
                      tileColor: theme.tileColor,
                      textColor: theme.textColor,
                      backgroundColor: theme.backgroundColor,
                    })}
                    className="rounded-xl border-2 overflow-hidden transition-all hover:scale-105 active:scale-95"
                    style={{
                      backgroundColor: theme.backgroundColor,
                      borderColor: active ? theme.tileColor : 'transparent',
                    }}
                  >
                    <div
                      className="h-7 flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: theme.tileColor, color: theme.textColor }}
                    >12</div>
                    <div className="py-0.5 text-[10px] text-center font-medium" style={{ color: theme.tileColor }}>
                      {theme.name}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* 색상 직접 지정 */}
            <div>
              <p className="text-[10px] text-gray-400 mb-1.5">색상 직접 지정</p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { label: '타일 배경', key: 'tileColor' },
                    { label: '타일 글자', key: 'textColor' },
                    { label: '배경색',   key: 'backgroundColor' },
                  ] as { label: string; key: keyof Settings }[]
                ).map(({ label, key }) => (
                  <div key={key} className="flex flex-col items-center gap-1">
                    <input
                      type="color"
                      value={settings[key] as string}
                      onChange={(e) => updateColor(key, e.target.value)}
                      className="w-full h-8 rounded-lg cursor-pointer border border-gray-200"
                      list={`color-history-${key}`}
                    />
                    <span className="text-[10px] text-gray-500 text-center leading-tight">{label}</span>
                  </div>
                ))}
              </div>

              {/* 색상 이력 */}
              {colorHistory.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] text-gray-400 mb-1">최근 사용 색상</p>
                  <div className="flex flex-wrap gap-1.5">
                    {colorHistory.map((color, i) => (
                      <button
                        key={i}
                        title={color}
                        onClick={() => {
                          // 가장 마지막에 변경한 컬러 키에 적용 — 탭한 색상칩을 선택된 피커에 적용
                          // 여기선 단순히 tileColor에 적용 (또는 사용자가 직접 색상칩 드래그)
                        }}
                        className="group relative"
                      >
                        <div
                          className="w-6 h-6 rounded-md border border-gray-200 shadow-sm hover:scale-110 transition-transform"
                          style={{ backgroundColor: color }}
                        />
                        {/* 호버시 hex값 표시 */}
                        <span className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                          {color}
                        </span>
                      </button>
                    ))}
                  </div>
                  {/* 이력 색상을 각 키에 적용하는 버튼 */}
                  <div className="mt-2 grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { label: '타일배경에 적용', key: 'tileColor' },
                        { label: '글자색에 적용',   key: 'textColor' },
                        { label: '배경색에 적용',   key: 'backgroundColor' },
                      ] as { label: string; key: keyof Settings }[]
                    ).map(({ label, key }) => (
                      <div key={key} className="flex flex-col gap-1">
                        <p className="text-[9px] text-gray-400 text-center">{label}</p>
                        <div className="flex flex-wrap gap-1 justify-center">
                          {colorHistory.slice(0, 5).map((color, i) => (
                            <button
                              key={i}
                              onClick={() => updateColor(key, color)}
                              className="w-5 h-5 rounded border border-gray-200 hover:scale-110 transition-transform"
                              style={{ backgroundColor: color }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 배경 이미지 */}
            <div>
              <p className="text-[10px] text-gray-400 mb-1.5">배경 이미지</p>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <div className="flex gap-1.5">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {settings.backgroundImage ? '이미지 변경' : '이미지 업로드'}
                </button>
                {settings.backgroundImage && (
                  <button
                    onClick={() => update({ backgroundImage: '' })}
                    className="px-3 py-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── 섹션: 글씨체 & 크기 ── */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 space-y-3">
            <SectionTitle>글씨체 & 크기</SectionTitle>

            {/* 메인 글자 */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-500">메인 글자 (시계 숫자)</p>
              <FontPicker
                value={settings.fontFamily}
                onChange={(v) => update({ fontFamily: v })}
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">글자 크기</span>
                <SizeInput
                  value={settings.fontSize}
                  onChange={(v) => update({ fontSize: v })}
                  min={24}
                />
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            {/* 부가 정보 */}
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold text-gray-500">부가 정보 (날짜 · AM/PM)</p>
              <FontPicker
                value={settings.subFontFamily}
                onChange={(v) => update({ subFontFamily: v })}
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400">글자 크기</span>
                <SizeInput
                  value={settings.subFontSize}
                  onChange={(v) => update({ subFontSize: v })}
                  min={8}
                />
              </div>
            </div>
          </div>

          {/* ── 섹션: 화면 설정 ── */}
          <div className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 space-y-2.5">
            <SectionTitle>화면 설정</SectionTitle>

            {/* 화면 보호 */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
              <div
                className="mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: settings.screenSaver ? '#dbeafe' : '#f3f4f6' }}
              >
                <Monitor className="w-4 h-4" style={{ color: settings.screenSaver ? '#2563eb' : '#9ca3af' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-gray-800">화면 보호</div>
                <div className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                  절전 모드 허용 — 번인 방지
                  {settings.screenSaver && (
                    <span className="block mt-0.5 text-blue-500 font-medium">✔ WakeLock 해제됨</span>
                  )}
                </div>
              </div>
              <Toggle
                checked={settings.screenSaver}
                onChange={() => {
                  const next = !settings.screenSaver;
                  update({ screenSaver: next, keepScreenOn: next ? false : settings.keepScreenOn });
                }}
              />
            </div>

            {/* 입자 픽셀 새로 고침 */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
              <div
                className="mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: settings.particleRefresh ? '#fef3c7' : '#f3f4f6' }}
              >
                <Zap className="w-4 h-4" style={{ color: settings.particleRefresh ? '#d97706' : '#9ca3af' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-gray-800">입자 픽셀 새로 고침</div>
                <div className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                  파티클로 OLED 픽셀 주기적 갱신
                </div>
              </div>
              <Toggle
                checked={settings.particleRefresh}
                onChange={() => update({ particleRefresh: !settings.particleRefresh })}
                accentColor="#d97706"
              />
            </div>

            {/* 화면 켜짐 유지 */}
            <div
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all ${
                settings.screenSaver
                  ? 'bg-gray-100 border-gray-100 opacity-40 pointer-events-none'
                  : 'bg-gray-50 border-gray-100'
              }`}
            >
              <div
                className="mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: settings.keepScreenOn ? '#dcfce7' : '#f3f4f6' }}
              >
                <Sun className="w-4 h-4" style={{ color: settings.keepScreenOn ? '#16a34a' : '#9ca3af' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-gray-800">화면 켜짐 유지</div>
                <div className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                  WakeLock — 화면 항상 켜짐
                  {settings.screenSaver && (
                    <span className="block mt-0.5 text-orange-400 font-medium">⚠ 화면 보호 ON 시 비활성</span>
                  )}
                  {settings.keepScreenOn && !settings.screenSaver && (
                    <span className="block mt-0.5 text-green-600 font-medium">✔ WakeLock 활성</span>
                  )}
                </div>
              </div>
              <Toggle
                checked={settings.keepScreenOn}
                onChange={() => update({ keepScreenOn: !settings.keepScreenOn })}
                accentColor="#16a34a"
              />
            </div>

            {/* 벚꽃 배경 */}
            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-gray-50 border border-gray-100">
              <div
                className="mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                style={{ backgroundColor: settings.cherryBlossom ? '#fce7f3' : '#f3f4f6' }}
              >
                🌸
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs text-gray-800">벚꽃 배경</div>
                <div className="text-[10px] text-gray-500 mt-0.5 leading-snug">
                  봄날 벚꽃잎이 휘날리는 애니메이션 배경
                </div>
              </div>
              <Toggle
                checked={settings.cherryBlossom}
                onChange={() => update({ cherryBlossom: !settings.cherryBlossom })}
                accentColor="#ec4899"
              />
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
