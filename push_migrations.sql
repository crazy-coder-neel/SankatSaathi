create table if not exists public.push_subscriptions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade unique,
    subscription jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Ensure UNIQUE constraint if table was created without it previously
do $$ 
begin 
    if not exists (select 1 from pg_constraint where conname = 'push_subscriptions_user_id_key') then
        alter table public.push_subscriptions add constraint push_subscriptions_user_id_key unique (user_id);
    end if;
end $$;

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Policies (Drop first to avoid "already exists" errors)
drop policy if exists "Users can manage their own subscriptions" on public.push_subscriptions;
create policy "Users can manage their own subscriptions"
    on public.push_subscriptions
    for all
    using (auth.uid() = user_id);

drop policy if exists "Service role can read all subscriptions" on public.push_subscriptions;
create policy "Service role can read all subscriptions"
    on public.push_subscriptions
    for select
    using (true);
