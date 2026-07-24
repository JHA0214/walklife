/* ==========================================================================
   워킹라이프 — 진입점
   화면 모듈을 라우터에 등록하고, 상단 헤더 버튼 이벤트를 연결한 뒤 첫 화면을 그립니다.
   ========================================================================== */

import { applySettings, initExercises, initAuthSession, signOutAdmin, setPasswordRecoveryHandler } from "./store.js";
import { go, render, registerScreen } from "./router.js";
import { closeModal } from "./adminAuth.js";

import { renderHome } from "./views/home.js";
import { renderSubparts } from "./views/subparts.js";
import { renderSearchResults } from "./views/search.js";
import { renderExercise } from "./views/exercise.js";
import { renderSettings } from "./views/settings.js";
import { renderAdmin } from "./views/admin.js";
import { renderAdminEdit } from "./views/adminEdit.js";
import { renderLogin } from "./views/login.js";
import { renderSignup } from "./views/signup.js";
import { renderFindPassword } from "./views/findPassword.js";
import { renderResetPassword } from "./views/resetPassword.js";
import { renderMypage } from "./views/mypage.js";

registerScreen("home", renderHome);
registerScreen("subparts", renderSubparts);
registerScreen("search", renderSearchResults);
registerScreen("exercise", renderExercise);
registerScreen("settings", renderSettings);
registerScreen("admin", renderAdmin);
registerScreen("adminEdit", renderAdminEdit);
registerScreen("login", renderLogin);
registerScreen("signup", renderSignup);
registerScreen("findPassword", renderFindPassword);
registerScreen("resetPassword", renderResetPassword);
registerScreen("mypage", renderMypage);

// ---------- 헤더 버튼 이벤트 ----------
document.getElementById("btnHome").addEventListener("click", function () { go("home"); });
document.getElementById("btnSettings").addEventListener("click", function () { go("settings"); });
document.getElementById("btnGoAdmin").addEventListener("click", function () { go("admin"); });
document.getElementById("btnLogout").addEventListener("click", async function () {
  await signOutAdmin();
  go("home");
});
document.getElementById("btnUserLogin").addEventListener("click", function () {
  go(this.dataset.mode === "mypage" ? "mypage" : "login");
});
document.getElementById("modalOverlay").addEventListener("click", function (e) {
  if (e.target.id === "modalOverlay") closeModal();
});

// ---------- 시작 ----------
document.getElementById("view").innerHTML = '<p class="page-sub">불러오는 중…</p>';
applySettings();
setPasswordRecoveryHandler(function () { go("resetPassword"); });
await Promise.all([initExercises(), initAuthSession()]);
render();
