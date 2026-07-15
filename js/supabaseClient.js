/* ==========================================================================
   워킹라이프 — Supabase 클라이언트 (빌드 도구 없이 ESM CDN으로 로드)
   ========================================================================== */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = "https://nuojlajlgnextaoxoyaz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im51b2psYWpsZ25leHRhb3hveWF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQwNDc5OTcsImV4cCI6MjA5OTYyMzk5N30.ifAq6dCebIcPqEjMUnJ-Q4bN1FajcobYueLeiSuiABA";

// supabase-js가 내부적으로 쓰는 navigator.locks 기반 세션 잠금이 일부 브라우저
// 환경에서 데드락을 일으켜 getSession()/signInWithPassword() 등이 에러 없이
// 영원히 멈추는 알려진 문제가 있음(github.com/supabase/supabase-js#1594, #2111).
// 이 앱은 탭 간 동기화가 필요 없으므로 잠금을 사용하지 않는 no-op으로 대체.
async function noOpLock(_name, _acquireTimeout, fn) {
  return await fn();
}

// anon key는 공개용으로 설계된 값입니다(브라우저에 노출돼도 안전).
// 실제 접근 제어는 Supabase의 Row Level Security 정책이 담당합니다.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: window.sessionStorage,   // 탭을 닫으면 로그아웃되는 기존 동작 유지
    persistSession: true,
    autoRefreshToken: true,
    lock: noOpLock,
  },
});
