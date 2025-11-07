import {
    handleMainImageSelect,
    handleMainImageRemove,
    setupMainImageDragDrop,
    renderAdditionalImageSlots
} from './imageHandler.js';
import {
    openCategoryScreen,
    closeCategoryScreen,
    confirmCategorySelection
} from './categoryHandler.js';
import {
    handleTitleChange,
    handleActivityTypeSelect,
    handleSubmit
} from './formHandler.js';
import {
    addNewSession,
    closeDeleteModal,
    confirmDeleteSession
} from './sessionHandler.js';

// 전체 이벤트 리스너 설정 - DOM 캐싱으로 중복 탐색 방지
export const setupEventListeners = () => {
    const mainImageBtn = document.getElementById('btn-main-image');
    const mainImageInput = document.getElementById('main-image-input');
    const mainImageUploadArea = document.getElementById('main-image-upload-area');
    const btnRemoveMainImage = document.getElementById('btn-remove-main-image');
    const categorySelectBtn = document.getElementById('category-select');
    const categoryExitBtn = document.getElementById('btn-category-exit');
    const categoryExitMobileBtn = document.querySelector('.btn-category-exit-mobile');
    const categoryNextBtns = document.querySelectorAll('.btn-category-next');
    const contentTitleInput = document.getElementById('content-title');
    const activityButtons = document.querySelectorAll('.btn-activity');
    const btnSubmit = document.getElementById('btn-submit');
    const nextButtons = document.querySelectorAll('.btn-next');
    const modalCloseBtn = document.getElementById('btn-delete-modal-close');
    const modalCancelBtn = document.getElementById('btn-delete-cancel');
    const modalConfirmBtn = document.getElementById('btn-delete-confirm');
    const deleteModal = document.getElementById('delete-modal');

    // 대표 이미지 업로드
    mainImageBtn?.addEventListener('click', e => {
        e.stopPropagation();
        mainImageInput?.click();
    });

    mainImageUploadArea?.addEventListener('click', () => mainImageInput?.click());

    mainImageInput?.addEventListener('change', e => {
        const file = e.target.files[0];
        if (file) handleMainImageSelect(file);
    });

    btnRemoveMainImage?.addEventListener('click', e => {
        e.stopPropagation();
        handleMainImageRemove();
    });

    setupMainImageDragDrop();
    renderAdditionalImageSlots();

    // 카테고리 선택
    categorySelectBtn?.addEventListener('click', openCategoryScreen);
    categoryExitBtn?.addEventListener('click', closeCategoryScreen);
    categoryExitMobileBtn?.addEventListener('click', closeCategoryScreen);
    categoryNextBtns.forEach(btn => btn.addEventListener('click', confirmCategorySelection));

    // 제목 입력
    contentTitleInput?.addEventListener('input', handleTitleChange);

    // 활동 유형 선택
    activityButtons.forEach(btn =>
      btn.addEventListener('click', e => handleActivityTypeSelect(e.target))
    );

    // 회차 추가
    btnSubmit?.addEventListener('click', addNewSession);

    // 폼 제출 - 카테고리 모드일 때는 카테고리 선택 실행
    nextButtons.forEach(btn => btn.addEventListener('click', (e) => {
        if (btn.classList.contains('category-mode')) {
            confirmCategorySelection(e);
        } else {
            handleSubmit();
        }
    }));

    // 삭제 모달
    modalCloseBtn?.addEventListener('click', closeDeleteModal);
    modalCancelBtn?.addEventListener('click', closeDeleteModal);
    modalConfirmBtn?.addEventListener('click', confirmDeleteSession);

    deleteModal?.addEventListener('click', e => {
        if (e.target === deleteModal) closeDeleteModal();
    });
};
