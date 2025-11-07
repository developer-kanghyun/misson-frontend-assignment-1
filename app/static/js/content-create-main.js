// ES6 Module 진입점
import { state } from "./modules/state.js";
import { setupEventListeners } from "./modules/eventHandler.js";
import {
  fillSessionData,
  attachSessionListeners,
  initializeDatePickers,
} from "./modules/sessionHandler.js";
import { autoGrowTextarea } from "./utils/ui.js";

const init = () => {
  setupEventListeners();

  const template = document.getElementById("session-template");
  if (template) {
    template.classList.remove("hidden");
    template.style.display = "block";
    template.setAttribute("data-session-index", "0");

    const title = template.querySelector(".session-info-title");
    if (title) title.textContent = "회차정보";

    fillSessionData(template, state.sessions[0]);
    attachSessionListeners(template, 0);
  }
  const btnDeleteSession = document.querySelectorAll(".btn-delete-session");
  btnDeleteSession.forEach((btn) => {
    btn.style.display = "none";
  });

  setTimeout(() => {
    const textareaInput = document.querySelectorAll(".textarea-input");
    textareaInput.forEach((textarea) => {
      autoGrowTextarea(textarea);
    });
    initializeDatePickers();
  }, 100);
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
