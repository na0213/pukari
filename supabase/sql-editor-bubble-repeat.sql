-- ============================================================
-- bubbles に「繰り返す」フラグを追加する SQL
-- Supabase SQL Editor で実行してください
-- ============================================================

alter table public.bubbles
  add column if not exists repeat boolean not null default false;

select id, text, repeat, status, created_at
from public.bubbles
order by created_at desc;

-- 任意: 既存の泡を繰り返し対象にする例
-- update public.bubbles set repeat = true where id = '00000000-0000-0000-0000-000000000000';
