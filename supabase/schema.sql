create table if not exists public.institutions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  created_at timestamptz not null default now()
);

insert into public.institutions (slug, name)
values ('adustech', 'Aliko Dangote University of Science and Technology')
on conflict (slug) do nothing;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  institution_id uuid not null references public.institutions (id),
  full_name text not null check (char_length(full_name) between 2 and 100),
  username text unique check (username is null or username ~ '^[a-z0-9][a-z0-9._]{2,23}$'),
  role text not null default 'student' check (role in ('student', 'lecturer', 'admin', 'moderator')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_institution_role_idx
  on public.profiles (institution_id, role);

create table if not exists public.admin_audit_logs (
  id bigint generated always as identity primary key,
  institution_id uuid not null references public.institutions (id),
  actor_user_id uuid references auth.users (id) on delete set null,
  target_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_institution_created_idx
  on public.admin_audit_logs (institution_id, created_at desc);

create or replace function public.is_institution_admin(target_institution_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles as profile
    where profile.user_id = (select auth.uid())
      and profile.institution_id = target_institution_id
      and profile.role = 'admin'
  );
$$;

revoke all on function public.is_institution_admin(uuid) from public;
grant execute on function public.is_institution_admin(uuid) to authenticated;

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  adustech_id uuid;
  requested_username text;
  requested_name text;
begin
  select institution.id into adustech_id
  from public.institutions as institution
  where institution.slug = 'adustech';

  if adustech_id is null then
    raise exception 'The ADUSTECH institution has not been configured.';
  end if;

  requested_name := nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '');
  requested_username := nullif(lower(btrim(new.raw_user_meta_data ->> 'username')), '');

  insert into public.profiles (user_id, institution_id, full_name, username, role)
  values (
    new.id,
    adustech_id,
    coalesce(requested_name, 'New student'),
    requested_username,
    'student'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

create or replace function public.log_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role is distinct from new.role then
    insert into public.admin_audit_logs (
      institution_id,
      actor_user_id,
      target_user_id,
      action,
      details
    )
    values (
      new.institution_id,
      (select auth.uid()),
      new.user_id,
      'profile.role_changed',
      jsonb_build_object('old_role', old.role, 'new_role', new.role)
    );
  end if;
  return new;
end;
$$;

create or replace function public.admin_update_member_role(
  target_institution_id uuid,
  target_user_id uuid,
  new_role text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new_role is null or new_role not in ('student', 'lecturer', 'moderator') then
    raise exception 'Only student, lecturer, or moderator access can be assigned here.'
      using errcode = '22023';
  end if;

  if target_user_id = (select auth.uid()) then
    raise exception 'Administrators cannot change their own access.'
      using errcode = '42501';
  end if;

  if not public.is_institution_admin(target_institution_id) then
    raise exception 'You are not an administrator for this institution.'
      using errcode = '42501';
  end if;

  update public.profiles as profile
  set role = new_role, updated_at = now()
  where profile.user_id = target_user_id
    and profile.institution_id = target_institution_id
    and profile.role <> 'admin';

  if not found then
    raise exception 'The member was not found or is protected.'
      using errcode = '22023';
  end if;
end;
$$;

revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;
revoke all on function public.log_profile_role_change() from public, anon, authenticated;
revoke all on function public.admin_update_member_role(uuid, uuid, text) from public, anon;
grant execute on function public.admin_update_member_role(uuid, uuid, text) to authenticated;

drop trigger if exists on_profile_role_changed on public.profiles;
create trigger on_profile_role_changed
  after update of role on public.profiles
  for each row execute function public.log_profile_role_change();

alter table public.institutions enable row level security;
alter table public.profiles enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists "Authenticated users can view institutions" on public.institutions;
create policy "Authenticated users can view institutions"
  on public.institutions for select to authenticated
  using (true);

drop policy if exists "Users can view own or institution profiles" on public.profiles;
create policy "Users can view own or institution profiles"
  on public.profiles for select to authenticated
  using (user_id = (select auth.uid()) or public.is_institution_admin(institution_id));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "Institution admins can view audit log" on public.admin_audit_logs;
create policy "Institution admins can view audit log"
  on public.admin_audit_logs for select to authenticated
  using (public.is_institution_admin(institution_id));

revoke all on public.institutions from anon, authenticated;
grant select on public.institutions to authenticated;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, username, updated_at) on public.profiles to authenticated;

revoke all on public.admin_audit_logs from anon, authenticated;
grant select on public.admin_audit_logs to authenticated;
revoke all on sequence public.admin_audit_logs_id_seq from anon, authenticated;
