// ==========================================================================
// 워킹라이프 — 아이디+비밀번호 로그인 (Edge Function)
//
// 아이디로 로그인하려면 그 아이디에 연결된 실제 로그인용 이메일을 알아야
// 하는데, 이걸 클라이언트가 직접 조회하게 하면(예: 공개 RPC) 비밀번호 없이
// 아이디만 알아도 그 회원의 실제 이메일 주소가 새어나가는 문제가 있었습니다.
// 그래서 이메일 조회 + 로그인 시도를 전부 서버(여기)에서만 하고, 클라이언트에는
// "성공(세션 토큰)" 또는 "아이디 또는 비밀번호가 올바르지 않습니다"만 돌려줍니다.
// 즉 비밀번호까지 맞아야 로그인이 성공하는 것이므로 이메일이 별도로 노출되지 않습니다.
//
// 배포 방법: Supabase 대시보드 > Edge Functions > New Function > 이름 "login"
// 으로 만든 뒤 이 파일 내용을 그대로 붙여넣고 배포(Deploy)하세요.
// CLI가 있다면: supabase functions deploy login
// ==========================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const USER_EMAIL_DOMAIN = "walklife.local";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { username, password } = await req.json();
    if (typeof username !== "string" || !username.trim() || typeof password !== "string" || !password) {
      return authError();
    }
    const trimmedUsername = username.trim();

    // 1) 아이디 -> 실제 로그인용 이메일 조회 (service role로만, 클라이언트에는 절대 돌려주지 않음)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("username", trimmedUsername)
      .maybeSingle();

    const email = (profile && profile.email)
      || (trimmedUsername.toLowerCase() + "@" + USER_EMAIL_DOMAIN);

    // 2) 실제 로그인 시도 (anon 클라이언트로 — 일반 로그인과 동일한 권한만 사용)
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data: authData, error: authErr } = await supabaseAnon.auth.signInWithPassword({ email, password });
    if (authErr || !authData.session) {
      return authError();
    }

    return new Response(JSON.stringify({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return authError();
  }
});

// 아이디가 존재하지 않는 경우와 비밀번호가 틀린 경우를 구분하지 않고 항상
// 같은 메시지를 돌려줘야 계정 존재 여부(아이디 유효성)가 새어나가지 않습니다.
function authError() {
  return new Response(JSON.stringify({ error: "아이디 또는 비밀번호가 올바르지 않습니다." }), {
    status: 400,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
