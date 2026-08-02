/* ==========================================================================
   워킹라이프 — 마이페이지 (즐겨찾기한 운동을 가장 먼저 보여주는 회원 전용 페이지)
   ========================================================================== */

import {
  getExercises, isFav, isLoggedIn, getUsername, signOutUser,
  getMyProfile, getRecommendedExercises,
} from "../store.js";
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

    <h2 class="section-title" style="margin-top:28px;">💡 추천 운동</h2>
    <div id="recommendedWrap"><p class="page-sub">불러오는 중…</p></div>

    <p class="page-sub" style="margin-top:28px;">
      <a href="#" id="goEditProfileFields" class="text-link">내 정보 수정</a>
    </p>

    <div class="actions-row" style="margin-top:12px;">
      <button class="btn btn-block" id="logoutBtn">로그아웃</button>
    </div>
  `;

  document.getElementById("back").addEventListener("click", function () { go("home"); });
  if (favs.length) renderExerciseList(document.getElementById("favList"), favs);

  document.getElementById("goEditProfileFields").addEventListener("click", function (e) { e.preventDefault(); go("editProfileFields"); });

  document.getElementById("logoutBtn").addEventListener("click", async function () {
    if (confirm(getUsername() + "님, 로그아웃 하시겠어요?")) {
      await signOutUser();
      go("home");
    }
  });

  loadRecommended();
}

async function loadRecommended() {
  const wrap = document.getElementById("recommendedWrap");
  let profile;
  try {
    profile = await getMyProfile();
  } catch (e) {
    wrap.innerHTML = '<p class="pw-error">추천 운동을 불러오지 못했습니다.</p>';
    return;
  }
  if (!document.getElementById("recommendedWrap")) return; // 그 사이 다른 화면으로 이동했으면 그리지 않음

  const preferred = profile.preferred_hashtags || [];
  if (!preferred.length) {
    wrap.innerHTML = `
      <div class="empty">관심 운동을 등록하면 맞춤 추천을 보여드려요.<br>
        <a href="#" id="goSetPreferred" class="text-link">내 정보 수정에서 등록하기</a>
      </div>`;
    document.getElementById("goSetPreferred").addEventListener("click", function (e) { e.preventDefault(); go("editProfileFields"); });
    return;
  }

  const recommended = getRecommendedExercises(preferred, profile.desired_intensity).filter(function (e) { return !isFav(e.id); });
  if (!recommended.length) {
    wrap.innerHTML = '<div class="empty">등록하신 관심 운동과 일치하는 운동이 아직 없습니다.</div>';
    return;
  }
  wrap.innerHTML = '<div id="recommendedList" class="exercise-list"></div>';
  renderExerciseList(document.getElementById("recommendedList"), recommended);
}
