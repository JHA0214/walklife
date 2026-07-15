/* ==========================================================================
   워킹라이프 — 관리자 로그인 모달
   비밀번호는 Supabase Auth가 서버에서 검증합니다. 연속 실패 시 잠시 잠그는 건
   UX 편의를 위한 것일 뿐 실제 보안 경계가 아니며, 진짜 경계는 Supabase Auth + RLS입니다.
   ========================================================================== */

import { isAdmin, signInAdmin } from "./store.js";
import { go } from "./router.js";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30000; // 5회 실패 시 30초 잠금

let failCount = 0;
let lockedUntil = 0;

export function openAdminLogin() {
  if (isAdmin()) { go("admin"); return; }
  const overlay = document.getElementById("modalOverlay");
  document.getElementById("modalTitle").textContent = "관리자 로그인";
  document.getElementById("modalBody").innerHTML = `
    <div class="field">
      <label for="pw">비밀번호</label>
      <input type="password" id="pw" autocomplete="off"
             placeholder="비밀번호 입력" />
      <p id="pwError" class="pw-error" hidden></p>
    </div>
    <div class="actions-row" style="margin-top:8px;">
      <button class="btn btn-primary btn-block" id="pwOk">로그인</button>
      <button class="btn btn-block" id="pwCancel">취소</button>
    </div>
  `;
  overlay.hidden = false;
  const pw = document.getElementById("pw");
  const pwError = document.getElementById("pwError");
  const pwOk = document.getElementById("pwOk");
  pw.focus();

  function showError(msg) {
    pwError.textContent = msg;
    pwError.hidden = false;
  }

  async function attempt() {
    const remainMs = lockedUntil - Date.now();
    if (remainMs > 0) {
      showError(`시도 횟수를 초과했습니다. ${Math.ceil(remainMs / 1000)}초 후 다시 시도해 주세요.`);
      return;
    }
    pwOk.disabled = true;
    try {
      await signInAdmin(pw.value);
      failCount = 0;
      closeModal();
      go("admin");
    } catch (e) {
      pw.value = "";
      pw.focus();
      failCount++;
      if (failCount >= MAX_ATTEMPTS) {
        lockedUntil = Date.now() + LOCKOUT_MS;
        failCount = 0;
        showError(`시도 횟수를 초과했습니다. ${LOCKOUT_MS / 1000}초 후 다시 시도해 주세요.`);
      } else {
        showError("비밀번호가 올바르지 않습니다.");
      }
    } finally {
      pwOk.disabled = false;
    }
  }
  pwOk.addEventListener("click", attempt);
  pw.addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
  document.getElementById("pwCancel").addEventListener("click", closeModal);
}

export function closeModal() {
  document.getElementById("modalOverlay").hidden = true;
  document.getElementById("modalBody").innerHTML = "";
}
