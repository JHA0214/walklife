/* ==========================================================================
   워킹라이프 — 전체 운동 목록 (홈 화면 "더보기")
   ========================================================================== */

import { getExercises, filterExercises } from "../store.js";
import { renderExerciseList } from "../exerciseCard.js";
import { go } from "../router.js";

export function renderAllExercises() {
  const viewEl = document.getElementById("view");
  const exercises = getExercises();

  viewEl.innerHTML = `
    <button class="back-btn" id="back">← 뒤로</button>
    <h1 class="page-title">전체 운동</h1>
    <div class="search-box">
      <span class="search-icon" aria-hidden="true">🔍</span>
      <input id="allExercisesSearch" class="search-input" type="search"
             placeholder="예) 걷기, 무릎, 균형" aria-label="운동 검색" />
    </div>
    <p class="page-sub">${exercises.length}개의 운동</p>
    <div id="allExercisesList" class="exercise-list"></div>
  `;

  renderExerciseList(document.getElementById("allExercisesList"), exercises);

  const searchInput = document.getElementById("allExercisesSearch");
  searchInput.addEventListener("input", function () {
    const q = searchInput.value.trim();
    renderExerciseList(document.getElementById("allExercisesList"), q ? filterExercises(q) : exercises);
  });

  document.getElementById("back").addEventListener("click", function () { go("home"); });
}
