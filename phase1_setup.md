# Phase 1: プロジェクト初期セットアップ

## このプロンプトの目的
PukariのPWAプロジェクトを新規作成し、基本構造を構築する。

## 指示

以下の手順でプロジェクトを作成してください。各ステップでコマンドを実行する前に、何をするか日本語で説明してください。

### 1. プロジェクト作成

Vite + React + TypeScript でプロジェクトを作成してください。

- プロジェクト名: `pukari`
- テンプレート: `react-ts`

### 2. 必要なパッケージの追加

以下のパッケージをインストールしてください（それぞれ何のためか説明してから）:

- `vite-plugin-pwa` — PWA対応（Service Worker自動生成）
- `@supabase/supabase-js` — Supabase接続
- `framer-motion` — アニメーション（シャボン玉の動き）

### 3. ディレクトリ構成

以下の構成でフォルダとファイルを作成してください:

```
src/
  components/
    Sky/
      SkyView.tsx          # メイン画面（空）
      SkyView.css          # 空のスタイル
    Bubble/
      BubbleItem.tsx        # 個別のシャボン玉
      BubbleItem.css        # シャボン玉のスタイル
      BubbleInput.tsx       # 泡の入力フォーム
      BubbleDetail.tsx      # 泡をタップしたときの詳細表示
    DailySky/
      DailySkyView.tsx      # 「今日の空」ジャーナル画面
      DailySkyView.css
  hooks/
    useBubbles.ts           # 泡のCRUDロジック
    useSkyColor.ts          # 空の色計算ロジック
    useDailySky.ts          # 日ごとの記録ロジック
  lib/
    supabase.ts             # Supabaseクライアント初期化
    constants.ts            # 定数（色の定義、状態名など）
  types/
    bubble.ts               # Bubble型定義
    sky.ts                   # Sky関連の型定義
  styles/
    global.css              # グローバルスタイル、CSS変数
    animations.css          # シャボン玉アニメーション定義
  App.tsx                   # ルーティング
  main.tsx                  # エントリーポイント
public/
  manifest.json             # PWAマニフェスト
```

### 4. 型定義の作成

`src/types/bubble.ts` に以下の型を定義してください:

```typescript
// シャボン玉の状態
export type BubbleStatus = 
  | 'floating'   // 浮かんでいる（初期状態）
  | 'nearby'     // そばに置いた
  | 'touched'    // 触れた（自動記録）
  | 'done'       // できた！
  | 'drifted';   // 遠くへ流れた

// シャボン玉のデータ
export interface Bubble {
  id: string;
  text: string;            // 1行のつぶやき
  memo?: string;           // 補足メモ（任意）
  status: BubbleStatus;
  createdAt: Date;
  touchedAt?: Date;        // 触れた日時（自動）
  doneAt?: Date;           // できた日時
  driftedAt?: Date;        // 遠くへ流れた日時
}
```

`src/types/sky.ts` に以下の型を定義してください:

```typescript
// 空の色の段階
export type SkyPhase = 
  | 'dawn'      // 早朝の薄い青（0個）
  | 'morning'   // 昼の明るい青（1-2個）
  | 'afternoon' // 午後の温かい空（3-4個）
  | 'sunset'    // 夕焼けのオレンジ（5-6個）
  | 'night';    // 星空（7+個）

// 1日の空の記録
export interface DailySky {
  date: string;            // YYYY-MM-DD
  phase: SkyPhase;
  doneCount: number;       // できた数
  touchedCount: number;    // 触れた数
  bubbleIds: string[];     // その日に関わった泡のID
}
```

`src/lib/constants.ts` に以下の定数を定義してください:

```typescript
// 無料プランの泡の上限
export const FREE_BUBBLE_LIMIT = 100;

// 自動ドリフトまでの日数（floating状態でタップなし）
export const AUTO_DRIFT_DAYS = 14;

// 「今日の空」無料閲覧日数
export const FREE_JOURNAL_DAYS = 30;

// アプリ名
export const APP_NAME = 'Pukari';
export const APP_TAGLINE = 'float your thoughts, gently.';
export const APP_TAGLINE_JA = '途中でも消えない、思いつきの避難所。';
```

### 5. CSS変数の定義

`src/styles/global.css` に以下のCSS変数を定義してください:

```css
:root {
  /* 空の色 */
  --sky-dawn: linear-gradient(180deg, #E3F2FD 0%, #BBDEFB 100%);
  --sky-morning: linear-gradient(180deg, #90CAF9 0%, #64B5F6 100%);
  --sky-afternoon: linear-gradient(180deg, #64B5F6 0%, #FFB74D 30%, #90CAF9 100%);
  --sky-sunset: linear-gradient(180deg, #FF8A65 0%, #FFB74D 40%, #CE93D8 100%);
  --sky-night: linear-gradient(180deg, #1A237E 0%, #283593 50%, #3949AB 100%);

  /* シャボン玉の色 */
  --bubble-base: rgba(255, 255, 255, 0.15);
  --bubble-border: rgba(255, 255, 255, 0.3);
  --bubble-glow: rgba(173, 216, 230, 0.4);
  --bubble-nearby: rgba(255, 255, 255, 0.25);
  --bubble-touched: rgba(173, 216, 230, 0.5);

  /* テキスト */
  --text-primary: #1B2A4A;
  --text-secondary: #6B7280;
  --text-on-dark: #E3F2FD;

  /* 感覚過敏配慮 */
  --animation-duration: 3s;
  --transition-speed: 0.3s;
}

/* アニメーション軽減設定 */
@media (prefers-reduced-motion: reduce) {
  :root {
    --animation-duration: 0s;
    --transition-speed: 0s;
  }
}
```

### 6. PWA マニフェスト

`public/manifest.json` を作成してください:

```json
{
  "name": "Pukari — float your thoughts, gently.",
  "short_name": "Pukari",
  "description": "途中でも消えない、思いつきの避難所。Float your thoughts, gently.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#E3F2FD",
  "theme_color": "#64B5F6",
  "icons": []
}
```

### 7. 動作確認

開発サーバーを起動して、空のアプリが表示されることを確認してください。

---

## 完了条件

- [ ] Vite + React + TypeScript プロジェクトが作成されている
- [ ] 全てのディレクトリとファイルが作成されている
- [ ] 型定義が正しく書かれている
- [ ] CSS変数が定義されている
- [ ] PWAマニフェストがある
- [ ] 開発サーバーが正常に起動する

---

## フェーズ完了時

1. 開発サーバーを起動して動作確認する
2. 上記の完了条件をすべてチェックする
3. 「確認完了しました。サーバーを停止します。」と報告してからサーバーを停止する
4. **次のフェーズには進まず、私の指示を待つ**
