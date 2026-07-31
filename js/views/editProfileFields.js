/* ==========================================================================
   워킹라이프 — 내 정보 수정
   1) 기본 정보(나이/성별/원하는 운동 강도/관심 운동, 전부 선택)
   2) 전화번호 — 비밀번호를 먼저 확인해야 현재 번호가 보이고 바꿀 수 있음
   3) 비밀번호 변경 — 현재 비밀번호 재확인 필요
   ========================================================================== */

import {
  isLoggedIn, getAllHashtags, getMyProfile, updateMyProfile,
  verifyPasswordAndGetPhone, changePhoneNumber, changePassword,
} from "../store.js";
import { profileFieldsHtml, wireProfileFields } from "../profileFieldsUI.js";
import { esc } from "../utils.js";
import { go } from "../router.js";

export function renderEditProfileFields() {
  if (!isLoggedIn()) { go("login"); return; }
  const viewEl = document.getElementById("view");

  viewEl.innerHTML = `
    <button class="back-btn" id="back">← 뒤로</button>
    <h1 class="page-title">내 정보 수정</h1>

    <h2 class="section-title">기본 정보</h2>
    <p class="page-sub">가입할 때 건너뛰었다면 여기서 입력하거나 바꿀 수 있어요.</p>
    <div id="profileFieldsWrap"><p class="page-sub">불러오는 중…</p></div>
    <p id="profileError" class="pw-error" hidden></p>
    <p id="profileSuccess" class="pw-success" hidden>저장되었습니다.</p>
    <div class="actions-row" style="margin-top:8px;">
      <button class="btn btn-primary btn-block" id="saveProfileBtn" disabled>저장</button>
    </div>

    <h2 class="section-title" style="margin-top:28px;">전화번호</h2>
    <div id="phoneSection">
      <p class="page-sub">전화번호를 확인하거나 바꾸려면 비밀번호를 입력해 주세요.</p>
      <div class="field">
        <label for="phoneVerifyPw">비밀번호</label>
        <input type="password" id="phoneVerifyPw" autocomplete="current-password" placeholder="현재 비밀번호" />
      </div>
      <p id="phoneVerifyError" class="pw-error" hidden></p>
      <div class="actions-row" style="margin-top:8px;">
        <button class="btn btn-primary btn-block" id="phoneVerifyBtn">확인</button>
      </div>
    </div>

    <h2 class="section-title" style="margin-top:28px;">비밀번호 변경</h2>
    <div class="field">
      <label for="cpCurrent">현재 비밀번호</label>
      <input type="password" id="cpCurrent" autocomplete="current-password" placeholder="현재 비밀번호" />
    </div>
    <div class="field">
      <label for="cpNew">새 비밀번호</label>
      <input type="password" id="cpNew" autocomplete="new-password" placeholder="6자 이상" />
    </div>
    <div class="field">
      <label for="cpNew2">새 비밀번호 확인</label>
      <input type="password" id="cpNew2" autocomplete="new-password" placeholder="비밀번호 다시 입력" />
    </div>
    <p id="pwError" class="pw-error" hidden></p>
    <p id="pwSuccess" class="pw-success" hidden>비밀번호가 변경되었습니다.</p>
    <div class="actions-row" style="margin-top:8px;">
      <button class="btn btn-primary btn-block" id="pwSaveBtn">변경</button>
    </div>
  `;

  document.getElementById("back").addEventListener("click", function () { go("mypage"); });

  loadProfileFields(viewEl);
  wirePhoneSection();
  wirePasswordSection();
}

// ---------- 1) 기본 정보 ----------
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

// ---------- 2) 전화번호(비밀번호 확인 후 노출) ----------
function wirePhoneSection() {
  const verifyBtn = document.getElementById("phoneVerifyBtn");
  const verifyError = document.getElementById("phoneVerifyError");

  verifyBtn.addEventListener("click", async function () {
    const password = document.getElementById("phoneVerifyPw").value;
    verifyError.hidden = true;
    verifyBtn.disabled = true;
    try {
      const phone = await verifyPasswordAndGetPhone(password);
      showPhoneEditForm(phone, password);
    } catch (e) {
      verifyError.textContent = e.message || "확인에 실패했습니다.";
      verifyError.hidden = false;
    } finally {
      verifyBtn.disabled = false;
    }
  });
}

// 비밀번호 확인이 끝나면 그 자리에 현재 번호 + 새 번호 입력 폼으로 바꿔 그림.
// 이미 확인된 비밀번호를 기억해뒀다가 실제 변경 때 다시 물어보지 않고 그대로 씀.
function showPhoneEditForm(currentPhone, confirmedPassword) {
  const section = document.getElementById("phoneSection");
  section.innerHTML = `
    <div class="field">
      <label>현재 전화번호</label>
      <p class="page-sub" id="currentPhone">${esc(currentPhone || "-")}</p>
    </div>
    <div class="field">
      <label for="epNewPhone">새 전화번호</label>
      <input type="tel" id="epNewPhone" autocomplete="tel" placeholder="010-1234-5678" />
    </div>
    <p id="epError" class="pw-error" hidden></p>
    <p id="epSuccess" class="pw-success" hidden>전화번호가 변경되었습니다.</p>
    <div class="actions-row" style="margin-top:8px;">
      <button class="btn btn-primary btn-block" id="epOk">변경</button>
    </div>
  `;

  const errorEl = document.getElementById("epError");
  const successEl = document.getElementById("epSuccess");
  const okBtn = document.getElementById("epOk");
  const newPhoneInput = document.getElementById("epNewPhone");

  async function attempt() {
    const newPhone = newPhoneInput.value;
    errorEl.hidden = true;
    successEl.hidden = true;
    okBtn.disabled = true;
    try {
      await changePhoneNumber(confirmedPassword, newPhone);
      successEl.hidden = false;
      document.getElementById("currentPhone").textContent = newPhone.trim();
      newPhoneInput.value = "";
    } catch (e) {
      errorEl.textContent = e.message || "전화번호 변경에 실패했습니다.";
      errorEl.hidden = false;
    } finally {
      okBtn.disabled = false;
    }
  }
  okBtn.addEventListener("click", attempt);
  newPhoneInput.addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
}

// ---------- 3) 비밀번호 변경 ----------
function wirePasswordSection() {
  const errorEl = document.getElementById("pwError");
  const successEl = document.getElementById("pwSuccess");
  const saveBtn = document.getElementById("pwSaveBtn");

  async function attempt() {
    const current = document.getElementById("cpCurrent").value;
    const next = document.getElementById("cpNew").value;
    const next2 = document.getElementById("cpNew2").value;
    errorEl.hidden = true;
    successEl.hidden = true;

    if (next !== next2) {
      errorEl.textContent = "새 비밀번호가 서로 일치하지 않습니다.";
      errorEl.hidden = false;
      return;
    }

    saveBtn.disabled = true;
    try {
      await changePassword(current, next);
      successEl.hidden = false;
      document.getElementById("cpCurrent").value = "";
      document.getElementById("cpNew").value = "";
      document.getElementById("cpNew2").value = "";
    } catch (e) {
      errorEl.textContent = e.message || "비밀번호 변경에 실패했습니다.";
      errorEl.hidden = false;
    } finally {
      saveBtn.disabled = false;
    }
  }
  saveBtn.addEventListener("click", attempt);
  ["cpCurrent", "cpNew", "cpNew2"].forEach(function (id) {
    document.getElementById(id).addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
  });
}
