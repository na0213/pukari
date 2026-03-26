-- Supabase SQL Editor 用
-- 目的:
-- 1) `bubbles.color` カラムを用意する
-- 2) 既存の泡に色を一括で付ける場合の土台にする
--
-- 補足:
-- 既存行の color が null のままだと、DailySkyView では無色表示になります。
-- すでに色付きで保存した泡は、このカラムに値が入るのでそのまま反映されます。

alter table public.bubbles
  add column if not exists color text;

-- 任意: 既存データの状態確認
select id, text, memo, color, created_at
from public.bubbles
order by created_at desc;

-- 任意: ここから下は、色を付けたい既存行がある場合だけ手動で実行してください。
-- `color` に入れられる値は以下です:
--   rose, mint, lavender, sage, plum, mauve
--
-- 例:
-- update public.bubbles set color = 'rose' where id in ('00000000-0000-0000-0000-000000000000');
--
-- 例:
-- update public.bubbles set color = 'mint' where memo is not null and color is null;
