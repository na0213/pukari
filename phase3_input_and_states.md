# Phase 3: 泡の入力と状態遷移

## このフェーズの目的
シャボン玉を新しく浮かべる機能、タップして詳細を見る機能、「そばに置く」「できた！」の操作を実装する。

## 前提
- Phase 2 が完了していること
- CLAUDE.md の安全ルールに従うこと

---

## 指示

### 1. BubbleInput コンポーネント（`src/components/Bubble/BubbleInput.tsx`）

泡を追加するための入力UI:

**仕様:**
- 画面下部に常時表示される入力バー
- テキストフィールドは1つだけ（改行不可）
- プレースホルダー: 「思いついたことを浮かべる...」
- 送信ボタン、またはEnterキーで泡を追加
- 入力後、テキストフィールドはクリアされる
- 新しい泡は `floating` 状態で空に追加される
- 追加時、泡がふわっと現れるアニメーション（framer-motion の `AnimatePresence`）

**UIのトーン:**
- 入力バーは控えめなデザイン（空の景色を邪魔しない）
- 半透明の背景、角丸、薄いborder
- 送信ボタンはシャボン玉のアイコン（○）でシンプルに

### 2. BubbleDetail コンポーネント（`src/components/Bubble/BubbleDetail.tsx`）

泡をタップしたときのモーダル/オーバーレイ:

**仕様:**
- シャボン玉をタップすると、画面中央に詳細が表示される
- 表示内容:
  - 1行テキスト（全文）
  - 補足メモ欄（任意。空の場合はプレースホルダー「メモを追加...」）
  - 状態表示（現在の状態がわかるアイコンまたはテキスト）
  - 作成日
- 操作ボタン:
  - 「そばに置く」ボタン（status が floating のときのみ表示）
  - 「できた！」ボタン（status が floating, nearby, touched のときに表示）
  - 「遠くへ流す」ボタン（小さく控えめに表示）
- 背景はすりガラス風のオーバーレイ（`backdrop-filter: blur`）

**「触れた」の自動記録:**
- BubbleDetail を開いた時点で、status が `floating` または `nearby` なら、自動的に `touched` に更新する
- `touchedAt` に現在日時を記録する
- ユーザーには通知しない（静かに記録される）

**操作後のアニメーション:**
- 「そばに置く」: モーダルが閉じて、泡が画面手前に少し大きく移動
- 「できた！」: 泡が空に溶けていくアニメーション（上に浮かびながら透明に）
- 「遠くへ流す」: 泡が小さくなりながら画面の端に移動

### 3. useBubbles フック（`src/hooks/useBubbles.ts`）

泡のデータ管理:

**このフェーズでは localStorage で管理する**（Supabase はPhase 5で接続）

```typescript
interface UseBubblesReturn {
  bubbles: Bubble[];                          // 全ての泡
  activeBubbles: Bubble[];                    // floating + nearby + touched の泡
  doneBubbles: Bubble[];                      // できた泡
  driftedBubbles: Bubble[];                   // 遠くへ流れた泡
  addBubble: (text: string) => void;          // 新しい泡を追加
  updateStatus: (id: string, status: BubbleStatus) => void;  // 状態変更
  updateMemo: (id: string, memo: string) => void;            // メモ更新
  touchBubble: (id: string) => void;          // 触れた（自動記録用）
  removeBubble: (id: string) => void;         // 完全削除（ユーザー操作のみ）
  todayDoneCount: number;                     // 今日のできた数
  todayTouchedCount: number;                  // 今日の触れた数
  totalCount: number;                         // 全泡数（上限チェック用）
  canAdd: boolean;                            // 追加可能か（上限未満か）
}
```

**無料プランの上限:**
- 全状態合計で **最大100個** まで
- 100個に達したら入力フィールドに「空がいっぱいです」と表示
- 「遠くの泡を手放すか、有料で広い空にしませんか？」と提案
- **アプリは勝手に泡を消さない。削除はユーザー自身が選ぶ**

**自動ドリフトルール:**
- `floating` 状態のまま14日間タップされなかった泡 → 自動で `drifted` に変更
- `nearby` や `touched` の泡は流れない（少しでも関わった泡は残る）
- `drifted` になっても削除されない。100個の枠内に残り続ける
- ユーザーはいつでも `drifted` → `floating` に戻せる

**注意:**
- localStorage のキーは `pukari-bubbles`
- データは JSON で保存
- 日付の比較は日本時間（JST）で行う

### 4. 状態遷移のルール

以下の遷移のみ許可:

```
floating → nearby（そばに置く）
floating → touched（泡を開いた = 自動）
floating → done（できた！）
floating → drifted（遠くへ流す）

nearby → touched（泡を開いた = 自動）
nearby → done（できた！）
nearby → drifted（遠くへ流す）

touched → done（できた！）
touched → drifted（遠くへ流す）

drifted → floating（戻す = 復活）
```

逆方向の遷移（done → floating など）は許可しない。

---

## 完了条件

- [ ] テキスト入力で新しいシャボン玉が空に追加される
- [ ] 泡をタップすると詳細表示が開く
- [ ] 詳細を開いた時点で「触れた」が自動記録される
- [ ] 「そばに置く」で泡が少し大きく手前に移動する
- [ ] 「できた！」で泡が空に溶けるアニメーションが再生される
- [ ] 「遠くへ流す」で泡が小さくなって端に移動する
- [ ] 空の色が「できた」数に応じて変化する
- [ ] データが localStorage に保存され、リロードしても残っている
- [ ] スマートフォン幅で操作に問題がない
