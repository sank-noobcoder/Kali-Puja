-- Create enum for roles
create type if not exists public.app_role as enum ('admin', 'moderator', 'user');

-- User roles table
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Helper function to check roles
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- RLS policies for user_roles (admins can read all, users can read their own)
create policy if not exists "Admins can select all roles"
  on public.user_roles for select
  using (public.has_role(auth.uid(), 'admin'));

create policy if not exists "Users can select their roles"
  on public.user_roles for select
  using (user_id = auth.uid());

create policy if not exists "Admins can manage roles"
  on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Media table for photos/videos
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete set null,
  year int not null,
  kind text not null check (kind in ('photo','video')),
  title text,
  description text,
  storage_path text not null,
  thumbnail_path text,
  visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id),
  delete_reason text
);

alter table public.media enable row level security;

-- Update trigger for updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger media_set_updated_at
before update on public.media
for each row execute function public.set_updated_at();

-- Media policies
create policy if not exists "Public can view visible media"
  on public.media for select
  using (visible = true);

create policy if not exists "Admins can view all media"
  on public.media for select
  using (public.has_role(auth.uid(), 'admin'));

create policy if not exists "Admins can insert media"
  on public.media for insert
  with check (public.has_role(auth.uid(), 'admin') and user_id = auth.uid());

create policy if not exists "Admins can update media"
  on public.media for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy if not exists "Admins can delete media"
  on public.media for delete
  using (public.has_role(auth.uid(), 'admin'));

-- Expenses table
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete set null,
  year int not null,
  amount numeric(12,2) not null check (amount >= 0),
  category text,
  description text,
  expense_date date not null default current_date,
  is_deleted boolean not null default false,
  deleted_by uuid references auth.users(id),
  delete_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

-- Expense policies: admins only
create policy if not exists "Admins can view expenses"
  on public.expenses for select
  using (public.has_role(auth.uid(), 'admin'));

create policy if not exists "Admins can insert expenses"
  on public.expenses for insert
  with check (public.has_role(auth.uid(), 'admin') and user_id = auth.uid());

create policy if not exists "Admins can update expenses"
  on public.expenses for update
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy if not exists "Admins can delete expenses"
  on public.expenses for delete
  using (public.has_role(auth.uid(), 'admin'));

-- Storage buckets
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('donations', 'donations', false)
on conflict (id) do nothing;

-- Storage policies
-- Public can view media bucket
create policy if not exists "Public can read media"
  on storage.objects for select
  using (bucket_id = 'media');

-- Admins can manage media bucket
create policy if not exists "Admins can manage media"
  on storage.objects for all
  using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));

-- Donations bucket restricted to admins
create policy if not exists "Admins can view donations"
  on storage.objects for select
  using (bucket_id = 'donations' and public.has_role(auth.uid(), 'admin'));

create policy if not exists "Admins can manage donations"
  on storage.objects for all
  using (bucket_id = 'donations' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'donations' and public.has_role(auth.uid(), 'admin'));

-- Realtime setup for tables
alter table public.media replica identity full;
alter table public.expenses replica identity full;

-- Add tables to publication for realtime
-- Note: This is idempotent in Supabase's managed environment
begin;
  -- some instances already have the publication; ignore errors
  do $$ begin
    perform 1;
  end $$;
commit;