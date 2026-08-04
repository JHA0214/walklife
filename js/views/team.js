/* ==========================================================================
   워킹라이프 — 운영진 소개 (누구나 볼 수 있고, 관리자만 추가/수정/삭제 가능)
   ========================================================================== */

import { getTeamMembers, removeTeamMember, isAdmin, isLoggedIn } from "../store.js";
import { esc } from "../utils.js";
import { go } from "../router.js";

export function renderTeam() {
  const viewEl = document.getElementById("view");
  viewEl.innerHTML = `
    <button class="back-btn" id="back">← 뒤로</button>
    <h1 class="page-title">운영진 소개</h1>
    ${isAdmin() ? '<button class="btn btn-primary btn-block" id="addMember">＋ 운영진 추가</button>' : ""}
    <div id="teamList" style="margin-top:16px;"><p class="page-sub">불러오는 중…</p></div>
  `;

  document.getElementById("back").addEventListener("click", function () {
    if (isAdmin()) go("admin");
    else if (isLoggedIn()) go("mypage");
    else go("home");
  });
  if (isAdmin()) {
    document.getElementById("addMember").addEventListener("click", function () { go("teamEdit", {}); });
  }

  loadTeam();
}

async function loadTeam() {
  const listEl = document.getElementById("teamList");
  let members;
  try {
    members = await getTeamMembers();
  } catch (e) {
    listEl.innerHTML = '<p class="pw-error">운영진 소개를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>';
    return;
  }
  if (!document.getElementById("teamList")) return; // 그 사이 다른 화면으로 이동

  if (!members.length) {
    listEl.innerHTML = '<div class="empty">아직 등록된 운영진 소개가 없습니다.</div>';
    return;
  }

  listEl.innerHTML = members.map(function (m) {
    return `
      <div class="team-card">
        ${m.photoUrl
          ? `<img class="team-photo" src="${esc(m.photoUrl)}" alt="${esc(m.name)} 사진" />`
          : `<div class="team-photo team-photo-empty">👤</div>`}
        <h2 class="team-name">${esc(m.name)}</h2>
        ${m.career ? `<div class="team-career">${esc(m.career)}</div>` : ""}
        ${m.greeting ? `<p class="team-greeting">${esc(m.greeting)}</p>` : ""}
        ${isAdmin() ? `
          <div class="actions-row" style="margin-top:10px;">
            <button class="btn btn-small" data-edit="${esc(m.id)}">수정</button>
            <button class="btn btn-small btn-danger" data-del="${esc(m.id)}">삭제</button>
          </div>` : ""}
      </div>`;
  }).join("");

  listEl.querySelectorAll("[data-edit]").forEach(function (b) {
    b.addEventListener("click", function () { go("teamEdit", { id: b.dataset.edit }); });
  });
  listEl.querySelectorAll("[data-del]").forEach(function (b) {
    b.addEventListener("click", async function () {
      const m = members.find(function (x) { return x.id === b.dataset.del; });
      if (m && confirm(`"${m.name}" 소개를 삭제할까요?`)) {
        b.disabled = true;
        try {
          await removeTeamMember(b.dataset.del);
          loadTeam();
        } catch (e) {
          alert("삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.");
          b.disabled = false;
        }
      }
    });
  });
}
