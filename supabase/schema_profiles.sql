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
-- 동작해야 하므로, 로그인 시에는 아래 get_login_email() 함수로 실제
-- 로그인용 이메일을 찾아 씁니다 — js/store.js의 signInUser 참고.
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

-- 로그인 시 "아이디" -> 실제 로그인용 이메일 변환에 쓰는 함수.
-- 이메일을 등록한 회원은 그 이메일을, 등록하지 않은 회원은
-- `아이디@walklife.local`을 돌려줍니다. 로그인 전(비로그인 상태)에도
-- 호출해야 하므로 RLS를 우회하는 security definer 함수로 만들고,
-- 이메일 주소 한 개만 돌려줘 다른 개인정보(전화번호 등) 노출은 없습니다.
create or replace function public.get_login_email(p_username text)
returns text
language sql
security definer
set search_path = public
as $$
  select coalesce(email, username || '@walklife.local')
  from public.profiles
  where username = p_username
  limit 1;
$$;

revoke all on function public.get_login_email(text) from public;
grant execute on function public.get_login_email(text) to anon, authenticated;
