/* ==========================================================================
   워킹라이프 — 회원가입
   ========================================================================== */

import { signUpUser } from "../store.js";
import { go } from "../router.js";

export function renderSignup() {
  const viewEl = document.getElementById("view");
  viewEl.innerHTML = `
    <button class="back-btn" id="back">← 뒤로</button>
    <h1 class="page-title">회원가입</h1>
    <p class="page-sub">아이디, 비밀번호, 전화번호를 입력해 주세요.</p>

    <div class="field">
      <label for="suUsername">아이디</label>
      <input type="text" id="suUsername" autocomplete="username" placeholder="영문/숫자 4~20자" />
      <p class="field-hint">영문, 숫자, 밑줄(_)만 사용해 4~20자로 입력해 주세요.</p>
    </div>
    <div class="field">
      <label for="suPassword">비밀번호</label>
      <input type="password" id="suPassword" autocomplete="new-password" placeholder="6자 이상" />
    </div>
    <div class="field">
      <label for="suPassword2">비밀번호 확인</label>
      <input type="password" id="suPassword2" autocomplete="new-password" placeholder="비밀번호 다시 입력" />
    </div>
    <div class="field">
      <label for="suPhone">전화번호</label>
      <input type="tel" id="suPhone" autocomplete="tel" placeholder="010-1234-5678" />
      <p class="field-hint">비밀번호를 잊었을 때 본인 확인에 사용됩니다.</p>
    </div>
    <div class="field">
      <label for="suEmail">이메일 (선택)</label>
      <input type="email" id="suEmail" autocomplete="email" placeholder="example@email.com" />
      <p class="field-hint">입력해 두면 비밀번호를 잊었을 때 이메일로 재설정 링크를 받을 수 있어요.</p>
    </div>
    <p id="suError" class="pw-error" hidden></p>

    <div class="actions-row" style="margin-top:8px;">
      <button class="btn btn-primary btn-block" id="suOk">가입하기</button>
    </div>
  `;

  document.getElementById("back").addEventListener("click", function () { go("home"); });

  const errorEl = document.getElementById("suError");
  const okBtn = document.getElementById("suOk");
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  async function attempt() {
    const username = document.getElementById("suUsername").value;
    const password = document.getElementById("suPassword").value;
    const password2 = document.getElementById("suPassword2").value;
    const phone = document.getElementById("suPhone").value;
    const email = document.getElementById("suEmail").value;
    errorEl.hidden = true;

    if (password !== password2) {
      showError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    okBtn.disabled = true;
    try {
      await signUpUser(username, password, phone, email);
      go("home");
    } catch (e) {
      showError(e.message || "회원가입에 실패했습니다.");
    } finally {
      okBtn.disabled = false;
    }
  }
  okBtn.addEventListener("click", attempt);
  viewEl.querySelectorAll("input").forEach(function (inp) {
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
  });
}
