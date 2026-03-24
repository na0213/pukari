# 修正指示：Phase 5（Supabase）を簡素化後の設計に合わせる

CLAUDE.md の安全ルールに従って修正してください。

---

## 背景

fix_ui_simplification で以下を廃止しました:
- `touched` 状態 / `touchedAt`
- `drifted` 状態 / `driftedAt`
- `repeatable` フラグ
- `bubble_logs` の `type: 'touched'`（`'done'` のみに）

Phase 5（Supabase接続）のコードはまだ旧設計のままなので、合わせて修正してください。

---

## 修正1: SQLスキーマファイルの更新

### 対象ファイル: `supabase/schema.sql`

**`bubbles` テーブルを以下に修正:**

```sql
create table bubbles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  text text not null,
  memo text,
  status text not null default 'floating'
    check (status in ('floating', 'nearby', 'completed')),
  size_factor real not null default 1.0,
  created_at timestamptz default now(),
  completed_at timestamptz,
  updated_at timestamptz default now()
);

alter table bubbles enable row level security;

create policy "Users can manage own bubbles"
  on bubbles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

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
```

**削除するカラム（旧設計から）:**
- `touched_at` — 廃止
- `drifted_at` — 廃止
- `repeatable` — 廃止

**追加するカラム:**
- `size_factor real not null default 1.0` — 泡のランダムサイズ係数

**status の check 制約を変更:**
- 旧: `('floating', 'nearby', 'touched', 'completed', 'drifted')`
- 新: `('floating', 'nearby', 'completed')`

**`bubble_logs` テーブルを以下に修正:**

```sql
create table bubble_logs (
  id uuid default gen_random_uuid() primary key,
  bubble_id uuid references bubbles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  type text not null default 'done'
    check (type in ('done')),
  created_at timestamptz default now(),
  unique(bubble_id, date, type)
);

alter table bubble_logs enable row level security;

create policy "Users can manage own bubble logs"
  on bubble_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_bubble_logs_user_date
  on bubble_logs(user_id, date);
```

**変更点:**
- `type` の check 制約: `('done', 'touched')` → `('done')` のみ

**`daily_skies` テーブル:**
- 変更なし

---

## 修正2: Supabase クライアントのフォールバック修正

### 対象ファイル: `src/lib/supabase.ts`

`.env.local` が未設定のとき、アプリがクラッシュする問題が報告されています。
以下を修正してください:

```typescript
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function isValidUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const supabase: SupabaseClient | null =
  isValidUrl(supabaseUrl) && supabaseAnonKey
    ? createClient(supabaseUrl!, supabaseAnonKey)
    : null;

export const isSupabaseEnabled = supabase !== null;
```

**重要:** `supabase` が `null` の場合、アプリ全体が localStorage モードで動作すること。

---

## 修正3: useBubbles の Supabase 層を新設計に合わせる

### 対象ファイル: `src/hooks/useBubbles.ts`

Supabase と通信する部分が旧設計のフィールドを参照している場合、以下に修正:

**Supabase から取得する bubbles のカラム:**
- `id`, `user_id`, `text`, `memo`, `status`, `size_factor`, `created_at`, `completed_at`, `updated_at`

**存在しないカラムへの参照を削除:**
- `touched_at` — 参照があれば削除
- `drifted_at` — 参照があれば削除
- `repeatable` — 参照があれば削除

**Supabase から取得する bubble_logs のカラム:**
- `id`, `bubble_id`, `user_id`, `date`, `type`, `created_at`
- `type` は `'done'` のみ

**localStorage キーと Supabase テーブルの対応:**
- `pukari-bubbles` ↔ `bubbles` テーブル
- `pukari-logs` ↔ `bubble_logs` テーブル

---

## 修正4: 自動ドリフト処理の削除

### 対象ファイル: 該当する全てのファイル

旧設計で実装した「14日間タップなしで自動 drifted」の処理がある場合、完全に削除してください。

`drifted` 状態は廃止されたため:
- アプリ起動時の自動ドリフト処理 → 削除
- `drifted` に関するフィルタリング → 削除
- `drifted` に関する UI 表示 → 削除

---

## 修正5: useAuth の確認

### 対象ファイル: `src/hooks/useAuth.ts`（存在する場合）

匿名認証の処理が、`supabase` が `null` の場合にエラーにならないことを確認:

```typescript
// supabase が null なら認証をスキップ
if (!supabase) {
  // localStorage モードで動作。認証不要。
  return;
}
```

---

## 確認方法

1. `.env.local` を**空のまま**で開発サーバーを起動する
2. アプリが真っ白にならず、正常に表示されることを確認（localStorage モード）
3. 泡の追加・キープ・今日はここまで・できた が全て動作することを確認
4. 「今日の空」が正しく表示されることを確認
5. コンソールに Supabase 関連のエラーが出ていないことを確認
6. `supabase/schema.sql` の内容が新設計に合っていることを確認
7. 「確認完了しました。サーバーを停止します。」と報告してからサーバーを停止する
8. **私の指示を待つ**
