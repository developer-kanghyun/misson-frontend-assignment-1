import { state } from "./state.js";
import { CATEGORIES } from "../utils/constants.js";
import { showToast } from "../utils/ui.js";
import { updateNextButton } from "./formHandler.js";

// 카테고리 선택 화면 열기 - DOM 캐싱으로 성능 최적화
export const openCategoryScreen = () => {
  state.tempCategories = [...state.categories];

  const categoryScreen = document.getElementById("category-screen");
  categoryScreen.classList.remove("hidden");
  categoryScreen.style.display = "block";
  const container = document.querySelector(".container");
  container.style.display = "none";

  // 메인 페이지 하단 네비게이션 버튼을 카테고리 버튼으로 전환
  const bottomNavBtn = document.querySelector(".bottom-nav .btn-next");
  if (bottomNavBtn) {
    bottomNavBtn.textContent = "다음으로";
    bottomNavBtn.classList.add("category-mode");
    bottomNavBtn.disabled = true; // 초기에는 비활성화
  }

  const categoryGrid = document.getElementById("category-grid");
  categoryGrid.innerHTML = "";

  // 카테고리 버튼 동적 생성 및 이벤트 연결
  CATEGORIES.forEach((category) => {
    const button = document.createElement("button");
    button.className = "category-toggle-btn";
    button.textContent = category;

    if (state.tempCategories.includes(category)) button.classList.add("selected");

    button.addEventListener("click", () => {
      const index = state.tempCategories.indexOf(category);
      if (index > -1) {
        state.tempCategories = state.tempCategories.filter((c) => c !== category);
        button.classList.remove("selected");
      } else {
        if (state.tempCategories.length >= 2) {
          showToast("최대 2개까지만 선택할 수 있습니다");
          return;
        }
        state.tempCategories = [...state.tempCategories, category];
        button.classList.add("selected");
      }
      updateCategoryNextButton();
    });

    categoryGrid.appendChild(button);
  });

  updateCategoryNextButton();
};

// 카테고리 선택 화면 닫기
export const closeCategoryScreen = () => {
  const categoryScreen = document.getElementById("category-screen");
  categoryScreen.classList.add("hidden");
  categoryScreen.style.display = "none";
  const container = document.querySelector(".container");
  container.style.display = "block";

  // 메인 페이지 하단 네비게이션 버튼을 원래대로 복구
  const bottomNavBtn = document.querySelector(".bottom-nav .btn-next");
  if (bottomNavBtn) {
    bottomNavBtn.classList.remove("category-mode");
  }

  state.tempCategories = [];
};

// 카테고리 선택 완료 버튼 활성화 여부 업데이트
export const updateCategoryNextButton = () => {
  const categoryNextButtons = document.querySelectorAll(".btn-category-next");
  const canProceed = state.tempCategories.length > 0;

  // 카테고리 전용 버튼들 업데이트
  categoryNextButtons.forEach((btn) => {
    btn.disabled = !canProceed;
    btn.classList.toggle("disabled", !canProceed);
  });

  // 메인 하단 네비의 버튼이 카테고리 모드일 때도 업데이트
  const bottomNavBtn = document.querySelector(".bottom-nav .btn-next.category-mode");
  if (bottomNavBtn) {
    bottomNavBtn.disabled = !canProceed;
    bottomNavBtn.classList.toggle("disabled", !canProceed);
  }
};

// 카테고리 선택 확정, 글로벌 상태 업데이트
export const confirmCategorySelection = (e) => {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }

  state.categories = [...state.tempCategories];

  // 화면 전환을 약간 지연시켜 클릭 이벤트 충돌 방지
  setTimeout(() => {
    closeCategoryScreen();
    const categoryInput = document.querySelector(".category-input");
    categoryInput.value = state.categories.join(", ");
    updateNextButton();
  }, 50);
};
