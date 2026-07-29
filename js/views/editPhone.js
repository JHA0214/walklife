/* ==========================================================================
   워킹라이프 — 회원정보 수정 (전화번호 변경, 비밀번호 재확인 필요)
   ========================================================================== */

import { isLoggedIn, getMyProfile, changePhoneNumber } from "../store.js";
import { go } from "../router.js";

export function renderEditPhone() {
  if (!isLoggedIn()) { go("login"); return; }
  const viewEl = document.getElementById("view");

  viewEl.innerHTML = `
    <button class="back-btn" id="back">← 뒤로</button>
    <h1 class="page-title">회원정보 수정</h1>
    <p class="page-sub">전화번호를 바꾸려면 비밀번호를 다시 입력해 주세요.</p>

    <div class="field">
      <label>현재 전화번호</label>
      <p id="currentPhone" class="page-sub">불러오는 중…</p>
    </div>
    <div class="field">
      <label for="epNewPhone">새 전화번호</label>
      <input type="tel" id="epNewPhone" autocomplete="tel" placeholder="010-1234-5678" />
    </div>
    <div class="field">
      <label for="epPassword">비밀번호 확인</label>
      <input type="password" id="epPassword" autocomplete="current-password" placeholder="현재 비밀번호" />
    </div>
    <p id="epError" class="pw-error" hidden></p>
    <p id="epSuccess" class="pw-success" hidden>전화번호가 변경되었습니다.</p>

    <div class="actions-row" style="margin-top:8px;">
      <button class="btn btn-primary btn-block" id="epOk">저장</button>
    </div>
  `;

  document.getElementById("back").addEventListener("click", function () { go("mypage"); });

  getMyProfile().then(function (profile) {
    document.getElementById("currentPhone").textContent = profile.phone || "-";
  }).catch(function () {
    document.getElementById("currentPhone").textContent = "불러오지 못했습니다.";
  });

  const errorEl = document.getElementById("epError");
  const successEl = document.getElementById("epSuccess");
  const okBtn = document.getElementById("epOk");
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  async function attempt() {
    const newPhone = document.getElementById("epNewPhone").value;
    const password = document.getElementById("epPassword").value;
    errorEl.hidden = true;
    successEl.hidden = true;

    okBtn.disabled = true;
    try {
      await changePhoneNumber(password, newPhone);
      successEl.hidden = false;
      document.getElementById("currentPhone").textContent = newPhone.trim();
      document.getElementById("epNewPhone").value = "";
      document.getElementById("epPassword").value = "";
    } catch (e) {
      showError(e.message || "전화번호 변경에 실패했습니다.");
    } finally {
      okBtn.disabled = false;
    }
  }
  okBtn.addEventListener("click", attempt);
  viewEl.querySelectorAll("input").forEach(function (inp) {
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
  });
}
