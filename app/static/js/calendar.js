class DatePickerCalendar {
    constructor(inputElement, options = {}) {
        this.input = inputElement;
        this.popup = null;
        this.selectedDate = null;

        this.minDate = options.minDate || new Date();
        this.maxDate = options.maxDate || new Date(2099, 12, 31);
        this.disabledDates = options.disabledDates || [];
        this.onSelect = options.onSelect || null;

        // 캘린더 시작 날짜: minDate가 오늘보다 미래면 minDate로 시작
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        this.currentDate = this.minDate > today ? new Date(this.minDate) : new Date();

        this.init();
    }

    init() {
        this.input.setAttribute("readonly", "true");
        this.input.addEventListener("focus", () => this.open());
        this.input.addEventListener("click", (e) => {
            e.stopPropagation();
            this.open();
        });

        this.outsideClickHandler = (e) => this.handleOutsideClick(e);
        document.addEventListener("click", this.outsideClickHandler);
    }

    createPopup() {
        this.popup = document.createElement("div");
        this.popup.className = "calendar-popup";

        const container = this.input.parentElement;
        if (container) {
            container.style.position = "relative";
            container.appendChild(this.popup);
        }

        this.popup.appendChild(this.createHeader());
        this.popup.appendChild(this.createWeekdays());
        this.popup.appendChild(this.createGrid());
        this.popup.appendChild(this.createButtonWrapper());
    }

    createHeader() {
        const header = document.createElement("div");
        header.className = "calendar-header";

        const monthYear = document.createElement("div");
        monthYear.className = "calendar-month-year";
        monthYear.id = "calendar-month-year";
        monthYear.textContent = this.formatMonthYear();

        const navButtons = document.createElement("div");
        navButtons.className = "calendar-nav-buttons";

        const prevBtn = document.createElement("button");
        prevBtn.className = "calendar-nav-btn";
        prevBtn.type = "button";
        prevBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14.4697 3.46967C14.7626 3.17678 15.2373 3.17678 15.5302 3.46967C15.8231 3.76256 15.8231 4.23732 15.5302 4.53022L8.06049 11.9999L15.5302 19.4697C15.8231 19.7626 15.8231 20.2373 15.5302 20.5302C15.2373 20.8231 14.7626 20.8231 14.4697 20.5302L6.46967 12.5302C6.17678 12.2373 6.17678 11.7626 6.46967 11.4697L14.4697 3.46967Z" fill="#121212"/>
        </svg>
      `;
        prevBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.prevMonth();
        });

        const nextBtn = document.createElement("button");
        nextBtn.className = "calendar-nav-btn";
        nextBtn.type = "button";
        nextBtn.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8.46967 3.46967C8.76256 3.17678 9.23732 3.17678 9.53022 3.46967L17.5302 11.4697C17.8231 11.7626 17.8231 12.2373 17.5302 12.5302L9.53022 20.5302C9.23732 20.8231 8.76256 20.8231 8.46967 20.5302C8.17678 20.2373 8.17678 19.7626 8.46967 19.4697L15.9394 11.9999L8.46967 4.53022C8.17678 4.23732 8.17678 3.76256 8.46967 3.46967Z" fill="#121212"/>
        </svg>
      `;
        nextBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.nextMonth();
        });

        navButtons.appendChild(prevBtn);
        navButtons.appendChild(nextBtn);

        header.appendChild(monthYear);
        header.appendChild(navButtons);

        return header;
    }

    createWeekdays() {
        const weekdays = document.createElement("div");
        weekdays.className = "calendar-weekdays";

        ["일", "월", "화", "수", "목", "금", "토"].forEach((day) => {
            const dayEl = document.createElement("div");
            dayEl.className = "calendar-weekday";
            dayEl.textContent = day;
            weekdays.appendChild(dayEl);
        });

        return weekdays;
    }

    // 캘린더 날짜 그리드 생성 (이전달 날짜로 빈 칸 채우기 + 현재달 + 마지막 주는 다음달로 채우기)
    createGrid() {
        const grid = document.createElement("div");
        grid.className = "calendar-grid";

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay(); // 이번 달 1일의 요일 (0=일요일)
        const daysInMonth = new Date(year, month + 1, 0).getDate(); // 이번 달 총 일수
        const daysInPrevMonth = new Date(year, month, 0).getDate(); // 지난 달 총 일수

        let weekEl = document.createElement("div");
        weekEl.className = "calendar-week";

        // 이전 달 날짜로 첫 주 빈 칸 채우기
        for (let i = firstDay - 1; i >= 0; i--) {
            const day = daysInPrevMonth - i;
            weekEl.appendChild(
                this.createDayElement(new Date(year, month - 1, day), true)
            );
        }

        // 현재 달 날짜 (한 주에 7일 채워지면 다음줄로 넘어가기)
        for (let day = 1; day <= daysInMonth; day++) {
            if (weekEl.children.length === 7) {
                grid.appendChild(weekEl);
                weekEl = document.createElement("div");
                weekEl.className = "calendar-week";
            }

            weekEl.appendChild(
                this.createDayElement(new Date(year, month, day), false)
            );
        }

        // 다음 달 날짜로 마지막 주 채우기
        let nextMonthDay = 1;
        while (weekEl.children.length < 7) {
            weekEl.appendChild(
                this.createDayElement(
                    new Date(year, month + 1, nextMonthDay),
                    true
                )
            );
            nextMonthDay++;
        }

        grid.appendChild(weekEl);

        return grid;
    }

    // 개별 날짜 버튼 생성 (날짜 범위 검증 + 중복 날짜 비활성화 + 오늘/선택 날짜 스타일링)
    createDayElement(date, isOtherMonth) {
        const dayEl = document.createElement("button");
        dayEl.type = "button";
        dayEl.className = "calendar-day";
        dayEl.textContent = date.getDate();

        // 이전달/다음달 날짜는 비활성화
        if (isOtherMonth) {
            dayEl.classList.add("other-month");
            dayEl.disabled = true;
            return dayEl;
        }

        // 1단계: 날짜 범위 검증 (minDate ~ maxDate)
        const minDate = new Date(this.minDate);
        minDate.setHours(0, 0, 0, 0);
        const maxDate = new Date(this.maxDate);
        maxDate.setHours(0, 0, 0, 0);
        const currentDate = new Date(date);
        currentDate.setHours(0, 0, 0, 0);

        // 2단계: 중복 날짜 검증 (disabledDates 배열에 포함된 날짜)
        const formattedDate = this.formatDate(date);
        const isDuplicate = this.disabledDates.includes(formattedDate);

        // 검증 순서 중요: 먼저 비활성화 → 통과한 것만 스타일 적용 (오늘이 중복 날짜인 경우 방지)
        if (currentDate < minDate || currentDate > maxDate || isDuplicate) {
            dayEl.disabled = true;
            dayEl.classList.add("other-month");
        } else {
            // 3단계: 유효한 날짜만 오늘/선택 날짜 스타일 적용
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (currentDate.getTime() === today.getTime()) {
                dayEl.classList.add("today");
            }

            if (this.selectedDate) {
                const selected = new Date(this.selectedDate);
                selected.setHours(0, 0, 0, 0);
                if (currentDate.getTime() === selected.getTime()) {
                    dayEl.classList.add("selected");
                }
            }

            dayEl.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.selectDate(date);
            });
        }

        return dayEl;
    }

    createButtonWrapper() {
        const wrapper = document.createElement("div");
        wrapper.className = "calendar-button-wrapper";

        const confirmBtn = document.createElement("button");
        confirmBtn.type = "button";
        confirmBtn.className = "calendar-confirm-btn";
        confirmBtn.textContent = "선택 완료";
        confirmBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.confirm();
        });

        wrapper.appendChild(confirmBtn);

        return wrapper;
    }

    selectDate(date) {
        this.selectedDate = date;
        this.updateSelectedUI();
    }

    // 선택된 날짜 UI 업데이트 (전체 재렌더링 없이 토글로 성능 최적화)
    updateSelectedUI() {
        this.popup.querySelectorAll(".calendar-day").forEach((day) => {
            day.classList.remove("selected");
        });

        if (this.selectedDate) {
            const selected = new Date(this.selectedDate);
            selected.setHours(0, 0, 0, 0);

            this.popup.querySelectorAll(".calendar-day").forEach((day) => {
                if (!day.disabled && !day.classList.contains("other-month")) {
                    const dayDate = new Date(
                        this.currentDate.getFullYear(),
                        this.currentDate.getMonth(),
                        parseInt(day.textContent)
                    );
                    dayDate.setHours(0, 0, 0, 0);

                    if (dayDate.getTime() === selected.getTime()) {
                        day.classList.add("selected");
                    }
                }
            });
        }
    }

    confirm() {
        if (!this.selectedDate) return;

        // 입력 필드에 "YYYY년 MM월 DD일" 형식으로 표시
        const year = this.selectedDate.getFullYear();
        const month = this.selectedDate.getMonth() + 1;
        const day = this.selectedDate.getDate();
        this.input.value = `${year}년 ${month}월 ${day}일`;

        if (this.onSelect) {
            this.onSelect(this.selectedDate);
        }

        this.close();
    }

    open() {
        if (!this.popup) {
            this.createPopup();
        }

        // 기존 입력값이 있으면 파싱, 없으면 minDate로 시작
        if (!this.selectedDate && this.input.value) {
            const matches = this.input.value.match(/(\d{4})년\s+(\d{1,2})월\s+(\d{1,2})일/);
            if (matches) {
                const year = parseInt(matches[1]);
                const month = parseInt(matches[2]) - 1;
                const day = parseInt(matches[3]);
                this.selectedDate = new Date(year, month, day);
                this.currentDate = new Date(year, month, 1);
            }
        }

        // 입력값이 없으면 minDate로 캘린더 시작
        if (!this.selectedDate) {
            this.currentDate = new Date(this.minDate);
        }

        // 다른 캘린더 팝업들 모두 닫기 (한 번에 하나만 열림)
        document.querySelectorAll(".calendar-popup").forEach((popup) => {
            if (popup !== this.popup) {
                popup.classList.remove("active");
            }
        });

        this.popup.style.zIndex = "10000";
        this.popup.classList.add("active");
        this.updateCalendarDisplay();
        this.updateSelectedUI();
    }

    close() {
        if (this.popup) {
            this.popup.classList.remove("active");
        }
    }

    handleOutsideClick(e) {
        if (
            this.popup &&
            !this.popup.contains(e.target) &&
            e.target !== this.input
        ) {
            this.close();
        }
    }

    prevMonth() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        this.currentDate = new Date(year, month - 1, 1);
        this.updateCalendarDisplay();
    }

    nextMonth() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        this.currentDate = new Date(year, month + 1, 1);
        this.updateCalendarDisplay();
    }

    updateCalendarDisplay() {
        const monthYearEl = this.popup.querySelector("#calendar-month-year");
        if (monthYearEl) {
            monthYearEl.textContent = this.formatMonthYear();
        }

        const oldGrid = this.popup.querySelector(".calendar-grid");
        if (oldGrid) {
            oldGrid.remove();
        }

        const newGrid = this.createGrid();
        this.popup.insertBefore(
            newGrid,
            this.popup.querySelector(".calendar-button-wrapper")
        );
    }

    formatMonthYear() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth() + 1;
        return `${year}년 ${month}월`;
    }

    // 날짜를 YYYY-MM-DD 형식으로 변환 (내부 로직 및 disabledDates 비교용)
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    // 캘린더 인스턴스 정리 (이벤트 리스너 제거로 메모리 누수 방지)
    destroy() {
        if (this.popup) {
            this.popup.remove();
            this.popup = null;
        }

        document.removeEventListener("click", this.outsideClickHandler);
    }
}
