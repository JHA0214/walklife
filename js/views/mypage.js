/* ==========================================================================
   워킹라이프 — 마이페이지 (즐겨찾기한 운동을 가장 먼저 보여주는 회원 전용 페이지)
   ========================================================================== */

import { getExercises, isFav, isLoggedIn, getUsername, signOutUser } from "../store.js";
import { renderExerciseList } from "../exerciseCard.js";
import { esc } from "../utils.js";
import { go } from "../router.js";

export function renderMypage() {
  if (!isLoggedIn()) { go("login"); return; }
  const viewEl = document.getElementById("view");
  const favs = getExercises().filter(function (e) { return isFav(e.id); });

  viewEl.innerHTML = `
    <button class="back-btn" id="back">← 뒤로</button>
    <h1 class="page-title">마이페이지</h1>
    <p class="page-sub">${esc(getUsername())}님, 환영합니다.</p>

    <h2 class="section-title">⭐ 즐겨찾기한 운동</h2>
    ${favs.length
      ? '<div id="favList" class="exercise-list"></div>'
      : '<div class="empty">아직 즐겨찾기한 운동이 없습니다.<br>운동 상세 화면에서 ☆ 버튼을 눌러 추가해 보세요.</div>'}

    <div class="actions-row" style="margin-top:24px;">
      <button class="btn btn-block" id="logoutBtn">로그아웃</button>
    </div>
  `;

  document.getElementById("back").addEventListener("click", function () { go("home"); });
  if (favs.length) renderExerciseList(document.getElementById("favList"), favs);

  document.getElementById("logoutBtn").addEventListener("click", async function () {
    if (confirm(getUsername() + "님, 로그아웃 하시겠어요?")) {
      await signOutUser();
      go("home");
    }
  });
}
