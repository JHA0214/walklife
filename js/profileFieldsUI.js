/* ==========================================================================
   워킹라이프 — 회원가입/마이페이지 공용: 나이·성별·원하는 운동 강도·관심 운동
   전부 선택 입력이며, HTML 생성(profileFieldsHtml)과 토글 동작 연결
   (wireProfileFields)을 나눠서 두 화면(signup.js, views/mypage.js)에서
   똑같이 재사용합니다.
   ========================================================================== */

import { esc } from "./utils.js";

const GENDERS = [
  { value: "", label: "선택 안 함" },
  { value: "남성", label: "남성" },
  { value: "여성", label: "여성" },
];

// current: { age, gender, desired_intensity, preferred_hashtags } (전부 선택적)
export function profileFieldsHtml(allTags, current) {
  current = current || {};
  const currentTags = current.preferred_hashtags || [];
  return `
    <div class="field">
      <label for="pfAge">나이 (선택)</label>
      <input type="number" id="pfAge" min="1" max="120" placeholder="예) 65"
             value="${current.age != null ? esc(current.age) : ""}" />
    </div>
    <div class="field">
      <label>성별 (선택)</label>
      <div class="font-choices" id="pfGenderChoices">
        ${GENDERS.map(function (g) {
          const active = (current.gender || "") === g.value;
          return `<button type="button" class="font-choice${active ? " active" : ""}" data-gender="${esc(g.value)}">${esc(g.label)}</button>`;
        }).join("")}
      </div>
    </div>
    <div class="field">
      <label>원하는 운동 강도 (선택)</label>
      <div class="font-choices" id="pfIntensityChoices">
        ${[1, 2, 3, 4, 5].map(function (n) {
          const active = Number(current.desired_intensity) === n;
          return `<button type="button" class="font-choice${active ? " active" : ""}" data-intensity="${n}" style="min-width:52px;padding:16px 6px;">${n}</button>`;
        }).join("")}
      </div>
      <p class="field-hint">1(매우 쉬움) ~ 5(매우 어려움) 중에서 선호하는 강도를 골라주세요.</p>
    </div>
    <div class="field">
      <label>원하는 운동 (선택, 여러 개 선택 가능)</label>
      ${allTags.length
        ? `<div class="tag-choices" id="pfTagChoices">${allTags.map(function (t) {
            const active = currentTags.indexOf(t) !== -1;
            return `<button type="button" class="tag-choice${active ? " active" : ""}" data-tag="${esc(t)}">#${esc(t)}</button>`;
          }).join("")}</div>`
        : `<p class="field-hint">아직 등록된 운동 키워드가 없습니다.</p>`}
    </div>
  `;
}

// container 안에서 profileFieldsHtml로 그려진 토글들의 클릭 동작을 연결하고,
// 현재 선택 상태를 읽을 수 있는 getValues()를 돌려줍니다.
export function wireProfileFields(container) {
  let selectedGender = "";
  const genderBtns = container.querySelectorAll("#pfGenderChoices .font-choice");
  genderBtns.forEach(function (btn) {
    if (btn.classList.contains("active")) selectedGender = btn.dataset.gender;
    btn.addEventListener("click", function () {
      selectedGender = btn.dataset.gender;
      genderBtns.forEach(function (b) { b.classList.toggle("active", b === btn); });
    });
  });

  let selectedIntensity = "";
  const intensityBtns = container.querySelectorAll("#pfIntensityChoices .font-choice");
  intensityBtns.forEach(function (btn) {
    if (btn.classList.contains("active")) selectedIntensity = btn.dataset.intensity;
    btn.addEventListener("click", function () {
      selectedIntensity = btn.dataset.intensity;
      intensityBtns.forEach(function (b) { b.classList.toggle("active", b === btn); });
    });
  });

  const selectedTags = new Set();
  const tagBtns = container.querySelectorAll("#pfTagChoices .tag-choice");
  tagBtns.forEach(function (btn) {
    if (btn.classList.contains("active")) selectedTags.add(btn.dataset.tag);
    btn.addEventListener("click", function () {
      const tag = btn.dataset.tag;
      if (selectedTags.has(tag)) { selectedTags.delete(tag); btn.classList.remove("active"); }
      else { selectedTags.add(tag); btn.classList.add("active"); }
    });
  });

  return {
    getValues: function () {
      return {
        age: container.querySelector("#pfAge").value,
        gender: selectedGender,
        desiredIntensity: selectedIntensity,
        preferredHashtags: Array.from(selectedTags),
      };
    },
  };
}
