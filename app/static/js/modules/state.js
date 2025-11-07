import { DEFAULT_SESSION } from '../utils/constants.js';

// 전역 상태 관리 - 모든 상태를 state 객체로 통일
export const state = {
  mainImage: null,
  additionalImages: [null, null, null, null],
  categories: [],
  title: '',
  activityType: null,
  sessions: [{ ...DEFAULT_SESSION }],
  tempCategories: [],
  sessionToDelete: null,
  datePickerInstances: [],
};
