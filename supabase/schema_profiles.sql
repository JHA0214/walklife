-- ==========================================================================
-- 워킹라이프 — 일반 회원 프로필 테이블
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 실행하세요.
-- (회원가입/로그인 자체는 Supabase Auth가 담당하며, 이 테이블은
--  "아이디(username)", "전화번호(phone)", "이메일(email, 선택)"을 함께
--  보관하기 위한 보조 테이블입니다.)
--
-- 이메일을 입력한 회원은 가입 시 그 실제 이메일이 Supabase Auth 계정의
-- 이메일로 그대로 쓰이고(비밀번호 찾기를 Supabase의 내장 이메일 링크로
-- 처리하기 위함), 입력하지 않은 회원은 기존처럼 `아이디@walklife.local`
-- 형태의 내부용 이메일을 씁니다. "아이디로 로그인"은 어느 쪽이든 동일하게
-- 동작해야 하므로, 아이디 -> 실제 이메일 조회는 클라이언트가 직접 하지 않고
-- 서버 쪽 Edge Function(supabase/functions/login)이 service role로 조회한 뒤
-- 로그인까지 대신 시도해서 성공/실패만 돌려줍니다 — js/store.js의 signInUser 참고.
-- (예전엔 이 조회를 공개 RPC(get_login_email)로 했었는데, 비밀번호 없이 아이디만
-- 알아도 등록된 실제 이메일이 새어나가는 문제가 있어 이 방식으로 교체했습니다.)
-- ==========================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  phone text not null,
  email text unique,
  created_at timestamptz not null default now()
);

-- 기존에 이미 profiles 테이블을 만들어 실행했었다면 이 줄로 email 컬럼만 추가됩니다.
alter table public.profiles add column if not exists email text unique;

alter table public.profiles enable row level security;

-- 본인 프로필만 조회 가능
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- auth.users에 새 계정이 생기면(회원가입 시 signUp의 options.data로 넘긴
-- username/phone/email을 이용해) 자동으로 profiles 행을 만들어주는 트리거.
-- security definer로 실행되어 RLS/타이밍 문제 없이 항상 안전하게 생성됩니다.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, phone, email)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'email'
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 예전에 쓰던 공개 RPC(아이디만으로 실제 이메일을 조회할 수 있어 정보 노출
-- 문제가 있었음)는 더 이상 쓰지 않으므로, 이미 만들어 실행했었다면 제거합니다.
-- 이제 이 조회는 supabase/functions/login Edge Function 안에서만 이뤄집니다.
drop function if exists public.get_login_email(text);
