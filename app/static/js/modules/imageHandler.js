import { state } from "./state.js";
import { isImageValid } from "../utils/validation.js";
import { showToast } from "../utils/ui.js";
import { updateNextButton } from "./formHandler.js";

// 대표 이미지 선택
export const handleMainImageSelect = (file) => {
  if (!isImageValid(file)) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById("main-image-preview");
    const placeholder = document.getElementById("main-image-placeholder");
    const removeBtn = document.getElementById("btn-remove-main-image");

    state.mainImage = e.target.result;
    preview.src = e.target.result;
    preview.classList.remove("hidden");
    placeholder.style.display = "none";
    removeBtn.classList.remove("hidden");
    removeBtn.style.display = "flex";

    document
      .getElementById("main-image-upload-area")
      .classList.add("has-image");
    updateNextButton();
  };
  reader.readAsDataURL(file);
};

// 대표 이미지 삭제
export const handleMainImageRemove = () => {
  state.mainImage = null;
  const mainImagePreview = document.getElementById("main-image-preview");
  mainImagePreview.classList.add("hidden");
  const mainImagePlaceholder = document.getElementById(
    "main-image-placeholder"
  );
  mainImagePlaceholder.style.display = "flex";
  const btnRemoveMainImage = document.getElementById("btn-remove-main-image");
  btnRemoveMainImage.classList.add("hidden");
  const mainImageUploadArea = document.getElementById("main-image-upload-area");
  mainImageUploadArea.classList.remove("has-image");
  const mainImageInput = document.getElementById("main-image-input");
  mainImageInput.value = "";
  updateNextButton();
};

// 드래그앤드롭 지원
export const setupMainImageDragDrop = () => {
  const area = document.getElementById("main-image-upload-area");

  area.addEventListener("dragover", (e) => {
    e.preventDefault();
    area.style.borderColor = "#00c73c";
    area.style.backgroundColor = "#f0f9f4";
  });

  area.addEventListener("dragleave", (e) => {
    e.preventDefault();
    area.style.borderColor = "#d0d0d0";
    area.style.backgroundColor = "";
  });

  area.addEventListener("drop", (e) => {
    e.preventDefault();
    area.style.borderColor = "#d0d0d0";
    area.style.backgroundColor = "";
    const file = e.dataTransfer.files[0];
    if (file) handleMainImageSelect(file);
  });
};

// 추가 이미지 슬롯 렌더링 (최대 4개)
export const renderAdditionalImageSlots = () => {
  const container = document.getElementById("additional-image-container");
  container.innerHTML = "";

  const images = state.additionalImages.filter((img) => img !== null);
  const slotsToShow = Math.min(images.length + 1, 4);

  for (let i = 0; i < slotsToShow; i++) {
    const slot = createSlot(i);
    container.appendChild(slot);

    if (state.additionalImages[i]) {
      appendImageToSlot(slot, state.additionalImages[i], i);
    }
  }
};

const createSlot = (index) => {
  const slot = document.createElement("div");
  slot.className = "upload-slot";
  slot.dataset.index = index;

  slot.innerHTML = `
    <div class="upload-icon">
      <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M12.5 2.25C12.9142 2.25 13.25 2.58579 13.25 3C13.25 3.41421 12.9142 3.75 12.5 3.75H5C4.66848 3.75 4.35063 3.88179 4.11621 4.11621C3.88179 4.35063 3.75 4.66848 3.75 5V19C3.75 19.3315 3.88179 19.6494 4.11621 19.8838C4.35063 20.1182 4.66848 20.25 5 20.25H5.68945L14.5557 11.3838C15.0713 10.8684 15.7709 10.5781 16.5 10.5781C17.2291 10.5781 17.9287 10.8674 18.4443 11.3828L20.25 13.1895V11.5C20.25 11.0858 20.5858 10.75 21 10.75C21.4142 10.75 21.75 11.0858 21.75 11.5V19C21.75 19.7293 21.4601 20.4286 20.9443 20.9443C20.4286 21.4601 19.7293 21.75 19 21.75H5C4.27065 21.75 3.57139 21.4601 3.05566 20.9443C2.53994 20.4286 2.25 19.7293 2.25 19V5C2.25 4.27065 2.53994 3.57139 3.05566 3.05566C3.57139 2.53994 4.27065 2.25 5 2.25H12.5ZM16.5 12.0781C16.1685 12.0781 15.8506 12.21 15.6162 12.4443L7.81055 20.25H19C19.3315 20.25 19.6494 20.1182 19.8838 19.8838C20.1182 19.6494 20.25 19.3315 20.25 19V15.3105L17.3838 12.4443C17.1494 12.21 16.8315 12.0781 16.5 12.0781Z" fill="#8F8F8F"/>
        <path fill-rule="evenodd" clip-rule="evenodd" d="M9 6.25C10.5188 6.25 11.75 7.48122 11.75 9C11.75 10.5188 10.5188 11.75 9 11.75C7.48122 11.75 6.25 10.5188 6.25 9C6.25 7.48122 7.48122 6.25 9 6.25ZM9 7.75C8.30964 7.75 7.75 8.30964 7.75 9C7.75 9.69036 8.30964 10.25 9 10.25C9.69036 10.25 10.25 9.69036 10.25 9C10.25 8.30964 9.69036 7.75 9 7.75Z" fill="#8F8F8F"/>
        <path d="M19 1.25C19.4142 1.25 19.75 1.58579 19.75 2V4.25H22C22.4142 4.25 22.75 4.58579 22.75 5C22.75 5.41421 22.4142 5.75 22 5.75H19.75V8C19.75 8.41421 19.4142 8.75 19 8.75C18.5858 8.75 18.25 8.41421 18.25 8V5.75H16C15.5858 5.75 15.25 5.41421 15.25 5C15.25 4.58579 15.5858 4.25 16 4.25H18.25V2C18.25 1.58579 18.5858 1.25 19 1.25Z" fill="#8F8F8F"/>
      </svg>
    </div>
    <input type="file" class="additional-image-input" accept=".jpg,.png" style="display:none" multiple />
  `;

  slot.addEventListener("click", () =>
    slot.querySelector(".additional-image-input").click()
  );
  slot
    .querySelector(".additional-image-input")
    .addEventListener("change", (e) => handleFileChange(e, index));

  // 드래그앤드롭
  slot.addEventListener("dragover", (e) => {
    e.preventDefault();
    slot.style.borderColor = "#00c73c";
  });
  slot.addEventListener("dragleave", () => {
    slot.style.borderColor = "#d0d0d0";
  });
  slot.addEventListener("drop", (e) => {
    e.preventDefault();
    slot.style.borderColor = "#d0d0d0";
    const file = e.dataTransfer.files[0];
    if (file) handleSingleFileUpload(file, index);
  });

  return slot;
};

const appendImageToSlot = (slot, src, index) => {
  const img = document.createElement("img");
  img.src = src;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "cover";
  slot.appendChild(img);
  slot.classList.add("has-image");

  const removeBtn = document.createElement("button");
  removeBtn.className = "btn-remove-image";
  removeBtn.textContent = "×";
  removeBtn.onclick = (e) => {
    e.stopPropagation();
    removeImageAt(index);
  };
  slot.appendChild(removeBtn);

  const icon = slot.querySelector(".upload-icon");
  if (icon) icon.style.display = "none";
};

// 여러 파일 선택 시 비동기 로딩 후 한 번만 렌더링 (성능 최적화)
const handleFileChange = (event, startIndex) => {
  const files = Array.from(event.target.files);
  const usedCount = state.additionalImages.filter((img) => img !== null).length;
  const availableSlots = 4 - usedCount;

  if (files.length > availableSlots) {
    showToast(
      `최대 4장까지 등록할 수 있습니다. ${availableSlots}장만 업로드됩니다.`
    );
  }

  const filesToAdd = files.slice(0, availableSlots);
  let loadedCount = 0;

  filesToAdd.forEach((file, idx) => {
    if (!isImageValid(file)) {
      loadedCount++;
      if (loadedCount === filesToAdd.length) renderAdditionalImageSlots();
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      state.additionalImages[startIndex + idx] = e.target.result;
      loadedCount++;
      if (loadedCount === filesToAdd.length) renderAdditionalImageSlots();
    };
    reader.readAsDataURL(file);
  });
};

const handleSingleFileUpload = (file, index) => {
  if (!isImageValid(file)) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    state.additionalImages[index] = e.target.result;
    renderAdditionalImageSlots();
  };
  reader.readAsDataURL(file);
};

// 삭제 후 배열 재정렬
const removeImageAt = (index) => {
  state.additionalImages[index] = null;
  const filtered = state.additionalImages.filter((img) => img !== null);
  state.additionalImages = [...filtered, null, null, null, null].slice(0, 4);
  renderAdditionalImageSlots();
};
