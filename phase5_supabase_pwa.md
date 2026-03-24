# Phase 5: Supabase接続とPWA仕上げ

## このフェーズの目的
localStorage からSupabaseに移行し、PWAとして完成させる。オフラインでも動作し、ホーム画面に追加できる状態にする。

## 前提
- Phase 4 が完了していること
- Supabase プロジェクトが作成済みであること（URL と anon key を私が提供します）
- CLAUDE.md の安全ルールに従うこと

---

## 指示

### 1. Supabase テーブル設計

以下のSQLでテーブルを作成してください（Supabase の SQL Editor で実行するため、SQLファイルとして出力）:

**`bubbles` テーブル:**
```sql
create table bubbles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  text text not null,
  memo text,
  status text not null default 'floating'
    check (status in ('floating', 'nearby', 'touched', 'completed', 'drifted')),
  repeatable boolean default false,
  created_at timestamptz default now(),
  touched_at timestamptz,
  completed_at timestamptz,
  drifted_at timestamptz,
  updated_at timestamptz default now()
);

-- RLS（Row Level Security）有効化
alter table bubbles enable row level security;

-- ユーザーは自分のデータのみアクセス可能
create policy "Users can manage own bubbles"
  on bubbles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at 自動更新
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

**`bubble_logs` テーブル（★新規追加）:**

「できた」「触れた」の日ごとの記録。くりかえし泡の毎日の達成を管理する。

```sql
create table bubble_logs (
  id uuid default gen_random_uuid() primary key,
  bubble_id uuid references bubbles(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  type text not null default 'done'
    check (type in ('done', 'touched')),
  created_at timestamptz default now(),
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
```

**`daily_skies` テーブル:**

※ `daily_skies` は `bubble_logs` から算出できるため、キャッシュ的な役割。なくても動くが、過去の空を高速に表示するために残す。

```sql
create table daily_skies (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  date date not null,
  phase text not null default 'dawn'
    check (phase in ('dawn', 'morning', 'afternoon', 'sunset', 'night')),
  done_count integer default 0,
  touched_count integer default 0,
  unique(user_id, date)
);

alter table daily_skies enable row level security;

create policy "Users can manage own daily skies"
  on daily_skies for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
```

### 2. Supabase クライアント（`src/lib/supabase.ts`）

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

`.env.local` ファイルを作成（値は私が後で入力します）:
```
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 認証（シンプルに）

MVP では匿名認証（Anonymous Auth）を使用:

- アプリ初回起動時に `supabase.auth.signInAnonymously()` を実行
- ユーザーIDが発行され、以降そのIDでデータを紐づける
- ログイン画面は v0.1 では作らない

### 4. useBubbles フックの Supabase 移行

Phase 3 で作った localStorage 版を Supabase 版に置き換える:

- `bubbles` テーブル: CRUD は `from('bubbles')` を使用
- `bubble_logs` テーブル: 「できた」「触れた」の記録は `from('bubble_logs')` を使用
- `pukari-logs`（localStorage）→ `bubble_logs`（Supabase）への移行も行う
- リアルタイム購読は v0.1 では不要（画面遷移時に再取得で十分）
- **オフライン対応**: Supabase に接続できない場合は localStorage にフォールバック

### 4.5. データ保存ポリシー（重要）

このアプリの絶対原則：**アプリは勝手に泡を消さない。**

**無料プラン:**
- シャボン玉は全状態合計で最大 **100個**
- データ保存期間は **無期限**（消えない。これがアプリの約束）
- 「今日の空」ジャーナルは **直近1ヶ月** 閲覧可能
- 100個に達したら入力時に「空がいっぱいです。遠くの泡を手放すか、広い空にしませんか？」と提案
- 「手放す」（完全削除）はユーザー自身が操作する。自動削除は絶対にしない

**有料プラン（月300〜500円）:**
- シャボン玉は **無制限**
- 「今日の空」ジャーナルは **全期間** 閲覧可能
- 音声入力、複数デバイス同期あり

**自動ドリフトルール（Supabase で cron または アプリ起動時に実行）:**
- `floating` 状態で作成から14日間タップなし → 自動で `drifted` に変更
- `nearby` / `touched` の泡は流れない
- `drifted` になっても削除しない。100個の枠に残る
- ユーザーはいつでも復活（`drifted` → `floating`）できる

**実装方法:**
- アプリ起動時に `bubbles` テーブルから `floating` かつ `created_at < now() - interval '14 days'` かつ `touched_at IS NULL` の泡を `drifted` に UPDATE
- 泡の合計数チェックは `addBubble` 実行前に `SELECT count(*) FROM bubbles WHERE user_id = ?` で確認

### 5. PWA 設定の仕上げ

`vite.config.ts` に `vite-plugin-pwa` の設定を追加:

```typescript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Pukari — float your thoughts, gently.',
        short_name: 'Pukari',
        description: '途中でも消えない、思いつきの避難所。Float your thoughts, gently.',
        description: '途中でも消えない、思いつきの避難所。',
        theme_color: '#64B5F6',
        background_color: '#E3F2FD',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*supabase.*$/,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-cache' },
          },
        ],
      },
    }),
  ],
});
```

**アイコンについて:**
- 仮のアイコン（シンプルなシャボン玉の円）を SVG で作成し、192px と 512px の PNG に変換してください
- デザインは最小限でOK（水色の円に白いハイライト）

### 6. デプロイ準備

- `npm run build` でビルドが通ることを確認
- ビルド成果物が `dist/` に出力されることを確認
- Vercel または Netlify へのデプロイ手順を簡潔にまとめる

---

## 完了条件

- [ ] Supabase テーブルの SQL ファイルが生成されている
- [ ] 匿名認証でアプリが起動する
- [ ] 泡のデータが Supabase に保存される
- [ ] オフライン時は localStorage にフォールバックする
- [ ] PWA としてホーム画面に追加できる
- [ ] Service Worker が正しく登録される
- [ ] ビルドが通り、デプロイ可能な状態
- [ ] 仮アイコンが設定されている

---

## フェーズ完了時

1. 開発サーバーを起動して動作確認する
2. 上記の完了条件をすべてチェックする
3. 「確認完了しました。サーバーを停止します。」と報告してからサーバーを停止する
4. **次のフェーズには進まず、私の指示を待つ**
