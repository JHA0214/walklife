// ==========================================================================
// 워킹라이프 — 전화번호 확인을 통한 비밀번호 재설정 (Edge Function)
//
// 다른 회원의 비밀번호를 변경하려면 Supabase Auth의 관리자 권한(service role)이
// 필요한데, service role 키는 절대 브라우저(anon key)에 노출하면 안 되므로
// 이 작업은 서버 쪽인 Edge Function에서만 수행합니다.
//
// 배포 방법(로컬에 Supabase CLI가 없다면):
//   Supabase 대시보드 > Edge Functions > New Function > 이름 "reset-password"
//   로 만든 뒤 이 파일 내용을 그대로 붙여넣고 배포(Deploy)하세요.
// CLI가 있다면: supabase functions deploy reset-password
//
// 주의: 이 방식은 실제 SMS 인증이 아니라 "아이디+전화번호 일치 여부"만 확인하는
// 약식 본인확인입니다. 아이디와 전화번호를 둘 다 아는 제3자가 있다면 비밀번호를
// 바꿀 수 있으므로, 더 강한 보안이 필요해지면 SMS OTP 인증으로 교체를 권장합니다.
// ==========================================================================

import { createClient } from "npm:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function normalizePhone(phone: unknown): string {
  return String(phone ?? "").replace(/[^0-9]/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const { username, phone, newPassword } = await req.json();

    if (typeof username !== "string" || !username.trim()) {
      return jsonError("아이디를 입력해 주세요.");
    }
    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return jsonError("비밀번호는 6자 이상 입력해 주세요.");
    }
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) {
      return jsonError("전화번호를 입력해 주세요.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // username + phone이 모두 일치하는 프로필이 있는지 확인 (본인확인 대용)
    const { data: profile, error: findError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("username", username.trim())
      .eq("phone", normalizedPhone)
      .maybeSingle();

    if (findError) throw findError;
    if (!profile) {
      // 아이디/전화번호 중 무엇이 틀렸는지는 알려주지 않음(계정 탐지 방지)
      return jsonError("일치하는 계정을 찾을 수 없습니다. 아이디와 전화번호를 확인해 주세요.");
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password: newPassword },
    );
    if (updateError) throw updateError;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return jsonError("비밀번호 재설정 중 오류가 발생했습니다.", 500);
  }
});

function jsonError(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
