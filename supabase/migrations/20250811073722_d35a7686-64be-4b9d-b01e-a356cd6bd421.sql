-- Allow authenticated users to assign themselves admin role (per project requirements)
create policy "Users can self-assign admin"
  on public.user_roles for insert
  with check (user_id = auth.uid() and role = 'admin'::public.app_role);