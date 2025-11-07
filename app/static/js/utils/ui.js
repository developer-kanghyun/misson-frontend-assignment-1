// UI 유틸리티 함수

// 토스트 메시지 표시
export const showToast = (msg) => {
    const existing = document.querySelector(".toast-message");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "toast-message";
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("toast-hide");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

export const showLoading = () => {
    const overlay = document.createElement("div");
    overlay.className = "loading-overlay";
    overlay.id = "loadingOverlay";
    overlay.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div class="loading-spinner"></div>
          <div class="loading-text">콘텐츠를 등록하는 중입니다...</div>
        </div>
      `;
    document.body.appendChild(overlay);
};

export const hideLoading = () => {
    document.getElementById("loadingOverlay")?.remove();
};

// Textarea 내용에 따라 높이 자동 조절 (최소 140px, 최대 296px)
export const autoGrowTextarea = (textarea) => {
    textarea.style.height = "auto";
    const MIN_HEIGHT = 140;
    const MAX_HEIGHT = 296;
    const scrollHeight = textarea.scrollHeight;

    if (scrollHeight < MIN_HEIGHT) {
        textarea.style.height = MIN_HEIGHT + "px";
        textarea.classList.remove("overflow-scroll");
    } else if (scrollHeight > MAX_HEIGHT) {
        textarea.style.height = MAX_HEIGHT + "px";
        textarea.classList.add("overflow-scroll");
    } else {
        textarea.style.height = scrollHeight + "px";
        textarea.classList.remove("overflow-scroll");
    }
};
