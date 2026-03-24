-- ============================================================
-- Pukari データベーススキーマ
-- Supabase SQL Editor で実行してください
-- ============================================================

-- ── bubbles テーブル ──

create table bubbles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  text text not null,
  memo text,
  status text not null default 'floating'
    check (status in ('floating', 'nearby', 'completed')),
  size_factor real not null default 1.0,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

-- RLS（Row Level Security）有効化
alter table bubbles enable row level security;

-- ユーザーは自分のデータのみアクセス可能
create policy "Users can manage own bubbles"
  on bubbles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at 自動更新トリガー
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger bubbles_updated_at
  before update on bubbles
  for each row execute function update_updated_at();


-- ── bubble_logs テーブル ──
-- 「できた」の日ごとの記録

create table bubble_logs (
  id uuid default gen_random_uuid() primary key,
  bubble_id uuid references bubbles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  type text not null default 'done'
    check (type in ('done')),
  created_at timestamptz not null default now(),
  unique(bubble_id, date, type)
);

alter table bubble_logs enable row level security;

create policy "Users can manage own bubble logs"
  on bubble_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 今日のできた数を高速に取得するためのインデックス
create index idx_bubble_logs_user_date
  on bubble_logs(user_id, date);


-- ── daily_skies テーブル ──
-- bubble_logs から算出できるが、過去の空を高速表示するためのキャッシュ

create table daily_skies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  phase text not null default 'dawn'
    check (phase in ('dawn', 'morning', 'afternoon', 'sunset', 'night')),
  done_count integer not null default 0,
  unique(user_id, date)
);

alter table daily_skies enable row level security;

create policy "Users can manage own daily skies"
  on daily_skies for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ── lagoon_bubbles テーブル ──
-- ブルーラグーンの意気込み（一時的なデータ。退出時に削除される）

create table lagoon_bubbles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  message text not null default '',
  created_at timestamptz default now()
);

alter table lagoon_bubbles enable row level security;

-- 全ユーザーが他のユーザーの意気込みを読める（匿名）
create policy "Anyone can read lagoon bubbles"
  on lagoon_bubbles for select
  using (true);

-- 自分の意気込みのみ作成・削除できる
create policy "Users can insert own lagoon bubbles"
  on lagoon_bubbles for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own lagoon bubbles"
  on lagoon_bubbles for delete
  using (auth.uid() = user_id);

-- Realtime 有効化
alter publication supabase_realtime add table lagoon_bubbles;

-- 注意: lagoon_bubbles は一時データ。ユーザー退出時に自分のレコードを削除する。
-- 万が一残った場合の定期削除 cron は将来的に設定予定。


-- ── Anonymous Auth を有効化する方法 ──
-- Supabase Dashboard → Authentication → Providers → Anonymous を ON にしてください
