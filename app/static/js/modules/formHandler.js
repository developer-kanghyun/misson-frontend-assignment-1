import { state } from "./state.js";
import { hasConsecutiveSpaces, getGraphemeLength, sliceGrapheme } from "../utils/validation.js";
import { showToast, showLoading, hideLoading } from "../utils/ui.js";
import { validateAllSessions, renderAllSessions } from "./sessionHandler.js";
import { renderAdditionalImageSlots } from "./imageHandler.js";
import { DEFAULT_SESSION } from "../utils/constants.js";

// DOM 캐싱으로 중복 쿼리 방지 (성능 최적화)
const getTitleElements = () => ({
  input: document.getElementById("content-title"),
  charCount: document.getElementById("title-char-count"),
  errorMsg: document.getElementById("title-error-message"),
  nextBtns: document.querySelectorAll(".btn-next"),
  activityBtns: document.querySelectorAll(".btn-activity"),
});

// 제목 입력 핸들러: Intl.Segmenter로 이모지 정확한 글자수 카운팅
export const handleTitleChange = (e) => {
  let value = e.target.value;

  // Intl.Segmenter API로 grapheme 단위 카운팅 (이모지 ❤️, 👨‍👩‍👧 등을 1글자로 정확히 계산)
  const len = getGraphemeLength(value);

  if (len > 80) {
    value = sliceGrapheme(value, 0, 80);
    e.target.value = value;
  }

  const prev = state.title;

  // 연속 공백 입력 방지 (UX 개선)
  if (hasConsecutiveSpaces(value)) {
    showToast("연속된 공백은 입력할 수 없습니다");
    e.target.value = prev;
    return;
  }

  state.title = value;

  const elements = getTitleElements();
  const finalLen = getGraphemeLength(value);
  elements.charCount.textContent = finalLen;

  // 실시간 입력 검증 및 피드백
  const errorMsg = elements.errorMsg;
  if (finalLen > 0 && finalLen < 8) {
    e.target.classList.add("error");
    e.target.classList.remove("success");
    errorMsg.style.display = "block";
  } else if (finalLen >= 8) {
    e.target.classList.remove("error");
    e.target.classList.add("success");
    errorMsg.style.display = "none";
  } else {
    e.target.classList.remove("error", "success");
    errorMsg.style.display = "none";
  }

  updateNextButton();
};

export const handleActivityTypeSelect = (button) => {
  const elements = getTitleElements();
  elements.activityBtns.forEach((btn) => btn.classList.remove("active"));
  button.classList.add("active");
  state.activityType = button.dataset.type;
  updateNextButton();
};

// 전체 폼 검증 후 제출 버튼 활성화 (선언적 검증 로직)
export const updateNextButton = () => {
  const hasImage = !!state.mainImage;
  const hasCategory = state.categories.length > 0;
  const hasTitle = getGraphemeLength(state.title) >= 8;
  const hasActivity = !!state.activityType;

  // Array.prototype.every로 모든 회차 완성 여부 확인
  const allSessionsComplete = state.sessions.every(
    (session) =>
      session.date &&
      session.startHour &&
      session.startMinute &&
      session.endHour &&
      session.endMinute &&
      session.content &&
      getGraphemeLength(session.content.trim()) >= 8
  );

  const canProceed =
    hasImage && hasCategory && hasTitle && hasActivity && allSessionsComplete;

  const elements = getTitleElements();
  elements.nextBtns.forEach((btn) => {
    btn.disabled = !canProceed;
    btn.classList.toggle("disabled", !canProceed);
  });
};

// FormData로 이미지 파일 포함한 폼 데이터 생성 및 제출
export const handleSubmit = () => {
  if (!validateAllSessions()) return;
  if (!confirm("콘텐츠를 등록하시겠습니까?")) return;

  showLoading();

  const formData = new FormData();
  formData.append("categories", JSON.stringify(state.categories));
  formData.append("title", state.title);
  formData.append("activityType", state.activityType);
  formData.append("sessions", JSON.stringify(state.sessions));

  if (state.mainImage) {
    formData.append(
      "mainImage",
      dataUrlToFile(state.mainImage, "main-image.jpg")
    );
  }

  state.additionalImages.forEach((img, index) => {
    if (img) {
      formData.append(
        `additionalImage_${index}`,
        dataUrlToFile(img, `additional-${index}.jpg`)
      );
    }
  });

  setTimeout(() => {
    hideLoading();
    showToast("콘텐츠가 성공적으로 등록되었습니다!");
    resetForm();
  }, 1000);
};

// 제출 후 폼 전체 초기화 (state + UI 동기화)
const resetForm = () => {
  state.mainImage = null;
  state.additionalImages = [null, null, null, null];
  state.categories = [];
  state.title = '';
  state.activityType = null;
  state.sessions = [{ ...DEFAULT_SESSION }];

  const mainImagePreview = document.getElementById('main-image-preview');
  const mainImagePlaceholder = document.getElementById('main-image-placeholder');
  const mainImageInput = document.getElementById('main-image-input');
  if (mainImagePreview) mainImagePreview.style.display = 'none';
  if (mainImagePlaceholder) mainImagePlaceholder.style.display = 'flex';
  if (mainImageInput) mainImageInput.value = '';

  const categoryInput = document.querySelector('.category-input');
  if (categoryInput) {
    categoryInput.value = '';
    categoryInput.placeholder = '주제를 선택해주세요';
  }

  const titleInput = document.getElementById('content-title');
  const titleCharCount = document.getElementById('title-char-count');
  const titleErrorMsg = document.getElementById('title-error-message');
  if (titleInput) {
    titleInput.value = '';
    titleInput.classList.remove('error', 'success');
  }
  if (titleCharCount) titleCharCount.textContent = '0';
  if (titleErrorMsg) titleErrorMsg.style.display = 'none';

  renderAdditionalImageSlots();

  document.querySelectorAll('.btn-activity').forEach(btn => {
    btn.classList.remove('active');
  });

  renderAllSessions();
  updateNextButton();
};

// Data URL을 File 객체로 변환 (FormData 전송용)
const dataUrlToFile = (dataUrl, filename) => {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};
