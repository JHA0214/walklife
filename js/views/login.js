/* ==========================================================================
   워킹라이프 — 회원 로그인
   ========================================================================== */

import { signInUser } from "../store.js";
import { go } from "../router.js";
import { openAdminLogin } from "../adminAuth.js";

export function renderLogin() {
  const viewEl = document.getElementById("view");
  viewEl.innerHTML = `
    <button class="back-btn" id="back">← 뒤로</button>
    <h1 class="page-title">로그인</h1>
    <p class="page-sub">아이디와 비밀번호를 입력해 주세요.</p>

    <div class="field">
      <label for="loginUsername">아이디</label>
      <input type="text" id="loginUsername" autocomplete="username" placeholder="아이디" />
    </div>
    <div class="field">
      <label for="loginPassword">비밀번호</label>
      <input type="password" id="loginPassword" autocomplete="current-password" placeholder="비밀번호" />
    </div>
    <p id="loginError" class="pw-error" hidden></p>

    <div class="actions-row" style="margin-top:8px;">
      <button class="btn btn-primary btn-block" id="loginOk">로그인</button>
    </div>
    <p class="page-sub" style="margin-top:16px;">
      <a href="#" id="goSignup" class="text-link">회원가입</a>
      · <a href="#" id="goFind" class="text-link">아이디/비밀번호 찾기</a>
    </p>
    <p style="margin-top:24px;font-size:0.8em;color:var(--text-soft);">
      관리자이신가요? <a href="#" id="goAdminLogin" class="text-link">관리자 로그인</a>
    </p>
  `;

  document.getElementById("back").addEventListener("click", function () { go("home"); });
  document.getElementById("goSignup").addEventListener("click", function (e) { e.preventDefault(); go("signup"); });
  document.getElementById("goFind").addEventListener("click", function (e) { e.preventDefault(); go("findPassword"); });
  document.getElementById("goAdminLogin").addEventListener("click", function (e) { e.preventDefault(); openAdminLogin(); });

  const errorEl = document.getElementById("loginError");
  const okBtn = document.getElementById("loginOk");
  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.hidden = false;
  }

  async function attempt() {
    const username = document.getElementById("loginUsername").value;
    const password = document.getElementById("loginPassword").value;
    errorEl.hidden = true;
    okBtn.disabled = true;
    try {
      await signInUser(username, password);
      go("home");
    } catch (e) {
      showError(e.message || "로그인에 실패했습니다.");
    } finally {
      okBtn.disabled = false;
    }
  }
  okBtn.addEventListener("click", attempt);
  viewEl.querySelectorAll("input").forEach(function (inp) {
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
  });
}
