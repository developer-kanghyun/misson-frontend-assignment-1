import { state } from "./state.js";
import { DEFAULT_SESSION } from "../utils/constants.js";
import { showToast, autoGrowTextarea } from "../utils/ui.js";
import {
  hasConsecutiveSpaces,
  minutesFrom12Hour,
  format12Hour,
  validateTimeInput,
  getGraphemeLength,
  sliceGrapheme,
} from "../utils/validation.js";
import { updateNextButton } from "./formHandler.js";


// 이벤트 위임 패턴으로 성능 최적화 (각 요소마다 리스너 등록하지 않고 부모에만 등록)
let startTimeTimeout = null;
let endTimeTimeout = null;

export const attachSessionListeners = (sessionBox, sessionIndex) => {
  if (sessionBox.dataset.listenersAttached === "true") return;
  sessionBox.dataset.listenersAttached = "true";

  // 클릭 이벤트 위임
  sessionBox.addEventListener("click", (e) => {
    if (e.target.classList.contains("session-start-period")) {
      handlePeriodToggle(sessionBox, sessionIndex, "start");
    }
    if (e.target.classList.contains("session-end-period")) {
      handlePeriodToggle(sessionBox, sessionIndex, "end");
    }
    if (e.target.classList.contains("btn-delete-session")) {
      e.preventDefault();
      e.stopPropagation();
      openDeleteModal(sessionIndex);
    }
  });

  sessionBox.addEventListener("input", (e) => {
    const target = e.target;

    if (
      target.classList.contains("session-start-hour") ||
      target.classList.contains("session-start-minute")
    ) {
      validateTimeInput(target);
      state.sessions[sessionIndex][
        target.classList.contains("session-start-hour")
          ? "startHour"
          : "startMinute"
      ] = target.value;

      // Debounce: 연속 입력 시 마지막 입력 300ms 후에만 종료 시간 업데이트
      clearTimeout(startTimeTimeout);
      startTimeTimeout = setTimeout(() => {
        autoUpdateEndTime(sessionBox, sessionIndex);
      }, 300);
    }

    if (
      target.classList.contains("session-end-hour") ||
      target.classList.contains("session-end-minute")
    ) {
      validateTimeInput(target);
      state.sessions[sessionIndex][
        target.classList.contains("session-end-hour") ? "endHour" : "endMinute"
      ] = target.value;

      // Debounce: 300ms 후 검증
      clearTimeout(endTimeTimeout);
      endTimeTimeout = setTimeout(() => {
        if (target.value) {
          validateEndTime(sessionBox, sessionIndex);
        }
      }, 300);
    }

    if (target.classList.contains("session-content")) {
      let value = target.value;

      const len = getGraphemeLength(value);

      if (len > 1000) {
        value = sliceGrapheme(value, 0, 1000);
        target.value = value;
      }

      const prev = state.sessions[sessionIndex].content;

      if (hasConsecutiveSpaces(value)) {
        showToast("연속된 공백은 입력할 수 없습니다");
        target.value = prev;
        autoGrowTextarea(target);
        return;
      }

      const finalLen = getGraphemeLength(value);
      state.sessions[sessionIndex].content = value;
      updateContentUI(sessionBox, target, finalLen);
    }
  });

  // 시간 입력 필드: keydown에서 숫자만 허용 (한글 IME 입력 차단)
  sessionBox.addEventListener("keydown", (e) => {
    const target = e.target;
    if (
      target.classList.contains("session-start-hour") ||
      target.classList.contains("session-start-minute") ||
      target.classList.contains("session-end-hour") ||
      target.classList.contains("session-end-minute")
    ) {
      const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
      const isNumber = /^[0-9]$/.test(e.key);
      const isAllowedKey = allowedKeys.includes(e.key);

      if (!isNumber && !isAllowedKey) {
        e.preventDefault();
      }
    }
  });
};

// 시작/종료 오전/오후 토글 처리
const handlePeriodToggle = (sessionBox, sessionIndex, type) => {
  const btn = sessionBox.querySelector(`.session-${type}-period`);
  const newValue = btn.dataset.value === "오전" ? "오후" : "오전";
  btn.dataset.value = newValue;
  btn.textContent = newValue;
  state.sessions[sessionIndex][`${type}Period`] = newValue;

  // 시작 토글 변경 시 종료 시간도 자동 +1시간 업데이트
  if (type === "start") {
    autoUpdateEndTime(sessionBox, sessionIndex);
  } else {
    validateEndTime(sessionBox, sessionIndex);
  }
  updateNextButton();
};

// 콘텐츠 입력 UI 업데이트
const updateContentUI = (sessionBox, target, len) => {
  const charCount = sessionBox.querySelector(".session-char-count");
  const errorMsg = sessionBox.querySelector(".session-content-error");

  if (charCount) charCount.textContent = len;
  autoGrowTextarea(target);

  if (len > 0 && len < 8) {
    target.classList.add("error");
    target.classList.remove("success");
    if (errorMsg) errorMsg.style.display = "block";
  } else if (len >= 8) {
    target.classList.remove("error");
    target.classList.add("success");
    if (errorMsg) errorMsg.style.display = "none";
  } else {
    target.classList.remove("error", "success");
    if (errorMsg) errorMsg.style.display = "none";
  }

  updateNextButton();
};

// 시작 시간 변경 시 항상 종료 시간을 시작+1시간으로 자동 업데이트 (23:59 제한)
const autoUpdateEndTime = (sessionBox, sessionIndex) => {
  const startPeriod = sessionBox.querySelector(".session-start-period")?.dataset
    .value;
  const startHour = parseInt(
    sessionBox.querySelector(".session-start-hour")?.value
  );
  const startMinute = parseInt(
    sessionBox.querySelector(".session-start-minute")?.value
  );

  if (!startPeriod || !startHour || isNaN(startMinute)) return;

  const startMinutes = minutesFrom12Hour(startPeriod, startHour, startMinute);
  const endMinutes = Math.min(startMinutes + 60, 23 * 60 + 59); // 23:59 제한
  const endTime = format12Hour(endMinutes);

  const endPeriodBtn = sessionBox.querySelector(".session-end-period");
  const endHourInput = sessionBox.querySelector(".session-end-hour");
  const endMinuteInput = sessionBox.querySelector(".session-end-minute");

  if (endPeriodBtn) {
    endPeriodBtn.dataset.value = endTime.period;
    endPeriodBtn.textContent = endTime.period;
  }
  if (endHourInput) endHourInput.value = endTime.hour;
  if (endMinuteInput) endMinuteInput.value = endTime.minute;

  if (state.sessions[sessionIndex]) {
    state.sessions[sessionIndex].endPeriod = endTime.period;
    state.sessions[sessionIndex].endHour = String(endTime.hour);
    state.sessions[sessionIndex].endMinute = endTime.minute;
  }
};

// 시작 시간, 종료 시간 검증
const validateEndTime = (sessionBox, sessionIndex) => {
  const startPeriod = sessionBox.querySelector(".session-start-period")?.dataset
    .value;
  const startHour = parseInt(
    sessionBox.querySelector(".session-start-hour")?.value
  );
  const startMinute = parseInt(
    sessionBox.querySelector(".session-start-minute")?.value
  );
  const endPeriod = sessionBox.querySelector(".session-end-period")?.dataset
    .value;
  const endHour = parseInt(
    sessionBox.querySelector(".session-end-hour")?.value
  );
  const endMinute = parseInt(
    sessionBox.querySelector(".session-end-minute")?.value
  );

  if (
    !startPeriod ||
    !startHour ||
    isNaN(startMinute) ||
    !endPeriod ||
    !endHour ||
    isNaN(endMinute)
  ) {
    return;
  }

  const startMinutes = minutesFrom12Hour(startPeriod, startHour, startMinute);
  const endMinutes = minutesFrom12Hour(endPeriod, endHour, endMinute);

  // 종료 시간이 23:59 초과하면 자동 보정
  if (endMinutes > 23 * 60 + 59) {
    const correctedTime = format12Hour(23 * 60 + 59);
    const endPeriodBtn = sessionBox.querySelector(".session-end-period");
    const endHourInput = sessionBox.querySelector(".session-end-hour");
    const endMinuteInput = sessionBox.querySelector(".session-end-minute");
    if (endPeriodBtn) {
      endPeriodBtn.dataset.value = correctedTime.period;
      endPeriodBtn.textContent = correctedTime.period;
    }
    if (endHourInput) endHourInput.value = correctedTime.hour;
    if (endMinuteInput) endMinuteInput.value = correctedTime.minute;
    state.sessions[sessionIndex].endPeriod = correctedTime.period;
    state.sessions[sessionIndex].endHour = String(correctedTime.hour);
    state.sessions[sessionIndex].endMinute = correctedTime.minute;
    return;
  }

  // 종료 시간이 시작보다 빠르면 자동 보정
  if (endMinutes <= startMinutes) {
    showToast("시작 시간보다 종료시간은 빠를 수 없습니다.");
    autoUpdateEndTime(sessionBox, sessionIndex);
  }
};

// 날짜 표시 포맷
export const fillSessionData = (sessionBox, sessionData) => {
  if (!sessionBox) return;

  const dateInput = sessionBox.querySelector(".session-date");
  if (dateInput) {
    if (sessionData.date) {
      const [year, month, day] = sessionData.date.split("-");
      dateInput.value = `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`;
    } else {
      dateInput.value = "";
    }
  }

  const elements = {
    startPeriod: sessionBox.querySelector(".session-start-period"),
    startHour: sessionBox.querySelector(".session-start-hour"),
    startMinute: sessionBox.querySelector(".session-start-minute"),
    endPeriod: sessionBox.querySelector(".session-end-period"),
    endHour: sessionBox.querySelector(".session-end-hour"),
    endMinute: sessionBox.querySelector(".session-end-minute"),
    content: sessionBox.querySelector(".session-content"),
    charCount: sessionBox.querySelector(".session-char-count"),
  };

  if (elements.startPeriod) {
    elements.startPeriod.textContent = sessionData.startPeriod;
    elements.startPeriod.dataset.value = sessionData.startPeriod;
  }
  if (elements.startHour) elements.startHour.value = sessionData.startHour;
  if (elements.startMinute)
    elements.startMinute.value = sessionData.startMinute;
  if (elements.endPeriod) {
    elements.endPeriod.textContent = sessionData.endPeriod;
    elements.endPeriod.dataset.value = sessionData.endPeriod;
  }
  if (elements.endHour) elements.endHour.value = sessionData.endHour;
  if (elements.endMinute) elements.endMinute.value = sessionData.endMinute;
  if (elements.content) {
    elements.content.value = sessionData.content || "";
    autoGrowTextarea(elements.content);
  }
  if (elements.charCount) {
    const contentLength = sessionData.content
      ? getGraphemeLength(sessionData.content)
      : 0;
    elements.charCount.textContent = contentLength;
  }
};

// 2회차 이상 회차 카드 생성
const createSessionCard = (sessionData, index) => {
  const template = document.getElementById("session-template");
  if (!template || index === 0) return null;

  const clonedBox = template.cloneNode(true);
  delete clonedBox.dataset.listenersAttached;
  clonedBox.id = "";
  clonedBox.setAttribute("data-session-index", String(index));
  clonedBox.classList.remove("hidden");
  clonedBox.style.display = "block";

  const title = clonedBox.querySelector(".session-info-title");
  if (title) title.textContent = `${index + 1}회차 정보`;

  const dateInput = clonedBox.querySelector(".session-date");
  if (dateInput) dateInput.setAttribute("data-session-index", String(index));

  fillSessionData(clonedBox, sessionData);
  attachSessionListeners(clonedBox, index);

  return clonedBox;
};

// 모든 회차 렌더링 및 이벤트 연결
export const renderAllSessions = () => {
  const template = document.getElementById("session-template");
  const container = document.getElementById("session-container");

  if (!template || !container) return;

  let nextElement = template.nextElementSibling;
  while (nextElement) {
    const toRemove = nextElement;
    nextElement = nextElement.nextElementSibling;
    toRemove.remove();
  }

  fillSessionData(template, state.sessions[0]);
  attachSessionListeners(template, 0);

  for (let i = 1; i < state.sessions.length; i++) {
    const card = createSessionCard(state.sessions[i], i);
    if (card) container.appendChild(card);
  }

  updateSessionCounts();
  updateDeleteButtonVisibility();
};

// 회차 제목 업데이트
const updateSessionCounts = () => {
  const template = document.getElementById("session-template");
  const cards = Array.from(
    document.querySelectorAll(".session-info-box")
  ).filter((card) => card.id !== "session-template");

  const total = 1 + cards.length;
  const title = template.querySelector(".session-info-title");
  if (title) title.textContent = total === 1 ? "회차정보" : "1회차 정보";

  cards.forEach((card, idx) => {
    const cardTitle = card.querySelector(".session-info-title");
    if (cardTitle) cardTitle.textContent = `${idx + 2}회차 정보`;
  });
};

// 삭제 버튼 표시 여부 (2회차 이상일 때만 표시)
const updateDeleteButtonVisibility = () => {
  const template = document.getElementById("session-template");
  const cards = Array.from(
    document.querySelectorAll(".session-info-box")
  ).filter((card) => card.id !== "session-template");

  const canDelete = 1 + cards.length >= 2;

  const templateBtn = template.querySelector(".btn-delete-session");
  if (templateBtn) templateBtn.style.display = canDelete ? "flex" : "none";

  cards.forEach((card) => {
    const btn = card.querySelector(".btn-delete-session");
    if (btn) btn.style.display = canDelete ? "flex" : "none";
  });
};

// 순차적 날짜 선택: 1회차 < 2회차 < 3회차 순서 보장
const getDateRangeForSession = (sessionIndex) => {
  let minDate = new Date();
  minDate.setHours(0, 0, 0, 0);

  let maxDate = new Date(2099, 11, 31);
  maxDate.setHours(23, 59, 59, 999);

  // 이전 회차 +1일 제약
  if (sessionIndex > 0 && state.sessions[sessionIndex - 1]?.date) {
    const prevDate = new Date(state.sessions[sessionIndex - 1].date);
    minDate = new Date(prevDate);
    minDate.setDate(minDate.getDate() + 1);
    minDate.setHours(0, 0, 0, 0);
  }

  // 다음 회차 -1일 제약
  if (
    sessionIndex < state.sessions.length - 1 &&
    state.sessions[sessionIndex + 1]?.date
  ) {
    const nextDate = new Date(state.sessions[sessionIndex + 1].date);
    maxDate = new Date(nextDate);
    maxDate.setDate(maxDate.getDate() - 1);
    maxDate.setHours(23, 59, 59, 999);
  }

  // 중복 날짜 비활성화
  const disabledDates = [];
  state.sessions.forEach((session, idx) => {
    if (idx !== sessionIndex && session.date) {
      disabledDates.push(session.date);
    }
  });

  return { minDate, maxDate, disabledDates };
};

// 날짜 선택기 초기화
export const initializeDatePickers = () => {
  state.datePickerInstances.forEach((picker) => {
    if (picker?.destroy) picker.destroy();
  });
  state.datePickerInstances = [];

  document.querySelectorAll(".session-date").forEach((dateInput) => {
    const sessionIndex =
      parseInt(dateInput.getAttribute("data-session-index")) || 0;
    const { minDate, maxDate, disabledDates } =
      getDateRangeForSession(sessionIndex);

    const picker = new DatePickerCalendar(dateInput, {
      minDate,
      maxDate,
      disabledDates,
      onSelect: (selectedDate) => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDate.getDate()).padStart(2, "0");
        state.sessions[sessionIndex].date = `${year}-${month}-${day}`;
        setTimeout(() => initializeDatePickers(), 100);
        updateNextButton();
      },
    });

    state.datePickerInstances.push(picker);
  });
};

// 새로운 회차 추가
export const addNewSession = () => {
  // 달력 팝업 닫기 (렌더링 버그 방지)
  document.querySelectorAll(".calendar-popup.active").forEach((popup) => {
    popup.classList.remove("active");
  });

  const template = document.getElementById("session-template");
  const contentTextarea = template?.querySelector(".session-content");
  if (contentTextarea) {
    state.sessions[0].content = contentTextarea.value;
  }

  state.sessions.push({ ...DEFAULT_SESSION });
  renderAllSessions();

  setTimeout(() => {
    initializeDatePickers();
  }, 100);

  showToast(`${state.sessions.length}회차가 추가되었습니다!`);
  updateNextButton();
};

// 삭제 모달 열기
const openDeleteModal = (index) => {
  if (index < 0 || index >= state.sessions.length) {
    showToast("삭제할 수 없는 회차입니다");
    return;
  }

  state.sessionToDelete = index;
  const modal = document.getElementById("delete-modal");
  if (modal) {
    modal.classList.remove("hidden");
    modal.style.display = "flex";
  }
};

// 삭제 모달 닫기
export const closeDeleteModal = () => {
  state.sessionToDelete = null;
  const modal = document.getElementById("delete-modal");
  if (modal) {
    modal.style.display = "none";
    modal.classList.add("hidden");
  }
};

// 삭제 확인
export const confirmDeleteSession = () => {
  const index = state.sessionToDelete;
  if (index === null) return;

  state.sessions.splice(index, 1);
  renderAllSessions();

  setTimeout(() => {
    initializeDatePickers();
  }, 100);

  setTimeout(() => {
    updateDeleteButtonVisibility();
    updateSessionCounts();
  }, 150);

  closeDeleteModal();
  showToast("회차가 삭제되었습니다");
  updateNextButton();
};

// 모든 회차 유효성 검사
export const validateAllSessions = () => {
  for (let i = 0; i < state.sessions.length; i++) {
    const session = state.sessions[i];
    const num = i + 1;

    if (!session.date) {
      showToast(`${num}회차의 날짜를 입력해주세요.`);
      return false;
    }

    if (!session.startHour || !session.startMinute) {
      showToast(`${num}회차의 시작 시간을 입력해주세요.`);
      return false;
    }

    if (!session.endHour || !session.endMinute) {
      showToast(`${num}회차의 종료 시간을 입력해주세요.`);
      return false;
    }

    const startMinutes = minutesFrom12Hour(
      session.startPeriod,
      parseInt(session.startHour),
      parseInt(session.startMinute)
    );
    const endMinutes = minutesFrom12Hour(
      session.endPeriod,
      parseInt(session.endHour),
      parseInt(session.endMinute)
    );

    if (endMinutes <= startMinutes) {
      showToast(`${num}회차: 종료 시간은 시작 시간보다 늦어야 합니다`);
      return false;
    }

    const trimmedContent = session.content.trim();
    if (!session.content || trimmedContent.length === 0) {
      showToast(`${num}회차의 활동 내용을 입력해주세요.`);
      return false;
    }

    if (getGraphemeLength(trimmedContent) < 8) {
      showToast(`${num}회차: 활동 내용은 최소 8자 이상이어야 합니다`);
      return false;
    }
  }

  return true;
};
