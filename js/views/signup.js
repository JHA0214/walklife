/* ==========================================================================
   워킹라이프 — 회원가입
   ========================================================================== */

import { signUpUser, getAllHashtags } from "../store.js";
import { go } from "../router.js";
import { esc } from "../utils.js";

export function renderSignup() {
  const viewEl = document.getElementById("view");
  const allTags = getAllHashtags();

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

    <div class="field">
      <label for="suAge">나이 (선택)</label>
      <input type="number" id="suAge" min="1" max="120" placeholder="예) 65" />
    </div>

    <div class="field">
      <label>성별 (선택)</label>
      <div class="font-choices" id="genderChoices">
        <button type="button" class="font-choice active" data-gender="">선택 안 함</button>
        <button type="button" class="font-choice" data-gender="남성">남성</button>
        <button type="button" class="font-choice" data-gender="여성">여성</button>
      </div>
    </div>

    <div class="field">
      <label>원하는 운동 강도 (선택)</label>
      <div class="font-choices" id="intensityChoices">
        ${[1, 2, 3, 4, 5].map(function (n) {
          return `<button type="button" class="font-choice" data-intensity="${n}" style="min-width:52px;padding:16px 6px;">${n}</button>`;
        }).join("")}
      </div>
      <p class="field-hint">1(매우 쉬움) ~ 5(매우 어려움) 중에서 선호하는 강도를 골라주세요.</p>
    </div>

    <div class="field">
      <label>원하는 운동 (선택, 여러 개 선택 가능)</label>
      ${allTags.length
        ? `<div class="tag-choices" id="tagChoices">${allTags.map(function (t) {
            return `<button type="button" class="tag-choice" data-tag="${esc(t)}">#${esc(t)}</button>`;
          }).join("")}</div>`
        : `<p class="field-hint">아직 등록된 운동 키워드가 없습니다.</p>`}
      <p class="field-hint">관심 있는 운동 키워드를 골라주세요.</p>
    </div>

    <p id="suError" class="pw-error" hidden></p>

    <div class="actions-row" style="margin-top:8px;">
      <button class="btn btn-primary btn-block" id="suOk">가입하기</button>
    </div>
  `;

  document.getElementById("back").addEventListener("click", function () { go("home"); });

  // ---------- 성별: 단일 선택 토글 ----------
  let selectedGender = "";
  const genderBtns = viewEl.querySelectorAll("#genderChoices .font-choice");
  genderBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      selectedGender = btn.dataset.gender;
      genderBtns.forEach(function (b) { b.classList.toggle("active", b === btn); });
    });
  });

  // ---------- 원하는 운동 강도: 단일 선택 토글 ----------
  let selectedIntensity = "";
  const intensityBtns = viewEl.querySelectorAll("#intensityChoices .font-choice");
  intensityBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      selectedIntensity = btn.dataset.intensity;
      intensityBtns.forEach(function (b) { b.classList.toggle("active", b === btn); });
    });
  });

  // ---------- 원하는 운동(해시태그): 다중 선택 토글 ----------
  const selectedTags = new Set();
  const tagBtns = viewEl.querySelectorAll("#tagChoices .tag-choice");
  tagBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const tag = btn.dataset.tag;
      if (selectedTags.has(tag)) { selectedTags.delete(tag); btn.classList.remove("active"); }
      else { selectedTags.add(tag); btn.classList.add("active"); }
    });
  });

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
    const age = document.getElementById("suAge").value;
    errorEl.hidden = true;

    if (password !== password2) {
      showError("비밀번호가 서로 일치하지 않습니다.");
      return;
    }

    okBtn.disabled = true;
    try {
      await signUpUser({
        username: username,
        password: password,
        phone: phone,
        email: email,
        age: age,
        gender: selectedGender,
        desiredIntensity: selectedIntensity,
        preferredHashtags: Array.from(selectedTags),
      });
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
