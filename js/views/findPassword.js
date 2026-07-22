/* ==========================================================================
   워킹라이프 — 비밀번호 찾기
   - 전화번호 방식: 아이디+전화번호 일치 확인 후 바로 재설정 (SMS 인증 없는 약식 확인)
   - 이메일 방식: 가입 시 등록한 이메일로 Supabase가 재설정 링크를 보내줌 (더 안전,
     이메일을 등록한 회원만 사용 가능 — 클릭 후 이어지는 화면은 resetPassword.js)
   ========================================================================== */

import { resetPasswordByPhone, requestPasswordResetByEmail } from "../store.js";
import { go } from "../router.js";

export function renderFindPassword() {
  const viewEl = document.getElementById("view");
  viewEl.innerHTML = `
    <button class="back-btn" id="back">← 뒤로</button>
    <h1 class="page-title">비밀번호 찾기</h1>
    <p class="page-sub">가입할 때 등록한 방법으로 본인을 확인해 주세요.</p>

    <div class="font-choices" style="margin-bottom:20px;">
      <button class="font-choice active" id="modePhone" type="button">전화번호로 찾기</button>
      <button class="font-choice" id="modeEmail" type="button">이메일로 찾기</button>
    </div>

    <div id="phoneForm">
      <div class="field">
        <label for="fpUsername">아이디</label>
        <input type="text" id="fpUsername" autocomplete="username" placeholder="아이디" />
      </div>
      <div class="field">
        <label for="fpPhone">전화번호</label>
        <input type="tel" id="fpPhone" autocomplete="tel" placeholder="010-1234-5678" />
      </div>
      <div class="field">
        <label for="fpPassword">새 비밀번호</label>
        <input type="password" id="fpPassword" autocomplete="new-password" placeholder="6자 이상" />
      </div>
      <div class="field">
        <label for="fpPassword2">새 비밀번호 확인</label>
        <input type="password" id="fpPassword2" autocomplete="new-password" placeholder="비밀번호 다시 입력" />
      </div>
      <p id="fpError" class="pw-error" hidden></p>
      <p id="fpSuccess" class="pw-success" hidden>비밀번호가 바뀌었습니다. 새 비밀번호로 로그인해 주세요.</p>
      <div class="actions-row" style="margin-top:8px;">
        <button class="btn btn-primary btn-block" id="fpOk">비밀번호 재설정</button>
      </div>
    </div>

    <div id="emailForm" hidden>
      <div class="field">
        <label for="feEmail">가입 시 등록한 이메일</label>
        <input type="email" id="feEmail" autocomplete="email" placeholder="example@email.com" />
      </div>
      <p id="feError" class="pw-error" hidden></p>
      <p id="feSuccess" class="pw-success" hidden>재설정 메일을 보냈습니다. 메일함(스팸함도 확인)에서 안내에 따라 새 비밀번호를 설정해 주세요.</p>
      <div class="actions-row" style="margin-top:8px;">
        <button class="btn btn-primary btn-block" id="feOk">재설정 메일 보내기</button>
      </div>
    </div>
  `;

  document.getElementById("back").addEventListener("click", function () { go("home"); });

  // ---------- 모드 전환 ----------
  const modePhoneBtn = document.getElementById("modePhone");
  const modeEmailBtn = document.getElementById("modeEmail");
  const phoneForm = document.getElementById("phoneForm");
  const emailForm = document.getElementById("emailForm");
  modePhoneBtn.addEventListener("click", function () {
    modePhoneBtn.classList.add("active");
    modeEmailBtn.classList.remove("active");
    phoneForm.hidden = false;
    emailForm.hidden = true;
  });
  modeEmailBtn.addEventListener("click", function () {
    modeEmailBtn.classList.add("active");
    modePhoneBtn.classList.remove("active");
    emailForm.hidden = false;
    phoneForm.hidden = true;
  });

  // ---------- 전화번호 방식 ----------
  const fpError = document.getElementById("fpError");
  const fpSuccess = document.getElementById("fpSuccess");
  const fpOk = document.getElementById("fpOk");
  function showFpError(msg) {
    fpError.textContent = msg;
    fpError.hidden = false;
  }
  async function attemptPhone() {
    const username = document.getElementById("fpUsername").value;
    const phone = document.getElementById("fpPhone").value;
    const password = document.getElementById("fpPassword").value;
    const password2 = document.getElementById("fpPassword2").value;
    fpError.hidden = true;
    fpSuccess.hidden = true;

    if (password !== password2) {
      showFpError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    fpOk.disabled = true;
    try {
      await resetPasswordByPhone(username, phone, password);
      fpSuccess.hidden = false;
      setTimeout(function () { go("login"); }, 1500);
    } catch (e) {
      showFpError(e.message || "비밀번호 재설정에 실패했습니다.");
      fpOk.disabled = false;
    }
  }
  fpOk.addEventListener("click", attemptPhone);
  phoneForm.querySelectorAll("input").forEach(function (inp) {
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") attemptPhone(); });
  });

  // ---------- 이메일 방식 ----------
  const feError = document.getElementById("feError");
  const feSuccess = document.getElementById("feSuccess");
  const feOk = document.getElementById("feOk");
  function showFeError(msg) {
    feError.textContent = msg;
    feError.hidden = false;
  }
  async function attemptEmail() {
    const email = document.getElementById("feEmail").value;
    feError.hidden = true;
    feSuccess.hidden = true;

    feOk.disabled = true;
    try {
      await requestPasswordResetByEmail(email);
      feSuccess.hidden = false;
    } catch (e) {
      showFeError(e.message || "메일 발송에 실패했습니다.");
    } finally {
      feOk.disabled = false;
    }
  }
  feOk.addEventListener("click", attemptEmail);
  emailForm.querySelectorAll("input").forEach(function (inp) {
    inp.addEventListener("keydown", function (e) { if (e.key === "Enter") attemptEmail(); });
  });
}
