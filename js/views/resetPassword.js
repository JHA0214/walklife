/* ==========================================================================
   워킹라이프 — 새 비밀번호 설정
   이메일로 받은 재설정 링크를 클릭해 돌아왔을 때(PASSWORD_RECOVERY) 보여주는 화면.
   ========================================================================== */

import { updateOwnPassword } from "../store.js";
import { go } from "../router.js";

export function renderResetPassword() {
  const viewEl = document.getElementById("view");
  viewEl.innerHTML = `
    <h1 class="page-title">새 비밀번호 설정</h1>
    <p class="page-sub">이메일 인증이 확인되었습니다. 새로 쓸 비밀번호를 입력해 주세요.</p>

    <div class="field">
      <label for="rpPassword">새 비밀번호</label>
      <input type="password" id="rpPassword" autocomplete="new-password" placeholder="6자 이상" />
    </div>
    <div class="field">
      <label for="rpPassword2">새 비밀번호 확인</label>
      <input type="password" id="rpPassword2" autocomplete="new-password" placeholder="비밀번호 다시 입력" />
    </div>
    <p id="rpError" class="pw-error" hidden></p>
    <p id="rpSuccess" class="pw-success" hidden>비밀번호가 바뀌었습니다.</p>

    <div class="actions-row" style="margin-top:8px;">
      <button class="btn btn-primary btn-block" id="rpOk">비밀번호 저장</button>
    </div>
  `;

  const errorEl = document.getElementById("rpError");
  const successEl = document.getElementById("rpSuccess");
  const okBtn = document.getElementById("rpOk");
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  async function attempt() {
    const password = document.getElementById("rpPassword").value;
    const password2 = document.getElementById("rpPassword2").value;
    errorEl.hidden = true;

    if (password !== password2) {
      showError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    okBtn.disabled = true;
    try {
      await updateOwnPassword(password);
      successEl.hidden = false;
      setTimeout(function () { go("home"); }, 1500);
    } catch (e) {
      showError(e.message || "비밀번호 변경에 실패했습니다.");
      okBtn.disabled = false;
    }
  }
  okBtn.addEventListener("click", attempt);
  viewEl.querySelectorAll("input").forEach(function (inp) {
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
  });
}
