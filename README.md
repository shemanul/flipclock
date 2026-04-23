# 🕐 FlipClock

아름다운 플립 애니메이션 디지털 시계 PWA

[![GitHub stars](https://img.shields.io/github/stars/shemanul/flipclock?style=flat-square)](https://github.com/shemanul/flipclock)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ 주요 기능

### 🎨 커스터마이제이션
- **색상 설정**: 타일, 텍스트, 배경 색상 자유롭게 변경
- **테마 시스템**: 6개의 프리셋 색상 테마
- **배경 이미지**: 9개의 프리셋 이미지 + 사용자 이미지 업로드
- **폰트 설정**: 시간 및 부제목 폰트와 크기 조정

### 🎭 파티클 애니메이션 효과
5가지 아름다운 애니메이션 효과 중 선택:
- 🌸 **벚꽃**: 하트/타원 모양의 분홍색 입자
- 🍃 **초록잎**: 신선한 초록색 나뭇잎
- 🍂 **낙엽**: 주황/빨강 가을 낙엽
- ❄️ **눈꽃**: 6개 가지의 눈 결정 모양
- 🌧️ **비**: 바닥에서 튀김 효과가 있는 고급 빗방울

### 🖱️ 직관적인 상호작용
- **드래그**: 시계를 터치해서 원하는 위치로 이동
- **핀치 줌**: 2손가락으로 시계 크기 조절 (0.3x ~ 2.5x)
- **더블탭**: 시계를 원래 위치로 리셋 + 전체화면 토글
- **스와이프**: 화면 간 전환 및 설정 열고 닫기

### 💾 자동 저장
- 모든 설정이 자동으로 localStorage에 저장됨
- 앱 재시작 후에도 색상, 배경 이미지, 시계 위치 유지

### 🔋 화면 관련 기능
- **화면 항상 켜짐**: 침대 옆 시계로 사용 가능 (WakeLock API)
- **화면 보호 모드**: OLED 번인 방지를 위한 픽셀 시프트
- **시계 투명도**: 배경 이미지를 더 잘 보기 위해 투명도 조절

### ⏱️ 추가 기능
- **타이머 화면**: 간편한 시간 측정
- **12/24시간 형식**: AM/PM 토글
- **초 표시 ON/OFF**: 필요에 따라 초 표시 선택
- **PWA 지원**: 웹 앱으로 설치하여 네이티브 앱처럼 사용

---

## 🚀 빠른 시작

### 온라인 접속
https://flipclock.vercel.app

### PWA 설치
1. 브라우저에서 주소창 옆의 **설치 아이콘** 클릭
2. 또는 메뉴에서 **"앱 설치"** 선택
3. 홈 화면에 추가됨

---

## 🛠️ 개발 환경 설정

### 필수 요구사항
- Node.js 16+
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/shemanul/flipclock.git
cd flipclock

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build
```

### 배포
현재 Vercel에 자동 배포되고 있습니다.

---

## 📁 프로젝트 구조

```
FlipClock_v1/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── ClockScreen.tsx      # 메인 시계 화면
│   │   │   ├── TimerScreen.tsx      # 타이머 화면
│   │   │   ├── SettingsScreen.tsx   # 설정 화면
│   │   │   └── FlipDigit.tsx        # 플립 애니메이션 숫자
│   │   └── App.tsx                  # 메인 앱 컴포넌트
│   └── index.css                    # 전역 스타일
├── guidelines/
│   ├── CHANGELOG.md                 # 버전별 변경사항
│   └── USER_GUIDE.md                # 사용자 가이드
├── public/
│   ├── background_images/           # 배경 이미지
│   └── manifest.json                # PWA 설정
└── package.json
```

---

## 🎨 기술 스택

- **프레임워크**: React 19
- **스타일링**: Tailwind CSS
- **애니메이션**: Framer Motion
- **언어**: TypeScript
- **배포**: Vercel

---

## 📸 스크린샷

| 메인 화면 | 설정 화면 | 파티클 효과 |
|----------|---------|-----------|
| 시계 디스플레이 | 색상 및 배경 설정 | 5가지 애니메이션 효과 |

---

## 📚 문서

- [**USER_GUIDE.md**](./guidelines/USER_GUIDE.md) - 상세한 사용자 가이드
- [**CHANGELOG.md**](./guidelines/CHANGELOG.md) - 버전별 변경사항

---

## 🐛 버그 신고 및 기능 요청

문제가 발생하거나 기능을 제안하고 싶으시면 [GitHub Issues](https://github.com/shemanul/flipclock/issues)에 등록해주세요.

---

## 📄 라이선스

MIT License - [LICENSE](./LICENSE) 참고

---

## 👨‍💻 개발자

FlipClock은 아름다운 UI/UX와 부드러운 애니메이션을 제공하는 현대적인 시계 애플리케이션입니다.

**현재 버전**: v0.7.0  
**마지막 업데이트**: 2026-04-23

---

## 🤝 기여

이 프로젝트에 기여하고 싶으신가요?

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**즐거운 시간 관리되세요! ⏰✨**