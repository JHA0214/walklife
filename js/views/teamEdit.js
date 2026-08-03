/* ==========================================================================
   워킹라이프 — 운영진 소개 추가/수정 폼 (관리자 전용)
   ========================================================================== */

import { getTeamMembers, addTeamMember, updateTeamMember, uploadTeamPhoto, isAdmin } from "../store.js";
import { esc, uid } from "../utils.js";
import { go, getRoute } from "../router.js";
import { openAdminLogin } from "../adminAuth.js";

export function renderTeamEdit() {
  if (!isAdmin()) { openAdminLogin(); return; }
  const viewEl = document.getElementById("view");
  const editId = getRoute().params.id;

  viewEl.innerHTML = `
    <button class="back-btn" id="back">← 운영진 소개</button>
    <h1 class="page-title">${editId ? "운영진 정보 수정" : "운영진 추가"}</h1>
    <p class="page-sub">불러오는 중…</p>
  `;
  document.getElementById("back").addEventListener("click", function () { go("team"); });

  if (!editId) {
    renderForm(null);
    return;
  }
  getTeamMembers().then(function (members) {
    const found = members.find(function (m) { return m.id === editId; });
    renderForm(found || null);
  }).catch(function () {
    renderForm(null);
  });
}

function renderForm(editing) {
  const viewEl = document.getElementById("view");
  const draft = editing
    ? { id: editing.id, name: editing.name, photoUrl: editing.photoUrl, career: editing.career, greeting: editing.greeting }
    : { id: null, name: "", photoUrl: "", career: "", greeting: "" };

  viewEl.innerHTML = `
    <button class="back-btn" id="back">← 운영진 소개</button>
    <h1 class="page-title">${editing ? "운영진 정보 수정" : "운영진 추가"}</h1>

    <div class="field">
      <label for="fName">이름</label>
      <input id="fName" type="text" value="${esc(draft.name)}" placeholder="예) 김워크" />
    </div>

    <div class="field">
      <label for="fPhoto">사진</label>
      ${draft.photoUrl ? `<img src="${esc(draft.photoUrl)}" alt="현재 사진" class="team-photo" style="margin-bottom:10px;" />` : ""}
      <input id="fPhoto" type="file" accept="image/*" />
      <p class="field-hint">${draft.photoUrl ? "새 파일을 고르면 기존 사진을 대신합니다." : "선택하지 않아도 저장할 수 있습니다."}</p>
    </div>

    <div class="field">
      <label for="fCareer">경력 소개</label>
      <textarea id="fCareer" placeholder="예) 2020~ 워크라이프 운영&#10;물리치료사 10년 경력">${esc(draft.career)}</textarea>
    </div>

    <div class="field">
      <label for="fGreeting">인사말</label>
      <textarea id="fGreeting" placeholder="경력 소개 아래에 보여줄 짧은 인사말을 적어주세요.">${esc(draft.greeting)}</textarea>
    </div>

    <p id="teamEditError" class="pw-error" hidden></p>

    <div class="actions-row">
      <button class="btn btn-primary" id="save">💾 저장</button>
      <button class="btn" id="cancel">취소</button>
    </div>
  `;

  document.getElementById("back").addEventListener("click", function () { go("team"); });
  document.getElementById("cancel").addEventListener("click", function () { go("team"); });

  const errorEl = document.getElementById("teamEditError");
  const saveBtn = document.getElementById("save");
  saveBtn.addEventListener("click", async function () {
    const name = document.getElementById("fName").value.trim();
    errorEl.hidden = true;
    if (!name) { errorEl.textContent = "이름을 입력해 주세요."; errorEl.hidden = false; return; }

    const career = document.getElementById("fCareer").value;
    const greeting = document.getElementById("fGreeting").value;
    const photoFile = document.getElementById("fPhoto").files[0];

    saveBtn.disabled = true;
    saveBtn.textContent = "저장 중…";
    try {
      let photoUrl = draft.photoUrl;
      if (photoFile) {
        photoUrl = await uploadTeamPhoto(photoFile);
      }
      const data = { name: name, photoUrl: photoUrl, career: career, greeting: greeting };
      if (editing) {
        await updateTeamMember(editing.id, data);
      } else {
        await addTeamMember(Object.assign({ id: uid() }, data));
      }
      go("team");
    } catch (e) {
      errorEl.textContent = e.message || "저장에 실패했습니다. 잠시 후 다시 시도해 주세요.";
      errorEl.hidden = false;
      saveBtn.disabled = false;
      saveBtn.textContent = "💾 저장";
    }
  });
}
