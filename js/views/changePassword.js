/* ==========================================================================
   워킹라이프 — 비밀번호 변경 (로그인된 상태, 현재 비밀번호 재확인 필요)
   ========================================================================== */

import { isLoggedIn, changePassword } from "../store.js";
import { go } from "../router.js";

export function renderChangePassword() {
  if (!isLoggedIn()) { go("login"); return; }
  const viewEl = document.getElementById("view");

  viewEl.innerHTML = `
    <button class="back-btn" id="back">← 뒤로</button>
    <h1 class="page-title">비밀번호 변경</h1>
    <p class="page-sub">비밀번호를 바꾸려면 현재 비밀번호를 먼저 입력해 주세요.</p>

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
    <p id="cpError" class="pw-error" hidden></p>
    <p id="cpSuccess" class="pw-success" hidden>비밀번호가 변경되었습니다.</p>

    <div class="actions-row" style="margin-top:8px;">
      <button class="btn btn-primary btn-block" id="cpOk">저장</button>
    </div>
  `;

  document.getElementById("back").addEventListener("click", function () { go("mypage"); });

  const errorEl = document.getElementById("cpError");
  const successEl = document.getElementById("cpSuccess");
  const okBtn = document.getElementById("cpOk");
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  async function attempt() {
    const current = document.getElementById("cpCurrent").value;
    const next = document.getElementById("cpNew").value;
    const next2 = document.getElementById("cpNew2").value;
    errorEl.hidden = true;
    successEl.hidden = true;

    if (next !== next2) {
      showError("새 비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    okBtn.disabled = true;
    try {
      await changePassword(current, next);
      successEl.hidden = false;
      document.getElementById("cpCurrent").value = "";
      document.getElementById("cpNew").value = "";
      document.getElementById("cpNew2").value = "";
    } catch (e) {
      showError(e.message || "비밀번호 변경에 실패했습니다.");
    } finally {
      okBtn.disabled = false;
    }
  }
  okBtn.addEventListener("click", attempt);
  viewEl.querySelectorAll("input").forEach(function (inp) {
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
  });
}
