# 修正指示：ブルーラグーン（もくもくモード）の実装

CLAUDE.md の安全ルールに従って修正してください。
**この修正は大きな機能追加です。1ファイルずつ確認しながら進めてください。**

---

## 概要

メイン画面（空）から「ブルーラグーン」に入れる機能を追加する。
他のユーザーと匿名で一緒に集中する空間。

**フロー:**
1. メイン画面でブルーラグーンボタンをタップ
2. 意気込みコメント入力のポップアップが出る
3. 入力して「Go」→ オーロラ画面に切り替わる
4. 集中タイム（他の人の意気込みシャボン玉も浮かんでいる）
5. 退出 → メイン画面に戻る。意気込みはデータベースから削除

---

## 新規作成1: 型定義の追加

### 対象ファイル: `src/types/bluelagoon.ts`（新規）

```typescript
// ブルーラグーンの意気込み
export interface LagoonBubble {
  id: string;
  userId: string;        // 匿名ユーザーID
  message: string;       // 意気込みテキスト
  createdAt: Date;
}

// 背景テーマ
export type LagoonTheme =
  | 'aurora'       // オーロラ（デフォルト）
  | 'rain'         // 紫陽花と雨
  | 'ocean'        // 島と海
  | 'bonfire';     // 焚き火

// サウンド設定
export type LagoonSound =
  | 'none'         // 無音
  | 'rain'         // 雨音
  | 'wave'         // 波の音
  | 'bonfire';     // 焚き火

// もくもくモード（一人 or みんな）
export type LagoonMode =
  | 'together'     // みんなでもくもく（デフォルト）
  | 'solo';        // 一人もくもくタイム
```

---

## 新規作成2: ブルーラグーンのメイン画面

### 新規ファイル: `src/components/BlueLagoon/BlueLagoonView.tsx` / `BlueLagoonView.css`

**オーロラ画面:**
- 全画面表示（メイン画面を完全に覆う）
- 背景: オーロラのアニメーション（CSS グラデーションアニメーションで実装）
- 自分の意気込みシャボン玉が画面中央付近に浮かんでいる
- 他のユーザーの意気込みシャボン玉がランダムな位置にふわふわ浮かんでいる

**オーロラ背景のCSS実装:**
```css
.aurora-background {
  background: linear-gradient(
    45deg,
    #0a0a2e,
    #1a1a4e,
    #0d3b66,
    #1a6b4a,
    #2d8b6e,
    #1a4e6b,
    #0a0a2e
  );
  background-size: 400% 400%;
  animation: aurora-shift 20s ease infinite;
}

@keyframes aurora-shift {
  0% { background-position: 0% 50%; }
  25% { background-position: 50% 0%; }
  50% { background-position: 100% 50%; }
  75% { background-position: 50% 100%; }
  100% { background-position: 0% 50%; }
}
```

上記はベースのオーロラ。これに加えて、半透明のグラデーションレイヤーを2〜3枚重ねて、ゆらゆら動くオーロラ感を出す:

```css
.aurora-layer-1 {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 20%, rgba(100, 255, 200, 0.15), transparent 60%);
  animation: aurora-wave-1 15s ease-in-out infinite;
}

.aurora-layer-2 {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 70% 60%, rgba(100, 180, 255, 0.12), transparent 60%);
  animation: aurora-wave-2 18s ease-in-out infinite;
}

@keyframes aurora-wave-1 {
  0%, 100% { transform: translateX(0) translateY(0); opacity: 0.6; }
  50% { transform: translateX(30px) translateY(-20px); opacity: 1; }
}

@keyframes aurora-wave-2 {
  0%, 100% { transform: translateX(0) translateY(0); opacity: 0.5; }
  50% { transform: translateX(-20px) translateY(15px); opacity: 0.9; }
}
```

**`prefers-reduced-motion` の場合:** アニメーションを停止し、静的なグラデーション背景を表示する。

**画面上部の情報:**
- 左上に小さく「◯人がもくもく中」の表示
- 人数はリアルタイムで更新（Supabase Realtime。未接続の場合は「1人」=自分のみ）

**画面下部のコントロール:**
```
[🔇サウンド]  [🎨テーマ]  [退出する]
```

- 「サウンド」: タップでサウンド選択パネルが開く
- 「テーマ」: タップでテーマ選択パネルが開く
- 「退出する」: タップでブルーラグーンを退出

**意気込みシャボン玉の見た目:**
- メイン画面のシャボン玉より少し小さめ（50〜70px）
- 半透明で、泡の中に意気込みテキストが小さく見える
- 自分の泡: やや明るい色（薄い白〜水色）
- 他の人の泡: より透明で控えめ（薄い白、opacity: 0.4程度）
- ゆっくりふわふわ漂うアニメーション

---

## 新規作成3: 入室ポップアップ

### 新規ファイル: `src/components/BlueLagoon/LagoonEntryModal.tsx` / `LagoonEntryModal.css`

**ブルーラグーンボタンをタップしたとき表示:**

- すりガラス風のモーダル（`backdrop-filter: blur`）
- タイトル: 「ブルーラグーンへ」
- サブテキスト: 「意気込みをひとこと」（小さく、グレー）
- テキスト入力欄: 1行。プレースホルダー「今日は何をがんばる？」
- 「Go」ボタン: メインカラー（水色系）。入力がなくても押せる（意気込みなしでも入れる）
- モーダル外タップ or 「×」で閉じる（入室しない）

**「Go」を押したときの動作:**
1. 入室SEを再生する（音声ファイルはまだないので、再生処理の枠だけ作る）
2. 意気込みテキストをデータベース（またはlocalStorage）に保存
3. 画面がオーロラ画面にトランジション（フェードイン、0.5秒）

---

## 新規作成4: サウンド選択パネル

### 新規ファイル: `src/components/BlueLagoon/SoundPicker.tsx` / `SoundPicker.css`

**画面下部からスライドアップする小さなパネル:**

```
♪ サウンド
─────────────
○ 無音
○ 雨音
○ 波の音
○ 焚き火
```

- ラジオボタン形式（1つだけ選択）
- デフォルト: 無音
- 選択するとすぐに反映（パネルは開いたまま）
- パネル外タップで閉じる

**サウンド再生:**
- Howler.js を使用（Phase 1 でインストール済みのはず。なければ追加）
- 音声ファイルのパスは定数で管理:
```typescript
export const LAGOON_SOUNDS: Record<LagoonSound, string | null> = {
  none: null,
  rain: '/sounds/rain.mp3',      // ★ファイルはまだない。パスだけ定義
  wave: '/sounds/wave.mp3',      // ★ファイルはまだない
  bonfire: '/sounds/bonfire.mp3', // ★ファイルはまだない
};
```
- ファイルが存在しない場合はエラーにならず、無音で動作する
- ループ再生する

---

## 新規作成5: テーマ選択パネル

### 新規ファイル: `src/components/BlueLagoon/ThemePicker.tsx` / `ThemePicker.css`

**画面下部からスライドアップする小さなパネル:**

```
🎨 背景
─────────────
○ オーロラ
○ 紫陽花と雨
○ 島と海
○ 焚き火
```

- ラジオボタン形式
- デフォルト: オーロラ
- 選択するとすぐに背景が切り替わる

**背景テーマの実装:**
- 各テーマのCSS背景を用意する
- 画像やイラストはまだないので、CSSグラデーションで雰囲気だけ作る:

```typescript
export const LAGOON_THEMES: Record<LagoonTheme, { background: string; label: string }> = {
  aurora: {
    background: '/* 上記のオーロラCSS */',
    label: 'オーロラ',
  },
  rain: {
    background: 'linear-gradient(180deg, #4a5568 0%, #718096 30%, #a0aec0 70%, #718096 100%)',
    label: '紫陽花と雨',
  },
  ocean: {
    background: 'linear-gradient(180deg, #2b6cb0 0%, #4299e1 40%, #63b3ed 70%, #ebf8ff 100%)',
    label: '島と海',
  },
  bonfire: {
    background: 'linear-gradient(180deg, #1a202c 0%, #2d3748 40%, #744210 80%, #c05621 100%)',
    label: '焚き火',
  },
};
```

- 将来的に画像/動画に差し替え可能な設計にしておく

**「一人もくもくタイム」との連動:**
- サウンドまたはテーマを変更すると、自動的に `solo` モードに切り替わる
- `solo` モードでは他のユーザーのシャボン玉が非表示になる
- 「オーロラ」＋「無音」に戻すと `together` モードに戻る

---

## 新規作成6: useLagoon フック

### 新規ファイル: `src/hooks/useLagoon.ts`

```typescript
interface UseLagoonReturn {
  // 入退室
  isInLagoon: boolean;
  enterLagoon: (message: string) => void;   // 入室（意気込み保存）
  exitLagoon: () => void;                    // 退出（意気込み削除）

  // 自分の意気込み
  myBubble: LagoonBubble | null;

  // 他のユーザーの意気込み
  otherBubbles: LagoonBubble[];

  // 参加人数
  participantCount: number;

  // モード・設定
  mode: LagoonMode;
  theme: LagoonTheme;
  sound: LagoonSound;
  setTheme: (theme: LagoonTheme) => void;
  setSound: (sound: LagoonSound) => void;
}
```

**入室処理 (`enterLagoon`):**
1. 意気込みテキストをデータベースに保存（`lagoon_bubbles` テーブル or localStorage）
2. 入室SEの再生（ファイルがなければスキップ）
3. `isInLagoon = true` に変更

**退出処理 (`exitLagoon`):**
1. 自分の意気込みをデータベースから削除
2. サウンドを停止
3. `isInLagoon = false` に変更

**他のユーザーの意気込み取得:**
- Supabase Realtime を使って `lagoon_bubbles` テーブルをサブスクライブ
- 新しいユーザーが入室したら入室SE（小さく）を再生（ファイルがなければスキップ）
- ユーザーが退出したら、そのシャボン玉がふわっと消えるアニメーション
- Supabase 未接続の場合: 自分のシャボン玉のみ表示（ソロモード扱い）

**入室SE / 他者入室SE:**
```typescript
export const LAGOON_SE = {
  enter: '/sounds/lagoon-enter.mp3',       // ★ファイルはまだない
  otherEnter: '/sounds/lagoon-other.mp3',  // ★ファイルはまだない
};
```
- ファイルが存在しない場合はエラーにならず、無音で動作する

---

## 新規作成7: Supabase テーブル（SQLファイルに追加）

### 対象ファイル: `supabase/schema.sql`

以下を追加:

```sql
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
```

**重要:** `lagoon_bubbles` は一時的なデータ。ユーザーが退出するときに自分のレコードを削除する。万が一削除されずに残った場合に備えて、24時間以上前のレコードを定期削除する cron を将来的に設定する（今は不要）。

---

## 修正8: SkyView にブルーラグーンボタンを追加

### 対象ファイル: `src/components/Sky/SkyView.tsx` / `SkyView.css`

メイン画面にブルーラグーンへの入口ボタンを追加。

**ボタンの配置:**
- 画面左下（検索ボタンの反対側）
- アイコン: 🌊 または オーロラっぽいグラデーションの小さな円
- サイズ: 検索ボタンと同じくらい
- `position: fixed`

**タップ → LagoonEntryModal を表示**

**ブルーラグーン中（`isInLagoon = true`）は:**
- メイン画面（空）を非表示にして BlueLagoonView を全画面表示
- 入力バー、検索ボタン、今日の空ボタンなどは非表示

---

## 修正9: App.tsx のルーティング

### 対象ファイル: `src/App.tsx`

- ブルーラグーンは別ルート（URLパス）ではなく、state で画面を切り替える
- `isInLagoon` が true のとき BlueLagoonView を表示、false のとき SkyView を表示

---

## ファイル構成まとめ

```
src/components/BlueLagoon/
  BlueLagoonView.tsx      # オーロラ画面（メイン）
  BlueLagoonView.css
  LagoonEntryModal.tsx    # 入室ポップアップ
  LagoonEntryModal.css
  LagoonBubbleItem.tsx    # 意気込みシャボン玉
  LagoonBubbleItem.css
  SoundPicker.tsx         # サウンド選択パネル
  SoundPicker.css
  ThemePicker.tsx         # テーマ選択パネル
  ThemePicker.css
src/hooks/
  useLagoon.ts            # ブルーラグーンのロジック
src/types/
  bluelagoon.ts           # 型定義
public/sounds/
  （空のディレクトリ。後で音声ファイルを追加する）
```

---

## 確認方法

1. 開発サーバーを起動する
2. メイン画面左下にブルーラグーンボタンが表示されることを確認
3. ボタンをタップ → 意気込み入力ポップアップが表示されることを確認
4. 意気込みを入力して「Go」→ オーロラ画面に切り替わることを確認
5. オーロラ背景がゆらゆらアニメーションしていることを確認
6. 自分の意気込みシャボン玉が浮かんでいることを確認
7. 左上に「1人がもくもく中」と表示されることを確認
8. 「サウンド」をタップ → サウンド選択パネルが開くことを確認（音は再生されなくてOK）
9. 「テーマ」をタップ → テーマ選択パネルが開き、背景が変わることを確認
10. テーマを変更すると他のユーザーのシャボン玉が消えること（ソロモード）を確認
11. 「退出する」をタップ → メイン画面に戻ることを確認
12. 再度ブルーラグーンに入る → 前回の意気込みが残っていないことを確認
13. `prefers-reduced-motion` でオーロラアニメーションが停止することを確認
14. 「確認完了しました。サーバーを停止します。」と報告してからサーバーを停止する
15. **私の指示を待つ**
