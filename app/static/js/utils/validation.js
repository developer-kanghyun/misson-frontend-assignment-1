import { MAX_FILE_SIZE } from "./constants.js";
import { showToast } from "./ui.js";

// 정확한 문자 길이 계산 (이모지 포함)
// Intl.Segmenter 사용 - 브라우저 내장 API로 grapheme 단위로 정확히 분리
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

// 정규식으로 연속된 공백 패턴 검사 (공백 2개 이상, 연속 줄바꿈, 공백+줄바꿈 조합)
export const hasConsecutiveSpaces = (text) => /  +|\n\n+|\s\n|\n\s/.test(text);

// 프론트엔드에서는 확장자와 파일 크기만 검증 (실제 이미지 포맷 검증은 백엔드에서 수행)
export const isImageValid = (file) => {
  const fileName = file.name.toLowerCase();

  if (!fileName.endsWith(".jpg") && !fileName.endsWith(".png")) {
    showToast("JPG 또는 PNG 파일만 업로드할 수 있습니다.");
    return false;
  }

  if (file.size > MAX_FILE_SIZE) {
    showToast("파일 크기는 15MB를 초과할 수 없습니다.");
    return false;
  }

  return true;
};

// 12시간제(오전/오후) -> 24시간제 분 단위로 변환 (비교 및 계산용)
export const minutesFrom12Hour = (period, hour, minute) => {
  let h = parseInt(hour) || 0;
  if (period === "오후" && h !== 12) {
    h += 12;
  } else if (period === "오전" && h === 12) {
    h = 0;
  }
  return h * 60 + (parseInt(minute) || 0);
};

// 24시간제 분 단위 -> 12시간제(오전/오후) 표시로 역변환
export const format12Hour = (minutes) => {
  let h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  const period = h >= 12 ? "오후" : "오전";
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return { period, hour: h, minute: String(m).padStart(2, "0") };
};

export const validateTimeInput = (input) => {
  // 정규식으로 숫자만 필터링
  let value = input.value.replace(/[^0-9]/g, "");

  // 빈 값 허용 (사용자 입력 중)
  if (value === "") {
    input.value = "";
    return;
  }

  const min = parseInt(input.getAttribute("min")) || 0;
  const max = parseInt(input.getAttribute("max")) || 59;

  // 3자리 이상 입력되면 마지막 2자리만 사용 (예: "109" -> "09")
  if (value.length > 2) {
    value = value.slice(-2);
  }

  const numValue = parseInt(value);

  if (numValue < min) {
    input.value = String(min);
  } else if (numValue > max) {
    input.value = String(max);
  } else {
    input.value = value;
  }
};
