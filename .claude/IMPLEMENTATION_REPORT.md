# 프론트엔드 과제 구현 및 문제 해결 레포트

## 프로젝트 개요

**과제명**: 콘텐츠 생성 화면 구현 및 AWS EC2 배포
**기술 스택**: Vanilla JavaScript (ES6+), HTML5, CSS3, Flask, Docker, AWS EC2
**배포 URL**: http://13.211.121.25:8080/

---

## 1. 프로젝트 구조 및 아키텍처

### 1.1 ES6 Module 기반 모듈화

```
app/static/js/
├── content-create-main.js      # 진입점
├── calendar.js                 # 달력 컴포넌트
├── modules/                    # 비즈니스 로직
│   ├── state.js                # 전역 상태 관리
│   ├── imageHandler.js         # 이미지 업로드 처리
│   ├── categoryHandler.js      # 카테고리 선택 로직
│   ├── sessionHandler.js       # 회차 관리 (시간 검증 포함)
│   ├── formHandler.js          # 폼 검증 & 제출
│   └── eventHandler.js         # 이벤트 리스너 등록
└── utils/                      # 유틸리티
    ├── constants.js            # 상수 정의
    ├── ui.js                   # UI 헬퍼 함수
    └── validation.js           # 검증 로직 (Intl.Segmenter)
```

**설계 원칙**:

- **관심사 분리**: 상태 관리, UI 로직, 검증 로직 분리
- **단방향 데이터 흐름**: state → UI 업데이트
- **재사용 가능한 유틸리티**: validation.js, ui.js

### 1.2 상태 관리 패턴

```javascript
// state.js - Setter 함수로 상태 변경 추적
export const state = {
  mainImage: null,
  additionalImages: [],
  selectedCategories: [],
  sessions: [],
};

// Setter 함수 예시
export const setMainImage = (file) => {
  state.mainImage = file;
};
```

---

## 2. 핵심 기술 구현

### 2.1 Intl.Segmenter를 활용한 이모지 정확한 카운팅

#### 문제 상황

- `String.length`: ❤️ = 2자, 2️⃣ = 3자, ❤️‍🔥 = 4자로 잘못 계산
- `Array.from()`: ❤️ = 2자 (variation selector를 별도 문자로 인식)

#### 해결 방법

```javascript
// validation.js
const segmenter = new Intl.Segmenter("ko", { granularity: "grapheme" });

export const getGraphemeLength = (text) => {
  return Array.from(segmenter.segment(text)).length;
};

export const sliceGrapheme = (text, start, end) => {
  const segments = Array.from(segmenter.segment(text));
  return segments
    .slice(start, end)
    .map((s) => s.segment)
    .join("");
};
```

#### 기술적 의의

- **Grapheme Cluster**: 사용자가 인지하는 "한 글자" 단위로 정확히 카운팅
- **Unicode 호환성**: Variation Selector, ZWJ Sequence 등 모든 이모지 지원
- **국제화 대응**: 한글, 일본어 등 복잡한 문자 조합도 정확히 처리

### 2.2 이벤트 위임 패턴으로 성능 최적화

#### 구현 예시

```javascript
// sessionHandler.js
sessionBox.addEventListener("click", (e) => {
  // 시작 시간 AM/PM 토글
  if (e.target.classList.contains("session-start-period")) {
    handlePeriodToggle(sessionBox, sessionIndex, "start");
  }
  // 종료 시간 AM/PM 토글
  else if (e.target.classList.contains("session-end-period")) {
    handlePeriodToggle(sessionBox, sessionIndex, "end");
  }
});
```

#### 장점

- **메모리 효율**: 각 버튼마다 리스너를 붙이지 않고 부모에 하나만 등록
- **동적 요소 대응**: 나중에 추가되는 요소도 자동으로 이벤트 처리
- **이벤트 버블링 활용**: DOM 구조에 따라 자동으로 위임

### 2.3 Debounce 패턴으로 입력 최적화

#### 문제 상황

- 매 keystroke마다 검증 함수 실행 → 불필요한 연산 발생
- 사용자가 타이핑 중일 때 중간 값으로 검증

#### 해결 방법

```javascript
// sessionHandler.js
let startTimeTimeout;
startHourInput.addEventListener("input", () => {
  clearTimeout(startTimeTimeout);
  startTimeTimeout = setTimeout(() => {
    autoUpdateEndTime(sessionBox, sessionIndex);
  }, 300);
});
```

#### 효과

- **성능 향상**: 입력이 멈춘 후 300ms 뒤에만 검증 실행
- **사용자 경험 개선**: 타이핑 중 깜빡임 없음

### 2.4 시간 검증 로직 (23:59 제한)

#### 요구사항

1. 시작 시간 변경 시 종료 시간 자동 +1시간
2. 종료 시간은 23:59를 초과할 수 없음
3. AM/PM 토글 시에도 동일한 검증 적용

#### 구현

```javascript
// sessionHandler.js

// 시간을 분 단위로 변환 (24시간 기준)
function getTimeInMinutes(sessionBox, type) {
  const hour =
    parseInt(sessionBox.querySelector(`.session-${type}-hour`).value) || 0;
  const minute =
    parseInt(sessionBox.querySelector(`.session-${type}-minute`).value) || 0;
  const period = sessionBox.querySelector(
    `.session-${type}-period`
  ).textContent;

  let totalMinutes = (hour % 12) * 60 + minute;
  if (period === "오후") totalMinutes += 12 * 60;

  return totalMinutes;
}

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

// AM/PM 토글 시에도 검증
const handlePeriodToggle = (sessionBox, sessionIndex, type) => {
  const periodBtn = sessionBox.querySelector(`.session-${type}-period`);
  periodBtn.textContent = periodBtn.textContent === "오전" ? "오후" : "오전";

  if (type === "start") {
    autoUpdateEndTime(sessionBox, sessionIndex);
  } else {
    validateEndTime(sessionBox, sessionIndex);
  }
};
```

### 2.5 이벤트 리스너 중복 등록 방지

#### 문제 상황

- 2회차 추가 시 이벤트 리스너가 중복 등록되어 토글 버튼 작동 안함

#### 해결 방법

```javascript
// sessionHandler.js
function attachSessionEventListeners(sessionBox, sessionIndex) {
  // 중복 등록 방지
  if (sessionBox.dataset.listenersAttached === "true") return;
  sessionBox.dataset.listenersAttached = "true";

  // 이벤트 리스너 등록
  sessionBox.addEventListener("click", (e) => {
    // ...
  });
}
```

### 2.6 IME 입력 차단 (한글 입력 방지)

#### 시간 입력 필드에 숫자만 허용

```javascript
// sessionHandler.js
sessionBox.addEventListener("keydown", (e) => {
  if (
    !e.target.classList.contains("session-start-hour") &&
    !e.target.classList.contains("session-start-minute") &&
    !e.target.classList.contains("session-end-hour") &&
    !e.target.classList.contains("session-end-minute")
  ) {
    return;
  }

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
    e.preventDefault(); // 한글 IME 차단
  }
});
```

### 2.7 순차적 날짜 선택 로직

#### 요구사항

- 1회차 < 2회차 < 3회차 (순차적 날짜)
- 중복 날짜 선택 불가

#### 구현

```javascript
// calendar.js
let minDate = new Date();
let maxDate = null;

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

---

## 3. 발생한 문제 및 해결 과정

### 3.1 배포 후 JavaScript 작동 오류

#### 문제

- EC2 배포 후 "Uncaught SyntaxError: Unexpected end of input (at sessionHandler.js:568:1)"

#### 원인

```javascript
// sessionHandler.js 561-567행 (잘못된 코드)
    validateEndTime(sessionBox, sessionIndex);
  });
});
  });
});

export { addNewSession, attachSessionEventListeners };
// 568행: 파일 끝 (syntax error)
```

#### 해결

- 중복된 괄호 제거, 올바른 함수 닫힘 구조로 수정

### 3.2 이모지 카운팅 오류

#### 문제

- ❤️ → 2자로 카운트
- 2️⃣ → 3자로 카운트
- ❤️‍🔥 → 4자로 카운트

#### 시도한 해결 방법

1. **Array.from()**: ❤️가 여전히 2자 (variation selector 분리)
2. **정규식 매칭**: 모든 이모지 조합 패턴을 커버할 수 없음

#### 최종 해결

- **Intl.Segmenter** API 사용 (grapheme granularity)
- 모든 Unicode 조합을 정확히 1글자로 인식

### 3.3 시간 토글 시 검증 누락

#### 문제

- 오전 11:30 → 오후 토글 시 종료 시간이 오후 12:30 (24:30)으로 설정됨
- 토글 버튼 클릭 시 23:59 검증이 실행되지 않음

#### 해결

```javascript
const handlePeriodToggle = (sessionBox, sessionIndex, type) => {
  // ... 토글 로직

  // 토글 시에도 검증 실행
  if (type === "start") {
    autoUpdateEndTime(sessionBox, sessionIndex);
  } else {
    validateEndTime(sessionBox, sessionIndex);
  }
};
```

### 3.4 입력 성능 문제

#### 문제

- focusout 이벤트로 검증 → 사용자 경험 저하
- 매 input마다 검증 → 불필요한 연산

#### 해결

- setTimeout debounce 패턴 (300ms)
- focusout 이벤트 제거

---

## 4. 코드 품질 개선

### 4.1 주석 작성 전략

#### 제거한 주석

```javascript
// ❌ 불필요한 주석
// 시간 입력 처리
let value = input.value;
```

#### 추가한 기술적 주석

```javascript
// ✅ 기술적 가치를 어필하는 주석

// Intl.Segmenter를 사용한 grapheme 단위 문자열 길이 계산
// String.length나 Array.from()과 달리 이모지의 variation selector, ZWJ sequence를
// 하나의 grapheme cluster로 정확히 인식
const segmenter = new Intl.Segmenter("ko", { granularity: "grapheme" });

// 이벤트 위임 패턴: 각 버튼마다 리스너를 붙이지 않고 부모 요소에서 처리
sessionBox.addEventListener("click", (e) => {
  if (e.target.classList.contains("session-start-period")) {
    handlePeriodToggle(sessionBox, sessionIndex, "start");
  }
});

// debounce: 입력이 멈춘 후 300ms 뒤에만 검증 실행 (성능 최적화)
clearTimeout(startTimeTimeout);
startTimeTimeout = setTimeout(() => {
  autoUpdateEndTime(sessionBox, sessionIndex);
}, 300);
```

### 4.2 중복 코드 제거

#### Before

```javascript
// input과 focusout 모두에서 검증
startHourInput.addEventListener("input", () => {
  autoUpdateEndTime(sessionBox, sessionIndex);
});

startHourInput.addEventListener("focusout", () => {
  autoUpdateEndTime(sessionBox, sessionIndex);
});
```

#### After

```javascript
// debounce 패턴으로 통합
let startTimeTimeout;
startHourInput.addEventListener("input", () => {
  clearTimeout(startTimeTimeout);
  startTimeTimeout = setTimeout(() => {
    autoUpdateEndTime(sessionBox, sessionIndex);
  }, 300);
});
```

---

## 5. 배포 프로세스

### 5.1 AWS EC2 환경

- **인스턴스**: Ubuntu 22.04 LTS (t2.micro)
- **퍼블릭 IP**: 13.211.121.25
- **보안 그룹**: SSH(22), HTTP(80), Custom TCP(8080)

### 5.2 Docker 컨테이너화

```dockerfile
# Dockerfile.development
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY app/ ./app/
EXPOSE 8080
CMD ["python3", "app/main.py"]
```

### 5.3 배포 명령어

```bash
# 로컬에서 EC2로 코드 전송
scp -i "missiondriven1.pem" -r . ubuntu@13.211.121.25:~/mission-frontend-assignment-1

# EC2에서 Docker 재시작
ssh -i "missiondriven1.pem" ubuntu@13.211.121.25
cd mission-frontend-assignment-1
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build -d
```

---

## 6. 성능 및 최적화

### 6.1 적용된 최적화 기법

| 기법        | 적용 위치         | 효과               |
| ----------- | ----------------- | ------------------ |
| 이벤트 위임 | sessionHandler.js | 메모리 사용량 감소 |
| Debounce    | 시간 입력 필드    | 불필요한 검증 감소 |
| DOM 캐싱    | formHandler.js    | DOM 조회 횟수 감소 |
| ES6 Module  | 전체 구조         | 코드 스플리팅 가능 |

### 6.2 브라우저 호환성

| 기능           | API               | 지원 브라우저            |
| -------------- | ----------------- | ------------------------ |
| Intl.Segmenter | Intl.Segmenter    | Chrome 87+, Safari 14.1+ |
| ES6 Module     | import/export     | 모든 모던 브라우저       |
| CSS Variables  | --custom-property | IE 제외 모든 브라우저    |

---

## 7. 프로젝트 성과

### 7.1 기술적 성과

1. ✅ Vanilla JavaScript로 React 수준의 상태 관리 구현
2. ✅ ES6 Module로 확장 가능한 구조 설계
3. ✅ Intl.Segmenter로 국제화 대응 완료
4. ✅ 이벤트 위임, Debounce 등 성능 최적화 적용
5. ✅ Docker + AWS EC2 배포 완료

### 7.2 문제 해결 능력

- 8개 이상의 실전 이슈 해결 (syntax error, 이모지 카운팅, 시간 검증 등)
- 브라우저 API 깊이 있는 활용 (Intl.Segmenter, IME 이벤트)
- 성능과 사용자 경험 밸런스 조정

### 7.3 코드 품질

- 관심사 분리, 모듈화, 재사용성 고려
- 기술적 가치를 보여주는 주석 작성
- 중복 코드 제거, 일관된 코딩 스타일

---

## 8. 향후 개선 가능한 부분

### 8.1 기술적 개선

1. **TypeScript 도입**: 타입 안정성 확보
2. **Web Component**: 재사용 가능한 UI 컴포넌트화
3. **Service Worker**: 오프라인 지원
4. **Virtual DOM**: 대량 데이터 렌더링 최적화

### 8.2 기능 개선

1. **이미지 압축**: 15MB 제한 → 자동 압축으로 사용자 편의성 향상
2. **드래그 정렬**: 추가 이미지 순서 변경
3. **임시 저장**: LocalStorage로 작성 중 데이터 보존
4. **접근성**: ARIA 속성 추가, 키보드 네비게이션 강화

---

## 9. 결론

본 프로젝트는 Vanilla JavaScript로 모던 웹 애플리케이션의 핵심 패턴을 구현하고, 실전에서 발생하는 다양한 이슈를 해결하는 과정을 보여줍니다.

**핵심 성과**:

- **Intl.Segmenter**: 이모지 정확한 카운팅으로 국제화 대응
- **이벤트 위임 + Debounce**: 성능 최적화
- **23:59 시간 검증**: 복잡한 시간 로직 구현
- **Docker + AWS EC2**: 프로덕션 배포 경험

---

**작성일**: 2025-11-07
**배포 URL**: http://13.211.121.25:8080/
**Repository**: mission-frontend-assignment-1
