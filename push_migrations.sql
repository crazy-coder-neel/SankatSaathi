-- Create push_subscriptions table
create table if not exists public.push_subscriptions (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references auth.users(id) on delete cascade,
    subscription jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.push_subscriptions enable row level security;

-- Policies
create policy "Users can manage their own subscriptions"
    on public.push_subscriptions
    for all
    using (auth.uid() = user_id);

create policy "Service role can read all subscriptions"
    on public.push_subscriptions
    for select
    using (true);
