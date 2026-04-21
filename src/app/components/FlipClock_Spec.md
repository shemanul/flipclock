# FlipClock — 기술 명세서 (Spec)

> 플립 애니메이션 시계 PWA 앱. 번인 방지, 테마 커스텀, 벚꽃 배경 등을 지원하는 풀스크린 시계 앱.

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 앱 이름 | FlipClock |
| 타입 | PWA (Progressive Web App) |
| 프레임워크 | React + TypeScript + Vite |
| 스타일 | Tailwind CSS |
| 애니메이션 | motion/react (Framer Motion) |
| 배포 | Vercel |
| 저장소 | GitHub (shemanul/flipclock) |

---

## 파일 구조

```
src/
└── app/
    └── components/
        ├── App.tsx              # 루트 컴포넌트 — 화면 전환, 픽셀시프트, 파티클
        ├── ClockScreen.tsx      # 시계 화면 — 플립 시계, 터치 제스처, 벚꽃
        ├── TimerScreen.tsx      # 타이머 화면
        ├── FlipDigit.tsx        # 플립 카드 애니메이션 컴포넌트
        └── SettingsScreen.tsx   # 설정 화면

public/
├── manifest.json               # PWA 매니페스트
├── service-worker.js           # 오프라인 캐시 (v2)
└── icons/                      # PWA 아이콘 (72~512px)
    ├── icon-72x72.png
    ├── icon-96x96.png
    ├── icon-128x128.png
    ├── icon-144x144.png
    ├── icon-152x152.png
    ├── icon-192x192.png
    ├── icon-384x384.png
    └── icon-512x512.png

index.html                      # 진입점 — PWA 메타태그, SW 등록
vercel.json                     # Vercel CSP 헤더 설정
```

---

## Settings 인터페이스

```typescript
export interface Settings {
  // 색상
  tileColor: string;          // 시계 타일 배경색
  textColor: string;          // 시계 타일 글자색
  backgroundColor: string;   // 앱 배경색
  backgroundImage: string;   // 배경 이미지 (base64)

  // 메인 글자 (시계 숫자)
  fontFamily: string;         // 폰트
  fontSize: number;           // 크기 (px), 기본값: 64

  // 부가 정보 (날짜 · AM/PM · 초)
  subFontFamily: string;      // 폰트
  subFontSize: number;        // 크기 (px), 기본값: 20

  // 화면 설정
  screenSaver: boolean;       // 화면 보호 (픽셀시프트 3초)
  particleRefresh: boolean;   // 입자+눈꽃+픽셀시프트 8초
  keepScreenOn: boolean;      // WakeLock API
  cherryBlossom: boolean;     // 벚꽃 애니메이션
}
```

---

## 컴포넌트 명세

### App.tsx

**역할:** 최상위 컴포넌트. 화면 전환, 번인 방지 효과 관리.

| 기능 | 구현 방식 |
|------|----------|
| 화면 전환 | AnimatePresence + motion.div |
| 픽셀 시프트 | setInterval → CSS transform translate |
| 파티클 50개 | motion.div 위치 애니메이션 |
| 눈꽃 30개 (❄❅❆) | motion.div y축 낙하 애니메이션 |
| WakeLock | navigator.wakeLock.request('screen') |
| 탭 복귀 시 재획득 | visibilitychange 이벤트 |

**픽셀 시프트 조건:**
- `screenSaver ON` → 3초마다 ±4px
- `particleRefresh ON` → 8초마다 ±4px
- 둘 다 ON → 3초 우선

---

### ClockScreen.tsx

**역할:** 시계 표시 + 모든 터치 제스처 처리.

**ClockScreen Props:**
```typescript
interface ClockScreenProps {
  tileColor, textColor, backgroundColor, backgroundImage,
  fontFamily, subFontSize, subFontFamily,
  showAmPm, showSeconds, cherryBlossom,
  onToggleAmPm, onToggleSeconds,
  onSwipeLeft, onSwipeUp, onSwipeDown
}
```

**터치 제스처 (전체 화면 단일 핸들러):**

| 제스처 | 동작 |
|--------|------|
| 한 손가락 위 스와이프 | 설정 열기 |
| 한 손가락 아래 스와이프 | 설정 닫기 |
| 한 손가락 왼쪽 스와이프 | 타이머 전환 |
| 두 손가락 핀치 | 시계 크기 조절 (0.3~2.5배) |
| 0.4초 길게 누르기 + 드래그 | 시계 위치 이동 (진동 피드백) |
| 더블탭 | 크기·위치 리셋 + 전체화면 토글 |

**벚꽃 (Canvas API):**
- 꽃잎 60개 (타원형 40% + 하트형 60%)
- 연분홍 5가지 색상 랜덤
- requestAnimationFrame 루프
- `cherryBlossom` prop 변경 시 즉시 시작/중단

**시계 타일 레이아웃:**
```
시 타일                    분 타일
┌──────────────┐          ┌──────────────┐
│  26. 04. 21. │          │    화요일     │
│              │          │              │
│      10      │          │      30      │
│              │          │              │
│ AM           │          │           45 │
└──────────────┘          └──────────────┘
```

---

### FlipDigit.tsx

**역할:** 숫자 플립 카드 애니메이션.

| 애니메이션 단계 | 동작 |
|----------------|------|
| idle | 현재 값 표시 |
| fold (0~180ms) | 상단 플랩 scaleY 1→0 (easeIn) |
| fall (180~360ms) | 하단 플랩 scaleY 0→1 (easeOut) |

**Props:**
```typescript
value, tileColor, textColor, fontFamily,
fontSize?,           // number (px) — 없으면 clamp(6rem, 20vw, 16rem)
topContent,          // 상단 부가정보 (날짜 or 요일)
bottomLeftContent,   // 하단 좌측 (AM/PM)
bottomRightContent,  // 하단 우측 (초)
subFontSize,         // string (예: "20px")
subFontFamily,
subTextColor
```

---

### SettingsScreen.tsx

**역할:** 설정 UI. 좌우 분할 레이아웃.

**레이아웃:**
```
┌─────────────┬──────────────────────┐
│  미리보기    │  테마 & 색상          │
│  (44% 고정) │  글씨체 & 크기        │
│             │  화면 설정            │
│  설정 요약  │  (우측 스크롤)        │
└─────────────┴──────────────────────┘
```

**HSL 색상 피커:**
- HEX ↔ HSL 변환 유틸 내장
- 색조(0~360°) / 채도(0~100%) / 밝기(0~100%) 슬라이더
- HEX 직접 입력 가능
- 색깔 칩 클릭 → 피커 펼침/접힘
- 현재 색상에서 정확히 시작

**테마 관리:**
- 기본 테마 6개 (기본/다크/블루/그린/퍼플/오렌지) — 삭제 불가
- 사용자 저장 테마 최대 6개 — X 버튼으로 삭제 가능
- "현재 색상을 테마로 저장" 버튼

**폰트 선택:** ▲▼ 화살표로 즉시 변경 (20종)

**글자 크기:** −/숫자/+ 입력, 길게 누르면 연속 증감

---

### TimerScreen.tsx

**역할:** 스톱워치 기능.

| 기능 | 내용 |
|------|------|
| 표시 | 분 : 초 (FlipDigit 사용) |
| 조작 | ▶ 시작 / ⏸ 일시정지 / ↺ 리셋 |
| 전환 | 오른쪽 스와이프 → 시계 화면 복귀 |

---

## PWA 설정

```json
// manifest.json
{
  "name": "FlipClock",
  "display": "fullscreen",
  "orientation": "landscape",
  "theme_color": "#0f4c5c",
  "background_color": "#fb9189"
}
```

**서비스워커:** Cache-First 전략, 캐시명 `flipclock-v2`

**index.html 주요 설정:**
```html
<!-- 브라우저 핀치줌 완전 차단 -->
<meta name="viewport" content="..., user-scalable=no">

<!-- 길게 누르기 메뉴 차단 -->
* { -webkit-touch-callout: none; touch-action: manipulation; }
```

---

## 번인 방지 전략

| 기능 | 방식 | 간격 |
|------|------|------|
| 픽셀 시프트 | CSS transform translate ±4px | 3초 or 8초 |
| 파티클 | 흰 점 50개 랜덤 이동 | 상시 |
| 눈꽃 | ❄❅❆ 낙하 애니메이션 | 상시 |
| WakeLock | navigator.wakeLock API | 화면 켜짐 유지 |

---

## 기본값

```typescript
const defaultSettings: Settings = {
  tileColor: '#0f4c5c',
  textColor: '#e5e5e5',
  backgroundColor: '#fb9189',
  backgroundImage: '',
  fontFamily: 'system-ui, ...',
  fontSize: 64,
  subFontFamily: 'system-ui, ...',
  subFontSize: 20,
  screenSaver: false,
  particleRefresh: false,
  keepScreenOn: false,
  cherryBlossom: false,
}
```

---

*작성일: 2026-04-21*

---

## 변경 이력

| 날짜 | 버전 | 파일 | 내용 |
|------|------|------|------|
| 2026-04-21 | v1.0.1 | SettingsScreen.tsx | 사용자 저장 테마 영구 저장 버그 수정 |

### v1.0.1 — 사용자 테마 영구 저장 (2026-04-21)

**문제:** `userThemes`가 React state에만 저장되어 있어서 설정 화면을 닫았다 다시 열면 저장된 테마가 초기화되는 버그

**원인:** 컴포넌트가 언마운트되면 state가 사라지는 React 특성

**해결:** `localStorage`를 사용해 영구 저장

```typescript
// 변경 전
const [userThemes, setUserThemes] = useState<typeof DEFAULT_THEMES>([]);

// 변경 후
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
```

**영향 범위:** `SettingsScreen.tsx` — `saveTheme`, `deleteUserTheme` 함수

