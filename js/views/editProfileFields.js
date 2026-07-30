/* ==========================================================================
   워킹라이프 — 내 정보 수정 (나이/성별/원하는 운동 강도/관심 운동, 전부 선택)
   ========================================================================== */

import { isLoggedIn, getAllHashtags, getMyProfile, updateMyProfile } from "../store.js";
import { profileFieldsHtml, wireProfileFields } from "../profileFieldsUI.js";
import { go } from "../router.js";

export function renderEditProfileFields() {
  if (!isLoggedIn()) { go("login"); return; }
  const viewEl = document.getElementById("view");

  viewEl.innerHTML = `
    <button class="back-btn" id="back">← 뒤로</button>
    <h1 class="page-title">내 정보 수정</h1>
    <p class="page-sub">가입할 때 건너뛰었다면 여기서 입력하거나 바꿀 수 있어요.</p>

    <div id="profileFieldsWrap"><p class="page-sub">불러오는 중…</p></div>
    <p id="profileError" class="pw-error" hidden></p>
    <p id="profileSuccess" class="pw-success" hidden>저장되었습니다.</p>

    <div class="actions-row" style="margin-top:8px;">
      <button class="btn btn-primary btn-block" id="saveProfileBtn" disabled>저장</button>
    </div>

    <p class="page-sub" style="margin-top:24px;">
      <a href="#" id="goEditPhone" class="text-link">회원정보 수정 (전화번호 변경)</a>
      · <a href="#" id="goChangePassword" class="text-link">비밀번호 변경</a>
    </p>
  `;

  document.getElementById("back").addEventListener("click", function () { go("mypage"); });
  document.getElementById("goEditPhone").addEventListener("click", function (e) { e.preventDefault(); go("editPhone"); });
  document.getElementById("goChangePassword").addEventListener("click", function (e) { e.preventDefault(); go("changePassword"); });

  loadProfileFields(viewEl);
}

async function loadProfileFields(viewEl) {
  const wrap = document.getElementById("profileFieldsWrap");
  const saveBtn = document.getElementById("saveProfileBtn");
  const errorEl = document.getElementById("profileError");
  const successEl = document.getElementById("profileSuccess");

  let profile;
  try {
    profile = await getMyProfile();
  } catch (e) {
    wrap.innerHTML = '<p class="pw-error">내 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>';
    return;
  }
  // 화면 이동 등으로 이미 다른 화면이 되었으면 그리지 않음
  if (!document.getElementById("profileFieldsWrap")) return;

  const allTags = getAllHashtags();
  wrap.innerHTML = profileFieldsHtml(allTags, profile);
  const fields = wireProfileFields(viewEl);
  saveBtn.disabled = false;

  saveBtn.addEventListener("click", async function () {
    errorEl.hidden = true;
    successEl.hidden = true;
    saveBtn.disabled = true;
    try {
      await updateMyProfile(fields.getValues());
      successEl.hidden = false;
    } catch (e) {
      errorEl.textContent = e.message || "저장에 실패했습니다.";
      errorEl.hidden = false;
    } finally {
      saveBtn.disabled = false;
    }
  });
}
