/* ==========================================================================
   워킹라이프 — 관리자 로그인 모달
   비밀번호는 평문 비교가 아니라 SHA-256 해시로 비교하고, 연속 실패 시 잠시 잠급니다.
   (서버가 없는 클라이언트 검증의 한계는 js/data.js 주석 참고)
   ========================================================================== */

import { ADMIN_PASSWORD_HASH } from "./data.js";
import { isAdmin, setAdmin } from "./store.js";
import { go } from "./router.js";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30000; // 5회 실패 시 30초 잠금

let failCount = 0;
let lockedUntil = 0;

async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map(function (b) { return b.toString(16).padStart(2, "0"); })
    .join("");
}

export function openAdminLogin() {
  if (isAdmin()) { go("admin"); return; }
  const overlay = document.getElementById("modalOverlay");
  document.getElementById("modalTitle").textContent = "관리자 로그인";
  document.getElementById("modalBody").innerHTML = `
    <div class="field">
      <label for="pw">비밀번호</label>
      <input type="password" id="pw" inputmode="numeric" autocomplete="off"
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
    const hash = await sha256Hex(pw.value);
    if (hash === ADMIN_PASSWORD_HASH) {
      failCount = 0;
      setAdmin(true);
      closeModal();
      go("admin");
    } else {
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
    }
  }
  document.getElementById("pwOk").addEventListener("click", attempt);
  pw.addEventListener("keydown", function (e) { if (e.key === "Enter") attempt(); });
  document.getElementById("pwCancel").addEventListener("click", closeModal);
}

export function closeModal() {
  document.getElementById("modalOverlay").hidden = true;
  document.getElementById("modalBody").innerHTML = "";
}
