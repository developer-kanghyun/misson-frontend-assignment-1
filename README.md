# Frontend Assignment 1 - 콘텐츠 생성 화면 구현

Figma 기획문서 기반 콘텐츠 생성 페이지 구현 및 AWS 배포

**🌐 배포 URL**: http://13.211.121.25:8080/

---

## 목차

- [📋 과제 요구사항 체크리스트](#-과제-요구사항-체크리스트)
- [기술 스택 & 구현 특징](#기술-스택--구현-특징)
- [프로젝트 구조](#프로젝트-구조)
- [로컬 실행 방법](#로컬-실행-방법)
- [AWS 배포 가이드](#aws-배포-가이드)
- [주요 기능](#주요-기능)
- [기술적 구현 포인트](#기술적-구현-포인트)
- [해결한 주요 이슈](#해결한-주요-이슈)
- [브라우저 호환성](#브라우저-호환성)
- [참고사항](#참고사항)
- [문제 해결](#문제-해결)

---

## 📋 과제 요구사항 체크리스트

| 요구사항                      | 상태 | 구현 내용                                                         |
| ----------------------------- | ---- | ----------------------------------------------------------------- |
| **Figma 기획 문서 기반 구현** | ✅   | 콘텐츠 생성 페이지 완성 (이미지 업로드, 카테고리 선택, 회차 관리) |
| **Vanilla JavaScript**        | ✅   | ES6 Module, 이벤트 위임, Debounce 패턴 적용                       |
| **반응형 디자인**             | ✅   | Mobile-first, PC(≥1100px) / Mobile(≤767px) 대응                   |
| **Flask 백엔드**              | ✅   | Python 3.9 + Flask 2.2.3                                          |
| **AWS EC2 배포**              | ✅   | Docker 컨테이너화 + EC2 배포 완료                                 |

---

## 과제 요구사항 상세

- **기술 스택**: Vanilla JavaScript (ES6+) / HTML5 / CSS3 / Flask
- **내용**: Figma 기획 문서를 참고하여 화면 구현
- **배포**: AWS EC2에 배포 (퍼블릭 IP 사용)

## 기술 스택 & 구현 특징

### Frontend

- **Vanilla JavaScript (ES6 Module)**: React 없이 모던 JavaScript 패턴 사용
  - ES6 Module로 코드 모듈화 (utils, modules 분리)
  - 이벤트 위임 패턴으로 성능 최적화
  - Setter 함수를 활용한 상태 관리
- **CSS Design System**: CSS Variables로 디자인 토큰 관리
- **반응형 웹**: Mobile-first 접근, Flexbox/Grid 활용

### Backend

- **Flask 2.2.3**: 경량 웹 프레임워크
- **Python 3.9**: 안정적인 런타임 환경

### 배포

- **Docker**: 컨테이너화로 환경 일관성 보장
- **AWS EC2**: 클라우드 서버 배포

## 프로젝트 구조

```
mission-frontend-assignment-1/
├── app/
│   ├── main.py                          # Flask 애플리케이션
│   ├── __init__.py
│   ├── static/
│   │   ├── js/
│   │   │   ├── content-create-main.js   # ES6 Module 진입점
│   │   │   ├── calendar.js              # 달력 컴포넌트
│   │   │   ├── modules/                 # 비즈니스 로직 모듈
│   │   │   │   ├── state.js             # 전역 상태 관리
│   │   │   │   ├── imageHandler.js      # 이미지 업로드
│   │   │   │   ├── categoryHandler.js   # 카테고리 선택
│   │   │   │   ├── sessionHandler.js    # 회차 관리
│   │   │   │   ├── formHandler.js       # 폼 검증 & 제출
│   │   │   │   └── eventHandler.js      # 이벤트 리스너 등록
│   │   │   └── utils/                   # 유틸리티 함수
│   │   │       ├── constants.js         # 상수 정의
│   │   │       ├── ui.js                # UI 헬퍼
│   │   │       └── validation.js        # 검증 로직
│   │   └── css/
│   │       ├── base/
│   │       │   ├── variables.css        # CSS 변수 (디자인 시스템)
│   │       │   └── reset.css            # CSS 리셋
│   │       ├── components/
│   │       │   └── toast.css            # 토스트 메시지
│   │       └── content-create.css       # 콘텐츠 생성 페이지 스타일
│   └── templates/
│       └── content/
│           └── create.html              # 콘텐츠 생성 페이지
├── venv/                                # Python 가상환경
├── Dockerfile.development               # Docker 설정
├── docker-compose.dev.yml               # Docker Compose 설정
├── requirements.txt                     # Python 의존성
├── .gitignore
└── README.md
```

## 로컬 실행 방법

### 1. Python 직접 실행

```bash
# 가상환경 생성 및 활성화
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python3 app/main.py

# 접속: http://localhost:8080/
```

### 2. Docker 실행 (권장)

```bash
# Docker 빌드 및 실행
docker-compose -f docker-compose.dev.yml up --build

# 백그라운드 실행
docker-compose -f docker-compose.dev.yml up -d

# 중지
docker-compose -f docker-compose.dev.yml down

# 접속: http://localhost:8080/
```

## AWS 배포 가이드

### 1. EC2 인스턴스 생성

1. **AWS EC2 콘솔** 접속
2. **인스턴스 시작** 클릭
3. 설정:
   - **AMI**: Ubuntu Server 22.04 LTS
   - **인스턴스 타입**: t2.micro (프리티어)
   - **키 페어**: 새로 생성 또는 기존 키 선택
   - **보안 그룹**:
     - SSH (22) - 내 IP
     - HTTP (80) - 0.0.0.0/0
     - Custom TCP (8080) - 0.0.0.0/0

### 2. EC2 접속 및 환경 설정

```bash
# SSH 접속
ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>

# 시스템 업데이트
sudo apt update && sudo apt upgrade -y

# Docker 설치
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Docker Compose 설치
sudo apt install -y docker-compose

# 재접속 (docker 그룹 적용)
exit
ssh -i "your-key.pem" ubuntu@<EC2-PUBLIC-IP>
```

### 3. 코드 배포

```bash
# Git 설치
sudo apt install -y git

# 방법 1: Git Clone (권장)
git clone <YOUR-REPO-URL>
cd mission-frontend-assignment-1

# 방법 2: SCP로 파일 전송 (로컬에서 실행)
scp -i "your-key.pem" -r /path/to/mission-frontend-assignment-1 ubuntu@<EC2-PUBLIC-IP>:~/
```

### 4. Docker로 서버 실행

```bash
# 프로젝트 디렉토리로 이동
cd mission-frontend-assignment-1

# Docker 컨테이너 빌드 및 실행
docker-compose -f docker-compose.dev.yml up --build -d

# 로그 확인
docker-compose -f docker-compose.dev.yml logs -f

# 컨테이너 상태 확인
docker ps
```

### 5. 접속 확인

브라우저에서 접속:

```
http://<EC2-PUBLIC-IP>:8080/
```

### 6. 서버 관리 명령어

```bash
# 컨테이너 중지
docker-compose -f docker-compose.dev.yml down

# 컨테이너 재시작
docker-compose -f docker-compose.dev.yml restart

# 로그 확인
docker-compose -f docker-compose.dev.yml logs -f
```

## 주요 기능

### 1. 이미지 업로드

- 대표 이미지: 1장 (필수)
- 추가 이미지: 최대 4장 (선택)
- 드래그 앤 드롭 지원
- JPG/PNG 지원, 15MB 제한

### 2. 카테고리 선택

- 8개 카테고리 중 최대 2개 선택
- 모바일/데스크톱 별도 UI

### 3. 제목 입력

- 8~80자 제한
- 이모지 정확한 글자수 카운팅 (`Intl.Segmenter` 사용)
- 연속 공백 입력 방지

### 4. 활동 방식 선택

- 온라인 / 오프라인 선택

### 5. 회차 정보 관리

- 다중 회차 추가 가능
- 각 회차별:
  - 날짜 선택 (커스텀 달력)
  - 시간 선택 (12시간제, 23:59 제한)
  - 시작 시간 변경 시 종료 시간 자동 +1시간
  - 활동 내용 입력 (8~800자, 이모지 정확한 카운팅)
- 순차적 날짜 선택 (1회차 < 2회차 < 3회차)
- 중복 날짜 자동 비활성화

### 6. 폼 검증

- 실시간 입력 검증
- 에러 메시지 표시
- 모든 필수 항목 입력 시 제출 버튼 활성화

## 기술적 구현 포인트

### ES6 Module 구조

```javascript
// 모듈화된 코드 구조
import { state } from "./modules/state.js";
import { setupEventListeners } from "./modules/eventHandler.js";
```

### 이벤트 위임 패턴

```javascript
// 각 요소마다 리스너를 붙이지 않고 부모에 하나만 등록
sessionBox.addEventListener("click", (e) => {
  if (e.target.classList.contains("session-start-period")) {
    handlePeriodToggle(sessionBox, sessionIndex, "start");
  }
});
```

### Debounce 패턴으로 입력 최적화

```javascript
// setTimeout으로 300ms 디바운스 적용 (불필요한 검증 방지)
let startTimeTimeout;
input.addEventListener("input", () => {
  clearTimeout(startTimeTimeout);
  startTimeTimeout = setTimeout(() => {
    autoUpdateEndTime(sessionBox, sessionIndex);
  }, 300);
});
```

### 이모지 정확한 카운팅 (Intl.Segmenter)

```javascript
// String.length는 '❤️‍🔥'.length === 4로 잘못 계산
// Intl.Segmenter로 grapheme 단위로 정확히 1글자로 인식
const segmenter = new Intl.Segmenter("ko", { granularity: "grapheme" });
export const getGraphemeLength = (text) => {
  return Array.from(segmenter.segment(text)).length;
};
```

### 순차적 날짜 선택 로직

```javascript
// 이전 회차 +1일 제약
if (sessionIndex > 0 && state.sessions[sessionIndex - 1]?.date) {
  const prevDate = new Date(state.sessions[sessionIndex - 1].date);
  minDate = new Date(prevDate);
  minDate.setDate(minDate.getDate() + 1);
}

// 다음 회차 -1일 제약
if (
  sessionIndex < state.sessions.length - 1 &&
  state.sessions[sessionIndex + 1]?.date
) {
  const nextDate = new Date(state.sessions[sessionIndex + 1].date);
  maxDate = new Date(nextDate);
  maxDate.setDate(maxDate.getDate() - 1);
}
```

### 시간 입력 필드 숫자 전용 처리

```javascript
// keydown에서 사전 차단 (한글 IME 입력 방지)
sessionBox.addEventListener("keydown", (e) => {
  const allowedKeys = [
    "Backspace",
    "Delete",
    "Tab",
    "ArrowLeft",
    "ArrowRight",
    "ArrowUp",
    "ArrowDown",
  ];
  const isNumber = /^[0-9]$/.test(e.key);

  if (!isNumber && !allowedKeys.includes(e.key)) {
    e.preventDefault();
  }
});

// input에서 정규식으로 숫자만 필터링
let value = input.value.replace(/[^0-9]/g, "");
```

### 시간 자동 업데이트 및 검증

```javascript
// 시작 시간 변경 시 종료 시간 자동 +1시간
function autoUpdateEndTime(sessionBox, sessionIndex) {
  const startMinutes = getTimeInMinutes(sessionBox, "start");
  const endMinutes = startMinutes + 60;
  setTimeFromMinutes(sessionBox, "end", endMinutes);
  validateEndTime(sessionBox, sessionIndex);
}

// 23:59 초과 시 자동 보정
function validateEndTime(sessionBox, sessionIndex) {
  const endMinutes = getTimeInMinutes(sessionBox, "end");
  if (endMinutes > 23 * 60 + 59) {
    setTimeFromMinutes(sessionBox, "end", 23 * 60 + 59); // 11:59 PM
  }
}
```

### CSS Design System

```css
:root {
  --color-primary: #00c73c;
  --spacing-lg: 16px;
  --radius-md: 8px;
  --transition-base: 0.3s ease;
}
```

### 반응형 디자인

**브레이크포인트**:

- **PC**: ≥1100px (카테고리 모달, 넓은 레이아웃)
- **Mobile**: ≤767px (카테고리 풀스크린, 모바일 최적화)
- **Tablet**: 768~1099px (PC 레이아웃 축소 버전)

**구현 방식**:

```css
/* Mobile-first 기본 스타일 */
.container {
  width: 100%;
  padding: 20px;
}

/* PC 스타일 */
@media (min-width: 1100px) {
  .container {
    max-width: 1100px;
    margin: 0 auto;
  }
}
```

**레이아웃**:

- Flexbox: 이미지 업로드, 버튼 그룹
- Grid: 카테고리 목록 (PC: 4열, Mobile: 2열)

### 컴포넌트 상태 관리

| 상태         | 구현 방법                              | 예시                             |
| ------------ | -------------------------------------- | -------------------------------- |
| **hover**    | CSS `:hover`                           | 버튼, 이미지 업로드 영역         |
| **active**   | CSS `:active`, `.active` 클래스        | 카테고리 선택, 활동 방식 버튼    |
| **disabled** | `[disabled]` 속성 + `.disabled` 클래스 | 제출 버튼 (필수 항목 미입력 시)  |
| **focus**    | CSS `:focus`                           | 입력 필드 (파란색 테두리)        |
| **error**    | `.error` 클래스 + JavaScript           | 제목 글자수 부족, 시간 검증 실패 |
| **success**  | `.success` 클래스 + JavaScript         | 제목 8자 이상 입력 완료          |

## 해결한 주요 이슈

### 1. 이모지 글자수 계산 오류

**문제**: `String.length`로 계산 시 이모지가 여러 글자로 인식됨

- ❤️ → 2자 (variation selector 포함)
- 2️⃣ → 3자 (숫자 + variation selector + keycap)
- ❤️‍🔥 → 4자 (ZWJ sequence)

**해결**: `Intl.Segmenter` API로 grapheme 단위 정확한 카운팅 (모든 이모지 1자 처리)

### 2. 시간 입력 시 23:59 초과 문제

**문제**: 시작 시간 11:30 AM → PM 토글 시 종료 시간이 12:30 PM (24:30)로 설정됨

**해결**: `validateEndTime` 함수로 23:59 초과 시 자동으로 11:59 PM으로 보정

### 3. 2회차 이상에서 토글 버튼 작동 안함

**문제**: 회차 추가 시 이벤트 리스너가 중복 등록되어 토글 버튼이 작동하지 않음

**해결**: `dataset.listenersAttached` 플래그로 중복 등록 방지

### 4. 입력마다 검증 실행으로 인한 성능 저하

**문제**: 매 입력마다 검증 함수가 실행되어 불필요한 연산 발생

**해결**: setTimeout으로 300ms debounce 적용

### 5. 달력 월 이동 시 날짜 건너뛰기

**문제**: 31일에서 월 변경 시 존재하지 않는 날짜로 인해 다음 달이 건너뛰어짐

**해결**: 월 이동 전 날짜를 1일로 초기화

### 6. 회차 추가 시 캘린더가 오늘 날짜로 초기화

**문제**: 2회차 추가 시 minDate가 1회차 날짜인데도 오늘 날짜부터 시작

**해결**: 캘린더 초기화 시 minDate가 오늘보다 미래면 minDate로 시작하도록 수정

### 7. 시간 입력 필드에 한글 입력 가능

**문제**: `type="number"` 필드에도 한글 IME가 작동하여 일시적으로 한글 입력됨

**해결**: `keydown` 이벤트에서 숫자와 특수키만 허용, `input` 이벤트에서 정규식으로 필터링

### 8. 모바일 카테고리 선택 버튼 활성화 안됨

**문제**: 카테고리 선택 시 `.disabled` 클래스를 toggle하지 않아 CSS 스타일 적용 안됨

**해결**: `btn.disabled` 속성과 `.disabled` 클래스를 함께 업데이트

## 브라우저 호환성

| 기능              | API                 | 지원 브라우저                      | 대체 방안                 |
| ----------------- | ------------------- | ---------------------------------- | ------------------------- |
| **이모지 카운팅** | `Intl.Segmenter`    | Chrome 87+, Edge 87+, Safari 14.1+ | `Array.from()` 폴백 가능  |
| **ES6 Module**    | `import/export`     | 모든 모던 브라우저                 | Webpack/Rollup으로 번들링 |
| **CSS Variables** | `--custom-property` | IE 제외 모든 브라우저              | Sass 변수로 대체 가능     |
| **Flexbox/Grid**  | CSS Flexbox, Grid   | 모든 모던 브라우저                 | float 레이아웃 대체       |

**권장 브라우저**:

- Chrome 87+
- Safari 14.1+
- Edge 87+
- Firefox 90+

## 참고사항

- ES6 Module은 브라우저 네이티브 지원 (번들러 불필요)
- Docker 사용으로 Python 환경 설정 불필요
- 포트 5000이 사용 중일 경우 8080 사용
- Intl.Segmenter는 비교적 최신 API (폴백 처리 권장)

## 문제 해결

### Docker 권한 오류

```bash
sudo usermod -aG docker $USER
# 재로그인 필요
```

### 포트 충돌

```bash
# 사용 중인 포트 확인
sudo lsof -i :8080

# 프로세스 종료
sudo kill -9 <PID>
```

### EC2 접속 불가

- 보안 그룹에서 8080 포트 인바운드 규칙 확인
- 퍼블릭 IP 주소 확인
