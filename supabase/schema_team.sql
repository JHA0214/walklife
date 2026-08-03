-- ==========================================================================
-- 워킹라이프 — 운영진 소개 (팀원 목록)
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 실행하세요.
--
-- exercises 테이블과 똑같은 방식으로 관리자만 쓸 수 있게 합니다: 이미 만들어
-- 두신 is_admin() 함수(auth.uid()가 app_admins 테이블에 있는지 확인)를 그대로
-- 재사용합니다. 이 함수가 없다면 먼저 exercises 테이블의 관리자 정책을
-- 설정했던 방식대로 is_admin()을 만들어 두셔야 합니다.
-- ==========================================================================

create table if not exists public.team_members (
  id text primary key,
  name text not null,
  photo_url text,
  career text,
  greeting text,
  created_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

-- 운영진 소개는 누구나(로그인 안 해도) 볼 수 있음
drop policy if exists "team_members_public_read" on public.team_members;
create policy "team_members_public_read" on public.team_members
  for select using (true);

-- 등록/수정/삭제는 관리자만
drop policy if exists "team_members_admin_insert" on public.team_members;
create policy "team_members_admin_insert" on public.team_members
  for insert with check (is_admin());

drop policy if exists "team_members_admin_update" on public.team_members;
create policy "team_members_admin_update" on public.team_members
  for update using (is_admin());

drop policy if exists "team_members_admin_delete" on public.team_members;
create policy "team_members_admin_delete" on public.team_members
  for delete using (is_admin());

-- ---------- 운영진 사진 저장용 Storage 버킷 ----------
-- public: true 라서 업로드된 사진은 누구나 URL로 볼 수 있고(getPublicUrl),
-- 업로드/수정/삭제는 아래 정책으로 관리자만 가능합니다.
insert into storage.buckets (id, name, public)
values ('team-photos', 'team-photos', true)
on conflict (id) do nothing;

drop policy if exists "team_photos_public_read" on storage.objects;
create policy "team_photos_public_read" on storage.objects
  for select using (bucket_id = 'team-photos');

drop policy if exists "team_photos_admin_insert" on storage.objects;
create policy "team_photos_admin_insert" on storage.objects
  for insert with check (bucket_id = 'team-photos' and is_admin());

drop policy if exists "team_photos_admin_update" on storage.objects;
create policy "team_photos_admin_update" on storage.objects
  for update using (bucket_id = 'team-photos' and is_admin());

drop policy if exists "team_photos_admin_delete" on storage.objects;
create policy "team_photos_admin_delete" on storage.objects
  for delete using (bucket_id = 'team-photos' and is_admin());
