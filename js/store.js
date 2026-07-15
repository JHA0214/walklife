/* ==========================================================================
   워킹라이프 — 상태 + Supabase(운동 데이터/관리자 인증) + localStorage(설정/즐겨찾기) 저장소
   운동 목록 / 설정 / 즐겨찾기 / 관리자 세션을 관리하는 유일한 모듈
   ========================================================================== */

import { DEFAULT_EXERCISES, DEFAULT_COUNT_SETTINGS, ADMIN_EMAIL } from "./data.js";
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
let adminFlag = false;                 // initAdmin() 이후 유효

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

// ---------- 관리자 세션 (Supabase Auth) ----------
export function isAdmin() {
  return adminFlag;
}
// 앱 시작 시 1회 호출: 기존 로그인 세션이 남아있는지 확인
export async function initAdmin() {
  const { data } = await supabase.auth.getSession();
  adminFlag = !!data.session;
  supabase.auth.onAuthStateChange(function (_event, session) {
    adminFlag = !!session;
  });
}
export async function signInAdmin(password) {
  const { error } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: password });
  if (error) throw error;
  adminFlag = true; // onAuthStateChange 콜백을 기다리지 않고 즉시 반영 (레이스 컨디션 방지)
}
export async function signOutAdmin() {
  await supabase.auth.signOut();
  adminFlag = false;
}
