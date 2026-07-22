/* ==========================================================================
   워킹라이프 — 상태 + Supabase(운동 데이터/관리자 인증) + localStorage(설정/즐겨찾기) 저장소
   운동 목록 / 설정 / 즐겨찾기 / 관리자 세션을 관리하는 유일한 모듈
   ========================================================================== */

import { DEFAULT_EXERCISES, DEFAULT_COUNT_SETTINGS, ADMIN_EMAIL, USER_EMAIL_DOMAIN } from "./data.js";
import { supabase } from "./supabaseClient.js";

const STORE_EX_CACHE = "wl_exercises_cache"; // 오프라인 폴백용 캐시 (더 이상 원본 저장소 아님)
const STORE_SETTINGS = "wl_settings";
const STORE_FAVORITES = "wl_favorites";

// ---------- 설정/즐겨찾기 저장소 (기존과 동일, 계속 localStorage) ----------
function loadSettings() {
  try {
    const raw = localStorage.getItem(STORE_SETTINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* 무시 */ }
  return { fontScale: 1, highContrast: false };
}
function loadFavorites() {
  try {
    const raw = localStorage.getItem(STORE_FAVORITES);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* 무시 */ }
  return [];
}
function saveFavorites() {
  localStorage.setItem(STORE_FAVORITES, JSON.stringify(favorites));
}

// ---------- 상태 ----------
let exercises = [];                    // Supabase에서 채워지는 캐시 (initExercises 이후 유효)
let settings = loadSettings();
let favorites = loadFavorites();       // 즐겨찾기한 운동 id 목록
let adminFlag = false;                 // initAuthSession() 이후 유효

// ---------- 운동 데이터: Supabase ↔ 앱 데이터 형식 변환 ----------
function fromDbRow(row) {
  return {
    id: row.id,
    title: row.title,
    bodyPart: row.body_part,
    subPart: row.sub_part,
    youtubeUrl: row.youtube_url,
    difficulty: row.difficulty,
    description: row.description,
    hashtags: row.hashtags || [],
    intervalSec: row.interval_sec,
    reps: row.reps,
  };
}
function toDbRow(data) {
  const row = {};
  if ("id" in data) row.id = data.id;
  if ("title" in data) row.title = data.title;
  if ("bodyPart" in data) row.body_part = data.bodyPart;
  if ("subPart" in data) row.sub_part = data.subPart;
  if ("youtubeUrl" in data) row.youtube_url = data.youtubeUrl;
  if ("difficulty" in data) row.difficulty = data.difficulty;
  if ("description" in data) row.description = data.description;
  if ("hashtags" in data) row.hashtags = data.hashtags;
  if ("intervalSec" in data) row.interval_sec = data.intervalSec;
  if ("reps" in data) row.reps = data.reps;
  return row;
}

// Supabase에서 전체 운동 목록을 다시 불러와 캐시를 갱신 (쓰기 이후 항상 이걸로 재동기화)
async function refreshExercises() {
  const { data, error } = await supabase.from("exercises").select("*").order("id");
  if (error) throw error;
  exercises = data.map(fromDbRow);
  try { localStorage.setItem(STORE_EX_CACHE, JSON.stringify(exercises)); } catch (e) { /* 무시 */ }
}

// 앱 시작 시 1회 호출: 운동 데이터를 Supabase에서 불러옴 (실패 시 로컬 캐시 → 기본 데이터로 폴백)
export async function initExercises() {
  try {
    await refreshExercises();
  } catch (e) {
    try {
      const raw = localStorage.getItem(STORE_EX_CACHE);
      exercises = raw ? JSON.parse(raw) : DEFAULT_EXERCISES.slice();
    } catch (e2) {
      exercises = DEFAULT_EXERCISES.slice();
    }
  }
}

export function getExercises() {
  return exercises;
}
export function findExercise(id) {
  return exercises.find(function (e) { return e.id === id; });
}
export async function addExercise(data) {
  const { error } = await supabase.from("exercises").insert(toDbRow(data));
  if (error) throw error;
  await refreshExercises();
}
export async function updateExercise(id, data) {
  const { error } = await supabase.from("exercises").update(toDbRow(data)).eq("id", id);
  if (error) throw error;
  await refreshExercises();
}
export async function removeExercise(id) {
  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) throw error;
  await refreshExercises();
  if (isFav(id)) toggleFav(id);
}
export function filterExercises(q) {
  q = q.trim().toLowerCase().replace(/^#/, "");
  if (!q) return exercises.slice();
  return exercises.filter(function (e) {
    const hay = [
      e.title, e.bodyPart, e.subPart, e.description,
      (e.hashtags || []).join(" "),
    ].join(" ").toLowerCase();
    return hay.indexOf(q) !== -1;
  });
}

// 운동별 음성 카운트 설정 읽기 (값이 없으면 기본값 사용)
export function exInterval(ex) {
  return Number(ex && ex.intervalSec) > 0 ? Number(ex.intervalSec) : DEFAULT_COUNT_SETTINGS.intervalSec;
}
export function exReps(ex) {
  return Number(ex && ex.reps) > 0 ? Number(ex.reps) : DEFAULT_COUNT_SETTINGS.reps;
}
// 운동 난이도 읽기 (1.0~5.0, 0.5 단위 / 값이 없거나 잘못되면 기본 3.0)
export function exDifficulty(ex) {
  const n = Number(ex && ex.difficulty);
  if (!(n >= 1 && n <= 5)) return 3;
  return Math.round(n * 2) / 2;
}

// ---------- 즐겨찾기 ----------
export function isFav(id) {
  return favorites.indexOf(id) !== -1;
}
export function toggleFav(id) {
  const i = favorites.indexOf(id);
  if (i === -1) favorites.push(id); else favorites.splice(i, 1);
  saveFavorites();
}

// ---------- 설정 ----------
export function getSettings() {
  return settings;
}
export function saveSettings() {
  localStorage.setItem(STORE_SETTINGS, JSON.stringify(settings));
}
// ---------- 접근성 설정 적용 ----------
export function applySettings() {
  document.documentElement.style.setProperty("--font-scale", settings.fontScale);
  document.body.classList.toggle("high-contrast", !!settings.highContrast);
}

// ---------- 계정 세션 (관리자 1계정 + 일반 회원, 모두 Supabase Auth 세션 하나를 공유) ----------
// 세션은 브라우저(탭)당 하나뿐이므로 "관리자로 로그인된 상태"와 "일반 회원으로 로그인된
// 상태"는 동시에 성립하지 않습니다. 세션의 이메일이 ADMIN_EMAIL이면 관리자, 그 외에는
// (있다면) 일반 회원으로 판단합니다.
let currentUsername = null; // 일반 회원으로 로그인 중이면 아이디, 아니면 null

function applySession(session) {
  const email = session && session.user ? session.user.email : null;
  adminFlag = email === ADMIN_EMAIL;
  currentUsername = (email && !adminFlag && session.user.user_metadata)
    ? (session.user.user_metadata.username || null)
    : null;
}

export function isAdmin() {
  return adminFlag;
}
// 앱 시작 시 1회 호출: 기존 로그인 세션(관리자/일반 회원 공통)이 남아있는지 확인
export async function initAuthSession() {
  const { data } = await supabase.auth.getSession();
  applySession(data.session);
  supabase.auth.onAuthStateChange(function (event, session) {
    applySession(session);
    if (event === "PASSWORD_RECOVERY" && passwordRecoveryHandler) passwordRecoveryHandler();
  });
}
export async function signInAdmin(password) {
  const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: password });
  if (error) throw error;
  adminFlag = true; // onAuthStateChange 콜백을 기다리지 않고 즉시 반영 (레이스 컨디션 방지)
  currentUsername = null;
}
export async function signOutAdmin() {
  await supabase.auth.signOut();
  adminFlag = false;
}

// ---------- 일반 회원 계정 (Supabase Auth, 아이디를 내부용 이메일로 변환해 사용) ----------
const USERNAME_RE = /^[a-zA-Z0-9_]{4,20}$/;
const PHONE_RE = /^01[0-9]-?\d{3,4}-?\d{4}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function usernameToEmail(username) {
  return username.trim().toLowerCase() + "@" + USER_EMAIL_DOMAIN;
}
function normalizePhone(phone) {
  return (phone || "").replace(/[^0-9]/g, "");
}
export function isValidUsername(username) {
  return USERNAME_RE.test((username || "").trim());
}
export function isValidPhone(phone) {
  return PHONE_RE.test((phone || "").trim());
}
export function isValidEmail(email) {
  return EMAIL_RE.test((email || "").trim());
}

export function isLoggedIn() {
  return !!currentUsername;
}
export function getUsername() {
  return currentUsername;
}

// 회원가입. email은 선택 입력 — 입력하면 비밀번호 찾기를 이메일 링크(더 안전)로 쓸 수 있고,
// 비워두면 기존처럼 전화번호 일치 확인 방식만 쓸 수 있습니다.
export async function signUpUser(username, password, phone, email) {
  if (!isValidUsername(username)) throw new Error("아이디는 영문/숫자/밑줄 4~20자로 입력해 주세요.");
  if (!isValidPhone(phone)) throw new Error("전화번호 형식이 올바르지 않습니다. 예) 010-1234-5678");
  if (!password || password.length < 6) throw new Error("비밀번호는 6자 이상 입력해 주세요.");
  const trimmedEmail = (email || "").trim();
  if (trimmedEmail && !isValidEmail(trimmedEmail)) throw new Error("이메일 형식이 올바르지 않습니다.");

  // 이메일을 입력했다면 그 실제 이메일을 계정 이메일로 사용(비밀번호 찾기 이메일 링크용).
  // 입력하지 않았다면 기존처럼 내부용 가짜 이메일을 사용.
  const authEmail = trimmedEmail || usernameToEmail(username);

  const { error } = await supabase.auth.signUp({
    email: authEmail,
    password: password,
    options: {
      data: {
        username: username.trim(),
        phone: normalizePhone(phone),
        email: trimmedEmail || null,
      },
    },
  });
  if (error) {
    if (String(error.message).indexOf("already registered") !== -1) {
      throw new Error(trimmedEmail ? "이미 사용 중인 아이디 또는 이메일입니다." : "이미 사용 중인 아이디입니다.");
    }
    throw error;
  }
  adminFlag = false;
  currentUsername = username.trim(); // onAuthStateChange를 기다리지 않고 즉시 반영
}

export async function signInUser(username, password) {
  // 아이디만으로는 실제 로그인용 이메일을 알 수 없음(이메일 등록 회원은 그 이메일,
  // 아니면 내부용 가짜 이메일) — DB에 물어봐서 확인.
  const { data: loginEmail } = await supabase.rpc("get_login_email", { p_username: username.trim() });
  const email = loginEmail || usernameToEmail(username);

  const { error } = await supabase.auth.signInWithPassword({ email: email, password: password });
  if (error) throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
  adminFlag = false;
  currentUsername = username.trim();
}

export async function signOutUser() {
  await supabase.auth.signOut();
  currentUsername = null;
}

// 전화번호로 본인 확인 후 비밀번호를 재설정합니다(SMS 인증 없는 약식 확인).
// 다른 회원의 비밀번호를 바꾸는 작업이라 anon key로는 할 수 없고, service role 키를 쓰는
// 서버 쪽 Edge Function(supabase/functions/reset-password)에서 처리합니다.
export async function resetPasswordByPhone(username, phone, newPassword) {
  if (!isValidUsername(username)) throw new Error("아이디 형식이 올바르지 않습니다.");
  if (!isValidPhone(phone)) throw new Error("전화번호 형식이 올바르지 않습니다.");
  if (!newPassword || newPassword.length < 6) throw new Error("비밀번호는 6자 이상 입력해 주세요.");

  const { data, error } = await supabase.functions.invoke("reset-password", {
    body: { username: username.trim(), phone: normalizePhone(phone), newPassword: newPassword },
  });
  if (error || (data && data.error)) {
    throw new Error((data && data.error) || "일치하는 계정을 찾을 수 없습니다. 아이디와 전화번호를 확인해 주세요.");
  }
}

// 이메일로 비밀번호 재설정 링크를 보냅니다(Supabase Auth 내장 기능, 실제 메일함 소유
// 확인이 되는 더 안전한 방식). 가입 시 이메일을 등록한 회원만 사용할 수 있습니다.
export async function requestPasswordResetByEmail(email) {
  if (!isValidEmail(email)) throw new Error("이메일 형식이 올바르지 않습니다.");
  const redirectTo = window.location.origin + window.location.pathname + "#resetPassword";
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectTo });
  if (error) throw error;
}

// 이메일 재설정 링크를 클릭해 들어온(= 세션이 "복구" 상태인) 상태에서 새 비밀번호로 바꿉니다.
export async function updateOwnPassword(newPassword) {
  if (!newPassword || newPassword.length < 6) throw new Error("비밀번호는 6자 이상 입력해 주세요.");
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// 이메일 재설정 링크를 클릭해 앱으로 돌아왔을 때(PASSWORD_RECOVERY 이벤트) 호출할 콜백 등록.
let passwordRecoveryHandler = null;
export function setPasswordRecoveryHandler(fn) {
  passwordRecoveryHandler = fn;
}
